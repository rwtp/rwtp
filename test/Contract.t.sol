// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import 'forge-std/Test.sol';
import './ERC20Mock.sol';
import '../src/Order.sol';
import '@openzeppelin/contracts/utils/cryptography/ECDSA.sol';
import '../src/OrderBook.sol';

contract SellOrderTest is Test {
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
        Order sellOrder = book.createOrder(
            address(this),
            token,
            'ipfs://metadata',
            100,
            false
        );

        assert(address(sellOrder.token()) == address(token));
    }

    // Test refund function (can't be refunded before time limit, can be refunded afterwards)
    function testRefund() public {
        vm.warp(0); // set the time to 0
        // Setup
        ERC20Mock token = new ERC20Mock('wETH', 'WETH', address(this), 100);
        address seller = address(0x1234567890123456784012345678901234567829);
        address buyer = address(0x5234567890123456754012345678901234567822);

        // Create a sell order
        Order sellOrder = book.createOrder(
            seller,
            token,
            'ipfs://metadata',
            100,
            false
        );

        token.transfer(buyer, 20);
        vm.startPrank(buyer);
        token.approve(address(sellOrder), 10);
        sellOrder.submitOffer(0, 1, 10, 10, 50, 'ipfs://somedata');
        vm.stopPrank();
        (, uint256 offer2price, uint256 offer2cost, , , , , , ) = sellOrder
            .offers(buyer, 0);
        require(offer2price == 10, 'offer price2 is not 10');
        require(offer2cost == 10, 'offer cost2 is not 10');

        vm.warp(30); // warp to block 30
        // Confirm buyer's offer
        token.transfer(seller, 50);
        vm.startPrank(seller);
        token.approve(address(sellOrder), 50);
        sellOrder.commit(buyer, 0);
        vm.stopPrank();
        
        vm.warp(131); // Warp past timeout (should still fail)
        vm.startPrank(buyer);
        vm.expectRevert(Order.TimeoutExpired.selector);
        sellOrder.refund(buyer, 0);
        vm.stopPrank();

        // Refund buyer offer 
        vm.warp(31);
        vm.startPrank(buyer);
        sellOrder.refund(buyer, 0);
        vm.stopPrank();

        // TODO: Test double refund

        // TODO: Confirm proper money movement
    }

    function testFailSubmittingOfferTwiceFails() public {
        ERC20Mock token = new ERC20Mock('wETH', 'WETH', address(this), 100);
        address seller = address(0x1234567890123456784012345678901234567829);
        address buyer = address(0x2234567890123456754012345678901234567821);

        // Create a sell order
        Order sellOrder = book.createOrder(
            seller,
            token,
            'ipfs://metadata',
            100,
            false
        );

        token.transfer(buyer, 20);
        vm.startPrank(buyer);
        token.approve(address(sellOrder), 20);
        sellOrder.submitOffer(0, 1, 15, 5, 50, 'ipfs://somedata');
        vm.stopPrank();

        token.transfer(buyer, 20);
        vm.startPrank(buyer);
        token.approve(address(sellOrder), 20);
        sellOrder.submitOffer(0, 1, 15, 5, 50, 'ipfs://somedata');
        vm.stopPrank();
    }

    function testHappyPath() public {
        // Setup
        ERC20Mock token = new ERC20Mock('wETH', 'WETH', address(this), 100);
        address seller = address(0x1234567890123456784012345678901234567829);
        address buyer1 = address(0x2234567890123456754012345678901234567821);
        address buyer2 = address(0x5234567890123456754012345678901234567822);

        // Create a sell order
        Order sellOrder = book.createOrder(
            seller,
            token,
            'ipfs://metadata',
            100,
            false
        );

        // Submit an offer from buyer1
        token.transfer(buyer1, 20);
        vm.startPrank(buyer1);
        token.approve(address(sellOrder), 20);
        sellOrder.submitOffer(0, 1, 20, 5, 50, 'ipfs://somedata');
        vm.stopPrank();
        (, uint256 offer1Price, uint256 offer1Cost, , , , , , ) = sellOrder
            .offers(buyer1, 0);
        require(offer1Price == 20, 'offer price1 is not 15');
        require(offer1Cost == 5, 'offer cost1 is not 5');
        require(
            token.balanceOf(address(sellOrder)) >= 20,
            'transfer did not occur '
        );

        // Submit an offer from buyer2
        token.transfer(buyer2, 20);
        vm.startPrank(buyer2);
        token.approve(address(sellOrder), 20);
        sellOrder.submitOffer(0, 1, 10, 10, 50, 'ipfs://somedata');
        vm.stopPrank();
        (, uint256 offer2price, uint256 offer2cost, , , , , , ) = sellOrder
            .offers(buyer2, 0);
        require(offer2price == 10, 'offer price2 is not 10');
        require(offer2cost == 10, 'offer cost2 is not 10');

        // Confirm buyer2's offer
        token.transfer(seller, 50);
        vm.startPrank(seller);
        token.approve(address(sellOrder), 50);
        sellOrder.commit(buyer2, 0);
        vm.stopPrank();

        (Order.State offerState1, , , , , , , , ) = sellOrder.offers(
            buyer2,
            0
        );
        require(
            offerState1 == Order.State.Committed,
            'state is not committed'
        );
        require(
            token.balanceOf(address(sellOrder)) == 80,
            'Sell order does not have 80 tokens'
        );

        // Confirm the order
        vm.prank(buyer2);
        sellOrder.confirm(buyer2, 0);

        (Order.State offerState2, , , , , , , , ) = sellOrder.offers(
            buyer2,
            0
        );
        require(offerState2 == Order.State.Closed, 'state is not Closed');

        require(
            token.balanceOf(sellOrder.maker()) == 60, // 60 = payment + stake
            'seller did not get paid'
        );
        require(
            token.balanceOf(buyer2) == 10, // stake
            'buyer did not get their stake back'
        );
    }

    function testFailsSellerBuysTheirOwnOrder() public {
        // Setup
        ERC20Mock token = new ERC20Mock('wETH', 'WETH', address(this), 100);
        address seller = address(0x1234567890123456784012345678901234567829);

        // Create a sell order
        Order sellOrder = book.createOrder(
            seller,
            token,
            'ipfs://metadata',
            100,
            false
        );

        // Submit an offer from seller
        token.transfer(seller, 20);
        vm.startPrank(seller);
        token.approve(address(sellOrder), 20);
        sellOrder.submitOffer(0, 1, 15, 5, 50, 'ipfs://somedata');
        vm.stopPrank();
    }

    function testOrderBookFees() public {
        // Setup
        ERC20Mock token = new ERC20Mock('wETH', 'WETH', address(this), 200);

        address seller = address(0x1234567890123456784012345678901234567829);
        address buyer1 = address(0x2234567890123456754012345678901234567821);

        // Create a sell order

        Order sellOrder = book.createOrder(
            seller,
            token,
            'ipfs://metadata',
            100,
            false
        );

        // Submit an offer
        token.transfer(buyer1, 100);
        vm.startPrank(buyer1);
        token.approve(address(sellOrder), 100);
        sellOrder.submitOffer(0, 1, 100, 0, 50, 'ipfs://somedata');
        vm.stopPrank();

        // Commit to the offer
        token.transfer(seller, 50);
        vm.startPrank(seller);
        token.approve(address(sellOrder), 50);
        sellOrder.commit(buyer1, 0);
        vm.stopPrank();

        // Confirm the order
        vm.prank(buyer1);
        sellOrder.confirm(buyer1, 0);

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

    function testCommitBatch() public {
        // Setup
        ERC20Mock token = new ERC20Mock('wETH', 'WETH', address(this), 200);
        address seller = address(0x1234567890123456784012345678901234567829);
        address buyer1 = address(0x2234567890123456754012345678901234567821);
        address buyer2 = address(0x5234567890123456754012345678901234567822);

        // Create a sell order
        Order sellOrder = book.createOrder(
            seller,
            token,
            'ipfs://metadata',
            100,
            false
        );

        // Submit an offer from buyer1
        token.transfer(buyer1, 20);
        vm.startPrank(buyer1);
        token.approve(address(sellOrder), 20);
        sellOrder.submitOffer(0, 1, 15, 5, 50, 'ipfs://somedata');
        vm.stopPrank();
        (, uint256 offer1Price, uint256 offer1Cost, , , , , , ) = sellOrder
            .offers(buyer1, 0);
        require(offer1Price == 15, 'offer price1 is not 15');
        require(offer1Cost == 5, 'offer cost1 is not 5');
        require(
            token.balanceOf(address(sellOrder)) >= 15,
            'transfer did not occur '
        );

        // Submit an offer from buyer2
        token.transfer(buyer2, 20);
        vm.startPrank(buyer2);
        token.approve(address(sellOrder), 20);
        sellOrder.submitOffer(0, 1, 10, 10, 50, 'ipfs://somedata');
        vm.stopPrank();
        (, uint256 offer2price, uint256 offer2cost, , , , , , ) = sellOrder
            .offers(buyer2, 0);
        require(offer2price == 10, 'offer price2 is not 10');
        require(offer2cost == 10, 'offer cost2 is not 10');

        // Confirm both buyers' offers
        token.transfer(seller, 100);
        vm.startPrank(seller);
        token.approve(address(sellOrder), 100);
        address[] memory buyers = new address[](2);
        uint32[] memory offerIndices = new uint32[](2);
        buyers[0] = buyer1;
        offerIndices[0] = 0;
        buyers[1] = buyer2;
        offerIndices[1] = 0;
        sellOrder.commitBatch(buyers, offerIndices);
        vm.stopPrank();

        (Order.State offerState1, , , , , , , , ) = sellOrder.offers(
            buyer2,
            0
        );
        require(
            offerState1 == Order.State.Committed,
            'state is not committed'
        );
        require(
            token.balanceOf(address(sellOrder)) == 125,
            'Sell order does not have 125 tokens'
        );

        // Confirm the order
        vm.prank(buyer2);
        sellOrder.confirm(buyer2, 0);

        (Order.State offerState2, , , , , , , , ) = sellOrder.offers(
            buyer2,
            0
        );
        require(offerState2 == Order.State.Closed, 'state is not Closed');

        require(
            token.balanceOf(sellOrder.maker()) == 60, // 60 = payment + stake
            'seller did not get paid'
        );
        require(
            token.balanceOf(buyer2) == 10, // stake
            'buyer did not get their stake back'
        );
    }
}

