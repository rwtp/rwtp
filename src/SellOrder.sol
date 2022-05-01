// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import 'openzeppelin-contracts/contracts/token/ERC20/IERC20.sol';
import 'openzeppelin-contracts/contracts/utils/cryptography/ECDSA.sol';

contract SellOrder {
    /// @dev msg.sender is not the buyer
    error MustBeBuyer();

    /// @dev msg.sender is not the seller
    error MustBeSeller();

    /// @dev the offer is already submitted, you must withdraw and make a new offer
    /// to modify it.
    error OfferAlreadySubmitted();

    /// @dev A function is run at the wrong time in the lifecycle
    error InvalidState(State expected, State received);

    /// @dev The state machine of the sell order
    enum State {
        Open,
        Closed,
        Committed,
        Finalized
    }

    /// @dev if true, the order is accepting offers
    State public state = State.Open;

    /// @dev the accepted offer. If address(0), there's no accepted offer.
    address public buyer;

    /// @dev The token used for payment & staking, such as wETH, DAI, or USDC.
    IERC20 public token;

    /// @dev The seller
    address public seller;

    /// @dev The public key of the item keypair, used to confirm delivery.
    address public item;

    /// @dev the maximum delivery time before the order can said to have failed.
    uint256 public timeout;

    /// @dev the block.timestamp in which acceptOffer() was called. 0 otherwise
    uint256 public acceptedAt;

    /// @dev the amount staked by the seller
    uint256 public sellerStake;

    /// @dev the URI where metadata about this SellOrder can be found
    string private _uri;

    struct Offer {
        /// @dev the amount the buyer is willing to pay
        uint256 price;
        /// @dev the amount the buyer is willing to stake
        uint256 stake;
        /// @dev the uri of metadata that can contain shipping information (typically encrypted)
        string uri;
    }

    /// @dev A mapping of potential offers to the amount of tokens they are willing to stake
    mapping(address => Offer) public offers;

    /// @dev Creates a new sell order.
    constructor(
        IERC20 token_,
        string memory uri_,
        uint256 timeout_
    ) {
        seller = msg.sender;
        token = token_;
        _uri = uri_;
        timeout = timeout_;
    }

    /// @dev returns the URI of the sell order, containing it's metadata
    function orderURI() external view virtual returns (string memory) {
        return _uri;
    }

    /// @dev Stakes on behalf of the seller
    function depositStake() external virtual {
        uint256 allowance = token.allowance(msg.sender, address(this));
        sellerStake = allowance;

        bool result = token.transferFrom(
            msg.sender,
            address(this),
            sellerStake
        );
        assert(result);
    }

    /// @dev reverts if the function is not at the expected state
    modifier onlyState(State expected) {
        if (state != expected) {
            revert InvalidState(expected, state);
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

    /// @dev reverts if msg.sender is not the buyer
    modifier onlyBuyer() {
        if (msg.sender != buyer) {
            revert MustBeBuyer();
        }

        _;
    }

    /// @dev returns the offer of a particular user
    function offerOf(address b) public view returns (uint256, uint256) {
        return (offers[b].price, offers[b].stake);
    }

    /// @dev creates an offer
    function submitOffer(
        uint256 price,
        uint256 stake,
        string memory uri
    ) external virtual onlyState(State.Open) {
        if (!(offers[msg.sender].price == 0 && offers[msg.sender].stake == 0)) {
            revert OfferAlreadySubmitted();
        }
        offers[msg.sender] = Offer(price, stake, uri);

        bool result = token.transferFrom(
            msg.sender,
            address(this),
            stake + price
        );
        assert(result);
    }

    /// @dev allows a buyer to withdraw the offer
    function withdrawOffer() external virtual {
        // if the order is open, anyone can withdraw.
        // if the order is not open, you can only withdraw if your offer is not the accepted offer.
        require(state == State.Open || msg.sender != buyer);

        Offer memory offer = offers[msg.sender];
        offers[msg.sender] = Offer(0, 0, offer.uri);

        bool result = token.transfer(msg.sender, offer.stake + offer.price);
        assert(result);
    }

    /// @dev Closes the bidding period in which offers are allowed to arive.
    function close() external virtual onlyState(State.Open) onlySeller {
        state = State.Closed;
    }

    /// @dev Commits a seller to an offer
    function commit(address buyer_, address item_)
        external
        virtual
        onlyState(State.Closed)
        onlySeller
    {
        buyer = buyer_;
        state = State.Committed;
        item = item_;
        acceptedAt = block.timestamp;
    }

    /// @dev Marks the order as sucessfully completed, and transfers the tokens.
    function confirm(
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external virtual onlyState(State.Committed) onlyBuyer {
        bytes32 hsh = keccak256(abi.encodePacked(address(this)));
        bytes32 addr = ECDSA.toEthSignedMessageHash(hsh);
        require(item == ECDSA.recover(addr, v, r, s), 'failed to verify');

        Offer memory offer = offers[buyer];
        offers[buyer] = Offer(0, 0, offer.uri);

        state = State.Finalized;

        // Return the stake to the buyer
        bool result0 = token.transfer(buyer, offer.stake);
        assert(result0);

        // Return the stake to the seller
        bool result1 = token.transfer(seller, sellerStake);
        assert(result1);

        // Transfer the payment to the seller
        bool result2 = token.transfer(seller, offer.price);
        assert(result2);
    }

    /// @dev Allows anyone to enforce this contract.
    function enforce() external virtual onlyState(State.Committed) {
        require(block.timestamp < timeout + acceptedAt);

        uint256 currentStake = sellerStake;
        state = State.Finalized;

        Offer memory offer = offers[buyer];
        offers[buyer] = Offer(0, 0, offer.uri);
        sellerStake = 0;

        // Transfer the payment to the seller
        bool result0 = token.transfer(seller, offer.price);
        assert(result0);

        // Transfer the buyer's stake to address(0).
        bool result1 = token.transfer(address(0), offer.stake);
        assert(result1);

        // Transfer the seller's stake to address(0).
        bool result2 = token.transfer(address(0), currentStake);
        assert(result2);
    }
}
