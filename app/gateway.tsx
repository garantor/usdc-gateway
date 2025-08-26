import { ThemedText } from '@/components/ThemedText'
import { ThemedView } from '@/components/ThemedView'
import { BalanceCard } from '@/components/ui/BalanceCard'
import React, { useEffect } from 'react'
import { useTheme } from '@ui-kitten/components'
import { getTokenBalance } from '@/blockchain/utils'
import { useLocalSearchParams } from 'expo-router'
import { getSupportedEvmChains } from '@/config'

export default function Gateway() {
    const theme = useTheme();
    let address = useLocalSearchParams().address

    const [Wallets, setWallets] = React.useState<any[]>([])
    const [loading, setLoading] = React.useState<boolean>(true)
    console.log('address ', address)

    useEffect(() => {
        getWalletsInfo()
    }, [address])

    const rows = [];
    for (let i = 0; i < Wallets.length; i += 3) {
        rows.push(Wallets.slice(i, i + 3));
    }

    async function getWalletsInfo() {
        setLoading(true)
        let Wallets = await getSupportedEvmChains(address as string)
        setWallets(Wallets)
        setLoading(false)
    }

    return (
        <ThemedView style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 16,
            backgroundColor: theme['background-basic-color-1'],
        }}>
            <ThemedText type="title" style={{ marginBottom: 24, color: theme['text-basic-color'] }}>
                User Balances ({Wallets.length})
            </ThemedText>
            {loading ? (
                <ThemedText style={{ color: theme['text-basic-color'], marginTop: 24 }}>
                    Loading balances...
                </ThemedText>
            ) : Wallets.length === 0 ? (
                <ThemedText style={{ color: theme['text-basic-color'], marginTop: 24 }}>
                    No wallets found.
                </ThemedText>
            ) : (
                rows.map((row, rowIdx) => (
                    <ThemedView
                        key={rowIdx}
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'center',
                            marginBottom: 12,
                            backgroundColor: theme['background-basic-color-1'],
                        }}
                    >
                        {row.map((wallet, idx) => (
                            <BalanceCard key={wallet.walletAddress + idx} {...wallet} />
                        ))}
                    </ThemedView>
                ))
            )}
            </ThemedView>
    )}
