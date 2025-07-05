'use server'

import { NextRequest, NextResponse } from "next/server";
import {polarServerAPI} from "@/api/server/polar/polarServerAPI";

export async function POST(req: NextRequest) {
    try {
        const { productId, amount, customer_email, metadata } = await req.json();

        const data = await polarServerAPI.postCheckoutsStakeServer(
            productId,
            amount,
            customer_email,
            metadata,
        );

        return NextResponse.json(data, { status: 200 });
    } catch (err: any) {
        return NextResponse.json(
            { message: err.message ?? "Polar error" },
            { status: 500 }
        );
    }
}