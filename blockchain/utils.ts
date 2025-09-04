import { Chain, createPublicClient, erc20Abi, getContract, http, createWalletClient, publicActions, maxUint256, zeroAddress } from 'viem'
import { mainnet } from 'viem/chains'
import { erc20BalanceAbi, gatewayWalletAbi } from './abis'
import {  mnemonicToAccount } from 'viem/accounts'
import { pad } from "viem";


const domain = { name: "GatewayWallet", version: "1" };

const EIP712Domain = [
    { name: "name", type: "string" },
    { name: "version", type: "string" },
];

const TransferSpec = [
    { name: "version", type: "uint32" },
    { name: "sourceDomain", type: "uint32" },
    { name: "destinationDomain", type: "uint32" },
    { name: "sourceContract", type: "bytes32" },
    { name: "destinationContract", type: "bytes32" },
    { name: "sourceToken", type: "bytes32" },
    { name: "destinationToken", type: "bytes32" },
    { name: "sourceDepositor", type: "bytes32" },
    { name: "destinationRecipient", type: "bytes32" },
    { name: "sourceSigner", type: "bytes32" },
    { name: "destinationCaller", type: "bytes32" },
    { name: "value", type: "uint256" },
    { name: "salt", type: "bytes32" },
    { name: "hookData", type: "bytes" },
];

const BurnIntent = [
    { name: "maxBlockHeight", type: "uint256" },
    { name: "maxFee", type: "uint256" },
    { name: "spec", type: "TransferSpec" },
];


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


export async function depositToGateWay(signerPriKey: any, chain: Chain, rpcString: string) {
    // Contract addresses on Ethereum Sepolia
    const gatewayWalletAddress = "0x0077777d7EBA4688BDeF3E311b846F25870A19B9";
    const usdcAddress = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

    const DEPOSIT_AMOUNT = 5_000000n; // 5 USDC
    console.log('mnemonic ', signerPriKey)
    const account = mnemonicToAccount(signerPriKey);
    console.log('the account ', account)

    // const client = createPublicClient({
    //     chain: chain,
    //     transport: http(rpcString),
    // });

    const walletClient = createWalletClient({
        chain: chain,
        transport: http(rpcString),
        account: account,
    }).extend(publicActions)

    const usdc: any = getContract({ address: usdcAddress, abi: erc20Abi, client: walletClient });
    const gatewayWallet = getContract({
        address: gatewayWalletAddress,
        abi: gatewayWalletAbi,
        client: walletClient,
    });

    const approvalTx = await usdc.write.approve([
        gatewayWallet.address,
        DEPOSIT_AMOUNT,
    ]);

    console.log('approvalTx:', approvalTx);

    let approvalReceipt = await walletClient.waitForTransactionReceipt({ hash: approvalTx });
    console.log('approvalReceipt:', approvalReceipt);
    // return approvalReceipt


    const depositTx = await gatewayWallet.write.deposit([
        usdc.address,
        DEPOSIT_AMOUNT,
    ]);
    console.log('depositTx:', depositTx);
    let depositReceipt = await walletClient.waitForTransactionReceipt({ hash: depositTx });
    console.log('depositReceipt:', depositReceipt);
    return depositReceipt;
}


export function addressToBytes32(address: any) {
    return pad(address.toLowerCase(), { size: 32 });
}



function createEthereumIntent(sourceGatewayWalletAddress: string, destinationMinterWalletAddress: string, sourceTokenAddress: any, destinationTokenAddress: string, sourceDepositorAddress: any, recipientAddress: any, sourceSignerAddress: any, depositAmount: BigInt) {
    const ethereumBurnIntent = {
        maxBlockHeight: maxUint256,
        maxFee: 1_010000n,
        spec: {
            version: 1,
            sourceDomain: 0,
            destinationDomain: 1,
            sourceContract: sourceGatewayWalletAddress,
            destinationContract: destinationMinterWalletAddress,
            sourceToken: sourceTokenAddress,
            destinationToken: destinationTokenAddress,
            sourceDepositor: sourceDepositorAddress,
            destinationRecipient: recipientAddress,
            sourceSigner: sourceSignerAddress,
            destinationCaller: zeroAddress,
            value: depositAmount,
            salt: "0x" + randomBytesHex(32),
            hookData: "0x",
        },
    };

    return ethereumBurnIntent;

}

