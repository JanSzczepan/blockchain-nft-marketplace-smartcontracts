export interface networkConfigItem {
   name: string
   vrfCoordinatorV2Address?: string
   subscriptionId?: string
   callbackGasLimit?: string
   gasLane?: string
   requestConfirmations?: string
   mintFee?: string
   blockConfirmations?: number
   ethUsdPriceFeed?: string
}

export interface networkConfigInfo {
   [key: string]: networkConfigItem
}

export const networkConfig: networkConfigInfo = {
   31337: {
      name: 'localhost',
   },
}

export const developmentChains = ['hardhat', 'localhost']
