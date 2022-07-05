// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import 'forge-std/Test.sol';
import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '../src/Asset.sol';

contract VendorTest is Test {
    function setUp() public {}

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
        AssetERC20 asset = vendor.createFungibleAsset(
            'Name',
            'symb',
            10,
            currency
        );

        assert(asset.price() == 10);
        assert(address(asset.token()) == address(currency));
        assert(asset.owner() == address(vendor));
        assert(asset.seller() == address(this));
        assert(stringEq(asset.name(), 'Name'));
        assert(stringEq(asset.symbol(), 'symb'));
    }
}
