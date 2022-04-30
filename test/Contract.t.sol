// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "openzeppelin-contracts/contracts/mocks/ERC20Mock.sol";
import "../src/SellOrder.sol";

contract UnitTest is Test {
    function setUp() public {}

    function testConstructor() public {
        ERC20Mock token = new ERC20Mock("wETH", "WETH", address(this), 100);
        SellOrder sellOrder = new SellOrder(token, 100);

        assert(sellOrder.state() == SellOrder.State.Open);
    }

    function testCanDepositStake() public {
        ERC20Mock token = new ERC20Mock("wETH", "WETH", address(this), 100);
        SellOrder sellOrder = new SellOrder(token, 100);

        token.approve(address(sellOrder), 50);
        sellOrder.depositStake();

        require(token.balanceOf(address(sellOrder)) == 50, "stake is not 50");
    }

    function testHappyPath() public {
        // Setup
        ERC20Mock token = new ERC20Mock("wETH", "WETH", address(this), 100);
        address seller = address(0x1234567890123456784012345678901234567829);
        address buyer1 = address(0x2234567890123456754012345678901234567821);
        address buyer2 = address(0x5234567890123456754012345678901234567822);

        // Create a sell order
        vm.prank(seller);
        SellOrder sellOrder = new SellOrder(token, 100);

        // Stake 10 tokens, on behalf of the seller
        token.approve(address(sellOrder), 10);
        sellOrder.depositStake();

        // Submit an offer from buyer1
        token.approve(address(buyer1), 20);
        vm.prank(buyer1);
        sellOrder.submitOffer(15, 5);
    }
}
