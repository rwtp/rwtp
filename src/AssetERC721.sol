// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/utils/Counters.sol';

contract AssetERC721 is ERC721, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;
    Counters.Counter private _listingIdCounter;
    Counters.Counter private _productIdCounter;

    // A mapping of productIds to products
    mapping(uint256 => Product) public products;
    mapping(uint256 => Listing) public listings;

    event Purchase(
        uint256 indexed tokenId,
        address indexed user,
        uint256 amount
    );
    event Redeem(
        uint256 indexed tokenId,
        address indexed user,
        uint256 amount,
        string uri
    );
    event CreateProduct(uint256 indexed productId);
    event CreateListing(uint256 indexed listingId);

    constructor() ERC721('RWTP', 'rwtp') {
        _transferOwnership(msg.sender);
    }

    // A "Product", like a jacket or a shirt.
    // Products have prices and can be listed for sale.
    struct Product {
        // URI to arbitrary listing metadata
        string uri;
        // Owner of this product.
        address owner;
    }

    // A "Listing" that's associated with a product.
    struct Listing {
        // The product ID this is associated with
        uint256 productId;
        // URI to arbitrary listing metadata
        string uri;
        // The amount you'll get if you buy this listing
        uint256 supply;
        // The price of the entire package
        uint256 price;
        // The token to purchase it in
        address token;
        // The number of times someone can buy this listing
        uint256 sets;
        // The timestamp at which you can purchase this
        uint256 purchasePeriodBegins;
        // The timestamp at which you can no longer purchase this
        uint256 purchasePeriodEnds;
        // The timestamp at which you can start redeeming this
        uint256 redemptionPeriodBegins;
        // The timestamp at which you can no longer redeem this
        uint256 redemptionPeriodEnds;
    }

    modifier onlyProductOwner(uint256 productId) {
        require(
            msg.sender == products[productId].owner,
            'Not the product owner'
        );
        _;
    }

    function setProductURI(uint256 productId, string memory uri)
        public
        onlyProductOwner(productId)
    {
        products[productId].uri = uri;
    }

    function setProductOwner(uint256 productId, address newOwner)
        public
        onlyProductOwner(productId)
    {
        products[productId].owner = newOwner;
    }

    /// Creates a new product
    function createProduct(string memory uri) public returns (uint256) {
        Product memory product;
        product.uri = uri;
        product.owner = msg.sender;

        uint256 productId = _productIdCounter.current();
        _productIdCounter.increment();

        products[productId] = product;
        emit CreateProduct(productId);
        return productId;
    }

    /// Creates a new listing for sale
    function createListing(
        uint256 productId,
        string memory uri,
        uint256 supply,
        uint256 price,
        address token,
        uint256 sets,
        uint256 purchasePeriodBegins,
        uint256 purchasePeriodEnds,
        uint256 redemptionPeriodBegins,
        uint256 redemptionPeriodEnds
    ) public onlyProductOwner(productId) returns (uint256) {
        Listing memory listing;
        listing.productId = productId;
        listing.uri = uri;
        listing.supply = supply;
        listing.price = price;
        listing.token = token;
        listing.sets = sets;
        listing.purchasePeriodBegins = purchasePeriodBegins;
        listing.purchasePeriodEnds = purchasePeriodEnds;
        listing.redemptionPeriodBegins = redemptionPeriodBegins;
        listing.redemptionPeriodEnds = redemptionPeriodEnds;

        uint256 listingId = _listingIdCounter.current();
        _listingIdCounter.increment();
        listings[listingId] = listing;

        emit CreateListing(listingId);
        return listingId;
    }

    // // Redeems a given amount of tokens
    // function redeem(
    //     uint256 tokenId,
    //     uint256 amount,
    //     string memory uri
    // ) public {
    //     require(amount > 0);
    //     require(supplies[tokenId] >= amount);
    //     supplies[tokenId] -= amount;

    //     if (supplies[tokenId] == 0) {
    //         _burn(tokenId);
    //     }

    //     emit Redeem(tokenId, msg.sender, amount, uri);
    // }

    // Merges two assets together into a single asset
    // function merge(uint256 tokenIdFrom, uint256 tokenIdTo) public {
    //     require(supplies[tokenIdFrom] > 0);
    //     require(supplies[tokenIdTo] > 0);
    //     supplies[tokenIdTo] += supplies[tokenIdFrom];
    //     supplies[tokenIdFrom] = 0;
    //     _burn(tokenIdFrom);
    // }

    // // Splits an asset into the original asset, and a new one with an amount received
    // // from the original asset.
    // function split(uint256 tokenId, uint256 amount) public {
    //     require(supplies[tokenId] >= amount);
    //     require(amount > 0);

    //     supplies[tokenId] -= amount;
    //     uint256 newId = _mint(msg.sender);
    //     supplies[newId] = amount;
    // }

    /// Mints a token, relatively safely.
    function _mint(address to) internal returns (uint256) {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
        return tokenId;
    }

    function _burn(uint256 tokenId) internal override(ERC721) {
        super._burn(tokenId);
    }
}
