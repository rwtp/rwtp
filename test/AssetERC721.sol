// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import 'forge-std/Test.sol';
import '../src/AssetERC721.sol';
import './ERC20Mock.sol';

function stringEq(string memory a, string memory b) view returns (bool) {
    return (keccak256(abi.encodePacked((a))) ==
        keccak256(abi.encodePacked((b))));
}

contract RedeemTests is Test {
    ERC20Mock mockToken = new ERC20Mock('wETH', 'WETH', address(this), 0);

    AssetERC721 asset = new AssetERC721();
    uint256 productId;
    uint256 listingId;
    uint256 tokenId;
    address seller = address(0x2234567890123456789012345678901234567891);
    address buyer = address(0x1234567890123456789012345678901234567890);
    uint256 SUPPLY = 100;

    function setUp() public {
        vm.prank(seller);
        productId = asset.createProduct('example.org');

        vm.prank(seller);
        listingId = asset.createListing(
            productId,
            'https://product.example.com',
            SUPPLY, // supply
            100, // price
            mockToken, // the token
            1, // number of runs
            block.timestamp, // purchase begins
            block.timestamp + 3600, // purchase ends
            block.timestamp + 3600 * 2,
            block.timestamp + 3600 * 3,
            0
        );

        mockToken.mint(buyer, 100);

        vm.startPrank(buyer);
        mockToken.approve(address(asset), 100);
        tokenId = asset.purchase(listingId);
        vm.stopPrank();
    }

    function testFailRedeemIfNotYourToken() public {
        vm.prank(address(0x1));
        asset.redeem(tokenId, 1, 0, 'https://redemption.example.com');
    }

    function testRedeem() public {
        vm.prank(buyer);
        asset.redeem(tokenId, 1, 0, 'https://redemption.example.com');

        uint256 supply = asset.supplyOf(tokenId);
        require(supply == 99, 'supply is not 99');
        require(asset.exists(tokenId), 'token does not exist');
    }

    function testFailRedeemIfNotEnoughSupply() public {
        vm.prank(buyer);
        asset.redeem(tokenId, 101, 0, 'https://redemption.example.com');
    }

    function testRedeemBurnsToken() public {
        vm.prank(buyer);
        asset.redeem(tokenId, 100, 0, 'https://redemption.example.com');

        require(!asset.exists(tokenId), 'token still exists');
    }

    function testRedeemTwice() public {
        vm.prank(buyer);
        asset.redeem(tokenId, 1, 0, 'https://redemption.example.com');
        require(asset.exists(tokenId), 'token does not exist');

        vm.prank(buyer);
        asset.redeem(tokenId, 99, 0, 'https://redemption.example.com');

        require(!asset.exists(tokenId), 'token still exists');
    }
}

contract PurchaseTests is Test {
    ERC20Mock mockToken = new ERC20Mock('wETH', 'WETH', address(this), 0);
    AssetERC721 asset = new AssetERC721();
    uint256 productId;
    address seller = address(0x2234567890123456789012345678901234567891);

    function setUp() public {
        vm.prank(seller);
        productId = asset.createProduct('example.org');
    }

    function testPurchase() public {
        vm.prank(seller);
        uint256 listingId = asset.createListing(
            productId,
            'https://product.example.com',
            100, // supply
            100, // price
            mockToken, // the token
            1, // number of runs
            block.timestamp, // purchase begins
            block.timestamp + 3600, // purchase ends
            block.timestamp + 3600 * 2,
            block.timestamp + 3600 * 3,
            0
        );

        address buyer = address(0x1234567890123456789012345678901234567890);
        mockToken.mint(buyer, 100);

        vm.startPrank(buyer);
        mockToken.approve(address(asset), 100);
        uint256 tokenId = asset.purchase(listingId);
        vm.stopPrank();

        // Autoincrementing tokenIds
        require(tokenId == 0, 'TokenId should be 0');
        require(
            mockToken.balanceOf(buyer) == 0,
            'buyer should have no more tokens'
        );
        require(
            mockToken.balanceOf(seller) == 99,
            'seller should have 99 tokens'
        );
        require(
            mockToken.balanceOf(asset.owner()) == 1,
            'owner should have 1 token'
        );
        require(asset.balanceOf(buyer) == 1);
    }

    function testFailPurchaseBeforePurchaseBegins() public {
        vm.prank(seller);
        uint256 listingId = asset.createListing(
            productId,
            'https://product.example.com',
            100, // supply
            100, // price
            mockToken, // the token
            1, // number of runs
            block.timestamp + 3600, // purchase begins
            block.timestamp + 3600, // purchase ends
            block.timestamp + 3600 * 2,
            block.timestamp + 3600 * 3,
            0
        );

        address buyer = address(0x1234567890123456789012345678901234567890);
        mockToken.mint(buyer, 100);

        vm.startPrank(buyer);
        mockToken.approve(address(asset), 100);
        uint256 tokenId = asset.purchase(listingId);
        vm.stopPrank();
    }

    function testFailPurchaseAfterPurchaseEnds() public {
        vm.prank(seller);
        uint256 listingId = asset.createListing(
            productId,
            'https://product.example.com',
            100, // supply
            100, // price
            mockToken, // the token
            1, // number of runs
            block.timestamp, // purchase begins
            block.timestamp + 3600, // purchase ends
            block.timestamp + 3600 * 2,
            block.timestamp + 3600 * 3,
            0
        );

        vm.warp(block.timestamp + 3600 + 1);

        address buyer = address(0x1234567890123456789012345678901234567890);
        mockToken.mint(buyer, 100);

        vm.startPrank(buyer);
        mockToken.approve(address(asset), 100);
        uint256 tokenId = asset.purchase(listingId);
        vm.stopPrank();
    }

    function testFailPurchaseWithNoMoreSets() public {
        vm.prank(seller);
        uint256 listingId = asset.createListing(
            productId,
            'https://product.example.com',
            100, // supply
            100, // price
            mockToken, // the token
            1, // number of runs
            block.timestamp, // purchase begins
            block.timestamp + 3600, // purchase ends
            block.timestamp + 3600 * 2,
            block.timestamp + 3600 * 3,
            0
        );

        // Purchase once
        address buyer = address(0x1234567890123456789012345678901234567890);
        mockToken.mint(buyer, 200);
        vm.startPrank(buyer);
        mockToken.approve(address(asset), 100);
        uint256 tokenId = asset.purchase(listingId);

        mockToken.approve(address(asset), 100);
        uint256 tokenId2 = asset.purchase(listingId);
        vm.stopPrank();
    }
}

