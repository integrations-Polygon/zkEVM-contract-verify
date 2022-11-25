// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";

// import "../../utils/Redeemable.sol";

/**
 * @title NFT Asset
 *
 * @notice An NFT based on the ERC721 standard and representing a digital asset
 *
 * @dev This contract is designed to be created by a factory that uses the clone standard
 * and then to be interacted with by a backend service that adds a web2 layer for ease of use.
 *
 * @dev Initial template taken from https://docs.openzeppelin.com/contracts/4.x/wizard
 * Burnable was not included since can burn on a marketplace by transferring to a dead address.
 * Votes was not included since not going to worry about NFT governance at this point.
 * Enumerable was not included since on-chain enumeration isn't required and to limit gas costs
 * Pausble was kept since we may use it and have admin rights on the contract to call it from the backend,
 * later we may look at renouncing admin rights and letting the contract live on its own in an immutable state.
 * URIStorage kept since we will likely want to change metadata for prize unlocking, but this will
 * add gas costs so may want to look at how to make this toggleable.
 *
 * @dev There are three mint functions
 * safeMint for minting a single item by the owner
 * batchMint for minting multiple items by the owner
 * publicMint for minting from a public wallet
 *
 * @dev the contract manually implements ownable since the OZ version doesn't work with cloining.
 * Ownership is set during initialization.
 *
 * @dev Could look eventually at other gas saving measures such as ERC721A, but currently need to focus
 * on getting the MVP live for CX Live.
 *
 * @dev TODO: implement royalties using ERC-2981.  Test on leading marketplaces.
 */
