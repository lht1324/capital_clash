import {User as SupabaseUser, UserResponse} from "@supabase/auth-js";
import { createSupabaseServer } from "@/lib/supabase/supabaseServer";
import { unstable_noStore as noStore } from 'next/cache';


export async function getSupabaseUser(): Promise<SupabaseUser | null> {
    noStore();
    try {
        const supabase = await createSupabaseServer();
        const { data: { user }, error: userError }: UserResponse = await supabase.auth.getUser();

        if (userError) throw userError;

        return user;
    } catch (error) {
        console.error(error);
        return null;
    }
}