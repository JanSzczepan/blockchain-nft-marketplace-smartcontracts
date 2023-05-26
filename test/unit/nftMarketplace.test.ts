import { deployments, ethers, network } from 'hardhat'
import { developmentChains } from '../../helper-hardhat-config'
import { BasicNft, NftMarketplace } from '../../typechain-types'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'

developmentChains.includes(network.name) &&
   describe('NftMarketplace Unit Tests', function () {
      let nftMarketplace: NftMarketplace
      let basicNft: BasicNft
      let tokenId: number
      let deployer: SignerWithAddress
      let user: SignerWithAddress
      const price = ethers.utils.parseEther('1')

      beforeEach(async function () {
         const accounts = await ethers.getSigners()
         deployer = accounts[0]
         user = accounts[1]
         await deployments.fixture(['nftmarketplace', 'basicnft'])
         nftMarketplace = await ethers.getContract('NftMarketplace', deployer)
         basicNft = await ethers.getContract('BasicNft', deployer)
         tokenId = (await basicNft.getTokenCounter()).toNumber()
         await basicNft.mintNft()
         await basicNft.approve(nftMarketplace.address, tokenId)
      })

      describe('listItem', function () {
         it('reverts if item is already listed', async function () {
            const tx = await nftMarketplace.listItem(
               basicNft.address,
               tokenId,
               price
            )
            await tx.wait(1)
            await expect(
               nftMarketplace.listItem(basicNft.address, tokenId, price)
            ).to.be.revertedWithCustomError(
               nftMarketplace,
               'NftMarketplace__AlreadyListed'
            )
         })

         it('reverts if sender is not owner', async function () {
            const nftMarketplaceConnectedToUser = nftMarketplace.connect(user)
            await expect(
               nftMarketplaceConnectedToUser.listItem(
                  basicNft.address,
                  tokenId,
                  price
               )
            ).to.be.revertedWithCustomError(
               nftMarketplace,
               'NftMarketplace__NotOwner'
            )
         })

         it('reverts if price is incorrect', async function () {
            await expect(
               nftMarketplace.listItem(basicNft.address, tokenId, 0)
            ).to.be.revertedWithCustomError(
               nftMarketplace,
               'NftMarketplace__PriceMustBeAboveZero'
            )
         })

         it('lists item', async function () {
            const tx = await nftMarketplace.listItem(
               basicNft.address,
               tokenId,
               price
            )
            await tx.wait(1)
            const item = await nftMarketplace.getListing(
               basicNft.address,
               tokenId
            )
            expect(item.price.toString()).to.equal(price.toString())
            expect(item.seller).to.equal(deployer.address)
         })

         it('emits ItemListed event', async function () {
            await expect(
               nftMarketplace.listItem(basicNft.address, tokenId, price)
            ).to.emit(nftMarketplace, 'ItemListed')
         })
      })

      describe('updateListing', function () {
         it('reverts if item is not listed', async function () {
            await expect(
               nftMarketplace.updateListing(basicNft.address, tokenId, price)
            ).to.be.revertedWithCustomError(
               nftMarketplace,
               'NftMarketplace__NotListed'
            )
         })

         it('updates listed item', async function () {
            const tx = await nftMarketplace.listItem(
               basicNft.address,
               tokenId,
               price
            )
            await tx.wait(1)
            const newPrice = ethers.utils.parseEther('1.5')
            const tx2 = await nftMarketplace.updateListing(
               basicNft.address,
               tokenId,
               newPrice
            )
            await tx2.wait(1)
            const updatedItem = await nftMarketplace.getListing(
               basicNft.address,
               tokenId
            )
            expect(updatedItem.price.toString()).to.equal(newPrice.toString())
         })

         it('emits ItemListed event', async function () {
            const tx = await nftMarketplace.listItem(
               basicNft.address,
               tokenId,
               price
            )
            await tx.wait(1)
            const newPrice = ethers.utils.parseEther('1.5')
            await expect(
               nftMarketplace.updateListing(basicNft.address, tokenId, newPrice)
            ).to.emit(nftMarketplace, 'ItemListed')
         })
      })

      describe('cancelListing', function () {
         beforeEach(async function () {
            const tx = await nftMarketplace.listItem(
               basicNft.address,
               tokenId,
               price
            )
            await tx.wait(1)
         })

         it('cancels listed item', async function () {
            const tx = await nftMarketplace.cancelListing(
               basicNft.address,
               tokenId
            )
            await tx.wait(1)
            const deletedItem = await nftMarketplace.getListing(
               basicNft.address,
               tokenId
            )
            expect(deletedItem.price.toString()).to.equal('0')
            expect(deletedItem.seller).to.equal(
               '0x0000000000000000000000000000000000000000'
            )
         })

         it('emits ItemCancelled event', async function () {
            await expect(
               nftMarketplace.cancelListing(basicNft.address, tokenId)
            ).to.emit(nftMarketplace, 'ItemCancelled')
         })
      })

      describe('buyItem', function () {
         let nftMarketplaceConnectedToBuyer: NftMarketplace

         beforeEach(async function () {
            const tx = await nftMarketplace.listItem(
               basicNft.address,
               tokenId,
               price
            )
            await tx.wait(1)
            nftMarketplaceConnectedToBuyer = nftMarketplace.connect(user)
         })

         it('reverts if spender is owner', async function () {
            await expect(
               nftMarketplace.buyItem(basicNft.address, tokenId, {
                  value: price,
               })
            ).to.be.revertedWithCustomError(
               nftMarketplace,
               'NftMarketplace__ShouldNotBeOwner'
            )
         })

         it('reverts if price is not met', async function () {
            await expect(
               nftMarketplaceConnectedToBuyer.buyItem(basicNft.address, tokenId)
            ).to.be.revertedWithCustomError(
               nftMarketplace,
               'NftMarketplace__PriceNotMet'
            )
         })

         it('updates proceeds', async function () {
            const tx = await nftMarketplaceConnectedToBuyer.buyItem(
               basicNft.address,
               tokenId,
               { value: price }
            )
            await tx.wait(1)
            const proceeds = await nftMarketplace.getProceeds(deployer.address)
            expect(proceeds.toString()).to.equal(price.toString())
         })

         it('deletes listed item', async function () {
            const tx = await nftMarketplaceConnectedToBuyer.buyItem(
               basicNft.address,
               tokenId,
               { value: price }
            )
            await tx.wait(1)
            const deletedItem = await nftMarketplace.getListing(
               basicNft.address,
               tokenId
            )
            expect(deletedItem.price.toString()).to.equal('0')
            expect(deletedItem.seller).to.equal(
               '0x0000000000000000000000000000000000000000'
            )
         })

         it('transfers ownership', async function () {
            const tx = await nftMarketplaceConnectedToBuyer.buyItem(
               basicNft.address,
               tokenId,
               { value: price }
            )
            await tx.wait(1)
            const owner = await basicNft.ownerOf(tokenId)
            expect(owner).to.equal(user.address)
         })

         it('emits ItemBought event', async function () {
            await expect(
               nftMarketplaceConnectedToBuyer.buyItem(
                  basicNft.address,
                  tokenId,
                  { value: price }
               )
            ).to.emit(nftMarketplace, 'ItemBought')
         })
      })

      describe('withdrawProceeds', function () {
         let nftMarketplaceConnectedToBuyer: NftMarketplace

         beforeEach(async function () {
            nftMarketplaceConnectedToBuyer = nftMarketplace.connect(user)

            const tx = await nftMarketplace.listItem(
               basicNft.address,
               tokenId,
               price
            )
            await tx.wait(1)
            const tx2 = await nftMarketplaceConnectedToBuyer.buyItem(
               basicNft.address,
               tokenId,
               { value: price }
            )
            await tx2.wait(1)
         })

         it('reverts if there is nothing to withdraw', async function () {
            expect(
               nftMarketplaceConnectedToBuyer.withdrawProceeds()
            ).to.be.revertedWithCustomError(
               nftMarketplace,
               'NftMarketplace__NoProceeds'
            )
         })

         it('deletes proceeds', async function () {
            const tx = await nftMarketplace.withdrawProceeds()
            await tx.wait(1)
            const proceeds = await nftMarketplace.getProceeds(deployer.address)
            expect(proceeds.toString()).to.equal('0')
         })

         it('sends ETH to seller', async function () {
            const startingSellerBalance = await deployer.getBalance()
            const startingContractBalance = await ethers.provider.getBalance(
               nftMarketplace.address
            )

            const txResponse = await nftMarketplace.withdrawProceeds()
            const txReceipt = await txResponse.wait(1)
            const { effectiveGasPrice, gasUsed } = txReceipt
            const gasCost = effectiveGasPrice.mul(gasUsed)

            const endingSellerBalance = await deployer.getBalance()
            const endingContractBalance = await ethers.provider.getBalance(
               nftMarketplace.address
            )

            expect(endingContractBalance.toString()).to.equal('0')
            expect(endingSellerBalance.toString()).to.equal(
               startingSellerBalance
                  .add(startingContractBalance)
                  .sub(gasCost)
                  .toString()
            )
         })
      })
   })
