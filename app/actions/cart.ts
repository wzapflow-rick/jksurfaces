'use server'

import { cookies } from 'next/headers'
import { addToCart, createCart, getCart, removeCartLine, updateCartLine, type Cart } from '@/lib/shopify'

const CART_COOKIE = 'jk_cart_id'

async function readCartId(): Promise<string | undefined> {
  const store = await cookies()
  return store.get(CART_COOKIE)?.value
}

async function writeCartId(cartId: string): Promise<void> {
  const store = await cookies()
  store.set(CART_COOKIE, cartId, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
}

export async function fetchCart(): Promise<Cart | null> {
  const cartId = await readCartId()
  if (!cartId) return null
  return getCart(cartId)
}

export async function addItem(variantId: string, quantity = 1): Promise<Cart | null> {
  if (!variantId) return null
  const cartId = await readCartId()

  if (cartId) {
    const updated = await addToCart(cartId, variantId, quantity)
    if (updated) return updated
    // Cookie apontava para um carrinho expirado/inválido — cria um novo abaixo.
  }

  const created = await createCart(variantId, quantity)
  if (created) await writeCartId(created.id)
  return created
}

export async function updateItem(lineId: string, quantity: number): Promise<Cart | null> {
  const cartId = await readCartId()
  if (!cartId) return null
  if (quantity <= 0) return removeCartLine(cartId, lineId)
  return updateCartLine(cartId, lineId, quantity)
}

export async function removeItem(lineId: string): Promise<Cart | null> {
  const cartId = await readCartId()
  if (!cartId) return null
  return removeCartLine(cartId, lineId)
}
