//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.7;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ERC20Token is ERC20("ERC20Token", "ERC20") {
    constructor() {
        _mint(msg.sender, 1_000_000_000 ether); // 1B
    }
}
