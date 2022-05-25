// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import 'forge-std/Test.sol';
import './ERC20Mock.sol';
import '../src/Order.sol';
import '@openzeppelin/contracts/utils/cryptography/ECDSA.sol';
import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '../src/OrderBook.sol';

contract OrderTest is Test {
    address DAO = address(0x4234567890123456784012345678901234567821);
    address maker = address(0x1234567890123456784012345678901234567829);
    address taker1 = address(0x2234567890123456754012345678901234567821);
    address taker2 = address(0x5234567890123456754012345678901234567822);
    ERC20Mock token;
    OrderBook book;
    uint128 sellersStake = 5;

    function setUp() public {
        vm.prank(DAO);
        book = new OrderBook();
        token = new ERC20Mock('wETH', 'WETH', address(this), 20000);
    }

    function getTransferAmounts(
        Order order,
        uint128 price,
        uint128 buyersCost,
        uint128 sellerStake
    ) public view returns (uint128, uint128) {
        uint128 sellerTransferAmount = sellerStake;
        uint128 buyerTransferAmount = price;
        if (buyersCost > price) {
            buyerTransferAmount += (buyersCost - price);
        }
        uint128 makerTransferAmount;
        uint128 takerTransferAmount;
        if (order.orderType() == Order.OrderType.BuyOrder) {
            makerTransferAmount = buyerTransferAmount;
            takerTransferAmount = sellerTransferAmount;
        } else if (order.orderType() == Order.OrderType.SellOrder) {
            makerTransferAmount = sellerTransferAmount;
            takerTransferAmount = buyerTransferAmount;
        }
        return (makerTransferAmount, takerTransferAmount);
    }

    function createOrder(bool isBuyOrder) public returns (Order) {
        // Create a sell order
        Order order = book.createOrder(
            maker,
            token,
            'ipfs://metadata',
            100,
            isBuyOrder
        );

        assert(address(order.token()) == address(token));
        assert(order.timeout() == 100);
        if (isBuyOrder) {
            assert(order.orderType() == Order.OrderType.BuyOrder);
        } else {
            assert(order.orderType() == Order.OrderType.SellOrder);
        }

        return order;
    }

    function testCreateOrder() public {
        createOrder(false);
    }

    function testCreateOrderFuzz(bool isBuyOrder) public {
        createOrder(isBuyOrder);
    }

    function submitOffer(
        Order order,
        address taker,
        uint32 index,
        uint128 price,
        uint128 buyersCost,
        uint128 sellerStake
    ) public {
        (, uint128 takerTransferAmount) = getTransferAmounts(order, price, buyersCost, sellerStake);

        // Get initial balances
        uint256 takerStartBalance = token.balanceOf(taker);
        uint256 orderStartBalance = token.balanceOf(address(order));

        // Submit an offer from taker
        vm.startPrank(taker);
        order.submitOffer(
            index,
            price,
            buyersCost,
            sellerStake,
            'ipfs://somedata'
        );
        vm.stopPrank();

        (
            Order.State offerState,
            uint256 offerPrice,
            uint256 offerCost,
            ,
            ,
            ,
            ,

        ) = order.offers(taker, index);
        require(offerState == Order.State.Open, 'incorrect offer state');
        require(offerPrice == price, 'incorrect offer price');
        require(offerCost == buyersCost, 'incorrect offer buyersCost');

        require(
            token.balanceOf(address(order)) ==
                orderStartBalance + takerTransferAmount,
            'incorrect transfer to sell order'
        );
        require(
            token.balanceOf(taker) == takerStartBalance - takerTransferAmount,
            'incorrect transfer from taker'
        );
    }

    function testSubmitOfferFuzz(
        bool isBuyOrder,
        uint32 index,
        uint128 price,
        uint128 buyersCost,
        uint128 sellerStake
    ) public {
        vm.assume(price < 10000000000000000000000000000);
        vm.assume(buyersCost < 10000000000000000000000000000);
        vm.assume(sellerStake < 10000000000000000000000000000);
        Order order = createOrder(isBuyOrder);

        (, uint128 takerTransferAmount) = getTransferAmounts(order, price, buyersCost, sellerStake);

        token.mint(taker1, takerTransferAmount);
        vm.startPrank(taker1);
        token.approve(address(order), takerTransferAmount);
        vm.stopPrank();
        submitOffer(order, taker1, index, price, buyersCost, sellerStake);
    }

    function submitOfferBase(Order order, address taker) public {
        uint32 index = 0;
        uint128 price = 1;
        uint128 buyersCost = 1;
        uint128 sellerStake = 1;
        (, uint128 takerTransferAmount) = getTransferAmounts(order, price, buyersCost, sellerStake);

        token.mint(taker, takerTransferAmount);
        vm.startPrank(taker);
        token.approve(address(order), takerTransferAmount);
        vm.stopPrank();
        submitOffer(order, taker, index, price, buyersCost, sellerStake);
    }

    function testSubmitOffer() public {
        Order order = createOrder(false);
        submitOfferBase(order, taker1);
    }

    function testFailSubmitOfferLacksToken() public {
        uint32 index = 0;
        uint128 price = 1;
        uint128 buyersCost = 1;
        uint128 sellerStake = 1;
        Order order = createOrder(false);

        (, uint128 takerTransferAmount) = getTransferAmounts(order, price, buyersCost, sellerStake);

        token.mint(taker1, takerTransferAmount - 1);
        vm.startPrank(taker1);
        token.approve(address(order), takerTransferAmount - 1);
        vm.stopPrank();
        submitOffer(order, taker1, index, price, buyersCost, sellerStake);
    }

    function testFailSubmitOfferPaused() public {
        vm.startPrank(maker);
        Order order = createOrder(false);
        order.pause();
        vm.stopPrank();

        submitOfferBase(order, taker1);

        vm.startPrank(maker);
        order.unpause();
        vm.stopPrank();
    }

    function testSubmitOfferPauseUnpause() public {
        vm.startPrank(maker);
        Order order = createOrder(false);
        order.pause();
        vm.stopPrank();

        vm.startPrank(maker);
        order.unpause();
        vm.stopPrank();
        
        submitOfferBase(order, taker1);
    }

    function testFailSubmitOfferTwice() public {
        Order order = createOrder(false);
        submitOfferBase(order, taker1);
        submitOfferBase(order, taker1);
    }

    function testSubmitTwoOffers() public {
        Order order = createOrder(false);
        submitOfferBase(order, taker1);
        submitOfferBase(order, taker2);
    }

    function testFailSubmitOfferMaker() public {
        Order order = createOrder(false);
        submitOfferBase(order, maker);
    }

    function testFailSubmitOfferCommitted() public {
        Order order = createOrder(false);
        submitOfferBase(order, taker1);
        commitOffer(order, taker1, 0);
        submitOfferBase(order, taker1);
    }

    function testWithdrawOffer() public {
        Order order = createOrder(false);
        submitOfferBase(order, taker1);

        vm.startPrank(taker1);
        order.withdrawOffer(0);
        vm.stopPrank();

        (Order.State offerState, , , , , , , ) = order.offers(taker1, 0);
        require(offerState == Order.State.Closed, 'incorrect offer state');

        require(
            token.balanceOf(address(order)) == 0,
            'incorrect transfer to sell order'
        );
        require(token.balanceOf(taker1) == 1, 'incorrect transfer from taker');
    }

    function testWithdrawOfferFuzz(
        bool isBuyOrder,
        uint32 index,
        uint128 price,
        uint128 buyersCost,
        uint128 sellerStake
    ) public {
        vm.assume(price < 10000000000000000000000000000);
        vm.assume(buyersCost < 10000000000000000000000000000);
        vm.assume(sellerStake < 10000000000000000000000000000);
        Order order = createOrder(isBuyOrder);

        (, uint128 takerTransferAmount) = getTransferAmounts(order, price, buyersCost, sellerStake);

        token.mint(taker1, takerTransferAmount);
        vm.startPrank(taker1);
        token.approve(address(order), takerTransferAmount);
        vm.stopPrank();
        submitOffer(order, taker1, index, price, buyersCost, sellerStake);

        vm.startPrank(taker1);
        order.withdrawOffer(index);
        vm.stopPrank();

        (Order.State offerState, , , , , , , ) = order.offers(
            taker1,
            index
        );
        require(offerState == Order.State.Closed, 'incorrect offer state');

        require(
            token.balanceOf(address(order)) == 0,
            'incorrect transfer to sell order'
        );
        require(
            token.balanceOf(taker1) == takerTransferAmount,
            'incorrect transfer from taker'
        );
    }

    function testFailWithdrawOfferTwice() public {
        Order order = createOrder(false);
        submitOfferBase(order, taker1);

        vm.startPrank(taker1);
        order.withdrawOffer(0);
        order.withdrawOffer(0);
        vm.stopPrank();
    }

    function testFailWithdrawOfferPaused() public {
        Order order = createOrder(false);
        submitOfferBase(order, taker1);

        vm.startPrank(maker);
        order.pause();
        vm.stopPrank();

        vm.startPrank(taker1);
        order.withdrawOffer(0);
        vm.stopPrank();
    }

    function testFailWithdrawClosedOffer() public {
        Order order = createOrder(false);
        vm.startPrank(taker1);
        order.withdrawOffer(0);
        vm.stopPrank();
    }

    function testFailWithdrawOfferMaker() public {
        Order order = createOrder(false);
        submitOfferBase(order, taker1);

        vm.startPrank(maker);
        order.withdrawOffer(0);
        vm.stopPrank();
    }

    function testFailWithdrawOfferCommitted() public {
        Order order = createOrder(false);
        submitOfferBase(order, taker1);
        commitOffer(order, taker1, 0);
        vm.startPrank(taker1);
        order.withdrawOffer(0);
        vm.stopPrank();
    }

    function commitOffer(Order order, address taker, uint32 index) public {
        // Get initial balances
        uint256 makerStartBalance = token.balanceOf(maker);
        uint256 orderStartBalance = token.balanceOf(address(order));

        // Commit to an offer from maker
        vm.startPrank(maker);
        order.commit(taker, index);
        vm.stopPrank();

        (Order.State offerState, uint128 price, uint128 buyersCost, uint128 sellerStake, , , , ) = order
            .offers(taker, index);
        (uint128 makerTransferAmount, ) = getTransferAmounts(order, price, buyersCost, sellerStake);
        require(offerState == Order.State.Committed, 'incorrect offer state');

        require(
            token.balanceOf(address(order)) ==
                orderStartBalance + makerTransferAmount,
            'incorrect transfer to sell order'
        );
        require(
            token.balanceOf(maker) == makerStartBalance - makerTransferAmount,
            'incorrect transfer from maker'
        );
    }

    function testCommitOfferBase() public {
        Order order = createOrder(false);
        submitOfferBase(order, taker1);

        token.mint(maker, 1);
        vm.startPrank(maker);
        token.approve(address(order), 1);
        vm.stopPrank();
        commitOffer(order, taker1, 0);
    }

    function testFailCommitOfferPaused() public {
        Order order = createOrder(false);
        submitOfferBase(order, taker1);

        vm.startPrank(maker);
        order.pause();
        vm.stopPrank();

        token.mint(maker, 1);
        vm.startPrank(maker);
        token.approve(address(order), 1);
        vm.stopPrank();
        commitOffer(order, taker1, 0);
    }

    function testCommitOfferFuzz(
        bool isBuyOrder,
        uint32 index,
        uint128 price,
        uint128 buyersCost,
        uint128 sellerStake
    ) public {
        vm.assume(price < 10000000000000000000000000000);
        vm.assume(buyersCost < 10000000000000000000000000000);
        vm.assume(sellerStake < 10000000000000000000000000000);
        Order order = createOrder(isBuyOrder);

        (uint128 makerTransferAmount, uint128 takerTransferAmount) = getTransferAmounts(order, price, buyersCost, sellerStake);

        token.mint(taker1, takerTransferAmount);
        vm.startPrank(taker1);
        token.approve(address(order), takerTransferAmount);
        vm.stopPrank();
        submitOffer(order, taker1, index, price, buyersCost, sellerStake);

        token.mint(maker, makerTransferAmount);
        vm.startPrank(maker);
        token.approve(address(order), makerTransferAmount);
        vm.stopPrank();
        commitOffer(order, taker1, index);

        (Order.State offerState, , , , , , , ) = order.offers(
            taker1,
            index
        );
        require(offerState == Order.State.Committed, 'incorrect offer state');
    }

    function testFailCommitOfferBaseLacksTokens() public {
        Order order = createOrder(false);
        submitOfferBase(order, taker1);

        token.mint(maker, 1);
        vm.startPrank(maker);
        token.approve(address(order), 0);
        vm.stopPrank();
        commitOffer(order, taker1, 0);
    }

    function testFailCommitOfferNotMaker() public {
        Order order = createOrder(false);
        submitOfferBase(order, taker1);

        token.mint(taker2, 1);
        vm.startPrank(taker2);
        token.approve(address(order), 1);
        vm.stopPrank();
        commitOffer(order, taker1, 0);
    }

    function testFailCommitOfferTaker() public {
        Order order = createOrder(false);
        submitOfferBase(order, taker1);

        token.mint(taker1, 1);
        vm.startPrank(taker1);
        token.approve(address(order), 1);
        vm.stopPrank();
        commitOffer(order, taker1, 0);
    }

    function testFailCommitOfferClosed() public {
        Order order = createOrder(false);
        token.mint(maker, 1);
        vm.startPrank(maker);
        token.approve(address(order), 0);
        vm.stopPrank();
        commitOffer(order, taker1, 0);
    }

    function testCommitOfferBatch() public {
        Order order = createOrder(false);
        submitOfferBase(order, taker1);
        submitOfferBase(order, taker2);

        token.mint(maker, 2);
        vm.startPrank(maker);
        token.approve(address(order), 2);
        vm.stopPrank();

        // Get initial balances
        uint256 makerStartBalance = token.balanceOf(maker);
        uint256 orderStartBalance = token.balanceOf(address(order));

        // Commit to an offer from maker
        address[] memory takers = new address[](2);
        uint32[] memory indicies = new uint32[](2);
        takers[0] = taker1;
        indicies[0] = 0;
        takers[1] = taker2;
        indicies[1] = 0;
        vm.startPrank(maker);
        order.commitBatch(takers, indicies);
        vm.stopPrank();

        (Order.State offerState, , , , , , , ) = order.offers(taker1, 0);
        require(offerState == Order.State.Committed, 'incorrect offer state');

        require(
            token.balanceOf(address(order)) == orderStartBalance + 2,
            'incorrect transfer to sell order'
        );
        require(
            token.balanceOf(maker) == makerStartBalance - 2,
            'incorrect transfer from maker'
        );
    }

    function confirmOffer(
        Order order,
        address taker,
        address from,
        uint32 index
    ) public {
        // Get initial balances
        uint256 makerStartBalance = token.balanceOf(maker);
        uint256 takerStartBalance = token.balanceOf(taker);
        uint256 daoStartBalance = token.balanceOf(DAO);

        (, uint128 price, uint128 buyersCost, uint128 sellerStake, , , , ) = order
            .offers(taker, index);

        // Confirm to an offer from maker
        vm.startPrank(from);
        order.confirm(taker, index);
        vm.stopPrank();

        (Order.State offerState, , , , , , , ) = order.offers(taker, index);
        require(offerState == Order.State.Closed, 'incorrect offer state');

        uint256 buyerTransferAmount = 0;
        if (buyersCost > price ) {
            buyerTransferAmount += buyersCost - price;
        }
        uint256 makerTransferAmount;
        uint256 takerTransferAmount;
        if (order.orderType() == Order.OrderType.BuyOrder) {
            makerTransferAmount = buyerTransferAmount;
            takerTransferAmount = price - ((price * IOrderBook(book).fee()) / 1000000) + sellerStake;
        } else {
            makerTransferAmount = price - ((price * IOrderBook(book).fee()) / 1000000) + sellerStake;
            takerTransferAmount = buyerTransferAmount;
        }

        require(
            token.balanceOf(address(order)) == 0,
            'sell order should have no balance'
        );

        require(
            token.balanceOf(maker) == makerStartBalance + makerTransferAmount,
            'incorrect transfer to maker'
        );

        require(
            token.balanceOf(DAO) == daoStartBalance + ((price * IOrderBook(book).fee()) / 1000000),
            'incorrect transfer to DAO'
        );

        require(
            token.balanceOf(taker) == takerStartBalance + takerTransferAmount,
            'incorrect transfer to taker'
        );
    }

    function testConfirmOffer() public {
        vm.warp(0);
        Order order = createOrder(false);
        submitOfferBase(order, taker1);

        token.mint(maker, 1);
        vm.startPrank(maker);
        token.approve(address(order), 1);
        vm.stopPrank();
        commitOffer(order, taker1, 0);

        vm.warp(0);
        confirmOffer(order, taker1, taker1, 0);
    }

    function testFailConfirmOfferPaused() public {
        vm.warp(0);
        Order order = createOrder(false);
        submitOfferBase(order, taker1);

        token.mint(maker, 1);
        vm.startPrank(maker);
        token.approve(address(order), 1);
        vm.stopPrank();
        commitOffer(order, taker1, 0);

        vm.startPrank(maker);
        order.pause();
        vm.stopPrank();

        vm.warp(0);
        confirmOffer(order, taker1, taker1, 0);
    }

    function testConfirmOfferMaker() public {
        vm.warp(0);
        Order order = createOrder(false);
        submitOfferBase(order, taker1);

        token.mint(maker, 1);
        vm.startPrank(maker);
        token.approve(address(order), 1);
        vm.stopPrank();
        commitOffer(order, taker1, 0);

        vm.warp(110);
        confirmOffer(order, taker1, maker, 0);
    }

    function testFailConfirmOfferMakerTimeout() public {
        vm.warp(0);
        Order order = createOrder(false);
        submitOfferBase(order, taker1);

        token.mint(maker, 1);
        vm.startPrank(maker);
        token.approve(address(order), 1);
        vm.stopPrank();
        commitOffer(order, taker1, 0);

        vm.warp(10);
        confirmOffer(order, taker1, maker, 0);
    }

    function testConfirmOfferBatch() public {
        vm.warp(0);
        Order order = createOrder(false);
        submitOfferBase(order, taker1);
        submitOfferBase(order, taker2);

        token.mint(maker, 2);
        vm.startPrank(maker);
        token.approve(address(order), 2);
        vm.stopPrank();
        commitOffer(order, taker1, 0);
        commitOffer(order, taker2, 0);

        vm.warp(110);
        address[] memory takers = new address[](2);
        uint32[] memory indicies = new uint32[](2);
        takers[0] = taker1;
        indicies[0] = 0;
        takers[1] = taker2;
        indicies[1] = 0;
        vm.startPrank(maker);
        order.confirmBatch(takers, indicies);
        vm.stopPrank();
    }

    function testConfirmOfferFuzz(
        bool isBuyOrder,
        uint32 index,
        uint128 price,
        uint128 buyersCost,
        uint128 sellerStake
    ) public {
        vm.assume(price < 10000000000000000000000000000);
        vm.assume(buyersCost < 10000000000000000000000000000);
        vm.assume(sellerStake < 10000000000000000000000000000);
        Order order = createOrder(isBuyOrder);
        (uint128 makerTransferAmount, uint128 takerTransferAmount) = getTransferAmounts(order, price, buyersCost, sellerStake);

        token.mint(taker1, takerTransferAmount);
        vm.startPrank(taker1);
        token.approve(address(order), takerTransferAmount);
        vm.stopPrank();
        submitOffer(order, taker1, index, price, buyersCost, sellerStake);

        token.mint(maker, makerTransferAmount);
        vm.startPrank(maker);
        token.approve(address(order), makerTransferAmount);
        vm.stopPrank();
        commitOffer(order, taker1, index);

        address buyer = isBuyOrder ? maker : taker1;
        confirmOffer(order, taker1, buyer, index);

        (Order.State offerState, , , , , , , ) = order.offers(
            taker1,
            index
        );
        require(offerState == Order.State.Closed, 'incorrect offer state');
    }

    function testFailConfirmOfferNotCommitted() public {
        Order order = createOrder(false);
        submitOfferBase(order, taker1);
        confirmOffer(order, taker1, taker1, 0);
    }

    function refundOffer(Order order, address taker, address from, uint32 index) public {
        // Get initial balances
        uint256 makerStartBalance = token.balanceOf(maker);
        uint256 takerStartBalance = token.balanceOf(taker);

        (, uint128 price, uint128 buyersCost,, , , , ) = order.offers(
            taker,
            index
        );

        // Confirm to an offer from maker
        vm.startPrank(from);
        order.refund(taker, index);
        vm.stopPrank();

        (Order.State offerState, , , , , , , ) = order.offers(taker, index);
        require(offerState == Order.State.Closed, 'incorrect offer state');

        require(
            token.balanceOf(address(order)) == 0,
            'sell order should have no balance'
        );

        uint128 buyerTransferAmount = 0;
        if (buyersCost < price) {
            buyerTransferAmount += price - buyersCost;
        }
        uint128 makerTransferAmount;
        uint128 takerTransferAmount;
        if (order.orderType() == Order.OrderType.BuyOrder) {
            makerTransferAmount = buyerTransferAmount;
            takerTransferAmount = 0;
        } else if (order.orderType() == Order.OrderType.SellOrder) {
            makerTransferAmount = 0;
            takerTransferAmount = buyerTransferAmount;
        }
        require(
            token.balanceOf(maker) == makerStartBalance + makerTransferAmount,
            'incorrect transfer to maker'
        );

        require(
            token.balanceOf(taker) == takerStartBalance + takerTransferAmount,
            'incorrect transfer to taker'
        );
    }

    function testRefundOffer() public {
        vm.warp(0);
        Order order = createOrder(false);
        submitOfferBase(order, taker1);

        token.mint(maker, 1);
        vm.startPrank(maker);
        token.approve(address(order), 1);
        vm.stopPrank();
        commitOffer(order, taker1, 0);

        vm.warp(0);
        refundOffer(order, taker1, taker1, 0);
    }

    function testRefundOfferFuzz(
        bool isBuyOrder,
        uint32 index,
        uint128 price,
        uint128 buyersCost,
        uint128 sellerStake
    ) public {
        vm.assume(price < 10000000000000000000000000000);
        vm.assume(buyersCost < 10000000000000000000000000000);
        vm.assume(sellerStake < 10000000000000000000000000000);
        Order order = createOrder(isBuyOrder);
        (uint128 makerTransferAmount, uint128 takerTransferAmount) = getTransferAmounts(order, price, buyersCost, sellerStake);


        token.mint(taker1, takerTransferAmount);
        vm.startPrank(taker1);
        token.approve(address(order), takerTransferAmount);
        vm.stopPrank();
        submitOffer(order, taker1, index, price, buyersCost, sellerStake);

        token.mint(maker, makerTransferAmount);
        vm.startPrank(maker);
        token.approve(address(order), makerTransferAmount);
        vm.stopPrank();
        commitOffer(order, taker1, index);

        address buyer = isBuyOrder ? maker : taker1;
        refundOffer(order, taker1, buyer, index);

        (Order.State offerState, , , , , , , ) = order.offers(
            taker1,
            index
        );
        require(offerState == Order.State.Closed, 'incorrect offer state');
    }

    function testFailRefundOfferPaused() public {
        vm.warp(0);
        Order order = createOrder(false);
        submitOfferBase(order, taker1);

        token.mint(maker, 1);
        vm.startPrank(maker);
        token.approve(address(order), 1);
        vm.stopPrank();
        commitOffer(order, taker1, 0);

        vm.startPrank(maker);
        order.pause();
        vm.stopPrank();

        vm.warp(0);
        refundOffer(order, taker1, taker1, 0);
    }

    function testFailRefundOfferExpired() public {
        vm.warp(0);
        Order order = createOrder(false);
        submitOfferBase(order, taker1);

        token.mint(maker, 1);
        vm.startPrank(maker);
        token.approve(address(order), 1);
        vm.stopPrank();
        commitOffer(order, taker1, 0);

        vm.warp(110);
        refundOffer(order, taker1, taker1, 0);
    }

    function testFailRefundOfferNotBuyer() public {
        Order order = createOrder(false);
        submitOfferBase(order, taker1);

        token.mint(maker, 1);
        vm.startPrank(maker);
        token.approve(address(order), 1);
        vm.stopPrank();
        commitOffer(order, taker1, 0);

        // Confirm to an offer from maker
        vm.startPrank(taker2);
        order.refund(taker1, 0);
        vm.stopPrank();
    }

    function cancelOffer(
        Order order,
        address taker,
        address from,
        uint32 index
    ) public {
        // Get initial balances
        uint256 makerStartBalance = token.balanceOf(maker);
        uint256 takerStartBalance = token.balanceOf(taker);

        (
            ,
            uint128 price,
            uint128 buyersCost,
            uint128 sellerStake,
            ,
            ,
            bool makerCanceled,
            bool takerCanceled
        ) = order.offers(taker, index);

        // Cancel an offer
        vm.startPrank(from);
        order.cancel(taker, index);
        vm.stopPrank();

        (Order.State offerState, , , , , , , ) = order.offers(taker, index);

        if (makerCanceled || takerCanceled) {
            require(offerState == Order.State.Closed, 'incorrect offer state');
            require(
                token.balanceOf(address(order)) == 0,
                'sell order should have no balance'
            );
            (uint128 makerTransferAmount, uint128 takerTransferAmount) = getTransferAmounts(order, price, buyersCost, sellerStake);
            require(
                token.balanceOf(maker) == makerStartBalance + makerTransferAmount,
                'incorrect transfer to maker'
            );
            require(
                token.balanceOf(taker) == takerStartBalance + takerTransferAmount,
                'incorrect transfer to taker'
            );
        } else {
            require(
                offerState == Order.State.Committed,
                'incorrect offer state'
            );
        }
    }

    function testCancelOffer() public {
        Order order = createOrder(false);
        submitOfferBase(order, taker1);

        token.mint(maker, 1);
        vm.startPrank(maker);
        token.approve(address(order), 1);
        vm.stopPrank();

        commitOffer(order, taker1, 0);

        cancelOffer(order, taker1, taker1, 0);
        cancelOffer(order, taker1, maker, 0);
    }

    function testCancelOnce() public {
        Order order = createOrder(false);
        submitOfferBase(order, taker1);

        token.mint(maker, 1);
        vm.startPrank(maker);
        token.approve(address(order), 1);
        vm.stopPrank();

        commitOffer(order, taker1, 0);

        cancelOffer(order, taker1, taker1, 0);

        (Order.State offerState, , , , , , , ) = order.offers(taker1, 0);
        require(offerState == Order.State.Committed, 'incorrect offer state');
    }

    function testCancelOfferFuzz(
        bool isBuyOrder,
        uint32 index,
        uint128 price,
        uint128 buyersCost,
        uint128 sellerStake
    ) public {
        vm.assume(price < 10000000000000000000000000000);
        vm.assume(buyersCost < 10000000000000000000000000000);
        vm.assume(sellerStake < 10000000000000000000000000000);
        Order order = createOrder(isBuyOrder);
        (uint128 makerTransferAmount, uint128 takerTransferAmount) = getTransferAmounts(order, price, buyersCost, sellerStake);

        token.mint(taker1, takerTransferAmount);
        vm.startPrank(taker1);
        token.approve(address(order), takerTransferAmount);
        vm.stopPrank();
        submitOffer(order, taker1, index, price, buyersCost, sellerStake);

        token.mint(maker, makerTransferAmount);
        vm.startPrank(maker);
        token.approve(address(order), makerTransferAmount);
        vm.stopPrank();
        commitOffer(order, taker1, index);

        cancelOffer(order, taker1, taker1, index);
        cancelOffer(order, taker1, maker, index);

        (Order.State offerState, , , , , , , ) = order.offers(
            taker1,
            index
        );
        require(offerState == Order.State.Closed, 'incorrect offer state');
    }

    function testFailCancelOfferPaused() public {
        Order order = createOrder(false);
        submitOfferBase(order, taker1);

        token.mint(maker, 1);
        vm.startPrank(maker);
        token.approve(address(order), 1);
        vm.stopPrank();

        commitOffer(order, taker1, 0);

        vm.startPrank(maker);
        order.pause();
        vm.stopPrank();

        cancelOffer(order, taker1, taker1, 0);
    }

    function testPauseMaker() public {
        Order order = createOrder(false);
        submitOfferBase(order, taker1);

        vm.startPrank(maker);
        order.pause();
        vm.stopPrank();

        assert(Pausable(order).paused() == true);
    }

    function testUnpauseMaker() public {
        Order order = createOrder(false);
        submitOfferBase(order, taker1);

        vm.startPrank(maker);
        order.pause();
        vm.stopPrank();

        vm.startPrank(maker);
        order.unpause();
        vm.stopPrank();

        assert(Pausable(order).paused() == false);
    }

    function testFailPauseNotMaker() public {
        Order order = createOrder(false);
        submitOfferBase(order, taker1);

        vm.startPrank(taker1);
        order.pause();
        vm.stopPrank();
    }

    function testPauseDAO() public {
        Order order = createOrder(false);
        submitOfferBase(order, taker1);

        vm.startPrank(DAO);
        order.pause();
        vm.stopPrank();

        assert(Pausable(order).paused() == true);
    }
}

