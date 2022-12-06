//SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract ExampleProxy is ERC1967Proxy {
    constructor(address _logic, bytes memory _data) ERC1967Proxy(_logic, _data) {}

    function getImplementation() public view returns (address) {
        return _implementation();
    }

    function upgradeTo(address newImplementation) external {
        _upgradeTo(newImplementation);
    }
}
