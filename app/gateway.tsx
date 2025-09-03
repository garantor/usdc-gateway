import { ThemedText } from '@/components/ThemedText'
import { ThemedView } from '@/components/ThemedView'
import { BalanceCard } from '@/components/ui/BalanceCard'
import React, { useEffect, useState } from 'react'
import { useTheme } from '@ui-kitten/components'
import { useLocalSearchParams } from 'expo-router'
import { getSupportedEvmChains, LOCAL_STORAGE_KEY } from '@/config'
import { TouchableOpacity, StyleSheet } from 'react-native'
import { SelectItem } from '@/components/SelectItem'
import AntDesign from '@expo/vector-icons/AntDesign'
import { createUnifiedDepositIntent, depositToGateWay, sendUnifiedTransferToCircle } from '@/blockchain/utils'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { useCreateMnemonic } from '@/hooks/useCreateKeypair'
import * as chainsConfig from 'viem/chains'
import { createAvalancheDeposit, signTransactionTx } from '@/blockchain/intents'
import { sendSmartAccountTransactions } from '@/blockchain/zerodevSmartAcct'
import { parseEther } from 'viem'



const CopyIcon = ({ color = "#888", size = 30 }) => (
    <AntDesign name="copy1" size={size} color={color} />
);


export default function Gateway() {
    const theme = useTheme()
    const address = useLocalSearchParams().address
    const { getItem } = useLocalStorage(LOCAL_STORAGE_KEY)
    const { decryptMnemonic } = useCreateMnemonic()

    const [wallets, setWallets] = useState<any[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [fromChain, setFromChain] = useState<string>('')
    const [toChain, setToChain] = useState<string>('')

    useEffect(() => {
        getWalletsInfo()
    }, [address])

    async function getWalletsInfo() {
        setLoading(true)
        let Wallets = await getSupportedEvmChains(address as string)
        setWallets(Wallets)
        setLoading(false)
    }

    const chainNames = wallets.map(w => w.network)
    const handleCopy = () => {
        if (navigator?.clipboard) {
            navigator.clipboard.writeText(wallets.length > 0 ? `${wallets[0].walletAddress}` : '');
        }
    };

    async function handleSendGateWayTx(fromChain: string, toChain: string) {
        console.log('Sending from', fromChain, 'to', toChain)
        // const fromChainIndex = wallets.findIndex(w => w.network === fromChain)
        // const toChainIndex = wallets.findIndex(w => w.network === toChain)
        let fromChainConfig: any = wallets.find(w => w.network === fromChain)
        let toChainConfig = wallets.find(w => w.network === toChain)
        let sourceChain = chainsConfig[fromChainConfig.network] as any

        console.log('fromChainIndex ', fromChainConfig, 'toChainIndex ', toChainConfig)
        console.log('the item stored ', JSON.parse(getItem()).mnemonic)
        let mnemonic = await decryptMnemonic(JSON.parse(getItem()).mnemonic, 'testpassword')
        console.log('the mnemonic is:', mnemonic, mnemonic?.mnemonic?.phrase, sourceChain)

        let zerodevAccount = await sendSmartAccountTransactions(mnemonic?.mnemonic?.phrase, wallets[0].rpcUrl, sourceChain, toChainConfig.walletAddress, parseEther('0.00001'), '0x')

        console.log('the zerodevAccount is:', zerodevAccount)

            // let walletPri = 
        // let gateWayTx = await depositToGateWay(mnemonic?.mnemonic?.phrase, sourceChain, wallets[0].rpcUrl)
        // console.log('the deposit recipt ', gateWayTx)
        // let intents = await signTransactionTx(mnemonic?.mnemonic?.phrase)
        // let intents = await createUnifiedDepositIntent(mnemonic?.mnemonic?.phrase, address, address, sourceChain, sourceChain?.rpcUrl, 5_000000n)
        // console.log('the intents ', intents)
        // let req = await sendUnifiedTransferToCircle(intents)
        // console.log('the req ', req)
        // Implement the logic to send the transaction

        // let destiDeposit = await createAvalancheDeposit(mnemonic?.mnemonic?.phrase, wallets[0].rpcUrl);
        // console.log('the destiDeposit ', destiDeposit)
    }

    return (
        <ThemedView
            style={{
                flex: 1,
                flexDirection: 'row',
                padding: 32,
                backgroundColor: theme['background-basic-color-1'],
                gap: 32,
                justifyContent: 'center',
            }}
        >
            {/* Left: User Balances */}
            <ThemedView style={{ marginRight: 0, minWidth: 320 }}>
                <ThemedText type="title" style={{ marginBottom: 24, maxWidth: 300 }}>
                    {console.log('wallets ', wallets, wallets[0])}
                    User Balances {wallets.length > 0 ? `for ${wallets[0].walletAddress}` : console.log('wallets ', wallets)}

                    <TouchableOpacity
                        onPress={handleCopy}
                    >
                        <CopyIcon color={theme['color-primary-500']} />
                    </TouchableOpacity>
                </ThemedText>
                {loading ? (
                    <ThemedText style={{ marginTop: 24 }}>
                        Loading balances...
                    </ThemedText>
                ) : wallets.length === 0 ? (
                    <ThemedText style={{ marginTop: 24 }}>
                        No wallets found.
                    </ThemedText>
                ) : (
                    wallets.map((wallet, idx) => (
                        <BalanceCard key={wallet.walletAddress + idx} {...wallet} />
                    ))
                )}
            </ThemedView>

            {/* Right: Chain Selection Card */}
            <ThemedView
                style={[
                    styles.card,
                    {
                        backgroundColor: theme['background-basic-color-2'],
                        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                        minWidth: 340,
                        maxWidth: 400,
                        maxHeight: 600,
                    },
                ]}
            >
                <ThemedText type="subtitle" style={{ marginBottom: 24, alignSelf: 'center' }}>
                    Send USDC Across Chains
                </ThemedText>
                <SelectItem
                    label="From Chain"
                    value={fromChain}
                    onChange={setFromChain}
                    options={chainNames}
                    id="fromChain"
                    disabledOptions={toChain ? [toChain] : []}
                />
                <SelectItem
                    label="To Chain"
                    value={toChain}
                    onChange={setToChain}
                    options={chainNames}
                    id="toChain"
                    disabledOptions={fromChain ? [fromChain] : []}
                />
                <TouchableOpacity
                    style={[
                        styles.continueButton,
                        {
                            backgroundColor: theme['color-primary-500'],
                            opacity:
                                !fromChain ||
                                    !toChain ||
                                    fromChain === toChain
                                    ? 0.5
                                    : 1,
                        },
                    ]}
                    disabled={
                        !fromChain ||
                        !toChain ||
                        fromChain === toChain
                    }
                    onPress={async () => await handleSendGateWayTx(fromChain, toChain)}
                >
                    <ThemedText type="defaultSemiBold" style={{ color: theme['text-control-color'] }}>
                        Continue
                    </ThemedText>
                </TouchableOpacity>
            </ThemedView>
        </ThemedView>
    )
}

const styles = StyleSheet.create({
    card: {
        flex: 1,
        borderRadius: 16,
        padding: 32,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
        minWidth: 320,
        maxWidth: 400,
    },
    continueButton: {
        marginTop: 24,
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 8,
        alignItems: 'center',
        width: '100%',
        fontSize: 18,
    },
})