import {User as SupabaseUser, UserResponse} from "@supabase/auth-js";
import {createSupabaseServerReadOnly} from "@/lib/supabase/supabaseServer";
import {Database} from "@/types/database";
import {cookies} from "next/headers";


export async function getSupabaseUser(): Promise<SupabaseUser | null> {
    try {
        const supabase = await createSupabaseServerReadOnly();
        const { data: { user }, error: userError }: UserResponse = await supabase.auth.getUser();

        if (userError) throw userError;

        return user;
    } catch (error) {
        console.error(error);
        return null;
    }
}