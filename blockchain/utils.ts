import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'
import { erc20BalanceAbi } from './abis'

export async function getTokenBalance(
    rpcUrl: string,
    tokenAddress: `0x${string}`,
    walletAddress: `0x${string}`,
    decimal: number = 6 // Accept decimal as argument, default to 6
): Promise<string | null> {
    try {
        const client = createPublicClient({
            chain: mainnet,
            transport: http(rpcUrl),
        })

        const balance = await client.readContract({
            address: tokenAddress,
            abi: erc20BalanceAbi,
            functionName: 'balanceOf',
            args: [walletAddress],
        })

        // Parse balance by decimal
        const parsedBalance = balance
            ? (BigInt(balance) / BigInt(10 ** decimal)).toString()
            : "0"

        console.log('the balance is:', parsedBalance)
        return parsedBalance
    } catch (error) {
        console.error('Error fetching token balance:', error)
        return null
    }
}