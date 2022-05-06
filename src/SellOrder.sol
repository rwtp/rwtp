// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import './interfaces/IOrderBook.sol';

contract SellOrder {
    /// @dev msg.sender is not the seller
    error MustBeSeller();

    /// @dev A function is run at the wrong time in the lifecycle
    error InvalidState(State expected, State received);

    /// @dev Emitted when `buyer` submits and offer.
    event OfferSubmitted(
        address indexed buyer,
        uint256 indexed price,
        uint256 indexed stake,
        string uri
    );

    /// @dev Emitted when `buyer` withdrew and offer.
    event OfferWithdrawn(address indexed buyer);

    /// @dev Emitted when `buyer`'s offer was commited too.
    event OfferCommitted(address indexed buyer);

    /// @dev Emitted when `buyer` withdrew and offer.
    event OfferConfirmed(address indexed buyer);

    /// @dev Emitted when `buyer` withdrew and offer.
    event OfferEnforced(address indexed buyer);

    /// @dev The token used for payment & staking, such as wETH, DAI, or USDC.
    IERC20 public token;

    /// @dev The seller
    address public seller;

    /// @dev the maximum delivery time before the order can said to have failed.
    uint256 public timeout;

    /// @dev the amount the seller is offering to stake per order.
    uint256 public orderStake;

    /// @dev order book
    address public orderBook;

    /// @dev the URI where metadata about this SellOrder can be found
    string private _uri;

    /// @dev The state of an offer
    enum State {
        Closed,
        Open,
        Committed
    }

    struct Offer {
        /// @dev the amount the buyer is willing to pay
        uint256 price;
        /// @dev the amount the buyer is willing to stake
        uint256 stake;
        /// @dev the uri of metadata that can contain shipping information (typically encrypted)
        string uri;
        /// @dev the state of the offer
        State state;
        /// @dev the block.timestamp in which acceptOffer() was called. 0 otherwise
        uint256 acceptedAt;
    }

    /// @dev A mapping of potential offers to the amount of tokens they are willing to stake
    mapping(address => Offer) public offers;

    /// @dev The denominator of parts per million
    uint256 constant ONE_MILLION = 1000000;

    /// @dev Creates a new sell order.
    constructor(
        address seller_,
        IERC20 token_,
        uint256 orderStake_,
        string memory uri_,
        uint256 timeout_
    ) {
        orderBook = msg.sender;
        seller = seller_;
        token = token_;
        orderStake = orderStake_;
        _uri = uri_;
        timeout = timeout_;
    }

    /// @dev returns the URI of the sell order, containing it's metadata
    function orderURI() external view virtual returns (string memory) {
        return _uri;
    }

    /// @dev sets the URI of the sell order, containing it's metadata
    function setURI(string memory uri_) external virtual onlySeller {
        _uri = uri_;
    }

    /// @dev reverts if the function is not at the expected state
    modifier onlyState(address buyer_, State expected) {
        if (offers[buyer_].state != expected) {
            revert InvalidState(expected, offers[buyer_].state);
        }

        _;
    }

    /// @dev reverts if msg.sender is not the seller
    modifier onlySeller() {
        if (msg.sender != seller) {
            revert MustBeSeller();
        }

        _;
    }

    /// @dev creates an offer
    function submitOffer(
        uint256 price,
        uint256 stake,
        string memory uri
    ) external virtual onlyState(msg.sender, State.Closed) {
        uint256 allowance = token.allowance(msg.sender, address(this));
        require(allowance >= stake + price, 'Insufficient allowance');

        offers[msg.sender] = Offer(price, stake, uri, State.Open, 0);

        bool result = token.transferFrom(
            msg.sender,
            address(this),
            stake + price
        );
        require(result, 'Transfer failed');

        emit OfferSubmitted(msg.sender, price, stake, uri);
    }

    /// @dev allows a buyer to withdraw the offer
    function withdrawOffer()
        external
        virtual
        onlyState(msg.sender, State.Open)
    {
        Offer memory offer = offers[msg.sender];

        bool result = token.transfer(msg.sender, offer.stake + offer.price);
        assert(result);

        offers[msg.sender] = Offer(0, 0, offer.uri, State.Closed, 0);

        emit OfferWithdrawn(msg.sender);
    }

    /// @dev Commits a seller to an offer
    function commit(address buyer_)
        external
        virtual
        onlyState(buyer_, State.Open)
        onlySeller
    {
        // Deposit the stake required to commit to the offer
        uint256 allowance = token.allowance(msg.sender, address(this));
        require(allowance >= orderStake);
        bool result = token.transferFrom(msg.sender, address(this), orderStake);
        assert(result);

        // Update the status of the buyer's offer
        Offer memory offer = offers[buyer_];
        offers[buyer_] = Offer(
            offer.price,
            offer.stake,
            offer.uri,
            State.Committed,
            block.timestamp
        );

        emit OfferCommitted(buyer_);
    }

    /// @dev Marks the order as sucessfully completed, and transfers the tokens.
    function confirm() external virtual onlyState(msg.sender, State.Committed) {
        // Close the offer
        Offer memory offer = offers[msg.sender];
        offers[msg.sender] = Offer(
            0,
            0,
            offer.uri,
            State.Closed,
            block.timestamp
        );

        // Return the stake to the buyer
        bool result0 = token.transfer(msg.sender, offer.stake);
        assert(result0);

        // Return the stake to the seller
        bool result1 = token.transfer(seller, orderStake);
        assert(result1);

        uint256 toOrderBook = (offer.price * IOrderBook(orderBook).fee()) /
            ONE_MILLION;
        uint256 toSeller = offer.price - toOrderBook;

        // Transfer payment to the seller
        bool result2 = token.transfer(seller, toSeller);
        assert(result2);

        // Transfer payment to the order book
        bool result3 = token.transfer(
            IOrderBook(orderBook).owner(),
            toOrderBook
        );
        assert(result3);

        emit OfferConfirmed(msg.sender);
    }

    /// @dev Allows anyone to enforce an offer.
    function enforce(address buyer_)
        external
        virtual
        onlyState(buyer_, State.Committed)
    {
        Offer memory offer = offers[buyer_];
        require(block.timestamp > timeout + offer.acceptedAt);

        // Close the offer
        offers[buyer_] = Offer(0, 0, offer.uri, State.Closed, block.timestamp);

        // Transfer the payment to the seller
        bool result0 = token.transfer(seller, offer.price);
        assert(result0);

        // Transfer the buyer's stake to address(dead).
        bool result1 = token.transfer(
            address(0x000000000000000000000000000000000000dEaD),
            offer.stake
        );
        assert(result1);

        // Transfer the seller's stake to address(dead).
        bool result2 = token.transfer(
            address(0x000000000000000000000000000000000000dEaD),
            orderStake
        );
        assert(result2);

        emit OfferEnforced(buyer_);
    }
}
