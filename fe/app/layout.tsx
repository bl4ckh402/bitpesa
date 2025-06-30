import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals-enhanced.css"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"
import { MobileNavigation } from "@/components/mobile-navigation"
import { AppProviders } from "@/lib/providers/AppProviders"
import { Toaster } from "@/components/ui/sonner"
import { Header, Footer } from "@/components/layout"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "BitPesa - BTC-Backed Fiat Lending",
  description: "Unlock fiat liquidity without selling your Bitcoin",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0" />
      </head>
      <body className={`${inter.className} pb-16 md:pb-0 min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900`}>
        <AppProviders>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
            <Header />
            <main>
              {children}
            </main>
            <Footer />
            <Toaster />
            <MobileNavigation />
          </ThemeProvider>
        </AppProviders>
      </body>
    </html>
  )
}
