import { DeployFunction } from 'hardhat-deploy/dist/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { developmentChains, networkConfig } from '../helper-hardhat-config'
import verify from '../utils/verify'

const deployNftMarketplce: DeployFunction = async function (
   hre: HardhatRuntimeEnvironment
) {
   const { deployments, getNamedAccounts, network } = hre
   const { deploy } = deployments
   const { deployer } = await getNamedAccounts()
   const chainId = network.config.chainId!

   const args: any[] = []

   const nftMarketplace = await deploy('NftMarketplace', {
      from: deployer,
      args,
      log: true,
      waitConfirmations: networkConfig[chainId].blockConfirmations || 1,
   })

   if (
      developmentChains.includes(network.name) &&
      process.env.ETHERSCAN_API_KEY
   ) {
      await verify(nftMarketplace.address, args)
   }
}

deployNftMarketplce.tags = ['all', 'nftmarketplace']
export default deployNftMarketplce
