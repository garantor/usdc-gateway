import 'react-native-get-random-values'
import { Address, Chain, createWalletClient, erc20Abi, HDAccount, http, maxUint256, parseUnits, publicActions, zeroAddress } from "viem";
import { addressToBytes32, randomBytesHex } from './utils'
import { mnemonicToAccount } from "viem/accounts";
import { getContract } from "viem";
import { Crypto } from '@peculiar/webcrypto'
import { gatewayWalletAbi } from './abis';


interface iChainReqConfig {
    tokenContractAddress: string,
    rpcUrl: string,
    chainId: number | null,
    domainChainId: number,
    userAddress: string

}
// Polyfill global crypto if not present
if (typeof global.crypto === 'undefined') {
    global.crypto = new Crypto()
}

export default class CircleGatewayTransaction {
    private depositAmount = parseUnits('5', 6) // 5 USDC with 6 decimals
    // ================================DEFAULT VALUES FOR TESTNETS================================
    private sourceGatewayWalletAddress:Address = '0x0077777d7EBA4688BDeF3E311b846F25870A19B9' // gateway address are the same across all chains
    private destinationMinterWalletAddress: Address = '0x0022222ABE238Cc2C7Bb1f21003F0a260052475B' // minter address are the same across all chains#

    private sourceTokenAddress = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'
    private destinationTokenAddress = '0x036CbD53842c5426634e7929541eC2318f3dCF7e'

    private sourceRpc = ''
    private destinationRpc = ''
    private circleAttestationApi = 'https://gateway-api-testnet.circle.com/v1/'

    private domain = { name: "GatewayWallet", version: "1" }
    private EIP712Domain = [
        { name: "name", type: "string" },
        { name: "version", type: "string" },
    ]
    private TransferSpec = [
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
    ]
    private BurnIntent = [
        { name: "maxBlockHeight", type: "uint256" },
        { name: "maxFee", type: "uint256" },
        { name: "spec", type: "TransferSpec" },
    ]

    private gatewayMinterAbi = [
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
    ]

    constructor(sourceRpc:string, destinationRpc:string) {
        this.sourceRpc = sourceRpc
        this.destinationRpc = destinationRpc
     }

    private getBurnIntent(userAccount: HDAccount, sourceDomain: iChainReqConfig, destinationDomain: iChainReqConfig, depositAmount: bigint = this.depositAmount) {
        return {
            maxBlockHeight: maxUint256,
            maxFee: parseUnits('3.01', 6), // 3.01 USDC with 6 decimals
            spec: {
                version: 1,
                sourceDomain: sourceDomain.domainChainId,
                destinationDomain: destinationDomain.domainChainId,
                sourceContract: this.sourceGatewayWalletAddress,
                destinationContract: this.destinationMinterWalletAddress,

                sourceToken: sourceDomain.tokenContractAddress,
                destinationToken: destinationDomain.tokenContractAddress,
                sourceDepositor: userAccount.address,
                destinationRecipient: userAccount.address,
                sourceSigner: userAccount.address,
                destinationCaller: zeroAddress, // can be zero address if not relaying on destination chain
                value: depositAmount,
                salt: "0x" + randomBytesHex(32),
                hookData: "0x", // optional data that can be used in hooks
            },
        }
    }

    private burnIntentTypedData(burnIntent: any) {
        return {
            types: { EIP712Domain: this.EIP712Domain, TransferSpec: this.TransferSpec, BurnIntent: this.BurnIntent },
            domain: this.domain,
            primaryType: "BurnIntent",
            message: {
                ...burnIntent,
                spec: {
                    ...burnIntent.spec,
                    sourceContract: addressToBytes32(burnIntent.spec.sourceContract),
                    destinationContract: addressToBytes32(burnIntent.spec.destinationContract),
                    sourceToken: addressToBytes32(burnIntent.spec.sourceToken),
                    destinationToken: addressToBytes32(burnIntent.spec.destinationToken),
                    sourceDepositor: addressToBytes32(burnIntent.spec.sourceDepositor),
                    destinationRecipient: addressToBytes32(burnIntent.spec.destinationRecipient),
                    sourceSigner: addressToBytes32(burnIntent.spec.sourceSigner),
                    destinationCaller: addressToBytes32(burnIntent.spec.destinationCaller ?? zeroAddress),
                },
            },
        }
    }

