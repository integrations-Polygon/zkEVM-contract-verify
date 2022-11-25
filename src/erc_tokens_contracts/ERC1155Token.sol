// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "../utils/AccessProtected.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";

/// @notice smart contract that auto mints 2 ERC1155 tokens and also allows only the owner to mint more tokens
contract TestTokenERC1155 is ERC1155, Ownable, AccessProtected {
    /* ========== STATE VARIABLES ========== */

    using Counters for Counters.Counter;
    Counters.Counter public tokenId;

    /* ========== CONSTRUCTOR ========== */

    constructor() ERC1155("ipfs://some-random-hash/") {}

    /* ========== PUBLIC FUNCTIONS ========== */

    /**
     * Mint test ERC1155 token
     *
     * @param _receiver - Test ERC1155 token will be issued to receiver
     * @param _amount - amount of Test ERC1155 token you want to mint
     */
    function mintTestERC1155(address _receiver, uint256 _amount) public onlyAdmin returns (uint256) {
        tokenId.increment();
        uint256 newTokenID = tokenId.current();
        _mint(_receiver, newTokenID, _amount, "");
        return newTokenID;
    }

    /* ========== EXTERNAL FUNCTIONS ========== */

    /**
     * Batch Mint test ERC1155 tokens
     *
     * @param _receiver - test ERC1155 tokens will be issued to receiver
     * @param _amounts - array amount of test ERC1155 token you want to mint
     */
    function mintBatchTestERC1155(
        address _receiver,
        uint256[] memory _amounts
    ) external onlyAdmin returns (uint256[] memory) {
        uint256 lengthOfAmounts = _amounts.length;
        uint256[] memory tokenIds = new uint256[](lengthOfAmounts);
        for (uint256 i = 0; i < lengthOfAmounts; i++) {
            require(_amounts[i] > 0, "amount cannot be <= 0");
            uint256 newTokenID = mintTestERC1155(_receiver, _amounts[i]);
            tokenIds[i] = newTokenID;
        }
        return tokenIds;
    }
}
