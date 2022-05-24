// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import './interfaces/IOrderBook.sol';

contract Order {
    /// @dev Don't allow purchases from self
    error TakerCannotBeMaker();

    // @dev msg.sender is not the buyer of the order
    error MustBeBuyer();

    /// @dev msg.sender is not the maker of the order
    error MustBeMaker();

    /// @dev A function is run at the wrong time in the lifecycle
    error InvalidState(State expected, State received);

    /// @dev The order is not accepting new offers
    error OrderInactive();

    /// @dev The order timed out and can no longer be refunded
    error TimeoutExpired();

    /// @dev Emitted when `taker` submits an offer.
    event OfferSubmitted(
        address indexed taker,
        uint32 indexed index,
        uint32 quantity,
        uint128 pricePerUnit,
        uint128 costPerUnit,
        uint128 sellerStakePerUnit,
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
        uint128 pricePerUnit;
        /// @dev the amount the buyer gets when refunded
        uint128 costPerUnit;
        /// @dev the amount the seller is willing to stake
        uint128 sellerStakePerUnit;
        /// @dev the uri of metadata that can contain shipping information (typically encrypted)
        string uri;
        /// @dev the block.timestamp in which acceptOffer() was called. 0 otherwise
        uint64 acceptedAt;
        /// @dev canceled by the maker
        bool makerCanceled;
        /// @dev canceled by the taker
        bool takerCanceled;
        /// @dev Allows purchases of multiple units.
        /// The maker and taker's required stakes will both be scaled by this value.
        uint32 quantity;
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

    /// @dev returns buyer refund per unit for offer
    function refundPerUnit(Offer memory offer)
        internal
        view
        virtual
        returns (uint256)
    {
        if (offer.pricePerUnit > offer.costPerUnit) {
            return offer.pricePerUnit - offer.costPerUnit;
        } else {
            return 0;
        }
    }

    /// @dev returns buyer stake per unit for offer 
    function buyerStakePerUnit(Offer memory offer)
        internal
        view
        virtual
        returns (uint256)
    {
        if (offer.costPerUnit > offer.pricePerUnit) {
            return offer.costPerUnit - offer.pricePerUnit;
        } else {
            return 0;
        }
    }

    /// @dev returns buyer for offer with given taker
    function buyer(address taker_) 
        internal
        view
        virtual
        returns (address) 
    {
        if (orderType == OrderType.SellOrder) {
            return taker_;
        } else if (orderType == OrderType.BuyOrder) {
            return maker;
        } else {
            revert();
        }
    }

    /// @dev returns seller for offer with given taker
    function seller(address taker_) 
        internal
        view
        virtual
        returns (address) 
    {
        if (orderType == OrderType.SellOrder) {
            return maker;
        } else if (orderType == OrderType.BuyOrder) {
            return taker_;
        } else {
            revert();
        }
    }

    /// @dev reverts if the function is not at the expected state
    modifier onlyState(
        address taker_,
        uint32 index,
        State expected
    ) {
        if (offers[taker_][index].state != expected) {
            revert InvalidState(expected, offers[taker_][index].state);
        }

        _;
    }

    // @dev reverts if msg.sender is not the buyer
    modifier onlyBuyer(address taker_) {
        if (msg.sender != buyer(taker_)) {
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

    /// @dev reverts if not active
    modifier onlyActive() {
        if (!active) {
            revert OrderInactive();
        }

        _;
    }

    /// @dev creates an offer
    function submitOffer(
        uint32 index,
        uint32 quantity,
        uint128 pricePerUnit,
        uint128 costPerUnit,
        uint128 sellerStakePerUnit,
        string memory uri
    ) external virtual onlyState(msg.sender, index, State.Closed) onlyActive {
        if (msg.sender == maker) {
            revert TakerCannotBeMaker();
        }

        Offer storage offer = offers[msg.sender][index];
        offer.state = State.Open;
        offer.pricePerUnit = pricePerUnit;
        offer.costPerUnit = costPerUnit;
        offer.sellerStakePerUnit = sellerStakePerUnit;
        offer.uri = uri;
        offer.quantity = quantity;

        uint256 transferAmount;
        if (orderType == OrderType.BuyOrder) {
            // This is a sell offer
            transferAmount = sellerStakePerUnit * quantity;
        } else if (orderType == OrderType.SellOrder) {
            // This is a buy offer
            transferAmount =
                (pricePerUnit + buyerStakePerUnit(offer)) *
                quantity;
        }

        bool result = token.transferFrom(
            msg.sender,
            address(this),
            transferAmount
        );
        require(result, 'Transfer failed');

        emit OfferSubmitted(
            msg.sender,
            index,
            quantity,
            pricePerUnit,
            costPerUnit,
            sellerStakePerUnit,
            uri
        );
    }

    /// @dev allows a taker to withdraw a previous offer
    function withdrawOffer(uint32 index)
        external
        virtual
        onlyState(msg.sender, index, State.Open)
    {
        Offer memory offer = offers[msg.sender][index];

        uint256 transferAmount;
        if (orderType == OrderType.BuyOrder) {
            // This is a sell offer
            transferAmount = offer.sellerStakePerUnit * offer.quantity;
        } else if (orderType == OrderType.SellOrder) {
            // This is a buy offer
            transferAmount =
                (offer.pricePerUnit + buyerStakePerUnit(offer)) *
                offer.quantity;
        }

        bool result = token.transfer(msg.sender, transferAmount);
        assert(result);

        offers[msg.sender][index] = Offer(
            State.Closed,
            0,
            0,
            0,
            offer.uri,
            0,
            false,
            false,
            0
        );

        emit OfferWithdrawn(msg.sender, index);
    }

    /// @dev Commits a maker to an offer
    function commit(address taker_, uint32 index)
        public
        virtual
        onlyState(taker_, index, State.Open)
        onlyMaker
    {
        Offer storage offer = offers[taker_][index];

        // Update the status of the taker's offer
        offer.acceptedAt = uint64(block.timestamp);
        offer.state = State.Committed;

        uint256 transferAmount;
        if (orderType == OrderType.BuyOrder) {
            transferAmount =
                (offer.pricePerUnit + buyerStakePerUnit(offer)) *
                offer.quantity;
        } else if (orderType == OrderType.SellOrder) {
            transferAmount = offer.sellerStakePerUnit * offer.quantity;
        }

        // Deposit the amount required to commit to the offer
        uint256 allowance = token.allowance(msg.sender, address(this));
        require(allowance >= transferAmount);

        bool result = token.transferFrom(
            msg.sender,
            address(this),
            transferAmount
        );
        assert(result);

        emit OfferCommitted(taker_, index);
    }

    /// @dev Marks all provided offers as committed
    function commitBatch(address[] calldata takers, uint32[] calldata indices)
        external
        virtual
    {
        require(takers.length == indices.length);
        for (uint256 i = 0; i < takers.length; i++) {
            commit(takers[i], indices[i]);
        }
    }

    /// @dev Marks the order as sucessfully completed, and transfers the tokens.
    function confirm(address taker_, uint32 index)
        public
        virtual
        onlyState(taker_, index, State.Committed)
    {
        Offer memory offer = offers[taker_][index];

        // Only buyer can confirm before timeout
        if (block.timestamp < timeout + offer.acceptedAt) {
            if (msg.sender != buyer(taker_)) {
                revert MustBeBuyer();
            }
        }

        // Close the offer
        offers[taker_][index] = Offer(
            State.Closed,
            0,
            0,
            0,
            '',
            uint64(block.timestamp),
            false,
            false,
            0
        );

        uint256 total = (offer.pricePerUnit + offer.sellerStakePerUnit) * offer.quantity;
        uint256 toOrderBook = (total * IOrderBook(orderBook).fee()) /
            ONE_MILLION;
        uint256 toSeller = total - toOrderBook;
        uint256 toBuyer = buyerStakePerUnit(offer) * offer.quantity;

        // Transfer payment to the buyer
        bool result0 = token.transfer(buyer(taker_), toBuyer);
        assert(result0);

        // Transfer payment to the seller
        bool result1 = token.transfer(seller(taker_), toSeller);
        assert(result1);

        // Transfer payment to the order book
        bool result2 = token.transfer(
            IOrderBook(orderBook).owner(),
            toOrderBook
        );
        assert(result2);

        emit OfferConfirmed(taker_, index);
    }

    /// @dev Marks all provided offers as completed
    function confirmBatch(address[] calldata takers, uint32[] calldata indices)
        external
        virtual
    {
        for (uint256 i = 0; i < indices.length; i++) {
            confirm(takers[i], indices[i]);
        }
    }

    /// @dev Allows the buyer to refund an offer.
    function refund(address taker_, uint32 index)
        public
        virtual
        onlyState(taker_, index, State.Committed)
        onlyBuyer(taker_)
    {
        Offer memory offer = offers[taker_][index];
        if (block.timestamp > timeout + offer.acceptedAt) {
            revert TimeoutExpired();
        }

        // Close the offer
        offers[taker_][index] = Offer(
            State.Closed,
            0,
            0,
            0,
            '',
            uint64(block.timestamp),
            false,
            false,
            0
        );

        // Transfer the refund to the buyer
        bool result0 = token.transfer(
            buyer(taker_),
            refundPerUnit(offer) * offer.quantity
        );
        assert(result0);

        // Transfers to address(dead)
        bool result1 = token.transfer(
            address(0x000000000000000000000000000000000000dEaD),
            (
                buyerStakePerUnit(offer) // buyer's stake
                + offer.sellerStakePerUnit // seller's stake
                + offer.pricePerUnit - refundPerUnit(offer) // non-refundable purchase amount
            ) * offer.quantity
        );
        assert(result1);

        emit OfferRefunded(taker_, index);
    }

    /// @dev Refunds all provided offers
    function refundBatch(address[] calldata takers, uint32[] calldata indices)
        external
        virtual
    {
        require(takers.length == indices.length);
        for (uint256 i = 0; i < takers.length; i++) {
            refund(takers[i], indices[i]);
        }
    }

    /// @dev Allows either the taker or the maker to cancel the offer.
    ///      Only a committed offer can be canceled
    function cancel(address taker_, uint32 index)
        public
        virtual
        onlyState(taker_, index, State.Committed)
    {
        Offer storage offer = offers[taker_][index];
        if (msg.sender == taker_) {
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
            uint256 toBuyer = (offer.pricePerUnit +
                buyerStakePerUnit(offer)) * offer.quantity;
            uint256 toSeller = offer.sellerStakePerUnit * offer.quantity;

            // Transfer the buyer stake back to the buyer along with their payment
            bool result0 = token.transfer(buyer(taker_), toBuyer);
            assert(result0);

            // Transfer the seller stake back to the seller
            bool result1 = token.transfer(seller(taker_), toSeller);
            assert(result1);

            // Null out the offer
            offers[taker_][index] = Offer(
                State.Closed,
                0,
                0,
                0,
                '',
                uint64(block.timestamp),
                false,
                false,
                0
            );
        }

        emit OfferCanceled(
            taker_,
            index,
            offer.makerCanceled,
            offer.takerCanceled
        );
    }

    /// @dev Cancels all provided offers
    function cancelBatch(address[] calldata takers, uint32[] calldata indices)
        external
        virtual
    {
        require(takers.length == indices.length);
        for (uint256 i = 0; i < takers.length; i++) {
            cancel(takers[i], indices[i]);
        }
    }
}
