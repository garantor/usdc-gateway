import React from 'react'
import { useTheme } from '@ui-kitten/components'
import { ThemedText } from '@/components/ThemedText'

interface SelectItemProps {
    label: string
    value: string
    onChange: (value: string) => void
    options: string[]
    id?: string
    disabledOptions?: string[]
}

export const SelectItem: React.FC<SelectItemProps> = ({
    label,
    value,
    onChange,
    options,
    id,
    disabledOptions = [],
}) => {
    const theme = useTheme()
    return (
        <div style={{ width: '100%', marginBottom: 16 }}>
            <label htmlFor={id} style={{ marginBottom: 8, display: 'block' }}>
                <ThemedText type="defaultSemiBold">{label}</ThemedText>
            </label>
            <select
                id={id}
                value={value}
                onChange={e => onChange(e.target.value)}
                style={{
                    width: '100%',
                    padding: 10,
                    borderRadius: 8,
                    border: `1px solid ${theme['color-primary-500']}`,
                    marginBottom: 8,
                }}
            >
                <option value="" disabled>Select chain</option>
                {options.map((name, idx) => (
                    <option
                        key={name + idx}
                        value={name}
                        disabled={disabledOptions.includes(name)}
                    >
                        {name}
                    </option>
                ))}
            </select>
        </div>
    )
}