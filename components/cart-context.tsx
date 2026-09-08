'use client'

import { createContext, useCallback, useContext, useMemo, useState, useTransition, type ReactNode } from 'react'
import type { Cart } from '@/lib/shopify'
import { addItem as addItemAction, fetchCart, removeItem as removeItemAction, updateItem as updateItemAction } from '@/app/actions/cart'

type CartValue = {
  cart: Cart | null
  count: number
  isOpen: boolean
  isPending: boolean
  open: () => void
  close: () => void
  addItem: (variantId: string) => void
  updateItem: (lineId: string, quantity: number) => void
  removeItem: (lineId: string) => void
}

const CartContext = createContext<CartValue | null>(null)

export function CartProvider({ initialCart, children }: { initialCart: Cart | null; children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(initialCart)
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])

  const addItem = useCallback((variantId: string) => {
    setIsOpen(true)
    startTransition(async () => {
      const updated = await addItemAction(variantId, 1)
      if (updated) setCart(updated)
    })
  }, [])

  const updateItem = useCallback((lineId: string, quantity: number) => {
    startTransition(async () => {
      const updated = await updateItemAction(lineId, quantity)
      setCart(updated ?? (await fetchCart()))
    })
  }, [])

  const removeItem = useCallback((lineId: string) => {
    startTransition(async () => {
      const updated = await removeItemAction(lineId)
      setCart(updated ?? (await fetchCart()))
    })
  }, [])

  const value = useMemo<CartValue>(
    () => ({
      cart,
      count: cart?.totalQuantity ?? 0,
      isOpen,
      isPending,
      open,
      close,
      addItem,
      updateItem,
      removeItem,
    }),
    [cart, isOpen, isPending, open, close, addItem, updateItem, removeItem],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart deve ser usado dentro de CartProvider')
  return context
}
