'use client'

import Image from 'next/image'
import { useEffect } from 'react'
import { useCart } from '@/components/cart-context'
import { formatMoney } from '@/lib/format'

export function CartDrawer() {
  const { cart, isOpen, isPending, close, updateItem, removeItem } = useCart()

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [isOpen, close])

  const lines = cart?.lines ?? []
  const isEmpty = lines.length === 0

  function openCheckout() {
    if (!cart?.checkoutUrl) return
    const url = `${cart.checkoutUrl}${cart.checkoutUrl.includes('?') ? '&' : '?'}channel=online_store`
    // Dentro de um iframe (preview), abre em nova aba; fora, navega na própria aba.
    if (window.self !== window.top) window.open(url, '_blank', 'noopener,noreferrer')
    else window.location.href = url
  }

  return (
    <div
      className={`fixed inset-0 z-[80] ${isOpen ? '' : 'pointer-events-none'}`}
      aria-hidden={isOpen ? undefined : true}
    >
      <div
        onClick={close}
        className={`absolute inset-0 bg-ink/70 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Carrinho de compras"
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-surface shadow-2xl transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <p className="eyebrow">Seu carrinho</p>
          <button type="button" onClick={close} aria-label="Fechar carrinho" className="p-1 text-paper/70 transition-colors hover:text-champagne">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {isEmpty ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="display text-2xl text-paper">Seu carrinho está vazio.</p>
            <p className="max-w-xs text-sm leading-6 text-paper/50">Adicione um dos destaques e finalize a compra com toda a segurança do checkout Shopify.</p>
            <button type="button" onClick={close} className="mt-2 border-b border-champagne pb-1 text-[10px] uppercase tracking-[.24em] text-champagne transition-colors hover:text-paper">
              Continuar comprando
            </button>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-white/10 overflow-y-auto px-6">
              {lines.map((line) => (
                <li key={line.id} className="flex gap-4 py-5">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden border border-white/10 bg-white/[.04]">
                    {line.merchandise.product.featuredImage?.url && (
                      <Image
                        src={line.merchandise.product.featuredImage.url || '/placeholder.svg'}
                        alt={line.merchandise.product.featuredImage.altText ?? line.merchandise.product.title}
                        fill
                        sizes="80px"
                        className="object-contain p-2"
                      />
                    )}
                  </div>

                  <div className="flex flex-1 flex-col">
                    <p className="text-sm leading-snug text-paper">{line.merchandise.product.title}</p>
                    <p className="mt-1 text-[11px] tracking-wide text-paper/45">
                      {formatMoney(line.merchandise.price.amount, line.merchandise.price.currencyCode)}
                    </p>

                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div className="flex items-center border border-white/15">
                        <button type="button" onClick={() => updateItem(line.id, line.quantity - 1)} disabled={isPending} aria-label="Diminuir quantidade" className="px-3 py-1.5 text-paper/70 transition-colors hover:text-champagne disabled:opacity-40">−</button>
                        <span className="min-w-8 text-center text-sm text-paper">{line.quantity}</span>
                        <button type="button" onClick={() => updateItem(line.id, line.quantity + 1)} disabled={isPending} aria-label="Aumentar quantidade" className="px-3 py-1.5 text-paper/70 transition-colors hover:text-champagne disabled:opacity-40">+</button>
                      </div>
                      <button type="button" onClick={() => removeItem(line.id)} disabled={isPending} className="text-[10px] uppercase tracking-[.2em] text-paper/40 transition-colors hover:text-champagne disabled:opacity-40">
                        Remover
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="border-t border-white/10 px-6 py-6">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-[.24em] text-paper/50">Subtotal</span>
                <span className="display text-2xl text-paper">
                  {cart ? formatMoney(cart.cost.subtotalAmount.amount, cart.cost.subtotalAmount.currencyCode) : '—'}
                </span>
              </div>
              <p className="mt-2 text-[11px] tracking-wide text-paper/40">Frete e impostos calculados no checkout.</p>
              <button
                type="button"
                onClick={openCheckout}
                disabled={isPending}
                className="mt-5 flex w-full items-center justify-center gap-3 bg-champagne px-6 py-4 text-[11px] uppercase tracking-[.24em] text-ink transition-colors hover:bg-paper disabled:opacity-60"
              >
                Finalizar compra <span aria-hidden="true">→</span>
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  )
}
