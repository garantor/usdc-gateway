import 'react-native-get-random-values'

import { createWalletClient, http, maxUint256, parseUnits, zeroAddress } from "viem";
import {addressToBytes32, randomBytesHex} from './utils'
import { mnemonicToAccount } from "viem/accounts";
import { avalancheFuji, baseSepolia } from "viem/chains";
import { getContract } from "viem";
import { Crypto } from '@peculiar/webcrypto'

// Polyfill global crypto if not present
if (typeof global.crypto === 'undefined') {
    global.crypto = new Crypto()
}



const depositAmount = parseUnits('5', 6) // 5 USDC with 6 decimals
const sourceGatewayWalletAddress = '0x0077777d7EBA4688BDeF3E311b846F25870A19B9'
const destinationMinterWalletAddress = '0x0022222ABE238Cc2C7Bb1f21003F0a260052475B'
const sourceTokenAddress = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'
const destinationTokenAddress = '0x036CbD53842c5426634e7929541eC2318f3dCF7e'
const userSourceAddress = '0x5b1039bcfe0fc4a527120aaa0d306c6eee31ea79'





// Construct burn intents
const ethereumBurnIntent = {
    maxBlockHeight: maxUint256,
    maxFee: parseUnits('3.01', 6), // 3.01 USDC with 6 decimals
    spec: {
        version: 1,
        sourceDomain: 0,
        destinationDomain: 6,
        sourceContract: sourceGatewayWalletAddress,
        destinationContract: destinationMinterWalletAddress,
        sourceToken: sourceTokenAddress,
        destinationToken: destinationTokenAddress,
        sourceDepositor: userSourceAddress,
        destinationRecipient: userSourceAddress,
        sourceSigner: userSourceAddress,
        destinationCaller: zeroAddress,
        value: depositAmount,
        salt: "0x" + randomBytesHex(32),
        hookData: "0x",
    },
};


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



// =============================================
const gatewayMinterAbi = [
    {
        type: "function",
        name: "gatewayMint",
        inputs: [
            {
                name: "attestationPayload",
                type: "bytes",
                internalType: "bytes",
            },
            {
                name: "signature",
                type: "bytes",
                internalType: "bytes",
            },
        ],
        outputs: [],
        stateMutability: "nonpayable",
    },
];


function burnIntentTypedData(burnIntent:any) {
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


export async function sendUnifiedTransferToCircle(ethereumRequest: any) {
    
    const request = [ethereumRequest];

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

export async function signTransactionTx(signerMnemonic: any) {
    const account = mnemonicToAccount(signerMnemonic);
    console.log('the account ', account)

    const ethereumTypedData:any = burnIntentTypedData(ethereumBurnIntent);
    const ethereumSignature = await account.signTypedData(ethereumTypedData);
    const ethereumRequest = {
        burnIntent: ethereumTypedData.message,
        signature: ethereumSignature,
    };
    let sending = await sendUnifiedTransferToCircle(ethereumRequest);
    console.log('the signed request ', sending)
    return sending


}







export async function createDestinationChainDeposit(signerMnemonic:any, destinationChainRpc:string) {
    const account = mnemonicToAccount(signerMnemonic);
    console.log('the account ', account)
    const baseClient = createWalletClient({
        chain: baseSepolia,
        account,
        transport: http(destinationChainRpc),
    });

    const { attestation, signature } = await signTransactionTx(signerMnemonic);

    console.log('the attestation and signature ', attestation, signature)


    const avalancheGatewayMinterContract = getContract({
        address: destinationMinterWalletAddress,
        abi: gatewayMinterAbi,
        client: baseClient,
    });

    console.log('the contract ', avalancheGatewayMinterContract)
    const mintTx = await avalancheGatewayMinterContract.write.gatewayMint([
        attestation as any,
        signature,
    ]);

    console.log('the contract mintTx ', mintTx)
    return mintTx;
}



