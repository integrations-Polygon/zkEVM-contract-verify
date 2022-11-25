// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract ModifiedAccessControl is AccessControl {
    bytes32 public constant ROLE = keccak256("ACCESS_ROLE");
    bool public isOverride;

    constructor() {
        // Grant the access role to a specified account
        _setupRole(ROLE, msg.sender);
    }

    // Override the revokeRole function
    function revokeRole(bytes32, address) public override {
        isOverride = true;
    }
}
