import type { Metadata } from 'next'
import { Cormorant_Garamond, Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })
const cormorant = Cormorant_Garamond({ subsets: ['latin'], variable: '--font-cormorant', weight: ['300', '400', '500', '600'] })

export const metadata: Metadata = {
  title: 'JK SURFACES | Metais, acabamentos e soluções',
  description: 'Detalhes que definem espaços. Descubra a curadoria JK SURFACES para projetos extraordinários.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR" className="bg-[#080b0f]"><body className={`${geist.variable} ${cormorant.variable}`}>{children}</body></html>
}
