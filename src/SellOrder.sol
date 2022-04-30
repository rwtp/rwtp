// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "./VerifySignature.sol";

contract SellOrder is VerifySignature {
    enum State {
        Open,
        Closed,
        InProgress
    }

    /// @dev if true, the order is accepting offers
    State public state = State.Open;

    /// @dev the accepted offer. If address(0), there's no accepted offer.
    address public acceptedOffer;

    /// @dev The token used for payment & staking, such as wETH, DAI, or USDC.
    IERC20 public token;

    /// @dev The seller
    address public owner;

    /// @dev The public key of the item keypair, used to confirm delivery.
    address public item;

    /// @dev the maximum delivery time before the order can said to have failed.
    uint256 public timeout;

    /// @dev the block.timestamp in which acceptOffer() was called. 0 otherwise
    uint256 public acceptedAt;

    /// @dev the amount staked by the seller
    uint256 public stake;

    struct Offer {
        /// @dev the amount the buyer is willing to stake
        uint256 stake;
        /// @dev the amount the buyer is willing to pay
        uint256 price;
    }

    /// @dev A mapping of potential offers to the amount of tokens they are willing to stake
    mapping(address => Offer) public offers;

    /// @dev Creates a new sell order.
    constructor(
        address shippingKey_,
        IERC20 token_,
        uint256 timeout_
    ) {
        owner = msg.sender;
        shippingKey = shippingKey_;
        token = token_;
        timeout = timeout_;
    }

    /// @dev Stakes on behalf of the seller
    function depositStake() {
        uint256 allowance = token.allowance(msg.sender, this);
        stake = allowance;

        bool result = token.transfer(this, stake);
        assert(result);
    }

    /// @dev creates an offer
    function submitOffer(uint256 stake, uint256 price) external virtual {
        require(state == State.Open);
        uint256 allowance = token.allowance(msg.sender, this);
        require(allowance == stake + price);

        offers[msg.sender] = Offer(stake, price);

        bool result = token.transfer(this, allowance);
        assert(result);
    }

    /// @dev allows a buyer to withdraw the offer
    function withdrawOffer() external virtual {
        // if the order is open, anyone can withdraw.
        // if the order is not open, you can only withdraw if your offer is not the accepted offer.
        require(state == State.Open || msg.sender != acceptedOffer);

        uint256 offer = offers[msg.sender];
        offers[msg.sender] = Offer(0, 0);

        bool result = token.transfer(msg.sender, offer.stake + offer.price);
        assert(result);
    }

    /// @dev Allows a seller to accept an offer.
    function acceptOffer(address buyer, address item) external virtual {
        require(state == State.Open);

        acceptedOffer = buyer;
        state = State.InProgress;
        item = item;
        acceptedAt = block.timestamp;
    }

    /// @dev Marks the order as sucessfully completed, and transfers the tokens.
    function confirm(string memory signature) external virtual {
        require(state == State.InProgress);
        require(msg.sender == acceptedOffer);
        require(
            verifySignature(
                msg.sender,
                abi.encodePacked(address(this)),
                bytes(signature)
            )
        );

        uint256 offer = offers[msg.sender];
        offers[msg.sender] = Offer(0, 0);

        state = State.Closed;

        // Return the stake to the buyer
        bool result0 = token.transfer(msg.sender, offer.stake);
        assert(result0);

        // Return the stake to the seller
        bool result1 = token.transfer(owner, offer.stake);
        assert(result1);

        // Transfer the payment to the seller
        bool result2 = token.transfer(owner, offer.price);
        assert(result2);
    }

    /// @dev Allows anyone to enforce this contract.
    function enforce() external virtual {
        require(state == State.InProgress);
        require(block.timestamp < timeout + acceptedAt);

        state = State.Closed;

        // Transfer the payment to the seller
        bool result0 = token.transfer(owner, offer.price);
        assert(result0);

        // Transfer the buyer's stake to address(0).
        bool result1 = token.transfer(address(0), offer.stake);
        assert(result1);

        // Transfer the seller's stake to address(0).
        bool result2 = token.transfer(address(0), stake);
        assert(result2);
    }
}
