import type { Metadata } from 'next'
import { Cormorant_Garamond, Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })
const cormorant = Cormorant_Garamond({ subsets: ['latin'], variable: '--font-cormorant', weight: ['300', '400', '500', '600'] })

export const metadata: Metadata = {
  title: 'JK SURFACES | Torneiras e Metais com Entrega para Todo o Brasil',
  description: 'Compre torneiras, misturadores e acabamentos com pronta entrega para todo o Brasil. Pagamento seguro e parcelamento.',
  keywords: ['comprar torneira', 'misturadores', 'metais para banheiro', 'torneira cozinha', 'acabamentos', 'loja de metais', 'JK Surfaces'],
  openGraph: {
    title: 'JK SURFACES | Torneiras e Metais com Entrega para Todo o Brasil',
    description: 'Compre torneiras, misturadores e acabamentos com pronta entrega para todo o Brasil. Pagamento seguro e parcelamento.',
    type: 'website',
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR" className="bg-ink"><body className={`${geist.variable} ${cormorant.variable}`}>{children}</body></html>
}
