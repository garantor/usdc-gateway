import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'
import { erc20BalanceAbi } from './abis'
import { pad } from "viem";



function randomBytesWeb(size: number): Uint8Array {
    const arr = new Uint8Array(size);
    crypto.getRandomValues(arr);
    return arr;
}

// Helper to get hex string
export function randomBytesHex(size: number): string {
    return Array.from(randomBytesWeb(size))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}
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
        return "0"
    }
}




export function addressToBytes32(address: any) {
    return pad(address.toLowerCase(), { size: 32 });
}


