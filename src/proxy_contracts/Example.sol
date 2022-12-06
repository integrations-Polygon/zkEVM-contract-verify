//SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

contract Example {
    uint _value;

    function getUint() public view returns (uint) {
        return _value;
    }

    function setUint(uint value) public {
        _value = value;
    }
}
