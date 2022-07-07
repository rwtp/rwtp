// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/security/Pausable.sol';

/// Lets you purchase new tokens, and then redeem them.
contract Vendor is Ownable {
    uint16 private _feeInBasisPoints;

    event Purchased(
        address indexed asset,
        address indexed user,
        uint256 amount
    );
    event Redeemed(
        address indexed asset,
        address indexed user,
        uint256 amount,
        string uri
    );
    event SetFee(uint16 feeInBasisPoints);
    event SetOwner(address owner);

    constructor() {
        _feeInBasisPoints = 100;
        _transferOwnership(msg.sender);
    }

    /// Sets a new owner
    function setOwner(address newOwner) external onlyOwner {
        _transferOwnership(newOwner);
        emit SetOwner(newOwner);
    }

    /// Sets a new fee
    function setFee(uint16 feeInBasisPoints) external onlyOwner {
        _feeInBasisPoints = feeInBasisPoints;
        emit SetFee(_feeInBasisPoints);
    }

    /// Returns the fee
    function fee() external view returns (uint16) {
        return _feeInBasisPoints;
    }

    /// Creates a new contract
    function createAssetERC20(
        string memory name,
        string memory symbol,
        uint256 price,
        IERC20 token,
        uint128 timeout,
        uint256 cap
    ) external virtual returns (AssetERC20) {
        AssetERC20 asset = new AssetERC20(
            name,
            symbol,
            price,
            token,
            msg.sender,
            timeout,
            cap
        );

        return asset;
    }

    function purchase(AssetERC20 asset, uint256 amount) external virtual {
        uint256 total = asset.price() * amount;
        uint256 toVendor = (total * _feeInBasisPoints) / 10000;
        uint256 toSeller = total - toVendor;

        asset.mint(msg.sender, amount);

        bool toSellerResult = asset.token().transferFrom(
            msg.sender,
            asset.seller(),
            toSeller
        );
        require(toSellerResult, 'Transfer to seller failed');

        bool toVendorResult = asset.token().transferFrom(
            msg.sender,
            owner(),
            toVendor
        );
        require(toVendorResult, 'Transfer to vendor failed');

        emit Purchased(address(asset), msg.sender, amount);
    }

    /// Requests that the token be redeemed for the underlying asset.
    /// Burns the token, and emits an event containing metadata,
    /// such as shipping information.
    function redeem(
        AssetERC20 asset,
        uint256 amount,
        string memory uri
    ) external virtual {
        // Check that the user has enough tokens to redeem
        require(asset.balanceOf(msg.sender) >= amount);

        asset.burn(msg.sender, amount);

        emit Redeemed(address(asset), msg.sender, amount, uri);
    }
}

/// TODO:
/// - Timeout

contract AssetERC20 is ERC20, Ownable, Pausable {
    uint256 public price;
    IERC20 public token;
    uint256 public cap;
    uint256 public minted;
    uint256 public expiresAt;

    /// The seller's treasury that the payment
    /// eventually goes to
    address public seller;

    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _price,
        IERC20 _token,
        address _seller,
        uint128 _timeout,
        uint256 _cap
    ) ERC20(_name, _symbol) {
        price = _price;
        token = _token;
        seller = _seller;
        cap = _cap;
        expiresAt = block.timestamp + _timeout;
        minted = 0;
        _transferOwnership(msg.sender);
    }

    function _mint(address account, uint256 amount) internal virtual override {
        require(minted + amount <= cap, 'cap exceeded');

        minted += amount;
        super._mint(account, amount);
    }

    /// Sets the seller to a new seller
    function setSeller(address newSeller) external virtual whenNotPaused {
        require(msg.sender == seller);
        seller = newSeller;
    }

    /// Mints the token, only callable by the owner.
    function mint(address to, uint256 amount)
        external
        virtual
        onlyOwner
        whenNotPaused
    {
        // Don't allow minting before timeout.
        require(
            block.timestamp < expiresAt,
            'Minting is not allowed after the timeout'
        );
        _mint(to, amount);
    }

    /// Burns the token, only callable by the owner
    function burn(address to, uint256 amount)
        external
        virtual
        onlyOwner
        whenNotPaused
    {
        // Don't allow burning before timeout.
        require(
            block.timestamp >= expiresAt,
            'Burning is not allowed before the timeout'
        );
        _burn(to, amount);
    }

    /// Pauses the token, in case of emergencies
    function pause() public virtual {
        require(msg.sender == seller);
        _pause();
    }

    /// Unpauses the token, resuming operations
    function unpause() public virtual {
        require(msg.sender == seller);
        _unpause();
    }
}
