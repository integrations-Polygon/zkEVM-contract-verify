// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "./tokens/ERC721Token_lender.sol";
import "../utils/AccessProtected.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { IERC721Receiver } from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

contract Lend is IERC721Receiver, ReentrancyGuard, AccessProtected {
    using Address for address;
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    using Counters for Counters.Counter;
    IERC20 public immutable myToken;
    ERC721 public immutable nftAddress;
    ERC721Token public immutable erc721Token;

    Counters.Counter public _listingIds;

    struct Listing {
        uint256 listingId;
        uint256[] tokenIDs;
        uint256 price;
        uint256 duration;
        address lender;
        bool isActive;
        bool onLend;
        uint256 rentperiod;
        uint256 rentexpire;
    }

    mapping(uint256 => Listing) public listings;
    mapping(uint256 => uint256) private _nftToListingId; //TokenID -> ListingId

    address public treasuryAddress;
    uint256 public treasuryPercentage;

    event LendListingAdded(
        uint256 listingId,
        uint256[] _nftIds,
        uint256 _price,
        uint256 _duration,
        address _lender,
        uint256 _timestamp,
        uint256 rentperiod,
        bool isActive,
        bool onLend
    );
    event LendListingCancelled(
        uint256 indexed listingId,
        uint256[] indexed _nftIds,
        address indexed _lender,
        uint256 _timestamp,
        bool isActive,
        bool onLend
    );
    event Rented(
        uint256 indexed listingId,
        uint256[] _nftIds,
        address indexed _lender,
        address indexed _renter,
        uint256 _price,
        uint256 _timestamp,
        bool isActive,
        bool onLend
    );
    event NftClaimed(
        uint256 indexed listingId,
        uint256[] indexed _nftIds,
        address indexed _lender,
        bool isActive,
        bool onLend
    );

    constructor(address _myToken, address _nftAddress, address _treasuryAddress, address _erc721Token) {
        require(_myToken.isContract(), "_myToken must be a contract");
        require(_nftAddress.isContract(), "_nftAddress must be a contract");
        require(_erc721Token.isContract(), "_erc721Token must be a contract");
        myToken = IERC20(_myToken);
        nftAddress = ERC721(_nftAddress);
        erc721Token = ERC721Token(_erc721Token);
        treasuryAddress = _treasuryAddress;
    }

    function transferWithTreasury(address _from, address _to, uint256 _amount) internal {
        uint256 treasuryFee = _amount.mul(5).div(100);
        myToken.safeTransferFrom(_from, treasuryAddress, treasuryFee);
        myToken.safeTransferFrom(_from, _to, _amount.sub(treasuryFee));
    }

    function lendNft(
        uint256[] memory nftIds,
        uint256 price,
        uint256 duration,
        uint256 rentduration
    ) external nonReentrant {
        for (uint256 i = 0; i < nftIds.length; i++) {
            require(_nftToListingId[nftIds[i]] == 0, "A listed Bundle exists with one of the given NFT");
            address nftOwner = IERC721(nftAddress).ownerOf(nftIds[i]);
            require(_msgSender() == nftOwner, "Not owner of one or more NFTs");
        }
        _listingIds.increment();
        uint256 listingId = _listingIds.current();
        for (uint256 i = 0; i < nftIds.length; i++) {
            _nftToListingId[nftIds[i]] = listingId;
            nftAddress.transferFrom(_msgSender(), address(this), nftIds[i]);
        }

        Listing memory listing = Listing(
            listingId,
            nftIds,
            price,
            block.timestamp + duration,
            _msgSender(),
            true,
            false,
            rentduration,
            0
        );
        listings[listingId] = listing;

        emit LendListingAdded(
            listingId,
            nftIds,
            price,
            block.timestamp + duration,
            _msgSender(),
            block.timestamp,
            rentduration,
            listings[listingId].isActive,
            listings[listingId].onLend
        );
    }

    function cancelLendNft(uint256 listingId) external nonReentrant {
        require(!listings[listingId].onLend, "NFT is already Lended");
        require(listings[listingId].isActive, "Lending is already cancelled");
        require(listings[listingId].lender == _msgSender(), "You are not the owner of this listing");
        listings[listingId].isActive = false;

        for (uint256 i = 0; i < listings[listingId].tokenIDs.length; i++) {
            _nftToListingId[listings[listingId].tokenIDs[i]] = 0;
            nftAddress.transferFrom(address(this), listings[listingId].lender, listings[listingId].tokenIDs[i]);
        }
        emit LendListingCancelled(
            listingId,
            listings[listingId].tokenIDs,
            _msgSender(),
            block.timestamp,
            listings[listingId].isActive,
            listings[listingId].onLend
        );
    }

    function rentNft(uint256 listingId) external nonReentrant {
        require(listings[listingId].isActive, "NFT is not Active");
        require(!listings[listingId].onLend, "NFT is already Lended");
        require(listings[listingId].duration > block.timestamp, "Listing Expired");
        address seller = listings[listingId].lender;
        address buyer = _msgSender();
        uint256 price = listings[listingId].price;
        listings[listingId].onLend = true;
        listings[listingId].isActive = false;
        listings[listingId].rentexpire = block.timestamp + listings[listingId].rentperiod;

        // Transfer the erc721Token Tokens
        transferWithTreasury(buyer, seller, price);

        // Transfer Game Token
        for (uint256 i = 0; i < listings[listingId].tokenIDs.length; i++) {
            erc721Token.issueToken(
                msg.sender,
                listings[listingId].tokenIDs[i],
                nftAddress.tokenURI(listings[listingId].tokenIDs[i])
            );
        }
        emit Rented(
            listingId,
            listings[listingId].tokenIDs,
            seller,
            buyer,
            price,
            block.timestamp,
            listings[listingId].isActive,
            listings[listingId].onLend
        );
    }

    function claimNft(uint256 listingId) external nonReentrant {
        require(listings[listingId].lender == msg.sender, "You are not the lender of the NFT");
        require(block.timestamp > listings[listingId].rentexpire, "Lending time isn't over yet");
        require(listings[listingId].onLend, "NFT is not Lended yet");
        for (uint256 i = 0; i < listings[listingId].tokenIDs.length; i++) {
            nftAddress.transferFrom(address(this), listings[listingId].lender, listings[listingId].tokenIDs[i]);

            erc721Token.burn(listings[listingId].tokenIDs[i]);
        }
        listings[listingId].onLend = false;
        emit NftClaimed(
            listingId,
            listings[listingId].tokenIDs,
            listings[listingId].lender,
            listings[listingId].isActive,
            listings[listingId].onLend
        );
    }

    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external override returns (bytes4) {
        return this.onERC721Received.selector;
    }
}
