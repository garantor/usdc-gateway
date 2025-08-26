import { useCallback } from 'react'

export function useLocalStorage<T = any>(key: string) {
    // Store value
    const setItem = useCallback((value: T) => {
        localStorage.setItem(key, JSON.stringify(value))
    }, [key])

    // Get value
    const getItem = useCallback((): T | null => {
        const item = localStorage.getItem(key)
        return item ? JSON.parse(item) : null
    }, [key])

    // Update value (merge for objects)
    const updateItem = useCallback((updates: Partial<T>) => {
        const current = getItem()
        if (current && typeof current === 'object') {
            const updated = { ...current, ...updates }
            setItem(updated)
        }
    }, [getItem, setItem])

    // Delete value
    const removeItem = useCallback(() => {
        localStorage.removeItem(key)
    }, [key])

    return { setItem, getItem, updateItem, removeItem }
}