'use server'
// 부분 컬럼 업데이트는 PATCH로 처리

import {createSupabaseServer} from "@/lib/supabase/supabaseServer";
import {NextRequest, NextResponse} from "next/server";
import {PostPlayersReq} from "@/api/types/supabase/players/PostPlayersReq";

// 작동 확인.
export async function POST(nextReq: NextRequest) {
    try {
        const req: PostPlayersReq = await nextReq.json();

        const supabase = await createSupabaseServer();

        const newPlayerInfo = {
            user_id: req.userId,
            continent_id: req.continentId,
            name: req.name,
            stake_amount: req.investmentAmount,
            area_color: `#${Math.floor(Math.random() * 16777215).toString(16)}`
        }

        const { data, error } = await supabase
            .from('players')
            .insert([newPlayerInfo])
            .select();

        if (error) throw error

        return NextResponse.json({ data: data?.[0] }, { status: 201 })
    } catch (error) {
        console.error(error)
        return NextResponse.json(
            { error: (error as Error).message },
            { status: 500 },
        )
    }
}

export async function GET() {
    try {
        const supabase = await createSupabaseServer();

        const { data, error } = await supabase
            .from('players')
            .select('*');

        if (error) throw error

        return data || []
    } catch (error) {
        console.log(error);

        return [];
    }
}