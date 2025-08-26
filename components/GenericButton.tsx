import React from 'react'
import { Button } from '@ui-kitten/components'

type GenericIconButtonProps = {
    title: string
    icon: React.ReactElement
    onPress: () => void
    style?: object
    loading?: boolean
}

export const GenericIconButton = ({
    title,
    icon,
    onPress,
    style,
    loading = false,
}: GenericIconButtonProps) => (
    <Button
        style={style}
        accessoryRight={icon}
        onPress={onPress}
        disabled={loading}
        status={loading ? 'basic' : 'primary'}
    >
        {loading ? 'Please wait...' : title}
    </Button>
)