contract OrderBookTest is Test {
    address DAO = address(0x4234567890123456784012345678901234567821);
    address maker = address(0x1234567890123456784012345678901234567829);
    address taker1 = address(0x2234567890123456754012345678901234567821);
    address taker2 = address(0x5234567890123456754012345678901234567822);
    ERC20Mock token;

    function setUp() public {
        token = new ERC20Mock('wETH', 'WETH', address(this), 20000);
    }
    
    function testFailOnlyDAOCanSetFees() public {
        vm.prank(DAO);
        OrderBook book = new OrderBook();
        book.setFee(10);
    }

    function testFailOnlyDAOCanSetOwner() public {
        vm.prank(DAO);
        OrderBook book = new OrderBook();
        book.setOwner(maker);
    }

    function testDAOCanSetFees() public {
        vm.prank(DAO);
        OrderBook book = new OrderBook();

        vm.prank(DAO);
        book.setFee(10);
        require(book.fee() == 10, 'fee is not 10');
    }

    function testDAOCanSetOwner() public {
        vm.prank(DAO);
        OrderBook book = new OrderBook();

        vm.prank(DAO);
        book.setOwner(DAO);
        require(book.owner() == DAO, 'owner is not owner');
    }

    function testPauseBook() public {
        vm.startPrank(DAO);
        OrderBook book = new OrderBook();
        book.pause();
        vm.stopPrank();

        assert(Pausable(book).paused() == true);
    }

    function testFailPauseBookNotDAO() public {
        vm.startPrank(DAO);
        OrderBook book = new OrderBook();
        vm.stopPrank();
        
        vm.startPrank(maker);
        book.pause();
        vm.stopPrank();
    }

    function testFailPauseBookCreateOrder() public {
        vm.startPrank(DAO);
        OrderBook book = new OrderBook();
        book.pause();
        vm.stopPrank();

        book.createOrder(
            maker,
            token,
            'ipfs://metadata',
            100,
            false
        );
    }

    function testPauseUnpauseBookCreateOrder() public {
        vm.startPrank(DAO);
        OrderBook book = new OrderBook();
        vm.stopPrank();

        vm.startPrank(DAO);
        book.pause();
        vm.stopPrank();

        vm.startPrank(DAO);
        book.unpause();
        vm.stopPrank();
        
        book.createOrder(
            maker,
            token,
            'ipfs://metadata',
            100,
            false
        );
    }

    function testFailPauseSubmitOffer() public {
        vm.startPrank(DAO);
        OrderBook book = new OrderBook();
        vm.stopPrank();

        Order order = book.createOrder(
            maker,
            token,
            'ipfs://metadata',
            100,
            false
        );
        
        vm.startPrank(DAO);
        book.pause();
        vm.stopPrank();
        
        token.mint(taker1, 1);
        vm.startPrank(taker1);
        token.approve(address(order), 1);
        order.submitOffer(0, 1, 1, 1, "");
        vm.stopPrank();
    }
}

