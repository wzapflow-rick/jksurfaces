import type { Metadata } from 'next'
import { Cormorant_Garamond, Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })
const cormorant = Cormorant_Garamond({ subsets: ['latin'], variable: '--font-cormorant', weight: ['300', '400', '500', '600'] })

export const metadata: Metadata = {
  title: 'JK SURFACES | Design que transforma espaços',
  description: 'Metais, acabamentos e soluções que unem qualidade, funcionalidade e design.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR" className="bg-ink"><body className={`${geist.variable} ${cormorant.variable}`}>{children}</body></html>
}
