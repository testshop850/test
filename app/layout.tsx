import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { CartProvider } from "@/contexts/cart-context"
import { AuthProvider } from "@/contexts/auth-context"
import { LanguageProvider } from "@/contexts/language-context"
import { SupportWidget } from "@/components/support-widget"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Milano Cafe - Premium restoran tajribasi",
  description: "Bizning nafis menyu va ajoyib xizmatimiz bilan Milano kafesida eng zo'r taomlardan bahramand bo'ling.",
  generator: 'Milano Cafe System v2.0'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <LanguageProvider>
            <AuthProvider>
              <CartProvider>
                {children}
                <SupportWidget />
                <Toaster />
              </CartProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}