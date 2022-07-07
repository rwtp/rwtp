// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import 'forge-std/Test.sol';
import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '../src/Asset.sol';
import './ERC20Mock.sol';

contract VendorTest is Test {
    function stringEq(string memory a, string memory b)
        public
        view
        returns (bool)
    {
        return (keccak256(abi.encodePacked((a))) ==
            keccak256(abi.encodePacked((b))));
    }

    function testCreateVendor() public {
        Vendor vendor = new Vendor();
        assert(vendor.owner() == address(this));
        assert(vendor.fee() == 100);
    }

    function testSetFee() public {
        address owner = address(0x4234567890123456784012345678901234567821);

        vm.startPrank(owner);
        Vendor vendor = new Vendor();
        vendor.setFee(500);
        vm.stopPrank();

        assert(vendor.fee() == 500);
    }

    function testFailSetFee() public {
        address owner = address(0x4234567890123456784012345678901234567821);

        vm.prank(owner);
        Vendor vendor = new Vendor();

        // Not the owner
        vendor.setFee(500);
    }

    function testSetOwner() public {
        address owner = address(0x4234567890123456784012345678901234567821);

        vm.startPrank(owner);
        Vendor vendor = new Vendor();
        vendor.setOwner(owner);
        vm.stopPrank();

        assert(vendor.owner() == owner);
    }

    function testFailSetOwner() public {
        address owner = address(0x4234567890123456784012345678901234567821);

        vm.prank(owner);
        Vendor vendor = new Vendor();

        // Not the owner
        vendor.setOwner(owner);
    }

    function testCreateAsset() public {
        ERC20 currency = new ERC20('ERC20', 'ERC20');

        Vendor vendor = new Vendor();
        AssetERC20 asset = vendor.createAssetERC20(
            'Name',
            'symb',
            10,
            currency,
            1,
            100000
        );

        assert(asset.price() == 10);
        assert(address(asset.token()) == address(currency));
        assert(asset.owner() == address(vendor));
        assert(asset.seller() == address(this));
        assert(stringEq(asset.name(), 'Name'));
        assert(stringEq(asset.symbol(), 'symb'));
    }
}

contract PurchaseTests is Test {
    address seller = address(0x4234567890123456784012345678901234567821);
    address buyer = address(0x4234567890123456784012345678901234567822);
    ERC20Mock currency = new ERC20Mock('ERC20', 'ERC20', buyer, 1000);
    Vendor vendor = new Vendor();
    AssetERC20 asset;

    event Redeemed(
        address indexed asset,
        address indexed user,
        uint256 amount,
        string uri
    );

    function setUp() public {
        vm.prank(seller);
        asset = vendor.createAssetERC20(
            'Name',
            'symb',
            100,
            currency,
            1,
            1000000
        );
    }

    function testPurchase() public {
        vm.startPrank(buyer);
        currency.approve(address(vendor), 1000);
        vendor.purchase(asset, 1);
        vm.stopPrank();

        // Vendor gets 1%
        assert(currency.balanceOf(address(this)) == 1);

        // Seller gets 99%
        assert(currency.balanceOf(seller) == 99);

        // Buyer got asset
        assert(asset.balanceOf(buyer) == 1);
    }

    function testRedeem() public {
        vm.startPrank(buyer);
        currency.approve(address(vendor), 1000);
        vendor.purchase(asset, 2);

        vm.warp(block.timestamp + 100000);

        assert(asset.balanceOf(buyer) == 2);

        // Expect is the same as the one we're about to emit
        vm.expectEmit(true, true, true, true);
        emit Redeemed(address(asset), buyer, 1, 'ipfs://');

        // Redeem asset
        vendor.redeem(asset, 1, 'ipfs://');

        assert(asset.balanceOf(buyer) == 1);
        vm.stopPrank();
    }

    function testFailRedeemIfBeforeTimeout() public {
        vm.startPrank(buyer);
        currency.approve(address(vendor), 1000);
        vendor.purchase(asset, 2);

        // No warp

        // Redeem asset
        vendor.redeem(asset, 1, 'ipfs://');
    }

    function testFailPurchaseAfterTimeout() public {
        vm.warp(block.timestamp + 100000);

        vm.startPrank(buyer);
        currency.approve(address(vendor), 1000);
        vendor.purchase(asset, 1);
        vm.stopPrank();
    }

    function testFailRedeemWhenNoAsset() public {
        vendor.redeem(asset, 1, 'ipfs://foobar');
    }

    function testFailPurchaseIfPaused() public {
        vm.startPrank(seller);
        asset.pause();
        vm.stopPrank();

        vm.startPrank(buyer);
        currency.approve(address(vendor), 1000);
        vendor.purchase(asset, 2);
        vm.stopPrank();
    }

    function testFailRedeemIfPaused() public {
        vm.startPrank(buyer);
        currency.approve(address(vendor), 1000);
        vendor.purchase(asset, 2);
        vm.stopPrank();

        vm.prank(seller);
        asset.pause();

        vm.prank(buyer);
        vendor.redeem(asset, 2, 'ipfs://');
    }

    function testUnpause() public {
        vm.startPrank(seller);
        asset.pause();
        asset.unpause();
        vm.stopPrank();

        vm.startPrank(buyer);
        currency.approve(address(vendor), 1000);
        vendor.purchase(asset, 2);
        vm.stopPrank();

        assert(asset.balanceOf(buyer) == 2);
    }

    function testFailIfBeyondSupplyCap() public {
        AssetERC20 cappedAsset = vendor.createAssetERC20(
            'Name',
            'symb',
            1,
            currency,
            1,
            10
        );

        vm.startPrank(buyer);
        currency.approve(address(vendor), 1000);
        vendor.purchase(cappedAsset, 20);
        vm.stopPrank();
    }
}
