// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/utils/Counters.sol';

contract AssetERC721 is ERC721, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;
    Counters.Counter private _listingIdCounter;
    Counters.Counter private _productIdCounter;
    Counters.Counter private _shippingIdCounter;

    // A mapping of productIds to Products
    mapping(uint256 => Product) public products;

    // A mapping of listingIds to Listings
    mapping(uint256 => Listing) public listings;

    // A mapping of shippingRateIds to ShippingRates
    mapping(uint256 => ShippingRate) public shippingRates;

    // A mapping of listingIds to accepted shippingRateIds
    mapping(uint256 => mapping(uint256 => bool)) public acceptedShippingRates;

    // A mapping of tokenIds to listingIds
    mapping(uint256 => uint256) public tokenIdsToListingIds;

    /// @dev the fee rate in parts per million
    uint256 public fee = 10000; // default is 1%

    /// @dev The denominator of parts per million
    uint256 constant ONE_MILLION = 1000000;

    event Purchase(uint256 indexed tokenId, address indexed buyer);
    event Redeem(
        uint256 indexed tokenId,
        address indexed user,
        uint256 amount,
        string uri
    );
    event CreateProduct(uint256 indexed productId);
    event CreateListing(uint256 indexed listingId);
    event CreateShippingRate(uint256 indexed shippingRateId);
    event SetProductOwner(uint256 indexed productId, address indexed newOwner);
    event SetProductURI(uint256 indexed productId, string newURI);
    event SetShippingRatePrice(
        uint256 indexed shippingRateId,
        uint256 newPrice
    );
    event SetListingURI(uint256 indexed listingId, string newURI);
    event SetListingPriceAndToken(
        uint256 indexed listingId,
        uint256 newPrice,
        IERC20 newToken
    );
    event SetListingShippingRate(
        uint256 indexed listingId,
        uint256 indexed shippingRateId,
        bool newAccepted
    );
    event SetShippingRateOwner(
        uint256 indexed shippingRateId,
        address indexed newOwner
    );
    event SetShippingRateURI(uint256 indexed shippingRateId, string newURI);

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
        IERC20 token;
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

    struct ShippingRate {
        // URI to arbitrary shipping metadata
        string uri;
        // The additional fee for shipping
        uint256 price;
        // The owner of this shipping rate that's allowed to modify it
        address owner;
    }

    modifier onlyProductOwner(uint256 productId) {
        require(
            msg.sender == products[productId].owner,
            'Not the product owner'
        );
        _;
    }

    modifier onlyShippingRateOwner(uint256 shippingRateId) {
        require(
            msg.sender == shippingRates[shippingRateId].owner,
            'Not the shipping rate owner'
        );
        _;
    }

    modifier onlyListingOwner(uint256 listingId) {
        require(
            msg.sender == products[listings[listingId].productId].owner,
            'Not the product owner'
        );
        _;
    }

    modifier onlyIfTokenExists(uint256 tokenId) {
        require(tokenId != 0, 'Token does not exist');
        _;
    }

    modifier onlyIfItsYourToken(uint256 tokenId) {
        require(msg.sender == ownerOf(tokenId), 'Not the token owner');
        _;
    }

    function setProductURI(uint256 productId, string memory uri)
        public
        onlyProductOwner(productId)
    {
        products[productId].uri = uri;
        emit SetProductURI(productId, uri);
    }

    function setProductOwner(uint256 productId, address newOwner)
        public
        onlyProductOwner(productId)
    {
        products[productId].owner = newOwner;
        emit SetProductOwner(productId, newOwner);
    }

    function setListingURI(uint256 listingId, string memory uri)
        public
        onlyListingOwner(listingId)
    {
        listings[listingId].uri = uri;
        emit SetProductURI(listingId, uri);
    }

    function setListingPriceAndToken(
        uint256 listingId,
        uint256 newPrice,
        IERC20 newToken
    ) public onlyListingOwner(listingId) {
        listings[listingId].price = newPrice;
        listings[listingId].token = newToken;
        emit SetListingPriceAndToken(listingId, newPrice, newToken);
    }

    function setShippingRatePrice(uint256 shippingRateId, uint256 price)
        public
        onlyShippingRateOwner(shippingRateId)
    {
        shippingRates[shippingRateId].price = price;
        emit SetShippingRatePrice(shippingRateId, price);
    }

    function setShippingRateOwner(uint256 shippingRateId, address newOwner)
        public
        onlyShippingRateOwner(shippingRateId)
    {
        shippingRates[shippingRateId].owner = newOwner;
        emit SetShippingRateOwner(shippingRateId, newOwner);
    }

    function setShippingRateURI(uint256 shippingRateId, string memory uri)
        public
        onlyShippingRateOwner(shippingRateId)
    {
        shippingRates[shippingRateId].uri = uri;
        emit SetShippingRateURI(shippingRateId, uri);
    }

    function setListingShippingRate(
        uint256 listingId,
        uint256 shippingRateId,
        bool accepted
    ) public onlyListingOwner(listingId) {
        acceptedShippingRates[listingId][shippingRateId] = accepted;

        emit SetListingShippingRate(listingId, shippingRateId, accepted);
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

    function createShippingRate(uint256 price, string memory uri)
        public
        returns (uint256)
    {
        ShippingRate memory shippingRate;
        shippingRate.price = price;
        shippingRate.uri = uri;
        shippingRate.owner = msg.sender;

        uint256 shippingRateId = _shippingIdCounter.current();
        _shippingIdCounter.increment();

        shippingRates[shippingRateId] = shippingRate;
        emit CreateShippingRate(shippingRateId);

        return shippingRateId;
    }

    /// Creates a new listing for sale
    function createListing(
        uint256 productId,
        string memory uri,
        uint256 supply,
        uint256 price,
        IERC20 token,
        uint256 sets,
        uint256 purchasePeriodBegins,
        uint256 purchasePeriodEnds,
        uint256 redemptionPeriodBegins,
        uint256 redemptionPeriodEnds,
        uint256 defaultShippingRateId
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

        // Add the default shipping rate to the listing
        acceptedShippingRates[listingId][defaultShippingRateId] = true;

        emit CreateListing(listingId);
        return listingId;
    }

    function purchase(uint256 listingId) public returns (uint256) {
        Listing storage listing = listings[listingId];
        Product memory product = products[listing.productId];

        require(listing.supply > 0, 'Uninitialized listing');
        require(product.owner != address(0), 'Uninitialized product');
        require(
            listing.purchasePeriodBegins <= block.timestamp &&
                block.timestamp <= listing.purchasePeriodEnds,
            'Not within purchase period'
        );
        require(listing.sets > 0, 'No more sets remaining');

        // Reduce sets by 1
        listing.sets--;

        // Mint token & connect it to the listingId
        uint256 tokenId = _mint(msg.sender);
        tokenIdsToListingIds[tokenId] = listingId;

        // Transfer payment
        uint256 toContractOwner = (listing.price * fee) / ONE_MILLION;
        uint256 toProductOwner = listing.price - toContractOwner;
        listing.token.transferFrom(msg.sender, owner(), toContractOwner);
        listing.token.transferFrom(msg.sender, product.owner, toProductOwner);

        emit Purchase(tokenId, msg.sender);

        return tokenId;
    }

    function redeem(
        uint256 tokenId,
        uint256 amount,
        uint256 shippingRateId,
        string memory uri
    ) public onlyIfItsYourToken(tokenId) {
        Listing storage listing = listings[tokenIdsToListingIds[tokenId]];
        Product memory product = products[listing.productId];

        require(
            acceptedShippingRates[tokenIdsToListingIds[tokenId]][
                shippingRateId
            ],
            'Shipping rate not accepted'
        );
        require(amount > 0, 'Amount must be greater than 0');
        require(
            listing.supply - amount >= 0,
            'Not enough supply in this token'
        );

        // If there's a shipping fee, transfer it.
        uint256 shippingFee = shippingRates[shippingRateId].price;
        if (shippingFee > 0) {
            // Shipping fees are also subject to contract fee
            uint256 toContractOwner = (shippingFee * fee) / ONE_MILLION;
            uint256 toProductOwner = shippingFee - toContractOwner;
            listing.token.transferFrom(msg.sender, owner(), toContractOwner);
            listing.token.transferFrom(
                msg.sender,
                product.owner,
                toProductOwner
            );
        }

        listing.supply -= amount;
        if (listing.supply == 0) {
            _burn(tokenId);
        }

        emit Redeem(tokenId, msg.sender, amount, uri);
    }

    function exists(uint256 tokenId) public view returns (bool) {
        return _exists(tokenId);
    }

    function supplyOf(uint256 tokenId) public view returns (uint256) {
        if (!_exists(tokenId)) {
            return 0;
        }
        return listings[tokenIdsToListingIds[tokenId]].supply;
    }

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