    /**
     * Deposit USDC to Circle via the Gateway API.
     * @param signerMnemonic - The mnemonic phrase of the signer.
     * @returns The response from Circle's API.
     */
    private async getAttestation(userAccount:HDAccount, usdcSourceDomainId:number, usdcDestinationDomainId:number, depositAmount: bigint) {
        
        let sourceChainDomain: iChainReqConfig = {
            tokenContractAddress: this.sourceTokenAddress,
            rpcUrl: this.sourceRpc,
            chainId: null,
            domainChainId: usdcSourceDomainId, // Sepolia domain chain id
            userAddress: userAccount.address
        }
        let destinationChainDomain: iChainReqConfig = {
            tokenContractAddress: this.destinationTokenAddress,
            rpcUrl: this.destinationRpc,
            chainId: null,
            domainChainId: usdcDestinationDomainId, // Avalanche Fuji domain chain id
            userAddress: userAccount.address
        }
        const burnIntent = this.getBurnIntent(userAccount, sourceChainDomain, destinationChainDomain, depositAmount)
        const typedData: any = this.burnIntentTypedData(burnIntent)
        const signature = await userAccount.signTypedData(typedData)
        const request = {
            burnIntent: typedData.message,
            signature: signature,
        }

        let url = `${this.circleAttestationApi}/transfer`
        const response = await fetch(
            url,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify([request], (_key, value) =>
                    typeof value === "bigint" ? value.toString() : value,
                ),
            },
        )
        const json = await response.json()
        return json
    }


    public async getUserGatewayBalance(usdcDomainId:number, userAddress:Address) {
        let url = `${this.circleAttestationApi}/balances`

        const options = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                token: 'USDC',
                sources: [{ domain: usdcDomainId, depositor: userAddress }]
            })
        };

        let response = await fetch(url, options)
        if(response.status === 200){
            let json = await response.json()
            return json

        } else {
            const errorText = await response.text();
            throw new Error(errorText);
        }

          
        
    }


    /**
     * createGateWayDeposit - Deposit into Circle gateway wallet address
     * @param userMnemonic - the signer mnemonic
     * @param depositAmount - amount to send to the gateway wallet
     * @param depositChain - the chain that holds the user active usdc balance
     * @param sourceUsdcAddress - the usdc contract address on the source/originating chain
     * 
     */
    public async createGateWayDeposit(userMnemonic:string, depositAmount:bigint, depositChain:Chain, sourceUsdcAddress:Address) {
        const account = mnemonicToAccount(userMnemonic);
            console.log('the account ', account)        
            const walletClient = createWalletClient({
                chain: depositChain,
                transport: http(this.sourceRpc),
                account: account,
            }).extend(publicActions)
        
        const usdc: any = getContract({ address: sourceUsdcAddress, abi: erc20Abi, client: walletClient });
            const gatewayWallet = getContract({
                address: this.sourceGatewayWalletAddress,
                abi: gatewayWalletAbi,
                client: walletClient,
            });
        
            const approvalTx = await usdc.write.approve([
                gatewayWallet.address,
                depositAmount,
            ]);
            console.log('========================= Approval Tx Successful =================================')
        
            console.log('approvalTx:', approvalTx);
        
            let approvalReceipt = await walletClient.waitForTransactionReceipt({ hash: approvalTx });
            console.log('approvalReceipt:', approvalReceipt);
            // return approvalReceipt
        
        
            const depositTx = await gatewayWallet.write.deposit([
                usdc.address,
                depositAmount,
            ]);
            console.log('depositTx:', depositTx);
            let depositReceipt = await walletClient.waitForTransactionReceipt({ hash: depositTx });
            console.log('depositReceipt:', depositReceipt);
            console.log('================================Gateway Deposit Successful==========================')
            return depositReceipt;
        
    }

    /**
     * Mint USDC on the destination chain after Circle attestation.
     * @param signerMnemonic - The mnemonic phrase of the signer.
     * @param usdcSourceDomainId - The domain ID of the source chain.
     * @param usdcDestinationDomainId - The domain ID of the destination chain.
     * @param destinationChain - The destination chain object.
     * @param depositAmount - The amount to mint (in smallest units, default is this.depositAmount).
     * @returns The transaction hash of the mint operation.
     */
    public async destinationChainDeposit(
        signerMnemonic: string,
        usdcSourceDomainId: number,
        usdcDestinationDomainId: number,
        destinationChain: Chain,
        depositAmount: bigint = this.depositAmount
    ) {
        // Create account from mnemonic
        const account = mnemonicToAccount(signerMnemonic);

        // Fetch user's gateway balance from Circle API
        let balance = await this.getUserGatewayBalance(usdcSourceDomainId, account.address);

        // Convert balance string (e.g. "11.998950") to bigint (e.g. 11998950n) using 6 decimals for USDC
        const balanceValue: bigint = parseUnits(balance.balances[0].balance, 6);

        console.log('the balance value is ', balanceValue, ' and deposit amount is ', depositAmount);

        // Check if user has sufficient balance to mint
        if (balance && balance.balances[0].balance && balanceValue >= depositAmount) {

            // Get attestation and signature from Circle API
            let { attestation, signature } = await this.getAttestation(
                account,
                usdcSourceDomainId,
                usdcDestinationDomainId,
                depositAmount
            );
            console.log('the attestation and signature ', attestation, signature);

            // Create wallet client for destination chain
            const baseClient = createWalletClient({
                chain: destinationChain,
                account,
                transport: http(this.destinationRpc)
            });

            // Get minter contract instance
            const minterContract = getContract({
                address: this.destinationMinterWalletAddress,
                abi: this.gatewayMinterAbi,
                client: baseClient,
            });

            // Call gatewayMint on the minter contract with attestation and signature
            const mintTx = await minterContract.write.gatewayMint([
                attestation as any,
                signature,
            ]);
            return mintTx;

        } else {
            // Throw error if insufficient balance
            throw new Error('Insufficient balance in gateway wallet. Please deposit more USDC to the gateway wallet before minting on the destination chain.');
        }
    }
}