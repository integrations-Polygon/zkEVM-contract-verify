// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { IERC721Receiver } from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import { IERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./utils/AccessProtected.sol";
import "./utils/BaseRelayRecipient.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

interface IERC721Token {
    function issueToken(uint256, string memory, string memory) external returns (uint256);

    function ownerOf(uint256) external view returns (address);

    function transferFrom(address from, address to, uint256 tokenId) external;

    function safeTransferFrom(address from, address to, uint256 tokenId) external;
}

contract NftAuction is IERC721Receiver, ReentrancyGuard, AccessProtected, BaseRelayRecipient {
    using Address for address;
    using Counters for Counters.Counter;
    using SafeMath for uint256;

    struct Auction {
        uint256 auctionID;
        AuctionType orderType;
        uint256 highestBid;
        uint256 startBid;
        uint256 endBid;
        uint256 startingTime;
        uint256 closingTime;
        address highestBidder;
        address originalOwner;
        bool isActive;
        bool isSold;
        uint256 nftCount;
        uint256[] tokenIDs;
    }

    mapping(uint256 => uint256) private _nftToAuctionId; //  TokenID -> AuctionID

    Counters.Counter public _auctionIds;

    enum AuctionType {
        dutchAuction,
        englishAuction
    }
    AuctionType choice;
    //AuctionType orderType;

    mapping(uint256 => Auction) public auctions;
    mapping(address => mapping(uint256 => uint256)) public claimableFunds; // User address -> AuctionID -> amount claimable

    IERC20 public immutable erc721Token;
    using SafeERC20 for IERC20;
    uint256 public balances;

    address public immutable nftAddress;
    address public treasuryAddress;
    uint256 public treasuryPercentage;

    event NewAuctionOpened(
        uint256 indexed auctionId,
        AuctionType indexed orderType,
        uint256[] nftIds,
        uint256 startingBid,
        uint256 closingTime,
        address originalOwner
    );

    event EnglishAuctionClosed(uint256 indexed auctionId, uint256 highestBid, address indexed highestBidder);

    event BidPlacedInEnglishAuction(uint256 indexed auctionId, uint256 indexed bidPrice, address indexed bidder);

    event BoughtNFTInDutchAuction(uint256 indexed auctionId, uint256 indexed bidPrice, address indexed buyer);

    event AuctionCancelled(uint256 indexed auctionId, address indexed cancelledBy);

    constructor(IERC20 _erc721Token, address _nftAddress, address _treasuryAddress) {
        require(_nftAddress.isContract(), "_nftAddress must be a contract");
        erc721Token = _erc721Token;
        nftAddress = _nftAddress;
        treasuryAddress = _treasuryAddress;
    }

    function setTreasuryAddress(address _treasuryAddress) external onlyAdmin {
        require(!_treasuryAddress.isContract(), "Treasury Address must not be a contract");
        treasuryAddress = _treasuryAddress;
    }

    // function setTreasuryPercentage(uint256 _treasuryPercentage) external onlyAdmin {
    //     require(treasuryPercentage >= 0, "treasuryPercentage has to be greater than or equal to 0");
    //     treasuryPercentage = _treasuryPercentage;
    // }

    function transferFromWithTreasury(address _from, address _to, uint256 _amount) internal {
        uint256 treasuryFee = _amount.mul(5).div(100).div(100);
        erc721Token.safeTransferFrom(_from, treasuryAddress, treasuryFee);
        erc721Token.safeTransferFrom(_from, _to, _amount - treasuryFee);
    }

    function transferWithTreasury(address _to, uint256 _amount) internal {
        uint256 treasuryFee = _amount.mul(treasuryPercentage).div(100).div(100);
        erc721Token.safeTransfer(treasuryAddress, treasuryFee);
        erc721Token.safeTransfer(_to, _amount - treasuryFee);
    }

    function getCurrentPrice(uint256 _auctionId, AuctionType orderType) public view returns (uint256) {
        AuctionType choicee = AuctionType.englishAuction;

        if (choicee == orderType) {
            return auctions[_auctionId].highestBid;
        } else {
            uint256 _startPrice = auctions[_auctionId].startBid;
            uint256 _endPrice = auctions[_auctionId].endBid;
            uint256 _startingTime = auctions[_auctionId].startingTime;
            uint256 tickPerBlock = (_startPrice - _endPrice) / (auctions[_auctionId].closingTime - _startingTime);
            return _startPrice - ((block.timestamp - _startingTime) * tickPerBlock);
        }
    }

    function startDutchAuction(
        uint256[] calldata _nftIds,
        uint256 _startPrice,
        uint256 _endBid,
        uint256 _duration
    ) external returns (uint256) {
        require(_startPrice > _endBid, "End price should be lower than start price");
        choice = AuctionType.dutchAuction;
        return openAuction(choice, _nftIds, _startPrice, _endBid, _duration);
    }

    function startEnglishAuction(
        uint256[] calldata _nftIds,
        uint256 _startPrice,
        uint256 _duration
    ) external returns (uint256) {
        choice = AuctionType.englishAuction;
        return openAuction(choice, _nftIds, _startPrice, 0, _duration);
    }

    function openAuction(
        AuctionType _orderType,
        uint256[] calldata _nftIds,
        uint256 _initialBid,
        uint256 _endBid,
        uint256 _duration
    ) private nonReentrant returns (uint256) {
        require(_nftIds.length > 0, "Atleast one NFT should be specified");
        require(_duration > 0 && _initialBid > 0, "Invalid input");
        for (uint256 i = 0; i < _nftIds.length; i++) {
            require(_nftToAuctionId[_nftIds[i]] == 0, "An auction Bundle exists with one of the given NFT");
            address nftOwner = IERC721(nftAddress).ownerOf(_nftIds[i]);
            require(_msgSender() == nftOwner, "Not owner of one or more NFTs");
        }

        _auctionIds.increment();
        uint256 newAuctionId = _auctionIds.current();
        auctions[newAuctionId].auctionID = newAuctionId;
        auctions[newAuctionId].orderType = _orderType;
        auctions[newAuctionId].startBid = _initialBid;
        auctions[newAuctionId].endBid = _endBid;
        auctions[newAuctionId].startingTime = block.timestamp;
        auctions[newAuctionId].closingTime = block.timestamp + _duration;
        auctions[newAuctionId].highestBid = _initialBid;
        auctions[newAuctionId].highestBidder = _msgSender();
        auctions[newAuctionId].originalOwner = _msgSender();
        auctions[newAuctionId].isActive = true;
        auctions[newAuctionId].nftCount = _nftIds.length;
        auctions[newAuctionId].tokenIDs = _nftIds;

        for (uint256 i = 0; i < _nftIds.length; i++) {
            _nftToAuctionId[_nftIds[i]] = newAuctionId;
            IERC721(nftAddress).transferFrom(_msgSender(), address(this), _nftIds[i]);
        }

        emit NewAuctionOpened(
            newAuctionId,
            _orderType,
            _nftIds,
            auctions[newAuctionId].startBid,
            auctions[newAuctionId].closingTime,
            auctions[newAuctionId].originalOwner
        );
        return newAuctionId;
    }

    function placeBidInEnglishAuction(
        uint256 _auctionId,
        uint256 _amount,
        AuctionType orderType
    ) external nonReentrant {
        choice = AuctionType.englishAuction;
        require(auctions[_auctionId].isActive == true, "Not active auction");
        require(auctions[_auctionId].closingTime > block.timestamp, "Auction is closed");
        require(_amount > auctions[_auctionId].highestBid, "Bid is too low");
        require(orderType == choice, "only for English Auction");
        if (auctions[_auctionId].closingTime - block.timestamp <= 600) {
            auctions[_auctionId].closingTime += 60;
        }
        // Lock Additional funds only if the user has made a bid before on the same auction
        uint256 lockedFunds = claimableFunds[_msgSender()][_auctionId];
        uint256 toLock = _amount.sub(lockedFunds);
        erc721Token.safeTransferFrom(_msgSender(), address(this), toLock);
        claimableFunds[_msgSender()][_auctionId] = 0;

        // Make previous highest bidder's funds claimable
        claimableFunds[auctions[_auctionId].highestBidder][_auctionId] = auctions[_auctionId].highestBid;

        // Make current bidder the highest bidder
        auctions[_auctionId].highestBid = _amount;
        auctions[_auctionId].highestBidder = _msgSender();
        emit BidPlacedInEnglishAuction(_auctionId, auctions[_auctionId].highestBid, auctions[_auctionId].highestBidder);
    }

    function buyNftFromDutchAuction(uint256 _auctionId, uint256 _amount, AuctionType orderType) external nonReentrant {
        choice = AuctionType.dutchAuction;
        require(auctions[_auctionId].isActive == true, "Not active auction");
        require(auctions[_auctionId].closingTime > block.timestamp, "Auction is closed");
        require(orderType == choice, "only for Dutch Auction");
        require(auctions[_auctionId].isSold == false, "Already sold");
        uint256 currentPrice = getCurrentPrice(_auctionId, choice);
        require(_amount >= currentPrice, "price error");
        address seller = auctions[_auctionId].originalOwner;

        auctions[_auctionId].highestBid = _amount;
        auctions[_auctionId].highestBidder = _msgSender();
        auctions[_auctionId].isSold = true;

        // transferring price to seller of nft
        transferFromWithTreasury(_msgSender(), seller, currentPrice);

        //transferring nft to highest bidder
        uint256[] memory _nftIds = auctions[_auctionId].tokenIDs;
        for (uint256 i = 0; i < _nftIds.length; i++) {
            _nftToAuctionId[_nftIds[i]] = 0;
            IERC721(nftAddress).transferFrom(address(this), _msgSender(), _nftIds[i]);
        }

        emit BoughtNFTInDutchAuction(_auctionId, auctions[_auctionId].highestBid, auctions[_auctionId].highestBidder);
    }

    function claimNftFromEnglishAuction(uint256 _auctionId) external nonReentrant {
        require(auctions[_auctionId].isActive == true, "Not active auction");
        require(auctions[_auctionId].closingTime <= block.timestamp, "Auction is not closed");
        require(auctions[_auctionId].highestBidder == _msgSender(), "You are not owner of this NFT");

        address seller = auctions[_auctionId].originalOwner;

        //sending price to seller of nft
        transferWithTreasury(seller, auctions[_auctionId].highestBid);

        //transferring nft to highest bidder
        uint256[] memory _nftIds = auctions[_auctionId].tokenIDs;
        for (uint256 i = 0; i < _nftIds.length; i++) {
            _nftToAuctionId[_nftIds[i]] = 0;
            IERC721(nftAddress).transferFrom(address(this), auctions[_auctionId].highestBidder, _nftIds[i]);
        }

        auctions[_auctionId].isActive = false;
        emit EnglishAuctionClosed(_auctionId, auctions[_auctionId].highestBid, auctions[_auctionId].highestBidder);
    }

    function claimFundsFromEnglishAuction(uint256 _auctionId) external nonReentrant {
        address sender = _msgSender();
        uint256 claimable = claimableFunds[sender][_auctionId];
        require(claimable > 0, "No funds to claim for this auction ID");
        erc721Token.safeTransferFrom(address(this), sender, claimable);
        claimableFunds[sender][_auctionId] = 0;
    }

    function cancelAuction(uint256 _auctionId) external nonReentrant {
        require(auctions[_auctionId].isActive == true, "Not active auction");
        require(auctions[_auctionId].closingTime > block.timestamp, "Auction is closed, Go to Claim Nft");
        require(auctions[_auctionId].startBid == auctions[_auctionId].highestBid, "Bids were placed in the Auction");
        require(auctions[_auctionId].originalOwner == _msgSender(), "You are not the creator of Auction");
        auctions[_auctionId].isActive = false;

        uint256[] memory _nftIds = auctions[_auctionId].tokenIDs;
        for (uint256 i = 0; i < _nftIds.length; i++) {
            _nftToAuctionId[_nftIds[i]] = 0;
            IERC721(nftAddress).transferFrom(address(this), auctions[_auctionId].originalOwner, _nftIds[i]);
        }

        emit AuctionCancelled(_auctionId, _msgSender());
    }

    function getBundledNFTs(uint256 _auctionId) public view returns (uint256[] memory) {
        return auctions[_auctionId].tokenIDs;
    }

    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external override returns (bytes4) {
        return this.onERC721Received.selector;
    }

    function setTrustedForwarder(address _trustedForwarder) external onlyAdmin {
        trustedForwarder = _trustedForwarder;
    }

    function _msgSender() internal view override(Context, BaseRelayRecipient) returns (address) {
        return BaseRelayRecipient._msgSender();
    }
}