function burnIntentTypedData(burnIntent: any) {
    return {
        types: { EIP712Domain, TransferSpec, BurnIntent },
        domain,
        primaryType: "BurnIntent",
        message: {
            ...burnIntent,
            spec: {
                ...burnIntent.spec,
                sourceContract: addressToBytes32(burnIntent.spec.sourceContract),
                destinationContract: addressToBytes32(
                    burnIntent.spec.destinationContract,
                ),
                sourceToken: addressToBytes32(burnIntent.spec.sourceToken),
                destinationToken: addressToBytes32(burnIntent.spec.destinationToken),
                sourceDepositor: addressToBytes32(burnIntent.spec.sourceDepositor),
                destinationRecipient: addressToBytes32(
                    burnIntent.spec.destinationRecipient,
                ),
                sourceSigner: addressToBytes32(burnIntent.spec.sourceSigner),
                destinationCaller: addressToBytes32(
                    burnIntent.spec.destinationCaller ?? zeroAddress,
                ),
            },
        },
    };
}


function createBurnIntent(destinationMinterWalletAddress: string, sourceGatewayWalletAddress: string, sourceTokenAddress: any, destinationTokenAddress: string, depositorAddress: any, recipientAddress: any, sourceSignerAddress: any, depositAmount: BigInt) {
    const baseBurnIntent = {
        maxBlockHeight: maxUint256,
        maxFee: 1_010000n,
        spec: {
            version: 1,
            sourceDomain: 6,
            destinationDomain: 1,
            sourceContract: sourceGatewayWalletAddress,
            destinationContract: destinationMinterWalletAddress,
            sourceToken: sourceTokenAddress,
            destinationToken: destinationTokenAddress,
            sourceDepositor: depositorAddress,
            destinationRecipient: recipientAddress,
            sourceSigner: sourceSignerAddress,
            destinationCaller: zeroAddress,
            value: depositAmount,
            salt: "0x" + randomBytesHex(32),
            hookData: "0x",
        },
    };

    return baseBurnIntent

}

export async function createUnifiedDepositIntent(
    signerMnemonic: any,
    depositorAddress: any,
    recipientAddress: any,
    chain: Chain,
    rpcString: string,
    depositAmount: bigint = 5_000000n,
    sourceGatewayWalletAddress: string = '0x0077777d7EBA4688BDeF3E311b846F25870A19B9',
    destinationMinterWalletAddress: string = '0x0022222ABE238Cc2C7Bb1f21003F0a260052475B',
    sourceTokenAddress: string = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    destinationTokenAddress: string = '0x5425890298aed601595a70ab815c96711a31bc65'
) {
    const account = mnemonicToAccount(signerMnemonic);
    console.log('the account ', account)

    const walletClient = createWalletClient({
        chain: chain,
        transport: http(rpcString),
        account: account,
    }).extend(publicActions)

    const ethereumTypedData: any = burnIntentTypedData(
        createEthereumIntent(
            sourceGatewayWalletAddress,
            destinationMinterWalletAddress,
            sourceTokenAddress,
            destinationTokenAddress,
            depositorAddress,
            recipientAddress,
            account.address,
            depositAmount
        )
    );
    const ethereumSignature = await account.signTypedData(ethereumTypedData);
    const ethereumRequest = {
        burnIntent: ethereumTypedData.message,
        signature: ethereumSignature,
    };

    const baseTypedData: any = burnIntentTypedData(
        createBurnIntent(
            destinationMinterWalletAddress,
            sourceGatewayWalletAddress,
            sourceTokenAddress,
            destinationTokenAddress,
            depositorAddress,
            recipientAddress,
            account.address,
            depositAmount
        )
    );
    const baseSignature = await account.signTypedData(baseTypedData);
    const baseRequest = {
        burnIntent: baseTypedData.message,
        signature: baseSignature,
        ethereumRequest: ethereumRequest,
    };

    console.log('the signed typed data ', baseRequest)
    return baseRequest;
}


export async function sendUnifiedTransferToCircle(intents:any) {
    console.log('the intents are ', intents)
    const request = [intents.ethereumRequest, { baseRequest: {
        burnIntent: intents.burnIntent,
        signature: intents.signature,
    }}];
    console.log('request ', request)

    const response = await fetch(
        "https://gateway-api-testnet.circle.com/v1/transfer",
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(request, (_key, value) =>
                typeof value === "bigint" ? value.toString() : value,
            ),
        },
    );

    const json = await response.json();

    console.log('the response from circle is ', json)
    return json;

}