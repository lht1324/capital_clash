import {createSupabaseClient} from "@/lib/supabase/supabaseClient";

export async function signInWithOAuth() {
    const supabase = createSupabaseClient();

    await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${window.location.origin}/auth/callback`,
            queryParams: {
                access_type: 'offline',
                prompt: 'consent',
            }
        }
    })
}

export async function signOutWithOAuth() {
    const supabase = createSupabaseClient();

    try {
        await supabase.auth.signOut()
    } catch (error) {
        console.error('로그아웃 중 오류 발생:', error)
    }
}