contract AssetTests is Test {
    ERC20Mock mockToken = new ERC20Mock('wETH', 'WETH', address(this), 100000);

    function testCreateShippingRate() public {
        AssetERC721 asset = new AssetERC721();
        uint256 shippingRateId = asset.createShippingRate(100, 'US');
        (string memory uri, uint256 price, address owner) = asset.shippingRates(
            shippingRateId
        );
        require(shippingRateId == 0, 'shippingRateId should be 0');
        require(price == 100, 'shipping rate price is not 100');
        require(owner == address(this), 'shipping rate owner is not this');
        require(stringEq(uri, 'US'), 'shipping rate uri is not US');
    }

    function testSetShippingRatePrice() public {
        AssetERC721 asset = new AssetERC721();
        uint256 shippingRateId = asset.createShippingRate(100, 'US');
        asset.setShippingRatePrice(shippingRateId, 200);
        (string memory uri, uint256 price, address owner) = asset.shippingRates(
            shippingRateId
        );
        require(price == 200, 'shipping rate price is not 200');
    }

    function testSetShippingRateOwner() public {
        AssetERC721 asset = new AssetERC721();
        uint256 shippingRateId = asset.createShippingRate(100, 'US');
        asset.setShippingRateOwner(
            shippingRateId,
            address(0x1234567890123456789012345678901234567890)
        );
        (string memory uri, uint256 price, address owner) = asset.shippingRates(
            shippingRateId
        );
        require(
            owner == address(0x1234567890123456789012345678901234567890),
            'shipping rate owner is not 0x1234567890123456789012345678901234567890'
        );
    }

    function testSetShippingRateURI() public {
        AssetERC721 asset = new AssetERC721();
        uint256 shippingRateId = asset.createShippingRate(100, 'US');
        asset.setShippingRateURI(shippingRateId, 'CA');
        (string memory uri, uint256 price, address owner) = asset.shippingRates(
            shippingRateId
        );
        require(stringEq(uri, 'CA'), 'shipping rate uri is not CA');
    }

    function testFailSetShippingRatePriceIfNotOwner() public {
        AssetERC721 asset = new AssetERC721();
        uint256 shippingRateId = asset.createShippingRate(100, 'US');

        vm.prank(address(0x2));
        asset.setShippingRatePrice(shippingRateId, 200);
    }

    function testFailSetShippingRateURIIfNotOwner() public {
        AssetERC721 asset = new AssetERC721();
        uint256 shippingRateId = asset.createShippingRate(100, 'US');

        vm.prank(address(0x2));
        asset.setShippingRateURI(shippingRateId, 'CA');
    }

    function testFailSetShippingRateOwnerIfNotOwner() public {
        AssetERC721 asset = new AssetERC721();
        uint256 shippingRateId = asset.createShippingRate(100, 'US');

        vm.prank(address(0x2));
        asset.setShippingRateOwner(shippingRateId, address(0x3));
    }

    function testCreateListing() public {
        AssetERC721 asset = new AssetERC721();
        uint256 productId = asset.createProduct('https://example.com');

        uint256 listingId = asset.createListing(
            productId,
            'https://product.example.com',
            100,
            10,
            mockToken,
            1000,
            block.timestamp,
            block.timestamp + 3600,
            block.timestamp + 3600 * 2,
            block.timestamp + 3600 * 3,
            1
        );
        assert(listingId == 0);

        (
            uint256 _productId,
            string memory _uri,
            uint256 _supply,
            uint256 _price,
            IERC20 _token,
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
        require(_token == mockToken);
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