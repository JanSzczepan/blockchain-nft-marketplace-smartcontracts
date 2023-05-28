import { ethers, network } from 'hardhat'
import { BasicNft, NftMarketplace } from '../typechain-types'
import { developmentChains } from '../helper-hardhat-config'
import moveBlocks from '../utils/move-blocks'
import mintAndList from '../utils/mintAndList'

async function cancelItem() {
   const tokenId = await mintAndList()
   const nftMarketplace: NftMarketplace = await ethers.getContract(
      'NftMarketplace'
   )
   const basicNft: BasicNft = await ethers.getContract('BasicNft')

   console.log('Canceling NFT...')

   const tx = await nftMarketplace.cancelListing(basicNft.address, tokenId)
   await tx.wait(1)

   console.log('NFT canceled!')

   if (developmentChains.includes(network.name)) {
      await moveBlocks(1, 1000)
   }
}

cancelItem()
   .then(() => process.exit(0))
   .catch((error) => {
      console.error(error)
      process.exit(1)
   })
