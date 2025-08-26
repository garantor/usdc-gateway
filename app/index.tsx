import { ThemedText } from '@/components/ThemedText'
import { ThemedView } from '@/components/ThemedView'
import React from 'react'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'
import { GenericIconButton } from '@/components/GenericButton'
import { useTheme } from '@ui-kitten/components'
import { useCreateMnemonic } from '@/hooks/useCreateKeypair'
import { BalanceCard } from '@/components/ui/BalanceCard'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { useRouter } from 'expo-router'


console.log('PUBLIC_EXPORT_ALCHEMY_API_KEY ', process.env.EXPO_PUBLIC_ALCHEMY_API_KEY)
export default function Gateway() {
    const theme = useTheme()
    const [loading, setLoading] = React.useState(false)
    const { encryptMnemonic, decryptMnemonic } = useCreateMnemonic()
    const { getItem, setItem } = useLocalStorage('USDC-Gateway')
    let router = useRouter()

    async function handleSecureSignUp() {
        setLoading(true)
       
        console.log("Starting secure authentication...")
        let encryptedMnemonic = await encryptMnemonic("testpassword")
        console.log('mnemonic ', encryptedMnemonic)
        setItem(JSON.stringify({ mnemonic: encryptedMnemonic }))
        setLoading(false)
       
        router.push({
            pathname: '/gateway',
            params: { address: '0x' + JSON.parse(encryptedMnemonic)?.address }
        })


    }


   

    return (
        <ThemedView style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: theme['background-basic-color-1'],
            padding: 0,
        }}>
            <ThemedText style={{
                fontSize: 32,
                fontWeight: 'bold',
                color: theme['text-basic-color'],
                marginBottom: 8,
                letterSpacing: 2,
            }}>
                USDC Gateway
            </ThemedText>
            <ThemedText style={{
                fontSize: 16,
                color: theme['text-hint-color'],
                marginBottom: 32,
                textAlign: 'center',
                maxWidth: 300,
            }}>
                Securely access your digital assets with passkey authentication.
            </ThemedText>
            <ThemedView style={{
                backgroundColor: theme['background-basic-color-2'],
                padding: 32,
                borderRadius: 20,
                shadowColor: theme['color-basic-900'],
                shadowOpacity: 0.2,
                shadowRadius: 12,
                elevation: 8,
                alignItems: 'center',
                width: 340,
            }}>
                <GenericIconButton
                    style={{
                        minWidth: 240,
                        marginTop: 0,
                        marginBottom: 18,
                        backgroundColor: theme['color-primary-500'],
                        borderRadius: 10,
                    }}
                    icon={<FontAwesome5 name="key" size={22} color={theme['text-control-color']} />}
                    onPress={() => handleSecureSignUp()}
                    title='Sign Up with Passkey'
                    loading={loading}

                />
                <GenericIconButton
                    style={{
                        minWidth: 240,
                        marginTop: 0,
                        backgroundColor: theme['color-success-500'],
                        borderRadius: 10,
                    }}
                    icon={<FontAwesome5 name="sign-in-alt" size={22} color={theme['text-control-color']} />}
                    title='Login with Passkey'
                    loading={loading}
                    onPress={() => {}}

                />
                <ThemedText style={{
                    marginTop: 28,
                    color: theme['text-hint-color'],
                    fontSize: 13,
                    textAlign: 'center',
                }}>
                    Your credentials are never stored. Passkey login is private and secure.
                </ThemedText>
            </ThemedView>

            {/* <BalanceCard
                walletAddress="0x1234...abcd"
                network="Ethereum Mainnet"
                balance="1,250.00"
                tokenSymbol="USDC"
                // avatarUrl="https://i.pravatar.cc/48?u=wallet"
                // extraInfo={
                //     <ThemedText type="subtitle" style={{ color: '#4caf50' }}>
                //         Verified Account
                //     </ThemedText>
                // }
            /> */}
        </ThemedView>
    )
}