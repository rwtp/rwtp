// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import 'forge-std/Test.sol';
import 'openzeppelin-contracts/contracts/mocks/ERC20Mock.sol';
import '../src/SellOrder.sol';
import 'openzeppelin-contracts/contracts/utils/cryptography/ECDSA.sol';
import 'forge-std/console.sol';

contract UnitTest is Test {
    function toSignature(
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public pure returns (bytes memory) {
        return abi.encodePacked(v, r, s);
    }

    function testConstructor() public {
        ERC20Mock token = new ERC20Mock('wETH', 'WETH', address(this), 100);
        SellOrder sellOrder = new SellOrder(token, 50, 'ipfs://', 100);

        assert(address(sellOrder.token()) == address(token));
    }

    function testHappyPath() public {
        // Setup
        ERC20Mock token = new ERC20Mock('wETH', 'WETH', address(this), 100);
        address seller = address(0x1234567890123456784012345678901234567829);
        address buyer1 = address(0x2234567890123456754012345678901234567821);
        address buyer2 = address(0x5234567890123456754012345678901234567822);

        // Create a sell order
        vm.prank(seller);
        SellOrder sellOrder = new SellOrder(token, 50, 'ipfs://metadata', 100);

        // Submit an offer from buyer1
        token.transfer(buyer1, 20);
        vm.startPrank(buyer1);
        token.approve(address(sellOrder), 20);
        sellOrder.submitOffer(15, 5, 'ipfs://somedata');
        vm.stopPrank();
        (uint256 offer1Price, uint256 offer1Stake, , , , ) = sellOrder.offers(
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
        (uint256 offer2price, uint256 offer2stake, , , , ) = sellOrder.offers(
            buyer2
        );
        require(offer2price == 10, 'offer price2 is not 10');
        require(offer2stake == 10, 'offer stake2 is not 10');

        // Confirm buyer2's offer
        address item_pu = address(0xF446b31C8D565ACD0eADA24Fb1c562621e2e1633);
        uint256 item_pk = 28270262225976980648209755037975125003705358822066383074565795076366895392656;
        token.transfer(seller, 50);
        vm.startPrank(seller);
        token.approve(address(sellOrder), 50);
        sellOrder.commit(buyer2, item_pu);
        vm.stopPrank();

        (, , , , SellOrder.State offerState1, ) = sellOrder.offers(buyer2);
        require(
            offerState1 == SellOrder.State.Committed,
            'state is not committed'
        );
        console.log(token.balanceOf(address(sellOrder)));
        require(
            token.balanceOf(address(sellOrder)) == 90,
            'Sell order does not have 90 tokens'
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

        (, , , , SellOrder.State offerState2, ) = sellOrder.offers(buyer2);
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
}
