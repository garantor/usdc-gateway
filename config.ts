import { getTokenBalance } from "./blockchain/utils"

// Example USDC token contract addresses for each testnet
const USDC_ADDRESSES: Record<string, `0x${string}`> = {
    'Ethereum Sepolia': '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    'Avalanche Fuji': '0x5425890298aed601595a70AB815c96711a31Bc65',
    'Base Sepolia': '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
}

export async function getSupportedEvmChains(address: string) {
    const apiKey = process.env.EXPO_PUBLIC_ALCHEMY_API_KEY

    const chains = [
        {
            network: 'sepolia',
            rpcUrl: `https://eth-sepolia.g.alchemy.com/v2/${apiKey}`,
            walletAddress: address,
            tokenSymbol: 'USDC',
            decimal: 6,
            avatarUrl: 'https://i.pravatar.cc/48?u=wallet1',
            tokenAddress: USDC_ADDRESSES['Ethereum Sepolia'],
            
        },
        {
            network: 'baseSepolia',
            rpcUrl: `https://base-sepolia.g.alchemy.com/v2/${apiKey}`,
            walletAddress: address,
            tokenSymbol: 'USDC',
            decimal: 6,
            avatarUrl: 'https://i.pravatar.cc/48?u=wallet3',
            tokenAddress: USDC_ADDRESSES['Base Sepolia'],
        },
    ]

    // Fetch balances for each chain and return the list
    const chainsWithBalance = await Promise.all(
        chains.map(async (chain) => ({
            ...chain,
            balance: await getTokenBalance(
                chain.rpcUrl,
                chain.tokenAddress,
                chain.walletAddress as any,
                chain.decimal
            ),
        }))
    )

    return chainsWithBalance
}

export const LOCAL_STORAGE_KEY = 'USDC-Gateway'