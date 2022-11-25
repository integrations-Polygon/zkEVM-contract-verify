//SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/utils/introspection/ERC165.sol";

contract TestERC165 is ERC165 {
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == type(IERC165).interfaceId || super.supportsInterface(interfaceId);
    }
}
