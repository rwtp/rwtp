// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import 'forge-std/Test.sol';
import '../src/AssetERC721.sol';

contract AssetTest is Test {
    function testConstructor() public {
        AssetERC721 asset = new AssetERC721();
    }

    function testCreateListing() public {
        AssetERC721 asset = new AssetERC721();
    }
}
