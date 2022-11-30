// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "../utils/EIP712Base.sol";
import "../utils/BaseRelayRecipient.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { IERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { IERC721Receiver } from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

contract NFTSale is Ownable, IERC721Receiver, ReentrancyGuard, EIP712Base, BaseRelayRecipient {
    using Address for address;
    using SafeERC20 for IERC20;
    using Counters for Counters.Counter;
    using SafeMath for uint256;

    IERC20 public immutable myToken;

    bytes32 private constant OFFER_TYPEHASH =
        keccak256(bytes("Offer(address buyer,uint256 price,uint256 listingId,uint256 timestamp,uint256 expiryTime)"));

    struct Listing {
        uint256 listingId;
        uint256 nftCount;
        uint256[] tokenIDs;
        uint256 price;
        address owner;
        bool isActive;
        bool isSold;
    }

    struct Offer {
        address buyer;
        uint256 price;
        uint256 listingId;
        uint256 timestamp;
        uint256 expiryTime;
    }

    Counters.Counter public _listingIds;

    mapping(uint256 => uint256) private _nftToListingId; //TokenID -> ListingId

    // user address => admin? mapping
    mapping(address => bool) private _admins;
    mapping(uint256 => Listing) public listings;
    mapping(bytes32 => bool) private cancelledOffers;

    address public immutable nftAddress;
    address public treasuryAddress;

    event AdminAccessSet(address indexed _admin, bool indexed _enabled);
    event SaleListingAdded(
        uint256 indexed _listingId,
        uint256 indexed _price,
        address indexed _owner,
        uint256[] nftIds,
        uint256 _timestamp,
        bool isActive,
        bool isSold
    );
    event SaleListingCancelled(
        uint256 indexed _listingId,
        address indexed _owner,
        uint256 _timestamp,
        bool isActive,
        bool isSold
    );
    event Sold(
        uint256 indexed _listingId,
        address indexed _seller,
        address indexed _buyer,
        uint256 _price,
        uint256 _timestamp,
        bool isActive,
        bool isSold
    );

    constructor(IERC20 _myToken, address _nftAddress, address _treasuryAddress) {
        require(_nftAddress.isContract(), "_nftAddress must be a contract");
        _initializeEIP712("NFTSale", "1");
        myToken = _myToken;
        nftAddress = _nftAddress;
        treasuryAddress = _treasuryAddress;
    }

    /**
     * Set Admin Access
     *
     * @param admin - Address of Minter
     * @param enabled - Enable/Disable Admin Access
     */
    function setAdmin(address admin, bool enabled) external onlyOwner {
        _admins[admin] = enabled;
        emit AdminAccessSet(admin, enabled);
    }

    /**
     * Check Admin Access
     *
     * @param admin - Address of Admin
     * @return whether minter has access
     */
    function isAdmin(address admin) public view returns (bool) {
        return _admins[admin];
    }

    function setTreasuryAddress(address _treasuryAddress) external onlyAdmin {
        require(!_treasuryAddress.isContract(), "Treasury Address must not be a contract");
        treasuryAddress = _treasuryAddress;
    }

    function transferWithTreasury(address _from, address _to, uint256 _amount) internal {
        uint256 treasuryFee = _amount.mul(5).div(100).div(100);
        myToken.safeTransferFrom(_from, treasuryAddress, treasuryFee);
        myToken.safeTransferFrom(_from, _to, _amount - treasuryFee);
    }

    /**
     * Sell NFT Bundle
     *
     * @param _nftIds - Token IDs of the NFTs to be bundled
     * @param price - price to sell NFT for
     */
    function sellNFTBundle(uint256[] calldata _nftIds, uint256 price) external nonReentrant {
        for (uint256 i = 0; i < _nftIds.length; i++) {
            require(_nftToListingId[_nftIds[i]] == 0, "A listed Bundle exists with one of the given NFT");
            address nftOwner = IERC721(nftAddress).ownerOf(_nftIds[i]);
            require(_msgSender() == nftOwner, "Not owner of one or more NFTs");
        }
        _listingIds.increment();
        uint256 listingId = _listingIds.current();

        for (uint256 i = 0; i < _nftIds.length; i++) {
            _nftToListingId[_nftIds[i]] = listingId;
            IERC721(nftAddress).transferFrom(_msgSender(), address(this), _nftIds[i]);
        }
        Listing memory listing = Listing(listingId, _nftIds.length, _nftIds, price, _msgSender(), true, false);
        listings[listingId] = listing;
        emit SaleListingAdded(
            listingId,
            price,
            _msgSender(),
            _nftIds,
            block.timestamp,
            listings[listingId].isActive,
            listings[listingId].isSold
        );
    }

    /**
     * Get NFT Sale Listing
     *
     * @param _listingId - id of the NFT Bundle
     */
    function getListing(uint256 _listingId) external view returns (uint256[] memory) {
        return listings[_listingId].tokenIDs;
    }

    /**
     * Cancel NFT Sale
     *
     * @param _listingId - id of the NFT Bundle
     */
    function cancelListingBundle(uint256 _listingId) external nonReentrant {
        require(listings[_listingId].isActive, "Listing is already inactive");
        require(listings[_listingId].owner == _msgSender(), "You are not the owner of this listing");
        listings[_listingId].isActive = false;
        uint256[] memory _nftIds = listings[_listingId].tokenIDs;
        for (uint256 i = 0; i < _nftIds.length; i++) {
            _nftToListingId[_nftIds[i]] = 0;
            IERC721(nftAddress).transferFrom(address(this), listings[_listingId].owner, _nftIds[i]);
        }
        emit SaleListingCancelled(
            _listingId,
            _msgSender(),
            block.timestamp,
            listings[_listingId].isActive,
            listings[_listingId].isSold
        );
    }

    /**
     * Purchase NFT Internal
     *
     * @param _listingId - id of the NFT Bundle
     */
    function purchaseNFT(uint256 _listingId, uint256 _amount) external nonReentrant {
        require(_amount == listings[_listingId].price, "value not equal to price of nft");
        require(!listings[_listingId].isSold, "Listing is already sold");
        require(listings[_listingId].isActive, "Listing is inactive");
        address seller = listings[_listingId].owner;
        address buyer = (_msgSender());
        uint256 price = listings[_listingId].price;
        listings[_listingId].isSold = true;
        listings[_listingId].isActive = false;
        uint256[] memory _nftIds = listings[_listingId].tokenIDs;

        // Transfer the myToken Tokens
        transferWithTreasury(buyer, seller, price);

        // Transfer the NFTs to the buyer
        for (uint256 i = 0; i < _nftIds.length; i++) {
            _nftToListingId[_nftIds[i]] = 0;
            IERC721(nftAddress).transferFrom(address(this), buyer, _nftIds[i]);
        }
        emit Sold(
            _listingId,
            seller,
            buyer,
            price,
            block.timestamp,
            listings[_listingId].isActive,
            listings[_listingId].isSold
        );
    }

    function hashOffer(Offer memory offer) internal pure returns (bytes32) {
        return
            keccak256(
                abi.encode(OFFER_TYPEHASH, offer.buyer, offer.price, offer.listingId, offer.timestamp, offer.expiryTime)
            );
    }

    function verify(
        address signer,
        Offer memory offer,
        bytes32 sigR,
        bytes32 sigS,
        uint8 sigV
    ) internal view returns (bool) {
        require(signer != address(0), "NativeMetaTransaction: INVALID_SIGNER");
        return signer == ecrecover(toTypedMessageHash(hashOffer(offer)), sigV, sigR, sigS);
    }

    function acceptOffer(
        address offerSender,
        uint256 amount,
        uint256 listingId,
        uint256 timestamp,
        uint256 expiryTime,
        bytes32 sigR,
        bytes32 sigS,
        uint8 sigV
    ) external {
        Offer memory offer = Offer({
            buyer: offerSender,
            price: amount,
            listingId: listingId,
            timestamp: timestamp,
            expiryTime: expiryTime
        });
        require(verify(offerSender, offer, sigR, sigS, sigV), "Signature data and Offer data do not match");
        require(!cancelledOffers[hashOffer(offer)], "This offer has been cancelled");
        require(block.timestamp <= expiryTime, "Offer has expired");
        require(!listings[listingId].isSold, "Listing is already sold");
        require(listings[listingId].isActive, "Listing is inactive");
        address seller = listings[listingId].owner;
        require(_msgSender() == seller, "Offer can only be accepted by the listing owner");
        listings[listingId].isSold = true;
        listings[listingId].isActive = false;
        uint256[] memory _nftIds = listings[listingId].tokenIDs;

        // Transfer the myToken Tokens
        transferWithTreasury(offerSender, seller, amount);

        // Transfer the NFTs to the buyer
        for (uint256 i = 0; i < _nftIds.length; i++) {
            _nftToListingId[_nftIds[i]] = 0;
            IERC721(nftAddress).transferFrom(address(this), offerSender, _nftIds[i]);
        }
        emit Sold(listingId, seller, offerSender, amount, block.timestamp, false, true);
    }

    function cancelOffer(
        address offerSender,
        uint256 amount,
        uint256 listingId,
        uint256 timestamp,
        uint256 expiryTime,
        bytes32 sigR,
        bytes32 sigS,
        uint8 sigV
    ) external {
        Offer memory offer = Offer({
            buyer: offerSender,
            price: amount,
            listingId: listingId,
            timestamp: timestamp,
            expiryTime: expiryTime
        });
        require(verify(offerSender, offer, sigR, sigS, sigV), "Signature data and Offer data do not match");
        require(offerSender == _msgSender(), "Only offer owner can cancel it");
        bytes32 offerHash = hashOffer((offer));
        if (!cancelledOffers[offerHash]) {
            cancelledOffers[offerHash] = true;
        }
    }

    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external override returns (bytes4) {
        return this.onERC721Received.selector;
    }

    /**
     * Throws if called by any account other than the Admin.
     */
    modifier onlyAdmin() {
        require(_admins[_msgSender()] || _msgSender() == owner(), "Caller does not have Admin Access");
        _;
    }

    function setTrustedForwarder(address _trustedForwarder) external onlyAdmin {
        trustedForwarder = _trustedForwarder;
    }

    function _msgSender() internal view override(Context, BaseRelayRecipient) returns (address) {
        return BaseRelayRecipient._msgSender();
    }
}
