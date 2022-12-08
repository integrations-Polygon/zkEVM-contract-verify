// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "../../utils/AccessProtected.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

contract ERC721Token is ERC721URIStorage, ERC721Enumerable, ERC721Burnable, AccessProtected {
    using Address for address;
    address lenderContractAddress;

    mapping(address => bool) public whitelisted;
    event WhitelistAdded(address indexed user);
    event WhitelistRemoved(address indexed user);

    constructor() ERC721("ERC721Token", "ERC721") {}

    /**
     * Mint + Issue NFT
     *
     * @param recipient - NFT will be issued to recipient
     * @param tokenHash - Artwork Metadata IPFS hash
     */
    function issueToken(address recipient, uint256 tokenId, string memory tokenHash) public onlyLend {
        _mint(recipient, tokenId);
        _setTokenURI(tokenId, tokenHash);
    }

    /**
     * Get Holder Token IDs
     *
     * @param holder - Holder of the Tokens
     */
    function getHolderTokenIds(address holder) public view returns (uint256[] memory) {
        uint256 count = balanceOf(holder);
        uint256[] memory result = new uint256[](count);
        for (uint256 index = 0; index < count; index++) {
            result[index] = tokenOfOwnerByIndex(holder, index);
        }
        return result;
    }

    function setLenderContractAddress(address _lenderContractAddress) external onlyOwner {
        lenderContractAddress = _lenderContractAddress;
    }

    function getLenderContractAddress() external view returns (address) {
        return lenderContractAddress;
    }

    /**
     * Add contract addresses to the whitelist
     */

    function addToWhitelist(address _user) public onlyOwner {
        require(!whitelisted[_user], "already whitelisted");
        whitelisted[_user] = true;
        emit WhitelistAdded(_user);
    }

    function checkWhitelist(address _user) public view returns (bool) {
        return whitelisted[_user];
    }

    /**
     * Remove a contract addresses from the whitelist
     */

    function removeFromWhitelist(address _user) public onlyOwner {
        require(whitelisted[_user], "user not in whitelist");
        whitelisted[_user] = false;
        emit WhitelistRemoved(_user);
    }

    //
    //  OVERRIDES
    //
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721, ERC721Enumerable) {
        require(whitelisted[to] || from == address(0) || to == address(0), "NFT transfer isn't allowed");
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC721, ERC721Enumerable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function burn(uint256 tokenId) public virtual override onlyLend {
        _burn(tokenId);
    }

    modifier onlyLend() {
        require(_msgSender() == lenderContractAddress, "You cannot burn your own token");
        _;
    }
}
