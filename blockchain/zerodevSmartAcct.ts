import { getEntryPoint, KERNEL_V3_1 } from "@zerodev/sdk/constants"
import { Chain, createPublicClient, http } from "viem"
import { mnemonicToAccount } from "viem/accounts"
import { base } from 'viem/chains'
import { signerToEcdsaValidator } from "@zerodev/ecdsa-validator"
import { createKernelAccount, createKernelAccountClient, createZeroDevPaymasterClient, KernelAccountClient } from "@zerodev/sdk"



const entryPoint = getEntryPoint("0.7")
const publicClient = createPublicClient({
 
    transport: http(),
    chain: base,
})

const kernelVersion = KERNEL_V3_1


async function zerodevViemClient(chain:Chain, rpcServer: string) {
    let publicClient = createPublicClient({
        transport: http(rpcServer),
        chain: chain,
    })

    return publicClient

}


export async function createAccountValidator(mnemonic: string, chain: Chain, rpcUrl: string) {

    const publicClient = await zerodevViemClient(chain, rpcUrl)
    let txSigner = mnemonicToAccount(mnemonic)


    const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
        signer: txSigner,
        entryPoint,
        kernelVersion
    })

    const account = await createKernelAccount(publicClient, {
        plugins: {
            sudo: ecdsaValidator,
        },
        entryPoint,
        kernelVersion
    })
    return account
}


export async function paymasterClient(chain: Chain, rpcUrl:string) {
    const paymasterClient = createZeroDevPaymasterClient({
        chain,
        // Get this RPC from ZeroDev dashboard
        transport: http(rpcUrl),
    })

    return paymasterClient
}

export async function createZeroDevSmartAccount(mnemonic: string, rpcUrl: string, chain: Chain): Promise<KernelAccountClient> {
    const publicClient = await zerodevViemClient(chain, rpcUrl)
    let txSigner = await createAccountValidator(mnemonic, chain, rpcUrl)
    let txPaymasterClient = await paymasterClient(chain, rpcUrl)

  const kernelClient = await createKernelAccountClient({
      account: txSigner,

      chain: chain,

      bundlerTransport: http(rpcUrl),

      client: publicClient,

      paymaster: {
          getPaymasterData(userOperation) {
              return txPaymasterClient.sponsorUserOperation({ userOperation })
          }
      },
  })

  return kernelClient
}


export async function sendSmartAccountTransactions(mnemonic: string, rpcUrl: string, chain: Chain, to: `0x${string}`, value: bigint, callData: `0x${string}`) {
    let txSigner = await createAccountValidator(mnemonic, chain, rpcUrl)
    const kernelClient = await createZeroDevSmartAccount(mnemonic, rpcUrl, chain)

    const tx = await kernelClient.sendTransaction({
        account: txSigner,
        to,
        value,
        chain,
        data: callData,
    })

    console.log('the tx is:', tx)

    return tx
}