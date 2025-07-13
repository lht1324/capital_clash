'use server'

import { NextRequest, NextResponse } from "next/server";
import { polarServerAPI } from "@/api/server/polar/polarServerAPI";

export async function POST(req: NextRequest) {
    try {
        const originUrl = req.nextUrl.origin;
        const {
            productId,
            playerId,
            targetContinentId,
            email,
        } = await req.json();

        const data = await polarServerAPI.postCheckoutsChangeContinentServer(
            originUrl,
            productId,
            playerId,
            targetContinentId,
            email,
        );

        return NextResponse.json(data, { status: 200 });
    } catch (err: any) {
        return NextResponse.json(
            { message: err.message ?? "Polar error" },
            { status: 500 }
        );
    }
}