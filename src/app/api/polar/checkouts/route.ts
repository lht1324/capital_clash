'use server'

import { NextRequest, NextResponse } from "next/server";
import { postCheckoutsServer } from "@/api/server/polar/PolarServerAPI";

export async function POST(req: NextRequest) {
    try {
        const { productId, amount, customer_email } = await req.json();
        const data = await postCheckoutsServer(productId, amount, customer_email);
        return NextResponse.json(data, { status: 200 });
    } catch (err: any) {
        return NextResponse.json(
            { message: err.message ?? "Polar error" },
            { status: 500 }
        );
    }
}