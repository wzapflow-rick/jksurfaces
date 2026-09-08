'use client'

import { useCart } from '@/components/cart-context'

export function AddToCartButton({
  variantId,
  available,
  highlight,
  label,
}: {
  variantId: string
  available: boolean
  highlight?: boolean
  label: string
}) {
  const { addItem, isPending } = useCart()
  const disabled = !available || !variantId || isPending

  return (
    <button
      type="button"
      onClick={() => addItem(variantId)}
      disabled={disabled}
      aria-label={`Comprar ${label}`}
      className={`mt-6 inline-flex items-center justify-center gap-3 px-6 py-3 text-[11px] uppercase tracking-[.24em] transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        highlight
          ? 'bg-champagne text-ink hover:bg-paper'
          : 'border border-white/25 text-paper hover:border-champagne hover:text-champagne'
      }`}
    >
      {available ? 'Comprar agora' : 'Indisponível'} <span aria-hidden="true">→</span>
    </button>
  )
}
