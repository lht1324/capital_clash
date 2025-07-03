'use server'

import {createSupabaseServer} from "@/lib/supabase/supabaseServer";
import {NextRequest, NextResponse} from "next/server";
import {Player} from "@/api/types/supabase/Players";
import {playersServerAPI} from "@/api/server/supabase/playersServerAPI";

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId } = await params;
        const supabase = await createSupabaseServer();

        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq("id", userId);

        if (error) throw error

        return NextResponse.json({ ...(data?.[0]) }, { status: 201 });
    } catch (error) {
        console.log(error);

        return NextResponse.json(
            { error: (error as Error).message },
            { status: 500 },
        )
    }
}