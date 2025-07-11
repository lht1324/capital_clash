'use server'

import {NextRequest, NextResponse} from "next/server";
import {Player} from "@/api/types/supabase/Players";
import {playersServerAPI} from "@/api/server/supabase/playersServerAPI";

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ playerId: string }> }
) {
    try {
        const { playerId } = await params;
        const player = await playersServerAPI.getPlayersByUserId(playerId);

        return NextResponse.json({ ...player }, { status: 201 });
    } catch (error) {
        console.log(error);

        return NextResponse.json(
            { error: (error as Error).message },
            { status: 500 },
        )
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ playerId: string }> }
) {
    try {
        const { playerId } = await params;
        const updatePlayerInfo: Partial<Player> = await request.json();
        let mappedUpdatePlayerInfo: Partial<Player>;

        if ("daily_views" in updatePlayerInfo) {
            const prevPlayerInfo = await playersServerAPI.getPlayersByPlayerId(playerId);

            if (prevPlayerInfo && "daily_views" in prevPlayerInfo) {
                const todayDayOfWeek = (new Date().getDay() + 6) % 7;

                const isNotWeeklyUpdated = prevPlayerInfo.daily_views.some((dailyView, dayIndex) => {
                    return todayDayOfWeek < dayIndex && dailyView !== 0;
                });

                if (isNotWeeklyUpdated) {
                    const newDailyViews = [0, 0, 0, 0, 0, 0, 0];
                    newDailyViews[todayDayOfWeek] = 1;

                    mappedUpdatePlayerInfo = {
                        ...updatePlayerInfo,
                        daily_views: newDailyViews,
                    };
                } else {
                    mappedUpdatePlayerInfo = updatePlayerInfo;
                }
            } else {
                mappedUpdatePlayerInfo = updatePlayerInfo;
            }
        } else {
            mappedUpdatePlayerInfo = updatePlayerInfo;
        }

        const result = await playersServerAPI.patchPlayersById(playerId, mappedUpdatePlayerInfo);

        return NextResponse.json({ data: result }, { status: 201 });
    } catch (error) {
        console.log(error);

        return NextResponse.json(
            { error: (error as Error).message },
            { status: 500 },
        );
    }
}