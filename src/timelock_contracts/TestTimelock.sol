// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/utils/Address.sol";

contract TestTimelock {
    using Address for address;

    address public timelock;

    constructor(address _timelock) {
        require(_timelock.isContract(), "_timelock must be a contract");
        timelock = _timelock;
    }

    function test() external {
        require(msg.sender == timelock, "caller is not the timelock smart contract");
        // more code here such as
        // - upgrade contract
        // - transfer funds
        // - switch price oracle
    }

    function getTimestamp() external view returns (uint256) {
        return block.timestamp + 50;
    }
}
