import { createWalletClient, http, maxUint256, zeroAddress } from "viem";
import {addressToBytes32, randomBytesHex} from './utils'
import { mnemonicToAccount } from "viem/accounts";
import { avalancheFuji } from "viem/chains";
import { getContract } from "viem";



const depositAmount = 5_000000n
const sourceGatewayWalletAddress = '0x0077777d7EBA4688BDeF3E311b846F25870A19B9'
const destinationMinterWalletAddress = '0x0022222ABE238Cc2C7Bb1f21003F0a260052475B'
const sourceTokenAddress = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'
const destinationTokenAddress = '0x5425890298aed601595a70ab815c96711a31bc65'
const userSourceAddress = '0x5b1039bcfe0fc4a527120aaa0d306c6eee31ea79'





// Construct burn intents
const ethereumBurnIntent = {
    maxBlockHeight: maxUint256,
    maxFee: 3_010000n,
    spec: {
        version: 1,
        sourceDomain: 0,
        destinationDomain: 1,
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


    // console.log('the intents are ', intents)
    // const request = [intents.ethereumRequest, {
    //     baseRequest: {
    //         burnIntent: intents.burnIntent,
    //         signature: intents.signature,
    //     }
    // }];
    // console.log('request ', request)

    // const response = await fetch(
    //     "https://gateway-api-testnet.circle.com/v1/transfer",
    //     {
    //         method: "POST",
    //         headers: { "Content-Type": "application/json" },
    //         body: JSON.stringify(request, (_key, value) =>
    //             typeof value === "bigint" ? value.toString() : value,
    //         ),
    //     },
    // );

    // const json = await response.json();

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

    // const baseTypedData:any = burnIntentTypedData(baseBurnIntent);
    // const baseSignature = await account.signTypedData(baseTypedData);
    // const baseRequest = {
    //     burnIntent: baseTypedData.message,
    //     signature: baseSignature,
    // };

    // console.log('the base request ', baseRequest);
    let sending = await sendUnifiedTransferToCircle(ethereumRequest);
    console.log('the signed request ', sending)
    return sending


}






export async function createAvalancheDeposit(signerMnemonic:any, rpcString:string) {
    const account = mnemonicToAccount(signerMnemonic);
    console.log('the account ', account)
    const avalancheClient = createWalletClient({
        chain: avalancheFuji,
        account,
        transport: http(rpcString)
    });

    const { attestation, signature } = await signTransactionTx(signerMnemonic);

    console.log('the attestation and signature ', attestation, signature)

    // let attestation = "0xff6fb3340000000000000000000000000000000000000000000000000000000002b6cdaa00000154ca85def70000000100000000000000010000000000000000000000000077777d7eba4688bdef3e311b846f25870a19b90000000000000000000000000022222abe238cc2c7bb1f21003f0a260052475b0000000000000000000000001c7d4b196cb0c7b01d743fbc6116a902379c72380000000000000000000000005425890298aed601595a70ab815c96711a31bc650000000000000000000000005b1039bcfe0fc4a527120aaa0d306c6eee31ea790000000000000000000000005b1039bcfe0fc4a527120aaa0d306c6eee31ea790000000000000000000000005b1039bcfe0fc4a527120aaa0d306c6eee31ea79000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004c4b4096ffe3bb4845892626297f96a6c00731e21f207946b61758f16d1380fcac4c6300000000";

    // let signature = "0x1f1b2e2729421f9aa080ce87130eb97f441cc82e296b13ef224b6e0a3f3d29ae58ee943954be4c8665b216f84df82847f27841adbe2c899918f60cc7b5eeb14d1b"

    const avalancheGatewayMinterContract = getContract({
        address: destinationMinterWalletAddress,
        abi: gatewayMinterAbi,
        client: avalancheClient,
    });
    const mintTx = await avalancheGatewayMinterContract.write.gatewayMint([
        attestation as any,
        signature,
    ]);

    console.log('the contract mintTx ', mintTx)
    return mintTx;
}












// function createBurnIntent(destinationMinterWalletAddress: string, sourceGatewayWalletAddress: string, sourceTokenAddress: any, destinationTokenAddress: string, depositorAddress: any, recipientAddress: any, sourceSignerAddress: any, depositAmount: BigInt) {
//     const baseBurnIntent = {
//         maxBlockHeight: maxUint256,
//         maxFee: 1_010000n,
//         spec: {
//             version: 1,
//             sourceDomain: 6,
//             destinationDomain: 1,
//             sourceContract: sourceGatewayWalletAddress,
//             destinationContract: destinationMinterWalletAddress,
//             sourceToken: sourceTokenAddress,
//             destinationToken: destinationTokenAddress,
//             sourceDepositor: depositorAddress,
//             destinationRecipient: recipientAddress,
//             sourceSigner: sourceSignerAddress,
//             destinationCaller: zeroAddress,
//             value: depositAmount,
//             salt: "0x" + randomBytesHex(32),
//             hookData: "0x",
//         },
//     };

//     return baseBurnIntent

// }


// function createEthereumIntent(sourceGatewayWalletAddress: string, destinationMinterWalletAddress: string, sourceTokenAddress: any, destinationTokenAddress: string, sourceDepositorAddress: any, recipientAddress: any, sourceSignerAddress: any, depositAmount: BigInt) {
//     const ethereumBurnIntent = {
//         maxBlockHeight: maxUint256,
//         maxFee: 1_010000n,
//         spec: {
//             version: 1,
//             sourceDomain: 0,
//             destinationDomain: 1,
//             sourceContract: sourceGatewayWalletAddress,
//             destinationContract: destinationMinterWalletAddress,
//             sourceToken: sourceTokenAddress,
//             destinationToken: destinationTokenAddress,
//             sourceDepositor: sourceDepositorAddress,
//             destinationRecipient: recipientAddress,
//             sourceSigner: sourceSignerAddress,
//             destinationCaller: zeroAddress,
//             value: depositAmount,
//             salt: "0x" + randomBytesHex(32),
//             hookData: "0x",
//         },
//     };

//     return ethereumBurnIntent;

// }

// export async function createUnifiedDepositIntent(
//     signerMnemonic: any,
//     depositorAddress: any,
//     recipientAddress: any,
//     chain: Chain,
//     rpcString: string,
//     depositAmount: bigint = 5_000000n,
//     sourceGatewayWalletAddress: string = '0x0077777d7EBA4688BDeF3E311b846F25870A19B9',
//     destinationMinterWalletAddress: string = '0x0022222ABE238Cc2C7Bb1f21003F0a260052475B',
//     sourceTokenAddress: string = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
//     destinationTokenAddress: string = '0x5425890298aed601595a70ab815c96711a31bc65'
// ) {
//     const account = mnemonicToAccount(signerMnemonic);
//     console.log('the account ', account)

//     const walletClient = createWalletClient({
//         chain: chain,
//         transport: http(rpcString),
//         account: account,
//     }).extend(publicActions)

//     const ethereumTypedData: any = burnIntentTypedData(
//         createEthereumIntent(
//             sourceGatewayWalletAddress,
//             destinationMinterWalletAddress,
//             sourceTokenAddress,
//             destinationTokenAddress,
//             depositorAddress,
//             recipientAddress,
//             account.address,
//             depositAmount
//         )
//     );
//     const ethereumSignature = await account.signTypedData(ethereumTypedData);
//     const ethereumRequest = {
//         burnIntent: ethereumTypedData.message,
//         signature: ethereumSignature,
//     };

//     const baseTypedData: any = burnIntentTypedData(
//         createBurnIntent(
//             destinationMinterWalletAddress,
//             sourceGatewayWalletAddress,
//             sourceTokenAddress,
//             destinationTokenAddress,
//             depositorAddress,
//             recipientAddress,
//             account.address,
//             depositAmount
//         )
//     );
//     const baseSignature = await account.signTypedData(baseTypedData);
//     const baseRequest = {
//         burnIntent: baseTypedData.message,
//         signature: baseSignature,
//         ethereumRequest: ethereumRequest,
//     };

//     console.log('the signed typed data ', baseRequest)
//     return baseRequest;
// }


// export async function sendUnifiedTransferToCircle(intents:any) {
//     console.log('the intents are ', intents)
//     const request = [intents.ethereumRequest, { baseRequest: {
//         burnIntent: intents.burnIntent,
//         signature: intents.signature,
//     }}];
//     console.log('request ', request)

//     const response = await fetch(
//         "https://gateway-api-testnet.circle.com/v1/transfer",
//         {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify(request, (_key, value) =>
//                 typeof value === "bigint" ? value.toString() : value,
//             ),
//         },
//     );

//     const json = await response.json();

//     console.log('the response from circle is ', json)
//     return json;

// }