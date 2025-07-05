'use server'

import { NextRequest, NextResponse } from "next/server";
import { playersServerAPI } from "@/api/server/supabase/playersServerAPI";
import { CheckoutSuccessStatus } from "@/api/types/polar/CheckoutSuccessStatus";

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;

        // PolarClientAPI.ts의 metadata에 정의된 파라미터들을 추출합니다.
        const userId = searchParams.get('user_id');
        const continentId = searchParams.get('continent_id');
        const stakeAmount = searchParams.get('stake_amount');
        const name = searchParams.get('name');
        const email = searchParams.get('email');

        // 추출된 파라미터들을 객체로 묶습니다. (null이 될 수 있으므로 타입 추론에 주의)
        const metaData = {
            userId,
            continentId,
            stakeAmount,
            name,
            email,
        };

        // 접속 확인, DB 업데이트
        console.log("Received meta_data from Polar checkout success:", metaData);

        if (!userId || !stakeAmount || !email) throw Error("Invalid meta_data from Polar checkout success");

        if (continentId && name) {
            const result = await playersServerAPI.postPlayers({
                user_id: userId,
                continent_id: continentId,
                stake_amount: parseInt(stakeAmount),
                name: name,
                contact_email: email
            })

            if (!result) throw Error("Failed insert player.");
        } else {
            const prevPlayerInfo = await playersServerAPI.getPlayersByUserId(userId);

            if (!prevPlayerInfo) throw Error("User is not exist in DB.");

            await playersServerAPI.patchPlayersById(prevPlayerInfo.id, {
                user_id: userId,
                stake_amount: prevPlayerInfo.stake_amount + parseInt(stakeAmount),
                contact_email: email
            })
        }

        const redirectUrl = new URL("/", req.url);
        redirectUrl.searchParams.set('checkout_success_status', CheckoutSuccessStatus.NEW_STAKE);

        return NextResponse.redirect(redirectUrl);
    } catch (err: any) {
        console.error("Error processing Polar checkout success:", err);
        return NextResponse.json(
            { message: err.message ?? "Polar error" },
            { status: 500 }
        );
    }
}