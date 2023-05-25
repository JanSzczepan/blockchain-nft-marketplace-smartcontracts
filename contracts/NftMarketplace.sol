// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';

error NftMarketplace__PriceMustBeAboveZero();
error NftMarketplace__AlreadyListed(address nftAddress, uint256 tokenId);
error NftMarketplace__NotListed(address nftAddress, uint256 tokenId);
error NftMarketplace__NotOwner();
error NftMarketplace__ShouldNotBeOwner();
error NftMarketplace__NotApprovedForMarketplace();
error NftMarketplace__PriceNotMet(
   address nftAddress,
   uint256 tokenId,
   uint256 price
);
error NftMarketplace__TransferFailed();
error NftMarketplace__NoProceeds();

contract NftMarketplace is ReentrancyGuard {
   struct ListItem {
      uint256 price;
      address seller;
   }

   event ItemListed(
      address indexed seller,
      address indexed nftAddress,
      uint256 indexed tokenId,
      uint256 price
   );

   event ItemCancelled(
      address indexed seller,
      address indexed nftAddress,
      uint256 indexed tokenId
   );

   event ItemBought(
      address indexed buyer,
      address indexed nftAddress,
      uint256 indexed tokenId,
      uint256 price
   );

   mapping(address => mapping(uint256 => ListItem)) private s_listing;
   mapping(address => uint256) private s_proceeds;

   modifier notListed(address nftAddress, uint256 tokenId) {
      ListItem memory item = s_listing[nftAddress][tokenId];
      if (item.price > 0) {
         revert NftMarketplace__AlreadyListed(nftAddress, tokenId);
      }

      _;
   }

   modifier isListed(address nftAddress, uint256 tokenId) {
      ListItem memory item = s_listing[nftAddress][tokenId];
      if (item.price <= 0) {
         revert NftMarketplace__NotListed(nftAddress, tokenId);
      }

      _;
   }

   modifier isOwner(
      address nftAddress,
      uint256 tokenId,
      address spender
   ) {
      IERC721 nft = IERC721(nftAddress);
      address owner = nft.ownerOf(tokenId);
      if (owner != spender) {
         revert NftMarketplace__NotOwner();
      }

      _;
   }

   modifier isNotOwner(
      address nftAddress,
      uint256 tokenId,
      address spender
   ) {
      IERC721 nft = IERC721(nftAddress);
      address owner = nft.ownerOf(tokenId);
      if (owner == spender) {
         revert NftMarketplace__ShouldNotBeOwner();
      }

      _;
   }

   modifier isPriceAboveZero(uint256 price) {
      if (price <= 0) {
         revert NftMarketplace__PriceMustBeAboveZero();
      }

      _;
   }

   function listItem(
      address nftAddress,
      uint256 tokenId,
      uint256 price
   )
      external
      notListed(nftAddress, tokenId)
      isOwner(nftAddress, tokenId, msg.sender)
      isPriceAboveZero(price)
   {
      IERC721 nft = IERC721(nftAddress);
      if (nft.getApproved(tokenId) != address(this)) {
         revert NftMarketplace__NotApprovedForMarketplace();
      }

      s_listing[nftAddress][tokenId] = ListItem(price, msg.sender);
      emit ItemListed(msg.sender, nftAddress, tokenId, price);
   }

   function updateListing(
      address nftAddress,
      uint256 tokenId,
      uint256 price
   )
      external
      isListed(nftAddress, tokenId)
      isOwner(nftAddress, tokenId, msg.sender)
      isPriceAboveZero(price)
      nonReentrant
   {
      s_listing[nftAddress][tokenId] = ListItem(price, msg.sender);
      emit ItemListed(msg.sender, nftAddress, tokenId, price);
   }

   function cancelListing(
      address nftAddress,
      uint256 tokenId
   )
      external
      isListed(nftAddress, tokenId)
      isOwner(nftAddress, tokenId, msg.sender)
   {
      delete (s_listing[nftAddress][tokenId]);
      emit ItemCancelled(msg.sender, nftAddress, tokenId);
   }

   function buyItem(
      address nftAddress,
      uint256 tokenId
   )
      external
      payable
      isListed(nftAddress, tokenId)
      isNotOwner(nftAddress, tokenId, msg.sender)
      nonReentrant
   {
      ListItem memory item = s_listing[nftAddress][tokenId];
      if (msg.value < item.price) {
         revert NftMarketplace__PriceNotMet(nftAddress, tokenId, item.price);
      }

      s_proceeds[item.seller] += msg.value;
      delete (s_listing[nftAddress][tokenId]);

      IERC721 nft = IERC721(nftAddress);
      nft.safeTransferFrom(item.seller, msg.sender, tokenId);
      emit ItemBought(msg.sender, nftAddress, tokenId, item.price);
   }

   function withdrawProceeds() external nonReentrant {
      uint256 proceeds = s_proceeds[msg.sender];
      if (proceeds <= 0) {
         revert NftMarketplace__NoProceeds();
      }

      s_proceeds[msg.sender] = 0;

      (bool success, ) = payable(msg.sender).call{value: proceeds}('');
      if (!success) {
         revert NftMarketplace__TransferFailed();
      }
   }

   function getListing(
      address nftAddress,
      uint256 tokenId
   ) external view returns (ListItem memory) {
      return s_listing[nftAddress][tokenId];
   }

   function getProceeds(address seller) external view returns (uint256) {
      return s_proceeds[seller];
   }
}
