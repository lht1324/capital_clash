import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ReactNode } from "react";
import './globals.css'
import {Analytics} from "@vercel/analytics/next";
import {SpeedInsights} from "@vercel/speed-insights/next";

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Capital Clash',
    description: 'Real money war game',
}

export default function RootLayout({
    children,
}: {
    children: ReactNode
}) {
    return (
        <html lang="ko">
            <body className={inter.className}>
                {children}
                <Analytics/>
                <SpeedInsights/>
            </body>
        </html>
    )
}