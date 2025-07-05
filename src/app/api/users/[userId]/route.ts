'use server'

import {NextRequest, NextResponse} from "next/server";
import {usersServerAPI} from "@/api/server/supabase/usersServerAPI";

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId } = await params;

        const data = await usersServerAPI.getUsersByUserid(userId);

        return NextResponse.json(data ? { ...data } : null, { status: 201 });
    } catch (error) {
        console.log(error);

        return NextResponse.json(
            { error: (error as Error).message },
            { status: 500 },
        )
    }
}