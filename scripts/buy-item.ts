import { ethers, getNamedAccounts, network } from 'hardhat'
import { BasicNft, NftMarketplace } from '../typechain-types'
import mintAndList from '../utils/mintAndList'
import { developmentChains } from '../helper-hardhat-config'
import moveBlocks from '../utils/move-blocks'

async function buyItem() {
   const { user } = await getNamedAccounts()
   const tokenId = await mintAndList()
   const nftMarketplace: NftMarketplace = await ethers.getContract(
      'NftMarketplace',
      user
   )
   const basicNft: BasicNft = await ethers.getContract('BasicNft')
   const listing = await nftMarketplace.getListing(basicNft.address, tokenId)

   console.log('Buying NFT...')

   const tx = await nftMarketplace.buyItem(basicNft.address, tokenId, {
      value: listing.price,
   })
   await tx.wait(1)

   console.log('NFT bought!')

   if (developmentChains.includes(network.name)) {
      await moveBlocks(1, 1000)
   }
}

buyItem()
   .then(() => process.exit(0))
   .catch((error) => {
      console.error(error)
      process.exit(1)
   })
