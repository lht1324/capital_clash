'use server'

import { NextRequest, NextResponse } from "next/server";
import { playersServerAPI } from "@/api/server/supabase/playersServerAPI";

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
            await playersServerAPI.postPlayers({
                user_id: userId,
                continent_id: continentId,
                investment_amount: parseInt(stakeAmount),
                name: name,
                contact_email: email
            })
        } else {
            const prevPlayerInfo = await playersServerAPI.getPlayersByUserId(userId);

            if (!prevPlayerInfo) throw Error("User is not exist in DB.");

            await playersServerAPI.patchPlayersById(prevPlayerInfo.id, {
                user_id: userId,
                investment_amount: prevPlayerInfo.investment_amount + parseInt(stakeAmount),
                contact_email: email
            })
        }

        // TODO: 여기에 결제 성공 후 필요한 로직을 추가하세요 (예: 주문 상태 업데이트, 사용자에게 알림 등)

        // 임시 응답: 성공적으로 데이터를 받았음을 알립니다.
        // return NextResponse.json({ message: "Checkout succeed!" }, { status: 200 });
        return NextResponse.redirect(new URL('/', req.url))

    } catch (err: any) {
        console.error("Error processing Polar checkout success:", err);
        return NextResponse.json(
            { message: err.message ?? "Polar error" },
            { status: 500 }
        );
    }
}