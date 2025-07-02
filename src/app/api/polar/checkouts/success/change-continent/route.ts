'use server'

import { NextRequest, NextResponse } from "next/server";
import { playersServerAPI } from "@/api/server/supabase/playersServerAPI";

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;

        // PolarClientAPI.ts의 metadata에 정의된 파라미터들을 추출합니다.
        const playerId = searchParams.get('player_id');
        const targetContinentId = searchParams.get('target_continent_id');

        // 추출된 파라미터들을 객체로 묶습니다. (null이 될 수 있으므로 타입 추론에 주의)

        if (!playerId || !targetContinentId) throw Error("Invalid meta_data from Polar checkout success");

        await playersServerAPI.patchPlayersById(playerId, {
            continent_id: targetContinentId
        });

        return NextResponse.redirect(new URL('/', req.url))
    } catch (err: any) {
        console.error("Error processing Polar checkout success:", err);
        return NextResponse.json(
            { message: err.message ?? "Polar error" },
            { status: 500 }
        );
    }
}