// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TestTokenERC20 is ERC20, Ownable {
    constructor() ERC20("ERC20 Test Token", "TT20") {
        uint256 totalSupply = 1000000000 ether; // 1 billion supply
        _mint(msg.sender, totalSupply);
    }

    // Function to mint tokens
    function mintERC20(address account, uint256 amount) external onlyOwner {
        _mint(account, amount);
    }
}
