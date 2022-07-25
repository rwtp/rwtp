// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import 'forge-std/Test.sol';
import '../src/AssetERC721.sol';

function stringEq(string memory a, string memory b) view returns (bool) {
    return (keccak256(abi.encodePacked((a))) ==
        keccak256(abi.encodePacked((b))));
}

contract AssetTests is Test {
    function testCreateListing() public {
        AssetERC721 asset = new AssetERC721();
        uint256 productId = asset.createProduct('https://example.com');

        uint256 listingId = asset.createListing(
            productId,
            'https://product.example.com',
            100,
            10,
            address(0x1234567890123456789012345678901234567890),
            1000,
            block.timestamp,
            block.timestamp + 3600,
            block.timestamp + 3600 * 2,
            block.timestamp + 3600 * 3
        );
        assert(listingId == 0);

        (
            uint256 _productId,
            string memory _uri,
            uint256 _supply,
            uint256 _price,
            address _token,
            uint256 _sets,
            uint256 _purchasePeriodBegins,
            uint256 _purchasePeriodEnds,
            uint256 _redemptionPeriodBegins,
            uint256 _redemptionPeriodEnds
        ) = asset.listings(listingId);

        require(_productId == productId);
        require(stringEq(_uri, 'https://product.example.com'));
        require(_supply == 100);
        require(_price == 10);
        require(_token == address(0x1234567890123456789012345678901234567890));
        require(_sets == 1000);
        require(_purchasePeriodBegins == block.timestamp);
        require(_purchasePeriodEnds == block.timestamp + 3600);
        require(_redemptionPeriodBegins == block.timestamp + 3600 * 2);
        require(_redemptionPeriodEnds == block.timestamp + 3600 * 3);
    }

    function testCreateProduct() public {
        AssetERC721 asset = new AssetERC721();
        uint256 productId = asset.createProduct('https://example.com');
        assert(productId == 0);

        (string memory uri, address owner) = asset.products(productId);
        assert(stringEq(uri, 'https://example.com'));
        assert(owner == address(this));
    }

    function testSetProductURI() public {
        AssetERC721 asset = new AssetERC721();
        uint256 productId = asset.createProduct('https://example.com');
        asset.setProductURI(productId, 'https://new.example.com');

        (string memory uri, address _owner) = asset.products(productId);
        assert(stringEq(uri, 'https://new.example.com'));
    }

    function testFailSetProductURIIfNotOwner() public {
        AssetERC721 asset = new AssetERC721();
        uint256 productId = asset.createProduct('https://example.com');

        vm.prank(address(0x0));
        asset.setProductURI(productId, 'https://new.example.com');
    }

    function testSetProductOwner() public {
        AssetERC721 asset = new AssetERC721();
        uint256 productId = asset.createProduct('https://example.com');

        address newOwner = address(0x4234567890123456784012345678901234567821);
        asset.setProductOwner(productId, newOwner);

        (string memory uri, address owner) = asset.products(productId);
        assert(owner == newOwner);
    }

    function testFailSetProductOwnerIfNotOwner() public {
        AssetERC721 asset = new AssetERC721();
        uint256 productId = asset.createProduct('https://example.com');

        vm.prank(address(0x0));
        asset.setProductOwner(
            productId,
            address(0x4234567890123456784012345678901234567821)
        );
    }
}
