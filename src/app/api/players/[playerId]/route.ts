'use server'

import {createSupabaseServer} from "@/lib/supabase/supabaseServer";
import {NextRequest, NextResponse} from "next/server";
import {Player} from "@/api/types/supabase/Players";
import {playersServerAPI} from "@/api/server/supabase/playersServerAPI";

export async function GET(
    _req: NextRequest,
    { params: { id } }: { params: { id: string } }
) {
    try {
        const supabase = await createSupabaseServer();

        const { data, error } = await supabase
            .from('investors')
            .select('*')
            .eq("id", id);

        if (error) throw error

        return NextResponse.json({ data: data }, { status: 201 });
    } catch (error) {
        console.log(error);

        return NextResponse.json(
            { error: (error as Error).message },
            { status: 500 },
        )
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ playerId: string }> }
) {
    try {
        const { playerId } = await params;
        const updatePlayerInfo: Partial<Player> = await request.json();
        console.log("updatePlayerInfo", updatePlayerInfo)

        const result = await playersServerAPI.update(playerId, updatePlayerInfo);

        return NextResponse.json({ data: result }, { status: 201 });
    } catch (error) {
        console.log(error);

        return NextResponse.json(
            { error: (error as Error).message },
            { status: 500 },
        );
    }
}