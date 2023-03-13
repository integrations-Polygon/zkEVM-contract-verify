// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/utils/Address.sol";

contract TestTimelock {
    using Address for address;
    uint256 output;

    address public timelock;

    constructor(address _timelock) {
        require(_timelock.isContract(), "_timelock must be a contract");
        timelock = _timelock;
    }

    function test(uint256 _input) public returns (bool) {
        require(msg.sender == timelock, "caller is not the timelock smart contract");
        output = _input * _input;
        // more code here such as
        // - upgrade contract
        // - transfer funds
        // - switch price oracle

        return true;
    }

    function getTimestamp() external view returns (uint256) {
        return block.timestamp + 60;
    }
}
