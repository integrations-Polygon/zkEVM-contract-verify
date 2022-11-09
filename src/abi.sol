// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

contract ABItest{

    function enc(string memory str) external pure returns (bytes memory){
        return abi.encode(str);
    }
    function dec(bytes calldata data) external pure returns (string memory str){

        (str) =   abi.decode(data, (string));
    }
}