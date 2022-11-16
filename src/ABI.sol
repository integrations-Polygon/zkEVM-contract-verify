// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

contract ABItest {
    function enc(uint256 arg) external pure returns (bytes memory) {
        return abi.encode(arg);
    }

    function encWithSelector(uint256 arg) external pure returns (bytes memory) {
        return abi.encodeWithSelector(bytes4(keccak256("myfunction(uint256)")), arg);
    }

    function encWithSignature(uint256 arg) external pure returns (bytes memory) {
        return abi.encodeWithSignature("myfunction(uint256)", arg);
    }

    function dec(bytes calldata data) external pure returns (uint256 arg) {
        arg = abi.decode(data, (uint256));
    }
}