contract CancelationTest is Test {
    Order sellOrder;
    address DAO = address(0x4234567890123456784012345678901234567821);
    address seller = address(0x1234567890123456784012345678901234567829);
    ERC20Mock token;
    OrderBook book;

    function setUp() public {
        vm.prank(DAO);
        book = new OrderBook();

        token = new ERC20Mock('wETH', 'WETH', address(this), 20000);

        // Create a sell order
        sellOrder = book.createOrder(
            seller,
            token, // stake
            'ipfs://metadata',
            100,
            false
        );
    }

    function testBuyerCancels() public {
        address buyer = address(0x4634567890123456784012345678901234567821);

        token.transfer(buyer, 100);
        token.transfer(seller, 50);

        uint256 originalBuyer = token.balanceOf(buyer);
        uint256 originalSeller = token.balanceOf(seller);

        // Submit an offer
        vm.startPrank(buyer);
        token.approve(address(sellOrder), 100);
        sellOrder.submitOffer(0, 1, 100, 0, 50, 'ipfs://somedata');
        vm.stopPrank();

        // Commit to the offer
        vm.startPrank(seller);
        token.approve(address(sellOrder), 50);
        sellOrder.commit(buyer, 0);
        vm.stopPrank();

        // buyer canceled
        vm.prank(buyer);
        sellOrder.cancel(buyer, 0);

        (, , , , , , bool sellerCanceled, bool buyerCanceled, ) = sellOrder
            .offers(buyer, 0);
        require(buyerCanceled, 'buyer did not cancel');
        require(!sellerCanceled, 'sellerCanceled canceled');

        // seller canceled
        vm.prank(seller);
        sellOrder.cancel(buyer, 0);

        require(
            token.balanceOf(buyer) == originalBuyer,
            'buyer should be cleared'
        );
        require(
            token.balanceOf(seller) == originalSeller,
            'seller should be cleared'
        );

        (Order.State offerState2, , , , , , , , ) = sellOrder.offers(
            buyer,
            0
        );
        require(offerState2 == Order.State.Closed, 'state is not Closed');
    }

    function buyAndCommit(address buyer, uint32 index) public {
        token.transfer(buyer, 100);
        token.transfer(seller, 50);

        // Submit an offer
        vm.startPrank(buyer);
        token.approve(address(sellOrder), 100);
        sellOrder.submitOffer(index, 1, 100, 0, 50, 'ipfs://somedata');
        vm.stopPrank();

        // Commit to the offer
        vm.startPrank(seller);
        token.approve(address(sellOrder), 50);
        sellOrder.commit(buyer, index);
        vm.stopPrank();
    }

    function testFailIfSellerCancelsAfterCanceled() public {
        address buyer = address(0x3634567890123456784012345678901234567822);
        buyAndCommit(buyer, 0);

        vm.prank(seller);
        sellOrder.cancel(buyer, 0);
        vm.prank(buyer);
        sellOrder.cancel(buyer, 0);

        vm.prank(seller);
        sellOrder.cancel(buyer, 0);
    }

    function testFailIfBuyerCancelsAfterCancelTwice() public {
        address buyer = address(0x3634567890123456784012345678901234567822);
        buyAndCommit(buyer, 0);

        vm.prank(seller);
        sellOrder.cancel(buyer, 0);
        vm.prank(buyer);
        sellOrder.cancel(buyer, 0);

        vm.prank(buyer);
        sellOrder.cancel(buyer, 0);
    }

    function testFailIfTryingToCancelSomeoneElsesOrder() public {
        address buyer = address(0x3634567890123456784012345678901234567822);
        buyAndCommit(buyer, 0);

        address meanieMcNoGooderFace = address(
            0x1634567890123456784012345678901234569824
        );
        vm.prank(meanieMcNoGooderFace);
        sellOrder.cancel(buyer, 0);
    }

    function testMultipleOffers() public {
        address buyer = address(0x3634567890123456784012345678901234567822);
        buyAndCommit(buyer, 0);
        buyAndCommit(buyer, 1);

        (Order.State offerState0, , , , , , , , ) = sellOrder.offers(
            buyer,
            0
        );
        (Order.State offerState1, , , , , , , , ) = sellOrder.offers(
            buyer,
            1
        );

        require(
            offerState0 == Order.State.Committed,
            'state is not Committed'
        );

        require(
            offerState1 == Order.State.Committed,
            'state is not Committed'
        );
    }

    function testFailInactiveOrder() public {
        vm.prank(seller);
        sellOrder.setActive(false);

        address buyer = address(0x3634567890123456784012345678901234567822);
        buyAndCommit(buyer, 0);
    }

    function testFailIfNotSellerCallsSetActive() public {
        sellOrder.setActive(false);
    }

    function testCanSetActiveAndInactive() public {
        vm.prank(seller);
        sellOrder.setActive(false);
        require(!sellOrder.active(), 'sell order is active');

        vm.prank(seller);
        sellOrder.setActive(true);
        require(sellOrder.active(), 'sell order is inactive');
    }
}

