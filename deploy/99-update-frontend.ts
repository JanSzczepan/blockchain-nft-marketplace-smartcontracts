import { DeployFunction } from 'hardhat-deploy/dist/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import fs from 'fs-extra'
import { frontEndContractAddressesFile } from '../helper-hardhat-config'
import { ethers, network } from 'hardhat'
import { NftMarketplace } from '../typechain-types'

const updateFrontend: DeployFunction = async function (
   hre: HardhatRuntimeEnvironment
) {
   if (process.env.UPDATE_FRONT_END) {
      await writeContractAddress()
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

updateFrontend.tags = ['all', 'frontend']
export default updateFrontend
