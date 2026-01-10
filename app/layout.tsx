import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { NavigationBar } from '@/components/NavigationBar'
import { createClient } from '@/lib/supabase/server'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Arena Triumph',
  description: 'Arena Triumph - Battle for glory',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Don't show navigation on login page
  const showNav = user !== null

  return (
    <html lang="en">
      <body className={inter.className}>
        {showNav && <NavigationBar />}
        <main>{children}</main>
      </body>
    </html>
  )
}
