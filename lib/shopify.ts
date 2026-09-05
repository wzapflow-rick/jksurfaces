const endpoint = `https://${process.env.SHOPIFY_STORE_DOMAIN}/api/2026-01/graphql.json`
const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN

export type StorefrontProduct = { id: string; title: string; handle: string; description: string; featuredImage?: { url: string; altText?: string | null }; priceRange: { minVariantPrice: { amount: string; currencyCode: string } } }

export async function getProducts(first = 6): Promise<StorefrontProduct[]> {
  if (!process.env.SHOPIFY_STORE_DOMAIN || !token) return []
  const query = `query Products($first: Int!) { products(first: $first, sortKey: TITLE) { nodes { id title handle description featuredImage { url altText } priceRange { minVariantPrice { amount currencyCode } } } } }`
  const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': token }, body: JSON.stringify({ query, variables: { first } }), next: { revalidate: 60 } })
  if (!response.ok) return []
  const result = await response.json() as { data?: { products?: { nodes?: StorefrontProduct[] } } }
  return result.data?.products?.nodes ?? []
}
