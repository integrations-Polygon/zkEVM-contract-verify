// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "../utils/AccessProtected.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

contract TestTokenERC721 is ERC721URIStorage, ERC721Enumerable, ERC721Burnable, AccessProtected {
    /* ========== STATE VARIABLES ========== */

    using Counters for Counters.Counter;
    Counters.Counter public tokenId;

    /* ========== CONSTRUCTOR ========== */

    constructor() ERC721("Test ERC721 Token", "TT721") {}

    /* ========== PUBLIC FUNCTIONS ========== */

    /**
     * Mint + Issue NFT
     *
     * @param recipient - NFT will be issued to recipient
     * @param hash - Artwork Metadata IPFS hash
     */
    function issueToken(address recipient, string memory hash) public onlyAdmin returns (uint256) {
        tokenId.increment();
        uint256 newTokenId = tokenId.current();
        _mint(recipient, newTokenId);
        _setTokenURI(newTokenId, hash);
        return newTokenId;
    }

    /**
     * Batch Mint
     *
     * @param recipient - NFT will be issued to recipient
     * @param _hashes - array of Artwork Metadata IPFS hash
     */
    function issueBatch(address recipient, string[] memory _hashes) public onlyAdmin returns (uint256[] memory) {
        uint256 len = _hashes.length;
        uint256[] memory tokenIds = new uint256[](len);
        for (uint256 i = 0; i < len; i++) {
            uint256 newTokenId = issueToken(recipient, _hashes[i]);
            tokenIds[i] = newTokenId;
        }
        return tokenIds;
    }

    /**
     * returns the message sender
     */

    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC721, ERC721Enumerable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function tokenURI(uint256 id) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(id);
    }

    /* ========== EXTERNAL FUNCTIONS ========== */

    /**
     * Get Holder Token IDs
     *
     * @param holder - Holder of the Tokens
     */
    function getHolderTokenIds(address holder) external view returns (uint256[] memory) {
        uint256 count = balanceOf(holder);
        uint256[] memory result = new uint256[](count);
        for (uint256 index = 0; index < count; index++) {
            result[index] = tokenOfOwnerByIndex(holder, index);
        }
        return result;
    }

    /* ========== INTERNAL FUNCTIONS ========== */

    function _beforeTokenTransfer(address from, address to, uint256 id) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, id);
    }

    function _burn(uint256 id) internal override(ERC721, ERC721URIStorage) {
        super._burn(id);
    }
}
