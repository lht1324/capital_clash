'use server'

import {NextRequest, NextResponse} from "next/server";
import {playersServerAPI} from "@/api/server/supabase/playersServerAPI";

// 작동 확인.
export async function POST(nextReq: NextRequest) {
    try {
        const {
            userId,
            continentId,
            name,
            stakeAmount,
        } = await nextReq.json();

        const player = await playersServerAPI.postPlayers({
            user_id: userId,
            continent_id: continentId,
            name: name,
            stake_amount: stakeAmount,
            area_color: `#${Math.floor(Math.random() * 16777215).toString(16)}`
        });

        return NextResponse.json({ data: player }, { status: 201 })
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
        const data = await playersServerAPI.getPlayers();

        return data || [];
    } catch (error) {
        console.log(error);

        return [];
    }
}