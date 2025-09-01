import React from 'react'
import { Modal, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native'
import { useTheme } from '@ui-kitten/components'
import { ThemedText } from '@/components/ThemedText'
import { ThemedView } from '@/components/ThemedView'

interface LoadingModalProps {
    visible: boolean
    onClose: () => void
    header?: string
    body?: string
}

export const LoadingModal: React.FC<LoadingModalProps> = ({
    visible,
    onClose,
    header = "Loading...",
    body = "Please wait while we process your request.",
}) => {
    const theme = useTheme()

    return (
        <Modal
            transparent
            animationType="fade"
            visible={visible}
            onRequestClose={onClose}
        >
            <ThemedView style={styles.overlay}>
                <ThemedView style={[styles.container, { backgroundColor: theme['background-basic-color-1'] }]}>
                    <ThemedText type="title" style={{ marginBottom: 8 }}>
                        {header}
                    </ThemedText>
                    <ActivityIndicator size="large" color={theme['color-primary-500']} style={{ marginVertical: 16 }} />
                    <ThemedText type="default" style={{ marginBottom: 16 }}>
                        {body}
                    </ThemedText>
                    <TouchableOpacity style={[styles.button, { backgroundColor: theme['color-primary-500'] }]} onPress={onClose}>
                        <ThemedText type="defaultSemiBold" style={{ color: theme['text-control-color'] }}>
                            Close
                        </ThemedText>
                    </TouchableOpacity>
                </ThemedView>
            </ThemedView>
        </Modal>
    )
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        width: 300,
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        elevation: 5,
    },
    button: {
        marginTop: 12,
        paddingVertical: 8,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
})