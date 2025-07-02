import {NextRequest, NextResponse} from 'next/server'
import {createSupabaseServer} from "@/lib/supabase/supabaseServer";
import {playersServerAPI} from "@/api/server/supabase/playersServerAPI";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    console.log("GET /auth/callback URL:", request.url);
    const url = new URL(request.url)
    const code = url.searchParams.get('code')
    if (!code) return NextResponse.redirect(new URL('/login?error', request.url))

    const supabase = await createSupabaseServer("mutate");

    await supabase.auth.exchangeCodeForSession(code)   // 🎯 세션 완성
    return NextResponse.redirect(new URL('/', request.url))
}