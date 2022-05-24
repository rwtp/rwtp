// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/security/Pausable.sol';
import './interfaces/IOrderBook.sol';

contract Order is Pausable {
    /// @dev Don't allow purchases from self
    error TakerCannotBeMaker();

    // @dev msg.sender is not the buyer of the order
    error MustBeBuyer();

    /// @dev msg.sender is not the maker of the order
    error MustBeMaker();

    /// @dev msg.sender is not the maker of the order or dao
    error MustBeMakerOrDAO();

    /// @dev A function is run at the wrong time in the lifecycle
    error InvalidState(State expected, State received);

    /// @dev Order or order book is paused
    error OrderOrBookPaused();

    /// @dev The order timed out and can no longer be refunded
    error TimeoutExpired();

    /// @dev Emitted when `taker` submits an offer.
    event OfferSubmitted(
        address indexed taker,
        uint32 indexed index,
        uint128 price,
        uint128 cost,
        uint128 sellerStake,
        string uri
    );

    /// @dev Emitted when `taker` withdrew an offer.
    event OfferWithdrawn(address indexed taker, uint32 indexed index);

    /// @dev Emitted when `taker`'s offer was committed too.
    event OfferCommitted(address indexed taker, uint32 indexed index);

    /// @dev Emitted when `taker` confirmed an offer was completed.
    event OfferConfirmed(address indexed taker, uint32 indexed index);

    /// @dev Emitted when an offer was refunded.
    event OfferRefunded(address indexed taker, uint32 indexed index);

    /// @dev Emitted when `maker` sets the order active or inactive.
    event ActiveToggled(bool active);

    /// @dev Someone requested a cancellation of the order. The order is only
    ///      "really" canceled if both makerCanceled and takerCanceled is
    ///      true.
    event OfferCanceled(
        address indexed taker,
        uint32 indexed index,
        bool makerCanceled,
        bool takerCanceled
    );

    /// @dev The order's URI changed
    event OrderURIChanged(string previous, string next);

    /// @dev The token used for payment & staking, such as wETH, DAI, or USDC.
    IERC20 public token;

    /// @dev The maker of this order book entry (as in, the "market maker")
    address public maker;

    /// @dev the maximum delivery time before the order can said to have failed.
    uint256 public timeout;

    /// @dev order book
    address public orderBook;

    /// @dev the URI where metadata about this Order can be found
    string private _uri;

    /// @dev if false, the order is not open for new offers.
    bool public active;

    /// @dev the type of order that the maker has placed.
    OrderType public orderType;

    /// @dev The state of an offer
    enum State {
        Closed,
        Open,
        Committed
    }

    /// @dev Types of orders that can be created by a maker.
    enum OrderType {
        SellOrder,
        BuyOrder
    }

    struct Offer {
        /// @dev the state of the offer
        State state;
        /// @dev the amount the buyer will pay
        uint128 price;
        /// @dev the amount the buyer gets when refunded
        uint128 cost;
        /// @dev the amount the seller is willing to stake
        uint128 sellerStake;
        /// @dev the uri of metadata that can contain shipping information (typically encrypted)
        string uri;
        /// @dev the block.timestamp in which acceptOffer() was called. 0 otherwise
        uint64 acceptedAt;
        /// @dev canceled by the maker
        bool makerCanceled;
        /// @dev canceled by the taker
        bool takerCanceled;
    }

    /// @dev A mapping of potential offers to the amount of tokens they are willing to stake
    ///     a "uint32" here means you can have 2^32 open offers from any given address.
    ///     uint32 was chosen over uint8 to support the use case of a program that's buying
    ///     on behalf of a large number of users.
    ///
    ///     If, for some reason, ~2 billion open offers does not support your use case, you
    ///     could just create another address for your additonal takers (shard), implement a
    ///     queue, or we could just release a new version.
    mapping(address => mapping(uint32 => Offer)) public offers;

    /// @dev The denominator of parts per million
    uint256 constant ONE_MILLION = 1000000;

    /// @dev Creates a new sell order.
    constructor(
        address maker_,
        IERC20 token_,
        string memory uri_,
        uint256 timeout_,
        OrderType orderType_
    ) {
        orderBook = msg.sender;
        maker = maker_;
        token = token_;
        _uri = uri_;
        timeout = timeout_;
        active = true;
        orderType = orderType_;
    }

    /// @dev returns the URI of the sell order, containing it's metadata
    function orderURI() external view virtual returns (string memory) {
        return _uri;
    }

    /// @dev sets the URI of the sell order, containing it's metadata
    function setURI(string memory uri_) external virtual onlyMaker {
        _uri = uri_;
        emit OrderURIChanged(_uri, uri_);
    }

    /// @dev Sets "active". If false, the order is not open for new offers.
    function setActive(bool active_) external virtual onlyMaker {
        active = active_;
        emit ActiveToggled(active);
    }

    /// @dev pauses this order book
    function pause() external onlyMakerOrDAO {
        _pause();
    }

    /// @dev unpauses this order book
    function unpause() external onlyMakerOrDAO {
        _unpause();
    }

    /// @dev returns buyer refund per unit for offer
    function refund(Offer memory offer)
        internal
        view
        virtual
        returns (uint256)
    {
        if (offer.price > offer.cost) {
            return offer.price - offer.cost;
        } else {
            return 0;
        }
    }

    /// @dev returns buyer stake per unit for offer
    function buyerStake(Offer memory offer)
        internal
        view
        virtual
        returns (uint256)
    {
        if (offer.cost > offer.price) {
            return offer.cost - offer.price;
        } else {
            return 0;
        }
    }

    /// @dev returns buyer for offer with given taker
    function buyer(address taker) internal view virtual returns (address) {
        if (orderType == OrderType.SellOrder) {
            return taker;
        } else if (orderType == OrderType.BuyOrder) {
            return maker;
        } else {
            revert();
        }
    }

    /// @dev returns seller for offer with given taker
    function seller(address taker) internal view virtual returns (address) {
        if (orderType == OrderType.SellOrder) {
            return maker;
        } else if (orderType == OrderType.BuyOrder) {
            return taker;
        } else {
            revert();
        }
    }

    /// @dev reverts if the function is not at the expected state
    modifier onlyState(
        address taker,
        uint32 index,
        State expected
    ) {
        if (offers[taker][index].state != expected) {
            revert InvalidState(expected, offers[taker][index].state);
        }

        _;
    }

    // @dev reverts if msg.sender is not the buyer
    modifier onlyBuyer(address taker) {
        if (msg.sender != buyer(taker)) {
            revert MustBeBuyer();
        }

        _;
    }

    /// @dev reverts if msg.sender is not the maker
    modifier onlyMaker() {
        if (msg.sender != maker) {
            revert MustBeMaker();
        }

        _;
    }

    /// @dev reverts if msg.sender is not the maker or DAO
    modifier onlyMakerOrDAO() {
        if (msg.sender != maker && msg.sender != IOrderBook(orderBook).owner()) {
            revert MustBeMakerOrDAO();
        }

        _;
    }

    /// @dev reverts order or book is paused
    modifier onlyOrderAndBookUnpaused() {
        if (paused() || Pausable(orderBook).paused()) {
            revert OrderOrBookPaused();
        }

        _;
    }

    /// @dev creates an offer
    function submitOffer(
        uint32 index,
        uint128 price,
        uint128 cost,
        uint128 sellerStake,
        string memory uri
    )
        external
        virtual
        onlyState(msg.sender, index, State.Closed)
        onlyOrderAndBookUnpaused
    {
        if (msg.sender == maker) {
            revert TakerCannotBeMaker();
        }

        Offer storage offer = offers[msg.sender][index];
        offer.state = State.Open;
        offer.price = price;
        offer.cost = cost;
        offer.sellerStake = sellerStake;
        offer.uri = uri;

        uint256 transferAmount;
        if (orderType == OrderType.BuyOrder) {
            // This is a sell offer
            transferAmount = sellerStake;
        } else if (orderType == OrderType.SellOrder) {
            // This is a buy offer
            transferAmount = price + buyerStake(offer);
        }

        if (transferAmount > 0) {
            bool result = token.transferFrom(
                msg.sender,
                address(this),
                transferAmount
            );
            require(result, 'Transfer failed');
        }

        emit OfferSubmitted(msg.sender, index, price, cost, sellerStake, uri);
    }

    /// @dev allows a taker to withdraw a previous offer
    function withdrawOffer(uint32 index)
        external
        virtual
        onlyOrderAndBookUnpaused
        onlyState(msg.sender, index, State.Open)
    {
        Offer memory offer = offers[msg.sender][index];

        uint256 transferAmount;
        if (orderType == OrderType.BuyOrder) {
            // This is a sell offer
            transferAmount = offer.sellerStake;
        } else if (orderType == OrderType.SellOrder) {
            // This is a buy offer
            transferAmount = offer.price + buyerStake(offer);
        }

        if (transferAmount > 0) {
            bool result = token.transfer(msg.sender, transferAmount);
            assert(result);
        }

        offers[msg.sender][index] = Offer(
            State.Closed,
            0,
            0,
            0,
            offer.uri,
            0,
            false,
            false
        );

        emit OfferWithdrawn(msg.sender, index);
    }

    /// @dev Commits a maker to an offer
    function commit(address taker, uint32 index)
        public
        virtual
        onlyOrderAndBookUnpaused
        onlyState(taker, index, State.Open)
        onlyMaker
    {
        Offer storage offer = offers[taker][index];

        // Update the status of the taker's offer
        offer.acceptedAt = uint64(block.timestamp);
        offer.state = State.Committed;

        uint256 transferAmount;
        if (orderType == OrderType.BuyOrder) {
            transferAmount = offer.price + buyerStake(offer);
        } else if (orderType == OrderType.SellOrder) {
            transferAmount = offer.sellerStake;
        }

        // Deposit the amount required to commit to the offer
        uint256 allowance = token.allowance(msg.sender, address(this));
        require(allowance >= transferAmount);

        if (transferAmount > 0) {
            bool result = token.transferFrom(
                msg.sender,
                address(this),
                transferAmount
            );
            assert(result);
        }

        emit OfferCommitted(taker, index);
    }

    /// @dev Marks all provided offers as committed
    function commitBatch(address[] calldata takers, uint32[] calldata indices)
        external
        virtual
        onlyOrderAndBookUnpaused
    {
        require(takers.length == indices.length);
        for (uint256 i = 0; i < takers.length; i++) {
            commit(takers[i], indices[i]);
        }
    }

    /// @dev Marks the order as sucessfully completed, and transfers the tokens.
    function confirm(address taker, uint32 index)
        public
        virtual
        onlyOrderAndBookUnpaused
        onlyState(taker, index, State.Committed)
    {
        Offer memory offer = offers[taker][index];

        // Only buyer can confirm before timeout
        if (block.timestamp < timeout + offer.acceptedAt) {
            if (msg.sender != buyer(taker)) {
                revert MustBeBuyer();
            }
        }

        // Close the offer
        offers[taker][index] = Offer(
            State.Closed,
            0,
            0,
            0,
            '',
            uint64(block.timestamp),
            false,
            false
        );

        uint256 toOrderBook = (offer.price * IOrderBook(orderBook).fee()) /
            ONE_MILLION;
        uint256 toSeller = offer.price - toOrderBook + offer.sellerStake;
        uint256 toBuyer = buyerStake(offer);

        // Transfer payment to the buyer
        if (toBuyer > 0) {
            bool result0 = token.transfer(buyer(taker), toBuyer);
            assert(result0);
        }

        // Transfer payment to the seller
        if (toSeller > 0) {
            bool result1 = token.transfer(seller(taker), toSeller);
            assert(result1);
        }

        // Transfer payment to the order book
        if (toOrderBook > 0) {
            bool result2 = token.transfer(
                IOrderBook(orderBook).owner(),
                toOrderBook
            );
            assert(result2);
        }

        emit OfferConfirmed(taker, index);
    }

    /// @dev Marks all provided offers as completed
    function confirmBatch(address[] calldata takers, uint32[] calldata indices)
        external
        virtual
        onlyOrderAndBookUnpaused
    {
        for (uint256 i = 0; i < indices.length; i++) {
            confirm(takers[i], indices[i]);
        }
    }

    /// @dev Allows the buyer to refund an offer.
    function refund(address taker, uint32 index)
        public
        virtual
        onlyOrderAndBookUnpaused
        onlyState(taker, index, State.Committed)
        onlyBuyer(taker)
    {
        Offer memory offer = offers[taker][index];
        if (block.timestamp > timeout + offer.acceptedAt) {
            revert TimeoutExpired();
        }

        // Close the offer
        offers[taker][index] = Offer(
            State.Closed,
            0,
            0,
            0,
            '',
            uint64(block.timestamp),
            false,
            false
        );

        // Transfer the refund to the buyer
        if (refund(offer) > 0) {
            bool result0 = token.transfer(buyer(taker), refund(offer));
            assert(result0);
        }

        // Transfers to address(dead)
        bool result1 = token.transfer(
            address(0x000000000000000000000000000000000000dEaD),
            (buyerStake(offer) + // buyer's stake
                offer.sellerStake + // seller's stake
                offer.price -
                refund(offer)) // non-refundable purchase amount
        );
        assert(result1);

        emit OfferRefunded(taker, index);
    }

    /// @dev Refunds all provided offers
    function refundBatch(address[] calldata takers, uint32[] calldata indices)
        external
        virtual
        onlyOrderAndBookUnpaused
    {
        require(takers.length == indices.length);
        for (uint256 i = 0; i < takers.length; i++) {
            refund(takers[i], indices[i]);
        }
    }

    /// @dev Allows either the taker or the maker to cancel the offer.
    ///      Only a committed offer can be canceled
    function cancel(address taker, uint32 index)
        public
        virtual
        onlyOrderAndBookUnpaused
        onlyState(taker, index, State.Committed)
    {
        Offer storage offer = offers[taker][index];
        if (msg.sender == taker) {
            // The taker is canceling their offer
            offer.takerCanceled = true;
        } else {
            // The maker is canceling their offer
            if (msg.sender != maker) {
                revert MustBeMaker();
            }
            offer.makerCanceled = true;
        }

        // If both parties canceled, then return the stakes, and the payment to the buyer,
        // and set the offer to closed
        if (offer.makerCanceled && offer.takerCanceled) {
            // Transfer the buyer stake back to the buyer along with their payment
            bool result0 = token.transfer(
                buyer(taker),
                offer.price + buyerStake(offer)
            );
            assert(result0);

            // Transfer the seller stake back to the seller
            if (offer.sellerStake > 0) {
                bool result1 = token.transfer(seller(taker), offer.sellerStake);
                assert(result1);
            }

            // Null out the offer
            offers[taker][index] = Offer(
                State.Closed,
                0,
                0,
                0,
                '',
                uint64(block.timestamp),
                false,
                false
            );
        }

        emit OfferCanceled(
            taker,
            index,
            offer.makerCanceled,
            offer.takerCanceled
        );
    }

    /// @dev Cancels all provided offers
    function cancelBatch(address[] calldata takers, uint32[] calldata indices)
        external
        virtual
        onlyOrderAndBookUnpaused
    {
        require(takers.length == indices.length);
        for (uint256 i = 0; i < takers.length; i++) {
            cancel(takers[i], indices[i]);
        }
    }
}
