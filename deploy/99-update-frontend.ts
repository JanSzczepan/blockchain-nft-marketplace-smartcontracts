import { DeployFunction } from 'hardhat-deploy/dist/types'
import fs from 'fs-extra'
import {
   abiFilesPath,
   frontEndContractAddressesFile,
} from '../helper-hardhat-config'
import { ethers, network } from 'hardhat'
import { BasicNft, NftMarketplace } from '../typechain-types'

const updateFrontend: DeployFunction = async function () {
   if (process.env.UPDATE_FRONT_END) {
      await writeContractAddress()
      await writeAbis()
   }
}

async function writeContractAddress() {
   console.log('Writing contract adress to frontend...')

   const nftMarketplace: NftMarketplace = await ethers.getContract(
      'NftMarketplace'
   )
   const chainId = network.config.chainId!
   const addresses = JSON.parse(
      fs.readFileSync(frontEndContractAddressesFile, 'utf8')
   )

   if (chainId in addresses) {
      if (
         !addresses[chainId]['NftMarketplace'].includes(nftMarketplace.address)
      ) {
         addresses[chainId]['NftMarketplace'].push(nftMarketplace.address)
      }
   } else {
      addresses[chainId] = { NftMarketplace: [nftMarketplace.address] }
   }

   fs.writeFileSync(
      frontEndContractAddressesFile,
      JSON.stringify(addresses),
      'utf8'
   )

   console.log('Contract adress written to frontend!')
}

async function writeAbis() {
   console.log('Writing contract ABIs to frontend...')

   const nftMarketplace: NftMarketplace = await ethers.getContract(
      'NftMarketplace'
   )
   const basicNft: BasicNft = await ethers.getContract('BasicNft')

   fs.writeFileSync(
      `${abiFilesPath}/NftMarketplaceABI.json`,
      nftMarketplace.interface.format(ethers.utils.FormatTypes.json).toString()
   )
   fs.writeFileSync(
      `${abiFilesPath}/BasicNftABI.json`,
      basicNft.interface.format(ethers.utils.FormatTypes.json).toString()
   )

   console.log('Contract ABIs written to frontend!')
}

updateFrontend.tags = ['all', 'frontend']
export default updateFrontend
