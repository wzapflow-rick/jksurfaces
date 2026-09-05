import type { Metadata } from 'next'
import { Cormorant_Garamond, Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })
const cormorant = Cormorant_Garamond({ subsets: ['latin'], variable: '--font-cormorant', weight: ['300', '400', '500', '600'] })

export const metadata: Metadata = {
  title: 'JK SURFACES | Metais, acabamentos e design',
  description: 'Curadoria de metais, acabamentos e soluções para projetos que valorizam cada detalhe.',
  keywords: ['metais', 'acabamentos', 'design de interiores', 'torneiras', 'JK Surfaces'],
  openGraph: { title: 'JK SURFACES | Metais, acabamentos e design', description: 'A matéria certa transforma o espaço.', type: 'website' },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR" className="bg-ink"><body className={`${geist.variable} ${cormorant.variable}`}>{children}</body></html>
}
