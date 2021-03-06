// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/security/Pausable.sol';
import './Order.sol';
import './interfaces/IOrderBook.sol';

/// @dev A factory for creating orders. The Graph should index this contract.
contract OrderBook is IOrderBook, Pausable {
    /// @dev all the orders available in the order book
    mapping(address => bool) public orders;

    /// @dev the fee rate in parts per million
    uint256 public fee = 10000; // 1%

    /// @dev the authority over this order book, ie the DAO
    address private _owner;

    /// @dev Throws if msg.sender is not the owner.
    error NotOwner();

    /// @dev initializes a new order book
    constructor() {
        _owner = msg.sender;
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view virtual returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        if (owner() != msg.sender) {
            revert NotOwner();
        }
        _;
    }

    /// @dev changes the fee rate
    function setFee(uint256 _fee) external onlyOwner {
        emit FeeChanged(fee, _fee);
        fee = _fee;
    }

    /// @dev changes the owner of this order book
    function setOwner(address _newOwner) external onlyOwner {
        emit OwnerChanged(owner(), _newOwner);
        _owner = _newOwner;
    }

    /// @dev pauses this order book
    function pause() external onlyOwner {
        _pause();
    }

    /// @dev unpauses this order book
    function unpause() external onlyOwner {
        _unpause();
    }

    /// @dev Creates a new order that can be easily indexed by something like theGraph.
    function createOrder(
        address maker,
        string memory uri,
        bool isBuyOrder
    ) external whenNotPaused returns (Order) {
        Order.OrderType orderType;
        if (isBuyOrder) {
            orderType = Order.OrderType.BuyOrder;
        } else {
            orderType = Order.OrderType.SellOrder;
        }
        Order order = new Order(maker, uri, orderType);
        emit OrderCreated(address(order));
        orders[address(order)] = true;
        return order;
    }
}
