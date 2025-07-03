'use server'

import { NextResponse } from "next/server";
import { polarServerAPI } from "@/api/server/polar/polarServerAPI";

export async function GET() {
    try {
        const data = await polarServerAPI.getProductsServer();
        return NextResponse.json(data, { status: 200 });
    } catch (err: any) {
        return NextResponse.json(
            { message: err.message ?? "Polar error" },
            { status: 500 }
        );
    }
}