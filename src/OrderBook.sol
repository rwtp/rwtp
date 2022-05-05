// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/utils/cryptography/ECDSA.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import './SellOrder.sol';

/// @dev A factory for creating orders. The Graph should index this contract.
contract OrderBook is Ownable {
    /// @dev emitted when a new sell order is created
    event SellOrderCreated(address indexed sellOrder);

    /// @dev emitted when setOwner is called
    event OwnerChanged(address previous, address next);

    /// @dev emitted when setOwner is called
    event FeeChanged(uint256 previous, uint256 next);

    /// @dev all the sell orders available in the order book
    mapping(address => bool) public sellOrders;

    /// @dev the fee rate in parts per million
    uint256 public fee = 10000; // 1%

    /// @dev initializes a new order book
    constructor() {
        _transferOwnership(msg.sender);
    }

    /// @dev changes the fee rate
    function setFee(uint256 _fee) external onlyOwner {
        emit FeeChanged(fee, _fee);
        fee = _fee;
    }

    /// @dev changes the owner of this order book
    function setOwner(address _newOwner) external onlyOwner {
        emit OwnerChanged(owner(), _newOwner);
        _transferOwnership(_newOwner);
    }

    /// @dev Creates a new sell order that can be easily indexed by something like theGraph.
    function createSellOrder(
        address seller,
        IERC20 token,
        uint256 stake,
        string memory uri,
        uint256 timeout
    ) external {
        SellOrder sellOrder = new SellOrder(
            this,
            seller,
            token,
            stake,
            uri,
            timeout
        );
        emit SellOrderCreated(address(sellOrder));
        sellOrders[address(sellOrder)] = true;
    }
}
