import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import Header from "./_components/header/header"
import Footer from "./_components/footer/footer"
import { Providers } from "./providers";
import { HistoryProvider } from "./_context/HistoryContext"
import NotificationToast from "./_components/notifications/NotificationToast"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Gestão da qualidade de implementação de UST",
  description: "",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <HistoryProvider>
            <div className="app-layout">
              <Header />
              <NotificationToast />

              <main className="app-main">
                {children}
              </main>

              <Footer />
            </div>
          </HistoryProvider>
        </Providers>
      </body>
    </html>
  )
}
