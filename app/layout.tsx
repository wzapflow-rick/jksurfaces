import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Sidebar } from "@/components/layout/sidebar"

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" })

export const metadata: Metadata = {
  title: "Radar JK — Inteligência de Aquisição",
  description:
    "Camada de inteligência de aquisição da JK Surfaces. Onde colocar o dinheiro: melhores oportunidades, maior ROI e menor custo de compra.",
}

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
  colorScheme: "dark",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="bg-background">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 min-w-0">
            <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">{children}</div>
          </main>
        </div>
      </body>
    </html>
  )
}