contract QuantityTest is Test {
    Order sellOrder;
    address DAO = address(0x4234567890123456784012345678901234567821);
    address seller = address(0x1234567890123456784012345678901234567829);
    ERC20Mock token;
    OrderBook book;
    uint128 sellersStake = 5;

    function setUp() public {
        vm.prank(DAO);
        book = new OrderBook();
        token = new ERC20Mock('wETH', 'WETH', address(this), 20000);

        // Create a sell order
        sellOrder = book.createOrder(
            seller,
            token,
            'ipfs://metadata',
            100,
            false
        );
    }

    function testPurchasingWithQuantity() public {
        address buyer = address(0x2934567890123456784012345678901234567234);

        uint32 quantity = 10;
        uint32 price = 10;
        uint32 cost = 2;
        uint32 index = 0;

        token.transfer(buyer, price * quantity);
        token.transfer(seller, sellersStake * quantity);

        uint256 originalSeller = token.balanceOf(seller);

        // Submit an offer
        vm.startPrank(buyer);
        token.approve(address(sellOrder), quantity * price);
        sellOrder.submitOffer(index, quantity, price, cost, sellersStake, 'ipfs://somedata');
        vm.stopPrank();

        // Commit to the offer
        vm.startPrank(seller);
        token.approve(address(sellOrder), sellersStake * quantity);
        sellOrder.commit(buyer, index);
        vm.stopPrank();

        // Confirm the offer
        vm.startPrank(buyer);
        sellOrder.confirm(buyer, index);
        vm.stopPrank();

        require(
            token.balanceOf(buyer) == 0,
            'buyer should be cleared'
        );

        // Check the buyer and seller got paid
        uint256 total = price * quantity;
        uint256 toOrderBook = (total * IOrderBook(book).fee()) /
            1000000;
        require(
            token.balanceOf(seller) - originalSeller == (total - toOrderBook),
            'seller should be paid'
        );

        // Check the state
        (Order.State offerState, , , , , , , , ) = sellOrder.offers(
            buyer,
            index
        );
        require(offerState == Order.State.Closed, 'state is not Closed');
    }
}

contract OrderBookTest is Test {
    function testFailOnlyOwnerCanSetFees() public {
        address owner = address(0x1234567890123456784012345678901234567829);
        vm.prank(owner);
        OrderBook book = new OrderBook();
        book.setFee(10);
    }

    function testFailOnlyOwnerCanSetOwner() public {
        address owner = address(0x1234567890123456784012345678901234567829);
        vm.prank(owner);
        OrderBook book = new OrderBook();
        book.setOwner(address(0x4234567890123456784012345678901234567822));
    }

    function testOwnerCanSetFees() public {
        address owner = address(0x1234567890123456784012345678901234567829);
        vm.prank(owner);
        OrderBook book = new OrderBook();

        vm.prank(owner);
        book.setFee(10);
        require(book.fee() == 10, 'fee is not 10');
    }

    function testOwnerCanSetOwner() public {
        address owner = address(0x1234567890123456784012345678901234567829);
        vm.prank(owner);
        OrderBook book = new OrderBook();

        vm.prank(owner);
        book.setOwner(owner);
        require(book.owner() == owner, 'owner is not owner');
    }
}
