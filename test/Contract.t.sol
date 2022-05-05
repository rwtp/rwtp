// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import 'forge-std/Test.sol';
import './ERC20Mock.sol';
import '../src/SellOrder.sol';
import '@openzeppelin/contracts/utils/cryptography/ECDSA.sol';
import 'forge-std/console.sol';
import '../src/OrderBook.sol';

contract UnitTest is Test {
    address DAO = address(0x4234567890123456784012345678901234567821);
    OrderBook book;

    function setUp() public {
        vm.prank(DAO);
        book = new OrderBook();
    }

    function toSignature(
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public pure returns (bytes memory) {
        return abi.encodePacked(v, r, s);
    }

    function testConstructor() public {
        ERC20Mock token = new ERC20Mock('wETH', 'WETH', address(this), 100);
        SellOrder sellOrder = book.createSellOrder(
            address(this),
            token,
            50,
            'ipfs://metadata',
            100
        );

        assert(address(sellOrder.token()) == address(token));
    }

    // Test enforce function (can't be enforced before time limit, can be enforced afterwards)
    function testEnforce() public {
        vm.warp(0); // set the time to 0
        // Setup
        ERC20Mock token = new ERC20Mock('wETH', 'WETH', address(this), 100);
        address seller = address(0x1234567890123456784012345678901234567829);
        address buyer = address(0x5234567890123456754012345678901234567822);

        // Create a sell order
        SellOrder sellOrder = book.createSellOrder(
            seller,
            token,
            50,
            'ipfs://metadata',
            100
        );

        token.transfer(buyer, 20);
        vm.startPrank(buyer);
        token.approve(address(sellOrder), 20);
        sellOrder.submitOffer(10, 10, 'ipfs://somedata');
        vm.stopPrank();
        (uint256 offer2price, uint256 offer2stake, , , ) = sellOrder.offers(
            buyer
        );
        require(offer2price == 10, 'offer price2 is not 10');
        require(offer2stake == 10, 'offer stake2 is not 10');

        vm.warp(30); // warp to block 30
        // Confirm buyer2's offer
        token.transfer(seller, 50);
        vm.startPrank(seller);
        token.approve(address(sellOrder), 50);
        sellOrder.commit(buyer);
        vm.stopPrank();

        // Submit an offer from buyer
        vm.startPrank(seller);
        vm.expectRevert();
        sellOrder.enforce(buyer);
        vm.stopPrank();

        vm.warp(51); // warp to block 51 (should still fail)
        vm.startPrank(seller);
        vm.expectRevert();
        sellOrder.enforce(buyer);
        vm.stopPrank();

        vm.warp(81); // warp to block 81 (should succeed)
        vm.startPrank(seller);
        vm.expectRevert();
        sellOrder.enforce(buyer);
        vm.stopPrank();
    }

    function testFailSubmittingOfferTwiceFails() public {
        ERC20Mock token = new ERC20Mock('wETH', 'WETH', address(this), 100);
        address seller = address(0x1234567890123456784012345678901234567829);
        address buyer = address(0x2234567890123456754012345678901234567821);

        // Create a sell order
        SellOrder sellOrder = book.createSellOrder(
            seller,
            token,
            50,
            'ipfs://metadata',
            100
        );

        token.transfer(buyer, 20);
        vm.startPrank(buyer);
        token.approve(address(sellOrder), 20);
        sellOrder.submitOffer(15, 5, 'ipfs://somedata');
        vm.stopPrank();

        token.transfer(buyer, 20);
        vm.startPrank(buyer);
        token.approve(address(sellOrder), 20);
        sellOrder.submitOffer(15, 5, 'ipfs://somedata');
        vm.stopPrank();
    }

    function testHappyPath() public {
        // Setup
        ERC20Mock token = new ERC20Mock('wETH', 'WETH', address(this), 100);
        address seller = address(0x1234567890123456784012345678901234567829);
        address buyer1 = address(0x2234567890123456754012345678901234567821);
        address buyer2 = address(0x5234567890123456754012345678901234567822);

        // Create a sell order
        SellOrder sellOrder = book.createSellOrder(
            seller,
            token,
            50,
            'ipfs://metadata',
            100
        );

        // Submit an offer from buyer1
        token.transfer(buyer1, 20);
        vm.startPrank(buyer1);
        token.approve(address(sellOrder), 20);
        sellOrder.submitOffer(15, 5, 'ipfs://somedata');
        vm.stopPrank();
        (uint256 offer1Price, uint256 offer1Stake, , , ) = sellOrder.offers(
            buyer1
        );
        require(offer1Price == 15, 'offer price1 is not 15');
        require(offer1Stake == 5, 'offer stake1 is not 5');
        require(
            token.balanceOf(address(sellOrder)) >= 20,
            'transfer did not occur '
        );

        // Submit an offer from buyer2
        token.transfer(buyer2, 20);
        vm.startPrank(buyer2);
        token.approve(address(sellOrder), 20);
        sellOrder.submitOffer(10, 10, 'ipfs://somedata');
        vm.stopPrank();
        (uint256 offer2price, uint256 offer2stake, , , ) = sellOrder.offers(
            buyer2
        );
        require(offer2price == 10, 'offer price2 is not 10');
        require(offer2stake == 10, 'offer stake2 is not 10');

        // Confirm buyer2's offer
        token.transfer(seller, 50);
        vm.startPrank(seller);
        token.approve(address(sellOrder), 50);
        sellOrder.commit(buyer2);
        vm.stopPrank();

        (, , , SellOrder.State offerState1, ) = sellOrder.offers(buyer2);
        require(
            offerState1 == SellOrder.State.Committed,
            'state is not committed'
        );
        require(
            token.balanceOf(address(sellOrder)) == 90,
            'Sell order does not have 90 tokens'
        );

        // Confirm the order
        vm.prank(buyer2);
        sellOrder.confirm();

        (, , , SellOrder.State offerState2, ) = sellOrder.offers(buyer2);
        require(offerState2 == SellOrder.State.Closed, 'state is not Closed');

        require(
            token.balanceOf(sellOrder.seller()) == 60, // 60 = payment + stake
            'seller did not get paid'
        );
        require(
            token.balanceOf(buyer2) == 10, // stake
            'buyer did not get their stake back'
        );
    }

    function testSellerBuysTheirOwnOrder() public {
        // Setup
        ERC20Mock token = new ERC20Mock('wETH', 'WETH', address(this), 100);
        address seller = address(0x1234567890123456784012345678901234567829);

        // Create a sell order
        SellOrder sellOrder = book.createSellOrder(
            seller,
            token,
            50,
            'ipfs://metadata',
            100
        );

        // Submit an offer from seller
        token.transfer(seller, 20);
        vm.startPrank(seller);
        token.approve(address(sellOrder), 20);
        sellOrder.submitOffer(15, 5, 'ipfs://somedata');
        vm.stopPrank();

        // commit to the order
        token.transfer(seller, 50);
        vm.startPrank(seller);
        token.approve(address(sellOrder), 50);
        sellOrder.commit(seller);
        vm.stopPrank();

        // Confirm the order
        vm.prank(seller);
        sellOrder.confirm();

        (, , , SellOrder.State offerState2, ) = sellOrder.offers(seller);
        require(offerState2 == SellOrder.State.Closed, 'state is not Closed');
    }

    function testOrderBookFees() public {
        // Setup
        ERC20Mock token = new ERC20Mock('wETH', 'WETH', address(this), 200);

        address seller = address(0x1234567890123456784012345678901234567829);
        address buyer1 = address(0x2234567890123456754012345678901234567821);

        // Create a sell order

        SellOrder sellOrder = book.createSellOrder(
            seller,
            token,
            50, // stake
            'ipfs://metadata',
            100
        );

        // Submit an offer
        token.transfer(buyer1, 100);
        vm.startPrank(buyer1);
        token.approve(address(sellOrder), 100);
        sellOrder.submitOffer(100, 0, 'ipfs://somedata');
        vm.stopPrank();

        // Commit to the offer
        token.transfer(seller, 50);
        vm.startPrank(seller);
        token.approve(address(sellOrder), 50);
        sellOrder.commit(buyer1);
        vm.stopPrank();

        // Confirm the order
        vm.prank(buyer1);
        sellOrder.confirm();

        // Check that the order book got 1 token
        require(
            token.balanceOf(book.owner()) == 1,
            'order book owner did not get 1 token'
        );

        // Check that the seller got 99 tokens, plus their 50 stake back
        require(
            token.balanceOf(seller) == 99 + 50,
            'seller did not get 1 token'
        );
    }
}