contract NFTAsset is ERC721, ERC721URIStorage, Pausable, Initializable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;

    /// @dev the owner of the contract, set during initialization after cloning
    address public owner;

    /// @dev used to enable a public mint
    bool public mintActive;

    /// @dev the default URI for individual token metadata
    string public defaultTokenUri;

    /// @dev the base URI for token metadata
    string public baseURI;

    /// @dev the web2 account id of the owner of this contract
    string public account;

    /// @dev the NFT name, set during initialization after cloning
    string private nftName;

    /// @dev the NFT symbol, set during initialization after cloning
    string private nftSymbol;

    /// @dev The NFT ID and associated IPFS Uris for both the asset and metadata
    struct IpfsAsset {
        string nftId;
        string ipfsAssetUri;
        string ipfsMetadataUri;
    }

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /// @dev Event emitted after mintActive is set
    event SetMintActive(bool mintActive);

    /// @dev Event emitted after baseURI is set
    event SetBaseURI(string uri);

    /// @dev Event emitted after tokenURI is set
    event SetTokenURI(uint256 tokenId, string uri);

    /// @dev Similar to Event in ERC721, but extended with org and collection IDs
    event TaggedTransfer(
        bytes indexed orgId,
        bytes indexed collectionId,
        IpfsAsset ipfsAsset,
        address from,
        address to,
        uint256 indexed tokenId
    );

    /// @dev not used since this instances are created from cloning
    /// and initialized not constructed
    constructor() ERC721("NOOP", "NOOP") {
        // set owner to prevent others from interacting with implementation
        // owner of instances will be set during initialization
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(owner == msg.sender, "ONLY_OWNER");
        _;
    }

    /**
     * @notice initialize is called by the contract cloning this contract
     * @notice _tokenIdCounter is initialized at 1, not 0
     * @param _owner the owner or backend web3 service controlling this contract
     * @param _account the web2 UUID of the account or organization associated with this contract
     * This id is only used to link this contract in case of Web2 DB failure
     * @param _nftName the name of the NFT, set here since no constructor in clones
     * @param _nftSymbol the symbol of the NFT, set here since no constructor in clones
     */
    function initialize(
        address _owner,
        string calldata _account,
        string calldata _nftName,
        string calldata _nftSymbol
    ) external initializer {
        owner = _owner;
        account = _account;
        nftName = _nftName;
        nftSymbol = _nftSymbol;
        // NB: This requirement should never fail
        require(_tokenIdCounter.current() == 0, "NONZERO_INIT_COUNTER");
        _tokenIdCounter.increment();
    }

    //////////////////////////////////////////
    // MINTING
    //////////////////////////////////////////

    /**
     * @notice mints a single NFT to the provided address with the
     * asset locator's ipfs metadata Uri
     * @notice emits TaggedTransfer in addition to Transfer
     * @param _orgId the account who owns this contract
     * @param _collectionId the asset collection associated with this clone contract
     * @param _ipfsAsset the asset locator information for the NFT being minting
     * @param _to the address to mint the NFT to
     */
    function safeMint(
        string memory _orgId,
        string memory _collectionId,
        IpfsAsset memory _ipfsAsset,
        address _to
    ) public onlyOwner {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(_to, tokenId);
        _setTokenURI(tokenId, _ipfsAsset.ipfsMetadataUri);
        emit TaggedTransfer(bytes(_orgId), bytes(_collectionId), _ipfsAsset, address(0), _to, tokenId);
    }

    /**
     * @notice mint multiple NFTs to the provided address with their
     * associated asset locator's ipfs metadata Uri
     * @notice emits TaggedTransfer in addition to Transfer
     * @param _orgId the account who owns this contract
     * @param _collectionId the asset collection associated with this clone contract
     * @param _ipfsAssets asset information for the NFTs to mint
     * @param _to the address to mint the NFT to
     */
    function batchMint(
        string memory _orgId,
        string memory _collectionId,
        IpfsAsset[] memory _ipfsAssets,
        address _to
    ) public onlyOwner {
        for (uint32 i; i < _ipfsAssets.length; i++) {
            safeMint(_orgId, _collectionId, _ipfsAssets[i], _to);
        }
    }

    /**
     * @notice allow external users to mint a single NFT
     * @dev only enabled if mintActive is set to true
     * No functionality yet for minting multiples
     */
    function publicMint() external {
        require(mintActive == true, "MINT_NOT_ACTIVE");
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(msg.sender, tokenId);
    }

    //////////////////////////////////////////
    // ADMINISTRATION
    //////////////////////////////////////////

    /**
     * @notice set the ability to publicly mint to active or inactive
     * @notice emits SetMintActive
     * @param _mintActive bool to togglethe mint
     */
    function setMintActive(bool _mintActive) external onlyOwner {
        mintActive = _mintActive;
        emit SetMintActive(mintActive);
    }

    /**
     * @notice set the base URI for the NFT metadata
     * @notice emits SetBaseURI
     * @param _URI  the base URI
     */
    function setBaseURI(string calldata _URI) external onlyOwner {
        baseURI = _URI;
        emit SetBaseURI(baseURI);
    }

    /**
     * @notice set the URI of an NFT
     * @notice emits SetTokenURI
     * @param _tokenId the id of the NFT to update
     * @param _uri  the URI to set for the token
     */
    function setTokenURI(uint256 _tokenId, string memory _uri) external onlyOwner {
        _setTokenURI(_tokenId, _uri);
        emit SetTokenURI(_tokenId, _uri);
    }

    /**
     * @notice set the max number of redemptions (default is 1)
     * @param _maxRedemptions the max number of redemptions to set for the NFT
     */
    // function setMaxRedemptions(uint32 _maxRedemptions) external onlyOwner {
    //     _setMaxRedemptions(_maxRedemptions);
    // }

    /**
     * @notice use redemptions for the NFT
     * @param _tokenId the id of the NFT to redeem
     * @param _count  the number of redemptions to redeem
     */
    // function redeem(uint256 _tokenId, uint32 _count) external onlyOwner {
    //     _redeem(_tokenId, _count);
    // }

    /// @notice allow owner to change the name
    function setName(string calldata _name) external onlyOwner {
        nftName = _name;
    }

    /// @notice allow owner to change the symbol
    function setSymbol(string calldata _symbol) external onlyOwner {
        nftSymbol = _symbol;
    }

    /// @notice pause trading for the NFT collection
    function pause() public onlyOwner {
        _pause();
    }

    /// @notice unpause trading for the NFT collection
    function unpause() public onlyOwner {
        _unpause();
    }

    /// @notice allow owner to transfer ownership
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "NEW_OWNER_UNDEFINED");
        _transferOwnership(_newOwner);
    }

    function renounceOwnership() external onlyOwner {
        _transferOwnership(address(0));
    }

    //////////////////////////////////////////
    // PUBLIC VIEW OVERRIDES
    //////////////////////////////////////////

    /**
     * @notice return the metadata URI for an NFT
     * @param _tokenId the id of the NFT to return the URI for
     * @dev override required by ERC721URIStorage
     */
    function tokenURI(uint256 _tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(_tokenId);
    }

    /**
     * @notice override of the NFT name
     * @dev required to allow dynamic NFT names for cloned contracts
     */
    function name() public view override returns (string memory) {
        return nftName;
    }

    /**
     * @notice override of the NFT symbol
     * @dev required to allow dynamic NFT symbols for cloned contracts
     */
    function symbol() public view override returns (string memory) {
        return nftSymbol;
    }

    //////////////////////////////////////////
    // INTERNAL OVERRIDES
    //////////////////////////////////////////

    /// @dev internal override to allow dynamic baseURIs for cloned contracts
    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    /// @dev override required by the pausable
    // function _beforeTokenTransfer(
    //     address from,
    //     address to,
    //     uint256 tokenId
    // ) internal override whenNotPaused {
    //     super._beforeTokenTransfer(from, to, tokenId);
    // }

    /// @dev override required by ERC721URIStorage
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function _transferOwnership(address _newOwner) private {
        address oldOwner = owner;
        owner = _newOwner;
        emit OwnershipTransferred(oldOwner, _newOwner);
    }
}
