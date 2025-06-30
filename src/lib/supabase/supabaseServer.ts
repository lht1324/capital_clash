// src/utils/supabase/server.ts
import { cookies } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

/** 서버 컴포넌트, 서버 액션, Route Handler에서 사용 */
export async function createSupabaseServer(): Promise<SupabaseClient<Database>> {
    // v15+: Promise 반환
    const store = await cookies();

    return createServerClient<Database>(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            cookies: {
                /** 브라우저가 보낸 쿠키 → Supabase */
                getAll() {
                    return store.getAll().map(({ name, value, ...opts }) => ({
                        name,
                        value,
                        options: opts as CookieOptions,
                    }))
                },
                /** Supabase가 돌려준 쿠키 → 브라우저 */
                setAll(all) {
                    all.forEach(({ name, value, options }) =>
                        store.set({ name, value, ...options }),
                    )
                },
            },
        },
    )
}

export async function createSupabaseServerReadOnly(): Promise<SupabaseClient<Database>> {
    // v15+: Promise 반환
    const store = await cookies();

    return createServerClient<Database>(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            cookies: {
                /** 브라우저가 보낸 쿠키 → Supabase */
                getAll() {
                    return store.getAll().map(({ name, value, ...opts }) => ({
                        name,
                        value,
                        options: opts as CookieOptions,
                    }))
                },
                /** Supabase가 돌려준 쿠키 → 브라우저 */
                setAll() {
                    /* no-op */
                },
            },
        },
    )
}