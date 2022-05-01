// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "openzeppelin-contracts/contracts/mocks/ERC20Mock.sol";
import "../src/SellOrder.sol";
import "openzeppelin-contracts/contracts/utils/cryptography/ECDSA.sol";
import "forge-std/console.sol";

contract UnitTest is Test {
    function toSignature(
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public pure returns (bytes memory) {
        return abi.encodePacked(v, r, s);
    }

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
        token.transfer(buyer1, 20);
        vm.startPrank(buyer1);
        token.approve(address(sellOrder), 20);
        sellOrder.submitOffer(15, 5);
        vm.stopPrank();
        (uint256 offerPrice1, uint256 offerStake1) = sellOrder.offerOf(buyer1);
        require(offerPrice1 == 15, "offer price1 is not 15");
        require(offerStake1 == 5, "offer stake1 is not 5");
        require(
            token.balanceOf(address(sellOrder)) >= 20,
            "transfer did not occur "
        );

        // Submit an offer from buyer2
        token.transfer(buyer2, 20);
        vm.startPrank(buyer2);
        token.approve(address(sellOrder), 20);
        sellOrder.submitOffer(10, 10);
        vm.stopPrank();
        (uint256 offerPrice2, uint256 offerStake2) = sellOrder.offerOf(buyer2);
        require(offerPrice2 == 10, "offer price2 is not 10");
        require(offerStake2 == 10, "offer stake2 is not 10");

        // Close the offers
        vm.prank(seller);
        sellOrder.close();

        require(
            sellOrder.state() == SellOrder.State.Closed,
            "state is not closed"
        );

        // Confirm buyer2's offer
        address item_pu = address(0xF446b31C8D565ACD0eADA24Fb1c562621e2e1633);
        uint256 item_pk = 28270262225976980648209755037975125003705358822066383074565795076366895392656;
        vm.prank(seller);
        sellOrder.commit(buyer2, item_pu);

        require(
            sellOrder.state() == SellOrder.State.Committed,
            "state is not committed"
        );
        require(sellOrder.buyer() == buyer2, "state is not committed");
        console.log(token.balanceOf(address(sellOrder)));
        require(
            token.balanceOf(address(sellOrder)) == 50,
            "Sell order does not have 50 tokens"
        );

        // Confirm the order
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(
            item_pk,
            ECDSA.toEthSignedMessageHash(
                keccak256(abi.encodePacked(address(sellOrder)))
            ) // converts an address to bytes
        );
        vm.prank(buyer2);
        sellOrder.confirm(v, r, s);

        require(
            sellOrder.state() == SellOrder.State.Finalized,
            "state is not Finalized"
        );

        require(
            token.balanceOf(sellOrder.seller()) == 20, // 20 = payment + stake
            "seller did not get paid"
        );
        require(
            token.balanceOf(sellOrder.buyer()) == 10, // stake
            "buyer did not get their stake back"
        );
    }
}
