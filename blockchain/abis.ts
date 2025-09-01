import { erc20Abi } from "viem";

export const erc20BalanceAbi = erc20Abi;

export const gatewayWalletAbi = [
    {
        type: "function",
        name: "deposit",
        inputs: [
            {
                name: "token",
                type: "address",
                internalType: "address",
            },
            {
                name: "value",
                type: "uint256",
                internalType: "uint256",
            },
        ],
        outputs: [],
        stateMutability: "nonpayable",
    },
];

export const unifiedWalletAbi = [
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
