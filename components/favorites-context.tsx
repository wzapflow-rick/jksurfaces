'use client'

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

type FavoritesValue = {
  favorites: string[]
  count: number
  has: (id: string) => boolean
  toggle: (id: string) => void
}

const FavoritesContext = createContext<FavoritesValue | null>(null)

// In-memory only for this phase — the interface is ready to receive persistence later.
export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([])

  const toggle = useCallback((id: string) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }, [])

  const value = useMemo<FavoritesValue>(
    () => ({
      favorites,
      count: favorites.length,
      has: (id: string) => favorites.includes(id),
      toggle,
    }),
    [favorites, toggle],
  )

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}

export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (!context) throw new Error('useFavorites deve ser usado dentro de FavoritesProvider')
  return context
}
