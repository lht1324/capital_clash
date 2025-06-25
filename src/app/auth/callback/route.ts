import { NextResponse } from 'next/server'
import {createSupabaseServer} from "@/lib/supabase/supabaseServer";

export async function GET(req: Request) {
    console.log("GET /api/auth/callback", req)
    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    if (!code) return NextResponse.redirect(new URL('/login?error', req.url))

    const supabase = await createSupabaseServer();

    await supabase.auth.exchangeCodeForSession(code)   // 🎯 세션 완성
    return NextResponse.redirect(new URL('/', req.url))
}