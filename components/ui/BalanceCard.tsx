import React from "react";
import { StyleSheet, View, Image, TouchableOpacity } from "react-native";
import { ThemedView } from "../ThemedView";
import { ThemedText } from "../ThemedText";
import { useTheme } from "@ui-kitten/components";
import AntDesign from '@expo/vector-icons/AntDesign';
// Simple copy icon SVG
const CopyIcon = ({ color = "#888", size = 30 }) => (
    <AntDesign name="copy1" size={size} color={color} />
);

type BalanceCardProps = {
    walletAddress: string;
    network: string;
    balance: string;
    tokenSymbol?: string;
    avatarUrl?: string;
    extraInfo?: React.ReactNode;
};

export const BalanceCard: React.FC<BalanceCardProps> = ({
    walletAddress,
    network,
    balance,
    tokenSymbol = "USDC",
    avatarUrl,
    extraInfo,
}) => {
    const theme = useTheme();

    const handleCopy = () => {
        if (navigator?.clipboard) {
            navigator.clipboard.writeText(walletAddress);
        }
    };

    return (
        <ThemedView
            style={[
                styles.card,
                {
                    backgroundColor: theme['background-basic-color-2'],
                    shadowColor: theme['color-basic-900'],
                },
            ]}
            level="2"
        >
            <View style={styles.header}>
                {avatarUrl && (
                    <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                )}
                <View style={styles.infoRow}>
                    <View style={styles.info}>
                        <ThemedText type="subtitle" style={[styles.network, { color: theme['text-hint-color'] }]}>
                            {network}
                        </ThemedText>
                    </View>
              
                </View>
            </View>
            <View style={styles.balanceRow}>
                <ThemedText type="title" style={{ color: theme['text-basic-color'] }}>{balance}</ThemedText>
                <ThemedText type="subtitle" style={[styles.tokenSymbol, { color: theme['text-hint-color'] }]}>
                    {tokenSymbol}
                </ThemedText>
            </View>
            {extraInfo && <View style={styles.extra}>{extraInfo}</View>}
        </ThemedView>
    );
};

const styles = StyleSheet.create({
    card: {
        alignSelf: 'center',
        borderRadius: 16,
        padding: 20,
        margin: 8,
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
        minWidth: 300,
        maxWidth: 400,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginRight: 16,
    },
    infoRow: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
    },
    info: {
        flex: 1,
        justifyContent: "center",
    },
    copyIcon: {
        marginLeft: 8,
        cursor: 'pointer',
        padding: 4,
        borderRadius: 4,
        transition: 'background 0.2s',
    },
    network: {
        fontSize: 14,
        marginTop: 2,
    },
    balanceRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
        justifyContent:'center'
    },
    tokenSymbol: {
        marginLeft: 8,
        fontSize: 18,
    },
    extra: {
        marginTop: 8,
    },
});