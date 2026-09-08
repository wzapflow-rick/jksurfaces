export function formatMoney(amount: string | number, currencyCode: string): string {
  const value = typeof amount === 'string' ? Number.parseFloat(amount) : amount
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: currencyCode }).format(value)
  } catch {
    return `${currencyCode} ${value.toFixed(2)}`
  }
}
