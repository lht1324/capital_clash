import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ReactNode } from "react";
import './globals.css'
import {Analytics} from "@vercel/analytics/next";
import {SpeedInsights} from "@vercel/speed-insights/next";

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Capital Clash',
    description: "No gacha, no random chance. Just the purest form of 'pay-to-win' where your wallet size directly translates to the size of your empire. Claim your dominance.",
    icons: {
        icon: [
            { url: '/favicon/favicon_16.png', sizes: '16x16' },
            { url: '/favicon/favicon_32.png', sizes: '32x32' },
            { url: '/favicon/favicon_48.png', sizes: '48x48' },
            { url: '/favicon/favicon_96.png', sizes: '96x96' },
            { url: '/favicon/favicon_192.png', sizes: '192x192' },
            { url: '/favicon/favicon_512.png', sizes: '512x512' },
        ],
        apple: '/favicon/favicon_180.png',
    },
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