'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import {Database} from "@/types/database";

// 싱글턴 패턴 – 탭 전체에서 WebSocket 1개만 유지
let client: SupabaseClient<Database> | undefined

export function createSupabaseClient(): SupabaseClient<Database> {
    if (client) return client

    client = createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            auth: {
                flowType: "pkce",
                persistSession: true,
                detectSessionInUrl: true,
            }
        }
    )

    return client
}
