// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import 'forge-std/Test.sol';
import './ERC20Mock.sol';
import '../src/SellOrder.sol';
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
        sellOrder.submitOffer(0, 1, 10, 10, 'ipfs://somedata');
        vm.stopPrank();
        (, uint256 offer2price, uint256 offer2stake, , , , , ) = sellOrder
            .offers(buyer, 0);
        require(offer2price == 10, 'offer price2 is not 10');
        require(offer2stake == 10, 'offer stake2 is not 10');

        vm.warp(30); // warp to block 30
        // Confirm buyer2's offer
        token.transfer(seller, 50);
        vm.startPrank(seller);
        token.approve(address(sellOrder), 50);
        sellOrder.commit(buyer, 0);
        vm.stopPrank();

        // Submit an offer from buyer
        vm.startPrank(seller);
        vm.expectRevert();
        sellOrder.enforce(buyer, 0);
        vm.stopPrank();

        vm.warp(51); // warp to block 51 (should still fail)
        vm.startPrank(seller);
        vm.expectRevert();
        sellOrder.enforce(buyer, 0);
        vm.stopPrank();

        vm.warp(200); // warp to block 200 (should succeed)
        vm.startPrank(seller);
        sellOrder.enforce(buyer, 0);
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
        sellOrder.submitOffer(0, 1, 15, 5, 'ipfs://somedata');
        vm.stopPrank();

        token.transfer(buyer, 20);
        vm.startPrank(buyer);
        token.approve(address(sellOrder), 20);
        sellOrder.submitOffer(0, 1, 15, 5, 'ipfs://somedata');
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
        sellOrder.submitOffer(0, 1, 15, 5, 'ipfs://somedata');
        vm.stopPrank();
        (, uint256 offer1Price, uint256 offer1Stake, , , , , ) = sellOrder
            .offers(buyer1, 0);
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
        sellOrder.submitOffer(0, 1, 10, 10, 'ipfs://somedata');
        vm.stopPrank();
        (, uint256 offer2price, uint256 offer2stake, , , , , ) = sellOrder
            .offers(buyer2, 0);
        require(offer2price == 10, 'offer price2 is not 10');
        require(offer2stake == 10, 'offer stake2 is not 10');

        // Confirm buyer2's offer
        token.transfer(seller, 50);
        vm.startPrank(seller);
        token.approve(address(sellOrder), 50);
        sellOrder.commit(buyer2, 0);
        vm.stopPrank();

        (SellOrder.State offerState1, , , , , , , ) = sellOrder.offers(
            buyer2,
            0
        );
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
        sellOrder.confirm(0);

        (SellOrder.State offerState2, , , , , , , ) = sellOrder.offers(
            buyer2,
            0
        );
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

    function testFailsSellerBuysTheirOwnOrder() public {
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
        sellOrder.submitOffer(0, 1, 15, 5, 'ipfs://somedata');
        vm.stopPrank();
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
        sellOrder.submitOffer(0, 1, 100, 0, 'ipfs://somedata');
        vm.stopPrank();

        // Commit to the offer
        token.transfer(seller, 50);
        vm.startPrank(seller);
        token.approve(address(sellOrder), 50);
        sellOrder.commit(buyer1, 0);
        vm.stopPrank();

        // Confirm the order
        vm.prank(buyer1);
        sellOrder.confirm(0);

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

contract CancelationTest is Test {
    SellOrder sellOrder;
    address DAO = address(0x4234567890123456784012345678901234567821);
    address seller = address(0x1234567890123456784012345678901234567829);
    ERC20Mock token;
    OrderBook book;

    function setUp() public {
        vm.prank(DAO);
        book = new OrderBook();

        token = new ERC20Mock('wETH', 'WETH', address(this), 20000);

        // Create a sell order
        sellOrder = book.createSellOrder(
            seller,
            token,
            50, // stake
            'ipfs://metadata',
            100
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
        sellOrder.submitOffer(0, 1, 100, 0, 'ipfs://somedata');
        vm.stopPrank();

        // Commit to the offer
        vm.startPrank(seller);
        token.approve(address(sellOrder), 50);
        sellOrder.commit(buyer, 0);
        vm.stopPrank();

        // buyer canceled
        vm.prank(buyer);
        sellOrder.cancel(buyer, 0);

        (, , , , , bool sellerCanceled, bool buyerCanceled, ) = sellOrder
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

        (SellOrder.State offerState2, , , , , , , ) = sellOrder.offers(
            buyer,
            0
        );
        require(offerState2 == SellOrder.State.Closed, 'state is not Closed');
    }

    function buyAndCommit(address buyer, uint32 index) public {
        token.transfer(buyer, 100);
        token.transfer(seller, 50);

        // Submit an offer
        vm.startPrank(buyer);
        token.approve(address(sellOrder), 100);
        sellOrder.submitOffer(index, 1, 100, 0, 'ipfs://somedata');
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

        (SellOrder.State offerState0, , , , , , , ) = sellOrder.offers(
            buyer,
            0
        );
        (SellOrder.State offerState1, , , , , , , ) = sellOrder.offers(
            buyer,
            1
        );

        require(
            offerState0 == SellOrder.State.Committed,
            'state is not Committed'
        );

        require(
            offerState1 == SellOrder.State.Committed,
            'state is not Committed'
        );
    }
}

contract QuantityTest is Test {
    SellOrder sellOrder;
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
        sellOrder = book.createSellOrder(
            seller,
            token,
            sellersStake, // stake
            'ipfs://metadata',
            100
        );
    }

    function testPurchasingWithQuantity() public {
        address buyer = address(0x2934567890123456784012345678901234567234);

        uint32 quantity = 10;
        uint32 price = 5;
        uint32 stake = 2;
        uint32 index = 0;

        token.transfer(buyer, (price + stake) * quantity);
        token.transfer(seller, sellersStake * quantity);

        uint256 originalSeller = token.balanceOf(seller);

        // Submit an offer
        vm.startPrank(buyer);
        token.approve(address(sellOrder), quantity * (price + stake));
        sellOrder.submitOffer(index, quantity, price, stake, 'ipfs://somedata');
        vm.stopPrank();

        // Commit to the offer
        vm.startPrank(seller);
        token.approve(address(sellOrder), sellersStake * quantity);
        sellOrder.commit(buyer, index);
        vm.stopPrank();

        // Confirm the offer
        vm.startPrank(buyer);
        sellOrder.confirm(index);
        vm.stopPrank();

        require(
            token.balanceOf(buyer) == (stake * quantity),
            'buyer should be cleared'
        );

        // Check the buyer and seller got paid
        require(
            token.balanceOf(seller) - originalSeller == ((price) * quantity),
            'seller should be paid'
        );

        // Check the state
        (SellOrder.State offerState, , , , , , , ) = sellOrder.offers(
            buyer,
            index
        );
        require(offerState == SellOrder.State.Closed, 'state is not Closed');
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
