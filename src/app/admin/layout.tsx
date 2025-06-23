import type { Metadata } from 'next'
import { ReactNode } from 'react'
import {Inter} from "next/font/google";

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Capital Clash - Admin',
    description: 'Admin page for Capital Clash.',
}

export default function AdminLayout({
    children,
}: {
    children: ReactNode
}) {
    return (
        <html lang="ko">
            <body className={inter.className}>{children}</body>
        </html>
    )
}
