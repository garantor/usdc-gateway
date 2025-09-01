import { ThemedText } from '@/components/ThemedText'
import { ThemedView } from '@/components/ThemedView'
import React, { useEffect } from 'react'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'
import { GenericIconButton } from '@/components/GenericButton'
import { useTheme } from '@ui-kitten/components'
import { useCreateMnemonic } from '@/hooks/useCreateKeypair'
import { BalanceCard } from '@/components/ui/BalanceCard'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { useRouter } from 'expo-router'
import { LoadingModal } from '@/components/ui/isLoading'
import { LOCAL_STORAGE_KEY } from '@/config'


console.log('PUBLIC_EXPORT_ALCHEMY_API_KEY ', process.env.EXPO_PUBLIC_ALCHEMY_API_KEY)
export default function Gateway() {
    const theme = useTheme()
    const [loading, setLoading] = React.useState(true)
    const { encryptMnemonic, decryptMnemonic } = useCreateMnemonic()
    const { getItem, setItem } = useLocalStorage(LOCAL_STORAGE_KEY)
    let router = useRouter()
    const [address, setAddress] = React.useState('')



    useEffect(() => {
        console.log('Effect ran')
        let data = JSON.parse(getItem())

        console.log('the date ', data)

        if (data !== null ) {
            let address = JSON.parse(data.mnemonic).address
            console.log('Data from storage: ', address)
            console.log('Found existing data, navigating to gateway...')
            setAddress('0x' + address)
        }
        setLoading(false)

    }, [])

    useEffect(() => {
        if (address) {
            console.log('Found existing address, navigating to gateway...')
            router.push({
                pathname: '/gateway',
                params: { address }
            })
        }
    }, [address])

    async function handleSecureSignUp() {
        setLoading(true)

        console.log("Starting secure authentication...")
        let encryptedMnemonic = await encryptMnemonic("testpassword")
        console.log('mnemonic ', encryptedMnemonic)
        setItem(JSON.stringify({ mnemonic: encryptedMnemonic }))
        setAddress('0x' + JSON.parse(encryptedMnemonic)?.address)
        setLoading(false)




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
                    onPress={() => { }}

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

            <LoadingModal
                visible={loading}
                onClose={() => setLoading(false)}
                header="Processing..."
                body="Please wait while we process your request."
            />
        </ThemedView>
    )
}