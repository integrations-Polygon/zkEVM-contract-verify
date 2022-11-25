//SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "./NFTAsset.sol";

// import "../Assets/NFT/NFTAssetProxy.sol";

/**
 * @title AssetFactory
 * @notice AssetFactory is used to create digital asset contracts such as those based off of ERC-20, ERC-721, and ERC-1155.
 * @custom:internal The initial goal is to get an MVP for CX Live.
 * Currently, this contract isn't upgradeable, for simplicity since we can deploy a new factory if needed.
 * Assuming this factory will be used for all three contract types, though maybe we will break it apart.
 * We may also stop using the factory pattern and leverage metaprogramming with macros.
 *
 * @dev Leverages the EIP-1167 Clone standard to create low cost Asset instances
 * https://docs.openzeppelin.com/contracts/4.x/api/proxy#Clones
 */
contract AssetFactoryCreate {
    /**
     * @notice owner (or deployer) of the contract
     * @dev we manually set the owner versus using OpenZeppelin Ownable since we can easily redeploy a new contract
     * and don't need the extra functionality such as renouncing or transfering ownership.
     */
    address public owner;

    /**
     * @notice web3 service that interacts with the contract
     */
    address public service;

    /**
     * @notice address of the nftContract implementation for cloning
     */
    address public nftContract;

    address public cloneInstance;

    /**
     * @notice event emitted when creating new NFT contracts
     * @param orgId the ID of the account the contract was created for
     * @param collectionId the ID of the asset collection the contract was created for
     * @param service the address of the service used to create the contract
     * @param instance the address of the created NFT contract
     */
    event CloneNFT(bytes indexed orgId, bytes indexed collectionId, address indexed service, address instance);

    modifier onlyOwner() {
        require(owner == msg.sender, "ONLY_OWNER");
        _;
    }

    modifier onlyService() {
        require(service == msg.sender, "ONLY_SERVICE");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice set the backend web3 service that communicates with this contract
     * @param _service wallet address of the backend web3 service
     */
    function setService(address _service) external onlyOwner {
        service = _service;
    }

    /**
     * @notice set the address of the live NFTAsset contract implementation
     * @param _contract address of the contract
     */
    function setNFTContract(address _contract) external onlyOwner {
        nftContract = _contract;
    }

    /**
     * @notice creates a cloned instance of the NFT contract
     * @param _orgId the ID of the account the contract was created for
     * @param _collectionId the ID of the asset collection the contract was created for
     */
    function cloneNFTContract(
        string calldata _orgId,
        string calldata _collectionId,
        string calldata _nftName,
        string calldata _nftSymbol
    ) external onlyService {
        require(nftContract != address(0), "NO_NFT_CONTRACT");
        bytes memory orgIdBytes = bytes(_orgId);
        require(orgIdBytes.length != 0, "NO_ORG_SPECIFIED");
        bytes memory collectionIdBytes = bytes(_collectionId);
        require(collectionIdBytes.length != 0, "NO_COLLECTION_SPECIFIED");
        address instance = Clones.clone(nftContract);
        NFTAsset(instance).initialize(service, _orgId, _nftName, _nftSymbol);
        emit CloneNFT(orgIdBytes, collectionIdBytes, service, instance);
        cloneInstance = instance;
    }

    /**
     * @notice creates a proxy NFT contract via ERC1967
     * @dev this operation is more expensive than `cloneNFTContract`
     * @param _orgId the ID of the account the contract was created for
     * @param _collectionId the ID of the asset collection the contract was created for
     */
    function cloneNFTContractERC1967(
        string calldata _orgId,
        string calldata _collectionId,
        string calldata _nftName,
        string calldata _nftSymbol
    ) external onlyService {
        require(nftContract != address(0), "NO_NFT_CONTRACT");
        bytes memory orgIdBytes = bytes(_orgId);
        require(orgIdBytes.length != 0, "NO_ORG_SPECIFIED");
        bytes memory collectionIdBytes = bytes(_collectionId);
        require(collectionIdBytes.length != 0, "NO_COLLECTION_SPECIFIED");
        bytes memory init = abi.encodeWithSelector(
            bytes4(keccak256("initialize(address,string,string,string)")),
            service,
            _orgId,
            _nftName,
            _nftSymbol
        );
        // NFTAssetProxy clone = new NFTAssetProxy(nftContract, init);
        // emit CloneNFT(orgIdBytes, collectionIdBytes, service, address(clone));
    }
}
