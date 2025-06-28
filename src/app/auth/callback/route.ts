import {NextRequest, NextResponse} from 'next/server'
import {createSupabaseServer} from "@/lib/supabase/supabaseServer";
import {playersServerAPI} from "@/api/server/supabase/playersServerAPI";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    console.log("GET /api/auth/callback", request)
    const url = new URL(request.url)
    const code = url.searchParams.get('code')
    if (!code) return NextResponse.redirect(new URL('/login?error', request.url))

    const supabase = await createSupabaseServer();

    const userId = searchParams.get('user_id');
    const investmentAmount = searchParams.get('investment_amount');
    const continentId = searchParams.get('continent_id');
    const name = searchParams.get('name');
    const email = searchParams.get('email');

    if (!userId || !investmentAmount || !continentId || !name || !email) {
        return NextResponse.redirect(new URL('/login?error', request.url))
    }

    await playersServerAPI.create({
        user_id: userId,
        investment_amount: parseInt(investmentAmount),
        continent_id: continentId,
        name: name,
        contact_email: email,
    })

    await supabase.auth.exchangeCodeForSession(code)   // 🎯 세션 완성
    return NextResponse.redirect(new URL('/', request.url))
}