import { ethers, network } from 'hardhat'
import { BasicNft, NftMarketplace } from '../typechain-types'
import { developmentChains } from '../helper-hardhat-config'
import moveBlocks from '../utils/move-blocks'

const PRICE = ethers.utils.parseEther('0.1')

export default async function mintAndList(): Promise<number> {
   const nftMarketplace: NftMarketplace = await ethers.getContract(
      'NftMarketplace'
   )
   const basicNft: BasicNft = await ethers.getContract('BasicNft')

   console.log('Minting NFT...')
   const mintTx = await basicNft.mintNft()
   const mintTxReceipt = await mintTx.wait(1)
   const tokenId = mintTxReceipt.events![0].args!.tokenId

   console.log('Approving NFT...')
   const approvalTx = await basicNft.approve(nftMarketplace.address, tokenId)
   await approvalTx.wait(1)

   console.log('Listing NFT...')
   const tx = await nftMarketplace.listItem(basicNft.address, tokenId, PRICE)
   await tx.wait(1)
   console.log('NFT Listed!')

   if (developmentChains.includes(network.name)) {
      await moveBlocks(1, 1000)
   }

   return tokenId
}
