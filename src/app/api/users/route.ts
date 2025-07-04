'use server'
// 부분 컬럼 업데이트는 PATCH로 처리

import {createSupabaseServer} from "@/lib/supabase/supabaseServer";;

export async function GET() {
    try {
        const supabase = await createSupabaseServer();

        const { data, error } = await supabase
            .from('users')
            .select('*');

        if (error) throw error

        return data || []
    } catch (error) {
        console.log(error);

        return [];
    }
}