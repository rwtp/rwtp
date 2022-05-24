// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import 'forge-std/Test.sol';
import './ERC20Mock.sol';
import '../src/Order.sol';
import '@openzeppelin/contracts/utils/cryptography/ECDSA.sol';
import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '../src/OrderBook.sol';

contract SellOrderTest is Test {
    Order sellOrder;
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

        // Create a sell order
        sellOrder = book.createOrder(
            maker,
            token,
            'ipfs://metadata',
            100,
            false
        );

        assert(address(sellOrder.token()) == address(token));
        assert(sellOrder.active());
    }

    function submitOffer(
        address taker,
        uint32 index,
        uint32 quantity,
        uint128 pricePerUnit,
        uint128 costPerUnit,
        uint128 sellerStakePerUnit
    ) public {
        // Get initial balances
        uint256 takerStartBalance = token.balanceOf(taker);
        uint256 orderStartBalance = token.balanceOf(address(sellOrder));

        // Submit an offer from taker
        vm.startPrank(taker);
        sellOrder.submitOffer(index, quantity, pricePerUnit, costPerUnit, sellerStakePerUnit, 'ipfs://somedata');
        vm.stopPrank();
        
        (Order.State offerState, uint256 offerPrice, uint256 offerCost, , , , , , ) = sellOrder
            .offers(taker, index);
        require(offerState == Order.State.Open, 'incorrect offer state');
        require(offerPrice == pricePerUnit, 'incorrect offer price');
        require(offerCost == costPerUnit, 'incorrect offer cost');
        
        uint128 transferAmount = pricePerUnit * quantity;
        if (costPerUnit > pricePerUnit) {
            transferAmount += (costPerUnit - pricePerUnit) * quantity;
        }

        require(
            token.balanceOf(address(sellOrder)) == orderStartBalance + transferAmount,
            'incorrect transfer to sell order'
        );
        require(
            token.balanceOf(taker) == takerStartBalance - transferAmount,
            'incorrect transfer from taker'
        );
    }

    function toSignature(
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public pure returns (bytes memory) {
        return abi.encodePacked(v, r, s);
    }

    function testSubmitOfferFuzz(
        uint32 index,
        uint32 quantity,
        uint128 pricePerUnit,
        uint128 costPerUnit,
        uint128 sellerStakePerUnit
    )  public {
        vm.assume(quantity < 10000000000000000000000000);
        vm.assume(pricePerUnit < 10000000000000000000000000000);
        vm.assume(costPerUnit < 10000000000000000000000000000);
        vm.assume(sellerStakePerUnit < 10000000000000000000000000000);
        uint128 transferAmount = pricePerUnit * quantity;
        if (costPerUnit > pricePerUnit) {
            transferAmount += (costPerUnit + pricePerUnit) * quantity;
        }

        token.mint(taker1, transferAmount);
        vm.startPrank(taker1);
        token.approve(address(sellOrder), transferAmount);
        vm.stopPrank();
        submitOffer(taker1, index, quantity, pricePerUnit, costPerUnit, sellerStakePerUnit);
    }

    function submitOfferBase(address taker)  public {
        uint32 index = 0;
        uint32 quantity = 1;
        uint128 pricePerUnit = 1;
        uint128 costPerUnit = 1;
        uint128 sellerStakePerUnit = 1;

        uint128 transferAmount = pricePerUnit * quantity;
        if (costPerUnit > pricePerUnit) {
            transferAmount += (costPerUnit + pricePerUnit) * quantity;
        }

        token.mint(taker, transferAmount);
        vm.startPrank(taker);
        token.approve(address(sellOrder), transferAmount);
        vm.stopPrank();
        submitOffer(taker, index, quantity, pricePerUnit, costPerUnit, sellerStakePerUnit);
    }

    function testSubmitOffer() public {
        submitOfferBase(taker1);
    }

    function testFailSubmitOfferLacksToken()  public {
        uint32 index = 0;
        uint32 quantity = 1;
        uint128 pricePerUnit = 1;
        uint128 costPerUnit = 1;
        uint128 sellerStakePerUnit = 1;

        uint128 transferAmount = pricePerUnit * quantity;
        if (costPerUnit > pricePerUnit) {
            transferAmount += (costPerUnit + pricePerUnit) * quantity;
        }

        token.mint(taker1, transferAmount - 1);
        vm.startPrank(taker1);
        token.approve(address(sellOrder), transferAmount - 1);
        vm.stopPrank();
        submitOffer(taker1, index, quantity, pricePerUnit, costPerUnit, sellerStakePerUnit);
    }

    function testFailSubmitOfferInactive()  public {
        vm.startPrank(maker);
        sellOrder.setActive(false);
        vm.stopPrank();
        
        submitOfferBase(taker1);

        vm.startPrank(maker);
        sellOrder.setActive(true);
        vm.stopPrank();
    }

    function testFailSubmitOfferTwice()  public {
        submitOfferBase(taker1);
        submitOfferBase(taker1);
    }

    function testSubmitTwoOffers()  public {
        submitOfferBase(taker1);
        submitOfferBase(taker2);
    }

    function testFailSubmitOfferMaker()  public {
        submitOfferBase(maker);
    }

    function testFailSubmitOfferCommitted()  public {
        submitOfferBase(taker1);
        commitOffer(taker1, 0);
        submitOfferBase(taker1);
    }

    function testWithdrawOffer() public {
        submitOfferBase(taker1);

        vm.startPrank(taker1);
        sellOrder.withdrawOffer(0);
        vm.stopPrank();

        (Order.State offerState, , , , , , , , ) = sellOrder.offers(taker1, 0);
        require(offerState == Order.State.Closed, 'incorrect offer state');

        require(
            token.balanceOf(address(sellOrder)) == 0,
            'incorrect transfer to sell order'
        );
        require(
            token.balanceOf(taker1) == 1,
            'incorrect transfer from taker'
        );
    }

    function testWithdrawOfferFuzz(
        uint32 index,
        uint32 quantity,
        uint128 pricePerUnit,
        uint128 costPerUnit,
        uint128 sellerStakePerUnit
    )  public {
        vm.assume(quantity < 10000000000000000000000000);
        vm.assume(pricePerUnit < 10000000000000000000000000000);
        vm.assume(costPerUnit < 10000000000000000000000000000);
        vm.assume(sellerStakePerUnit < 10000000000000000000000000000);
        uint128 transferAmount = pricePerUnit * quantity;
        if (costPerUnit > pricePerUnit) {
            transferAmount += (costPerUnit + pricePerUnit) * quantity;
        }

        token.mint(taker1, transferAmount);
        vm.startPrank(taker1);
        token.approve(address(sellOrder), transferAmount);
        vm.stopPrank();
        submitOffer(taker1, index, quantity, pricePerUnit, costPerUnit, sellerStakePerUnit);

        vm.startPrank(taker1);
        sellOrder.withdrawOffer(index);
        vm.stopPrank();

        (Order.State offerState, , , , , , , , ) = sellOrder.offers(taker1, index);
        require(offerState == Order.State.Closed, 'incorrect offer state');

        require(
            token.balanceOf(address(sellOrder)) == 0,
            'incorrect transfer to sell order'
        );
        require(
            token.balanceOf(taker1) == transferAmount,
            'incorrect transfer from taker'
        );
    }

    function testFailWithdrawOfferTwice() public {
        submitOfferBase(taker1);

        vm.startPrank(taker1);
        sellOrder.withdrawOffer(0);
        sellOrder.withdrawOffer(0);
        vm.stopPrank();
    }

    function testFailWithdrawClosedOffer() public {
        vm.startPrank(taker1);
        sellOrder.withdrawOffer(0);
        vm.stopPrank();
    }

    function testFailWithdrawOfferMaker() public {
        submitOfferBase(taker1);

        vm.startPrank(maker);
        sellOrder.withdrawOffer(0);
        vm.stopPrank();
    }

    function testFailWithdrawOfferCommitted()  public {
        submitOfferBase(taker1);
        commitOffer(taker1, 0);
        vm.startPrank(taker1);
        sellOrder.withdrawOffer(0);
        vm.stopPrank();
    }

    function commitOffer(
        address taker, 
        uint32 index
    ) public {
        // Get initial balances
        uint256 makerStartBalance = token.balanceOf(maker);
        uint256 orderStartBalance = token.balanceOf(address(sellOrder));

        // Commit to an offer from maker
        vm.startPrank(maker);
        sellOrder.commit(taker, index);
        vm.stopPrank();
        
        (Order.State offerState, , , uint128 sellerStakePerUnit , , , , , uint32 quantity) = sellOrder
            .offers(taker, index);
        require(offerState == Order.State.Committed, 'incorrect offer state');
        
        uint128 transferAmount = sellerStakePerUnit * quantity;

        require(
            token.balanceOf(address(sellOrder)) == orderStartBalance + transferAmount,
            'incorrect transfer to sell order'
        );
        require(
            token.balanceOf(maker) == makerStartBalance - transferAmount,
            'incorrect transfer from maker'
        );
    }

    function testCommitOfferBase() public {
        submitOfferBase(taker1);

        token.mint(maker, 1);
        vm.startPrank(maker);
        token.approve(address(sellOrder), 1);
        vm.stopPrank();
        commitOffer(taker1, 0);
    }

    function testCommitOfferFuzz(
        uint32 index,
        uint32 quantity,
        uint128 pricePerUnit,
        uint128 costPerUnit,
        uint128 sellerStakePerUnit
    )  public {
        vm.assume(quantity < 10000000000000000000000000);
        vm.assume(pricePerUnit < 10000000000000000000000000000);
        vm.assume(costPerUnit < 10000000000000000000000000000);
        vm.assume(sellerStakePerUnit < 10000000000000000000000000000);
        uint128 transferAmount = pricePerUnit * quantity;
        if (costPerUnit > pricePerUnit) {
            transferAmount += (costPerUnit + pricePerUnit) * quantity;
        }

        token.mint(taker1, transferAmount);
        vm.startPrank(taker1);
        token.approve(address(sellOrder), transferAmount);
        vm.stopPrank();
        submitOffer(taker1, index, quantity, pricePerUnit, costPerUnit, sellerStakePerUnit);

        uint128 makerStakeAmount = sellerStakePerUnit * quantity;
        token.mint(maker, makerStakeAmount);
        vm.startPrank(maker);
        token.approve(address(sellOrder), makerStakeAmount);
        vm.stopPrank();
        commitOffer(taker1, index);

        (Order.State offerState, , , , , , , , ) = sellOrder.offers(taker1, index);
        require(offerState == Order.State.Committed, 'incorrect offer state');
    }

    function testFailCommitOfferBaseLacksTokens() public {
        submitOfferBase(taker1);

        token.mint(maker, 1);
        vm.startPrank(maker);
        token.approve(address(sellOrder), 0);
        vm.stopPrank();
        commitOffer(taker1, 0);
    }

    function testFailCommitOfferNotMaker() public {
        submitOfferBase(taker1);

        token.mint(taker2, 1);
        vm.startPrank(taker2);
        token.approve(address(sellOrder), 1);
        vm.stopPrank();
        commitOffer(taker1, 0);
    }

    function testFailCommitOfferTaker() public {
        submitOfferBase(taker1);

        token.mint(taker1, 1);
        vm.startPrank(taker1);
        token.approve(address(sellOrder), 1);
        vm.stopPrank();
        commitOffer(taker1, 0);
    }

    function testFailCommitOfferClosed() public {
        token.mint(maker, 1);
        vm.startPrank(maker);
        token.approve(address(sellOrder), 0);
        vm.stopPrank();
        commitOffer(taker1, 0);
    }

    function testCommitOfferBatch() public {
        submitOfferBase(taker1);
        submitOfferBase(taker2);

        token.mint(maker, 2);
        vm.startPrank(maker);
        token.approve(address(sellOrder), 2);
        vm.stopPrank();
        
        // Get initial balances
        uint256 makerStartBalance = token.balanceOf(maker);
        uint256 orderStartBalance = token.balanceOf(address(sellOrder));

        // Commit to an offer from maker
        address[] memory takers = new address[](2);
        uint32[] memory indicies = new uint32[](2);
        takers[0] = taker1;
        indicies[0] = 0;
        takers[1] = taker2;
        indicies[1] = 0;
        vm.startPrank(maker);
        sellOrder.commitBatch(takers, indicies);
        vm.stopPrank();
        
        (Order.State offerState, , , , , , , , ) = sellOrder
            .offers(taker1, 0);
        require(offerState == Order.State.Committed, 'incorrect offer state');

        require(
            token.balanceOf(address(sellOrder)) == orderStartBalance + 2,
            'incorrect transfer to sell order'
        );
        require(
            token.balanceOf(maker) == makerStartBalance - 2,
            'incorrect transfer from maker'
        );
    }

    function confirmOffer(
        address taker,
        address from, 
        uint32 index
    ) public {
        // Get initial balances
        uint256 makerStartBalance = token.balanceOf(maker);
        uint256 takerStartBalance = token.balanceOf(taker);
        uint256 daoStartBalance = token.balanceOf(DAO);
        
        (, uint128 pricePerUnit, uint128 costPerUnit, uint128 sellerStakePerUnit, , , , , uint32 quantity) = sellOrder.offers(taker, index);

        // Confirm to an offer from maker
        vm.startPrank(from);
        sellOrder.confirm(taker, index);
        vm.stopPrank();

        (Order.State offerState, , , , , , , , ) = sellOrder.offers(taker, index);
        require(offerState == Order.State.Closed, 'incorrect offer state');
        
        uint256 total = (pricePerUnit + sellerStakePerUnit) * quantity;
        uint256 toDao = (total * IOrderBook(book).fee()) / 1000000;

        require(
            token.balanceOf(address(sellOrder)) == 0,
            'sell order should have no balance'
        );

        require(
            token.balanceOf(maker) == makerStartBalance + total - toDao,
            'incorrect transfer to seller'
        );

        require(
            token.balanceOf(DAO) == daoStartBalance + toDao,
            'incorrect transfer to DAO'
        );

        if (costPerUnit > pricePerUnit) {
             require(
                token.balanceOf(taker) == takerStartBalance + (costPerUnit - pricePerUnit) * quantity,
                'incorrect transfer to buyer'
            );
        } else {
            require(
                token.balanceOf(taker) == takerStartBalance,
                'incorrect transfer to buyer'
            );
        }
    }

    function testConfirmOffer() public {
        vm.warp(0);
        submitOfferBase(taker1);

        token.mint(maker, 1);
        vm.startPrank(maker);
        token.approve(address(sellOrder), 1);
        vm.stopPrank();
        commitOffer(taker1, 0);

        vm.warp(0);
        confirmOffer(taker1, taker1, 0);
    }

    function testConfirmOfferMaker() public {
        vm.warp(0);
        submitOfferBase(taker1);

        token.mint(maker, 1);
        vm.startPrank(maker);
        token.approve(address(sellOrder), 1);
        vm.stopPrank();
        commitOffer(taker1, 0);

        vm.warp(110);
        confirmOffer(taker1, maker, 0);
    }

    function testFailConfirmOfferMakerTimeout() public {
        vm.warp(0);
        submitOfferBase(taker1);

        token.mint(maker, 1);
        vm.startPrank(maker);
        token.approve(address(sellOrder), 1);
        vm.stopPrank();
        commitOffer(taker1, 0);

        vm.warp(10);
        confirmOffer(taker1, maker, 0);
    }

    function testConfirmOfferBatch() public {
        vm.warp(0);
        submitOfferBase(taker1);
        submitOfferBase(taker2);

        token.mint(maker, 2);
        vm.startPrank(maker);
        token.approve(address(sellOrder), 2);
        vm.stopPrank();
        commitOffer(taker1, 0);
        commitOffer(taker2, 0);

        vm.warp(110);
        address[] memory takers = new address[](2);
        uint32[] memory indicies = new uint32[](2);
        takers[0] = taker1;
        indicies[0] = 0;
        takers[1] = taker2;
        indicies[1] = 0;
        vm.startPrank(maker);
        sellOrder.confirmBatch(takers, indicies);
        vm.stopPrank();
    }

    function testConfirmOfferFuzz(
        uint32 index,
        uint32 quantity,
        uint128 pricePerUnit,
        uint128 costPerUnit,
        uint128 sellerStakePerUnit
    )  public {
        vm.assume(quantity < 10000000000000000000000000);
        vm.assume(pricePerUnit < 10000000000000000000000000000);
        vm.assume(costPerUnit < 10000000000000000000000000000);
        vm.assume(sellerStakePerUnit < 10000000000000000000000000000);
        uint128 transferAmount = pricePerUnit * quantity;
        if (costPerUnit > pricePerUnit) {
            transferAmount += (costPerUnit + pricePerUnit) * quantity;
        }

        token.mint(taker1, transferAmount);
        vm.startPrank(taker1);
        token.approve(address(sellOrder), transferAmount);
        vm.stopPrank();
        submitOffer(taker1, index, quantity, pricePerUnit, costPerUnit, sellerStakePerUnit);

        uint128 makerStakeAmount = sellerStakePerUnit * quantity;
        token.mint(maker, makerStakeAmount);
        vm.startPrank(maker);
        token.approve(address(sellOrder), makerStakeAmount);
        vm.stopPrank();
        commitOffer(taker1, index);

        confirmOffer(taker1, taker1, index);

        (Order.State offerState, , , , , , , , ) = sellOrder.offers(taker1, index);
        require(offerState == Order.State.Closed, 'incorrect offer state');
    }

    function testFailConfirmOfferNotCommitted() public {
        submitOfferBase(taker1);
        confirmOffer(taker1, taker1, 0);
    }

    function refundOffer(
        address taker, 
        uint32 index
    ) public {
        // Get initial balances
        uint256 makerStartBalance = token.balanceOf(maker);
        uint256 takerStartBalance = token.balanceOf(taker);
        
        (, uint128 pricePerUnit, uint128 costPerUnit, , , , , , uint32 quantity) = sellOrder.offers(taker, index);

        // Confirm to an offer from maker
        vm.startPrank(taker);
        sellOrder.refund(taker, index);
        vm.stopPrank();

        (Order.State offerState, , , , , , , , ) = sellOrder.offers(taker, index);
        require(offerState == Order.State.Closed, 'incorrect offer state');

        require(
            token.balanceOf(address(sellOrder)) == 0,
            'sell order should have no balance'
        );

        require(
            token.balanceOf(maker) == makerStartBalance,
            'incorrect transfer to seller'
        );

        if (costPerUnit < pricePerUnit) {
             require(
                token.balanceOf(taker) == takerStartBalance + (pricePerUnit - costPerUnit) * quantity,
                'incorrect transfer to buyer'
            );
        } else {
            require(
                token.balanceOf(taker) == takerStartBalance,
                'incorrect transfer to buyer'
            );
        }
    }

    function testRefundOffer() public {
        vm.warp(0);
        submitOfferBase(taker1);

        token.mint(maker, 1);
        vm.startPrank(maker);
        token.approve(address(sellOrder), 1);
        vm.stopPrank();
        commitOffer(taker1, 0);

        vm.warp(0);
        refundOffer(taker1, 0);
    }

    function testRefundOfferFuzz(
        uint32 index,
        uint32 quantity,
        uint128 pricePerUnit,
        uint128 costPerUnit,
        uint128 sellerStakePerUnit
    )  public {
        vm.assume(quantity < 10000000000000000000000000);
        vm.assume(pricePerUnit < 10000000000000000000000000000);
        vm.assume(costPerUnit < 10000000000000000000000000000);
        vm.assume(sellerStakePerUnit < 10000000000000000000000000000);
        uint128 transferAmount = pricePerUnit * quantity;
        if (costPerUnit > pricePerUnit) {
            transferAmount += (costPerUnit + pricePerUnit) * quantity;
        }

        token.mint(taker1, transferAmount);
        vm.startPrank(taker1);
        token.approve(address(sellOrder), transferAmount);
        vm.stopPrank();
        submitOffer(taker1, index, quantity, pricePerUnit, costPerUnit, sellerStakePerUnit);

        uint128 makerStakeAmount = sellerStakePerUnit * quantity;
        token.mint(maker, makerStakeAmount);
        vm.startPrank(maker);
        token.approve(address(sellOrder), makerStakeAmount);
        vm.stopPrank();
        commitOffer(taker1, index);

        refundOffer(taker1, index);

        (Order.State offerState, , , , , , , , ) = sellOrder.offers(taker1, index);
        require(offerState == Order.State.Closed, 'incorrect offer state');
    }

    function testFailRefundOfferExpired() public {
        vm.warp(0);
        submitOfferBase(taker1);

        token.mint(maker, 1);
        vm.startPrank(maker);
        token.approve(address(sellOrder), 1);
        vm.stopPrank();
        commitOffer(taker1, 0);

        vm.warp(110);
        refundOffer(taker1, 0);
    }

    function testFailRefundOfferNotBuyer() public {
        submitOfferBase(taker1);

        token.mint(maker, 1);
        vm.startPrank(maker);
        token.approve(address(sellOrder), 1);
        vm.stopPrank();
        commitOffer(taker1, 0);

        // Confirm to an offer from maker
        vm.startPrank(taker2);
        sellOrder.refund(taker1, 0);
        vm.stopPrank();
    }
}
