'use server'
// 부분 컬럼 업데이트는 PATCH로 처리

import {usersServerAPI} from "@/api/server/supabase/usersServerAPI";
import {NextRequest, NextResponse} from "next/server";

export async function POST(req: NextRequest) {
    try {
        const {
            user
        } = await req.json();

        const data = await usersServerAPI.postUsers(user);

        return NextResponse.json(data ? { ...data } : null, { status: 201 });
    } catch (error) {
        console.log(error);

        return NextResponse.json(
            { error: (error as Error).message },
            { status: 500 },
        )
    }
}

export async function GET() {
    try {
        const data = await usersServerAPI.getUsers();

        return NextResponse.json(data, { status: 201 });
    } catch (error) {
        console.log(error);

        return NextResponse.json(
            { error: (error as Error).message },
            { status: 500 },
        )
    }
}