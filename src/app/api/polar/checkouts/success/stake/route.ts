'use server'

import { NextRequest, NextResponse } from "next/server";
import { playersServerAPI } from "@/api/server/supabase/playersServerAPI";
import { polarServerAPI } from "@/api/server/polar/polarServerAPI";
import { CheckoutSuccessStatus } from "@/api/types/polar/CheckoutSuccessStatus";

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;

        const checkoutId = searchParams.get('checkout_id');
        if (!checkoutId) throw Error("Checkout ID is missing.");

        const checkoutDetails = await polarServerAPI.getCheckout(checkoutId);
        if (!checkoutDetails || !checkoutDetails.amount) throw Error("Failed to retrieve checkout details or amount from Polar.");

        const actualStakeAmount = checkoutDetails.amount / 100; // Polar API는 금액을 센트 단위로 반환

        const userId = searchParams.get('user_id');
        const continentId = searchParams.get('continent_id');
        const name = searchParams.get('name');
        const email = searchParams.get('email');

        const metaData = {
            userId,
            continentId,
            stakeAmount: actualStakeAmount, // 실제 결제 금액 사용
            name,
            email,
        };

        console.log("Received meta_data from Polar checkout success:", metaData);

        if (!userId || !email) throw Error("Invalid meta_data from Polar checkout success");

        if (continentId && name) {
            const result = await playersServerAPI.postPlayers({
                user_id: userId,
                continent_id: continentId,
                stake_amount: actualStakeAmount,
                name: name,
                contact_email: email
            })

            if (!result) throw Error("Failed insert player.");
        } else {
            const prevPlayerInfo = await playersServerAPI.getPlayersByUserId(userId);

            if (!prevPlayerInfo) throw Error("User is not exist in DB.");

            await playersServerAPI.patchPlayersById(prevPlayerInfo.id, {
                user_id: userId,
                stake_amount: prevPlayerInfo.stake_amount + actualStakeAmount,
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