import { useCallback } from 'react'
import { english, generateMnemonic } from 'viem/accounts'
import { HDNodeWallet, Wallet, ethers } from 'ethers'

export function useCreateMnemonic() {
    // Encrypts a newly generated mnemonic with a password, returns encrypted JSON string
    const encryptMnemonic = useCallback(
        async (password: string): Promise<string> => {
            try {
                const mnemonic = generateMnemonic(english, 256)
                const wallet = HDNodeWallet.fromPhrase(mnemonic)
                const encryptedJson = await wallet.encrypt(password)
                return encryptedJson
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Unknown error'
                throw new Error(`Encryption failed: ${message}`)
            }
        },
        []
    )

    // Decrypts an encrypted JSON string with a password, returns Wallet instance
    const decryptMnemonic = useCallback(
        async (encryptedJson: string, password: string): Promise<HDNodeWallet| Wallet> => {
            try {
                const wallet = await Wallet.fromEncryptedJson(encryptedJson, password)
                return wallet
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Unknown error'
                throw new Error(`Decryption failed: ${message}`)
            }
        },
        []
    )

    return { encryptMnemonic, decryptMnemonic }
}