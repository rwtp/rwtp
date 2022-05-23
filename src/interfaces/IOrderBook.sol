// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '../Order.sol';

interface IOrderBook {
    event OrderCreated(address indexed order);

    event OwnerChanged(address previous, address next);

    event FeeChanged(uint256 previous, uint256 next);

    function owner() external view returns (address);

    function fee() external view returns (uint256);

    function setFee(uint256 _fee) external;

    function setOwner(address _newOwner) external;

    function createOrder(
        address maker,
        IERC20 token,
        string memory uri,
        uint256 timeout,
        bool isBuyOrder
    ) external returns (Order);
}
