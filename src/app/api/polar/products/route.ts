'use server'

import { NextResponse } from "next/server";
import { getProductsServer } from "@/api/server/polar/PolarServerAPI";

export async function GET() {
    console.log("getProductsServer")
    try {
        const data = await getProductsServer();
        return NextResponse.json(data, { status: 200 });
    } catch (err: any) {
        return NextResponse.json(
            { message: err.message ?? "Polar error" },
            { status: 500 }
        );
    }
}
