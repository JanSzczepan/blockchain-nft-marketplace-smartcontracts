import { network } from 'hardhat'

async function sleep(sleepTime: number): Promise<void> {
   console.log(`Sleeping for ${sleepTime}...`)
   return new Promise((resolve) => setTimeout(resolve, sleepTime))
}

export default async function (blocksAmount: number, sleepTime: number = 0) {
   console.log('Moving blocks...')

   for (let i = 0; i < blocksAmount; i++) {
      await network.provider.request({ method: 'evm_mine', params: [] })

      if (sleepTime) {
         await sleep(sleepTime)
      }
   }

   console.log(`Moved ${blocksAmount} blocks.`)
}
