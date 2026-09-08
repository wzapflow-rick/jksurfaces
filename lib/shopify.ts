import { formatMoney } from '@/lib/format'

const endpoint = `https://${process.env.SHOPIFY_STORE_DOMAIN}/api/2026-01/graphql.json`
const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN

export { formatMoney }

export type Money = { amount: string; currencyCode: string }

export type StorefrontProduct = {
  id: string
  title: string
  handle: string
  description: string
  availableForSale: boolean
  featuredImage?: { url: string; altText?: string | null }
  priceRange: { minVariantPrice: Money }
  variantId: string
}

export type CartLine = {
  id: string
  quantity: number
  merchandise: {
    id: string
    title: string
    product: { title: string; handle: string; featuredImage?: { url: string; altText?: string | null } }
    price: Money
  }
  cost: { totalAmount: Money }
}

export type Cart = {
  id: string
  checkoutUrl: string
  totalQuantity: number
  cost: { subtotalAmount: Money; totalAmount: Money }
  lines: CartLine[]
}

type GraphQLResponse<T> = { data?: T; errors?: { message: string }[] }

async function shopifyFetch<T>(query: string, variables: Record<string, unknown> = {}, revalidate?: number): Promise<T | null> {
  if (!process.env.SHOPIFY_STORE_DOMAIN || !token) return null
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': token },
      body: JSON.stringify({ query, variables }),
      ...(revalidate !== undefined ? { next: { revalidate } } : { cache: 'no-store' }),
    })
    if (!response.ok) return null
    const result = (await response.json()) as GraphQLResponse<T>
    if (result.errors?.length) {
      console.log('[v0] Shopify GraphQL error:', result.errors.map((e) => e.message).join('; '))
      return null
    }
    return result.data ?? null
  } catch (error) {
    console.log('[v0] Shopify fetch failed:', error instanceof Error ? error.message : String(error))
    return null
  }
}

const PRODUCT_FIELDS = `
  id
  title
  handle
  description
  availableForSale
  featuredImage { url altText }
  priceRange { minVariantPrice { amount currencyCode } }
  variants(first: 1) { nodes { id } }
`

type RawProduct = Omit<StorefrontProduct, 'variantId'> & { variants: { nodes: { id: string }[] } }

function normalizeProduct(raw: RawProduct): StorefrontProduct {
  const { variants, ...rest } = raw
  return { ...rest, variantId: variants?.nodes?.[0]?.id ?? '' }
}

export async function getProducts(first = 12): Promise<StorefrontProduct[]> {
  const data = await shopifyFetch<{ products: { nodes: RawProduct[] } }>(
    `query Products($first: Int!) { products(first: $first, sortKey: PRICE) { nodes { ${PRODUCT_FIELDS} } } }`,
    { first },
    60,
  )
  return (data?.products?.nodes ?? []).map(normalizeProduct)
}

export async function getProduct(handle: string): Promise<StorefrontProduct | null> {
  const data = await shopifyFetch<{ product: RawProduct | null }>(
    `query Product($handle: String!) { product(handle: $handle) { ${PRODUCT_FIELDS} } }`,
    { handle },
    60,
  )
  return data?.product ? normalizeProduct(data.product) : null
}

const CART_FIELDS = `
  id
  checkoutUrl
  totalQuantity
  cost { subtotalAmount { amount currencyCode } totalAmount { amount currencyCode } }
  lines(first: 50) {
    nodes {
      id
      quantity
      cost { totalAmount { amount currencyCode } }
      merchandise {
        ... on ProductVariant {
          id
          title
          price { amount currencyCode }
          product { title handle featuredImage { url altText } }
        }
      }
    }
  }
`

type RawCart = Omit<Cart, 'lines'> & { lines: { nodes: CartLine[] } }

function normalizeCart(raw: RawCart | null | undefined): Cart | null {
  if (!raw) return null
  return { ...raw, lines: raw.lines?.nodes ?? [] }
}

export async function createCart(variantId: string, quantity = 1): Promise<Cart | null> {
  const data = await shopifyFetch<{ cartCreate: { cart: RawCart } }>(
    `mutation CartCreate($lines: [CartLineInput!]) { cartCreate(input: { lines: $lines }) { cart { ${CART_FIELDS} } userErrors { message } } }`,
    { lines: [{ merchandiseId: variantId, quantity }] },
  )
  return normalizeCart(data?.cartCreate?.cart)
}

export async function getCart(cartId: string): Promise<Cart | null> {
  const data = await shopifyFetch<{ cart: RawCart | null }>(
    `query Cart($cartId: ID!) { cart(id: $cartId) { ${CART_FIELDS} } }`,
    { cartId },
  )
  return normalizeCart(data?.cart)
}

export async function addToCart(cartId: string, variantId: string, quantity = 1): Promise<Cart | null> {
  const data = await shopifyFetch<{ cartLinesAdd: { cart: RawCart } }>(
    `mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) { cartLinesAdd(cartId: $cartId, lines: $lines) { cart { ${CART_FIELDS} } userErrors { message } } }`,
    { cartId, lines: [{ merchandiseId: variantId, quantity }] },
  )
  return normalizeCart(data?.cartLinesAdd?.cart)
}

export async function updateCartLine(cartId: string, lineId: string, quantity: number): Promise<Cart | null> {
  const data = await shopifyFetch<{ cartLinesUpdate: { cart: RawCart } }>(
    `mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) { cartLinesUpdate(cartId: $cartId, lines: $lines) { cart { ${CART_FIELDS} } userErrors { message } } }`,
    { cartId, lines: [{ id: lineId, quantity }] },
  )
  return normalizeCart(data?.cartLinesUpdate?.cart)
}

export async function removeCartLine(cartId: string, lineId: string): Promise<Cart | null> {
  const data = await shopifyFetch<{ cartLinesRemove: { cart: RawCart } }>(
    `mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) { cartLinesRemove(cartId: $cartId, lineIds: $lineIds) { cart { ${CART_FIELDS} } userErrors { message } } }`,
    { cartId, lineIds: [lineId] },
  )
  return normalizeCart(data?.cartLinesRemove?.cart)
}
