'use server'

import {continentsServerAPI} from "@/api/server/supabase/continentsServerAPI";
import {playersServerAPI} from "@/api/server/supabase/playersServerAPI";
import {Continent} from "@/api/server/supabase/types/Continents";
import {Player} from "@/api/server/supabase/types/Players";
import {calculateSquareLayout, getContinentPosition, PlacementResult, Position} from "@/lib/treemapAlgorithm";
import ContinentMapWrapperClient from "@/components/main/continent_map/ContinentMapWrapperClient";
import {getSupabaseUser} from "@/utils/userUtils";
import {usersServerAPI} from "@/api/server/supabase/usersServerAPI";

export default async function ContinentMapWrapperServer() {
    const continentList: Continent[] = await continentsServerAPI.getAll();
    const playerList: Player[] = await playersServerAPI.getAll();
    const authUser = await getSupabaseUser();
    const user = await usersServerAPI.getByUserid(authUser?.id);
    const vipPlayerList: Player[] = Object.values(
        playerList.reduce((acc, player) => {
            const id = player.continent_id;

            if (!acc[id] || player.investment_amount > acc[id].investment_amount) {
                acc[id] = player; // 최고 투자금액 기준
            }

            return acc;
        }, {} as Record<string, Player>)
    );
    const placementResultRecord: Record<string, PlacementResult> = { }
    const continentPositionRecord: Record<string, Position> = { }

    const getFilteredPlayerListByContinent = (continentId: string) => {
        return playerList.filter((player) => {
            return player.continent_id === continentId;
        })
    };

    continentList.forEach((continent) => {
        const filteredPlayerListByContinent = continent.id !== "central"
            ? getFilteredPlayerListByContinent(continent.id)
            : vipPlayerList

        if (filteredPlayerListByContinent.length !== 0) {
            placementResultRecord[continent.id] = calculateSquareLayout(
                filteredPlayerListByContinent,
                continent.id
            )
        }
    });

    continentList.forEach((continent) => {
        if (placementResultRecord[continent.id]) {
            continentPositionRecord[continent.id] = getContinentPosition(
                placementResultRecord[continent.id],
                placementResultRecord["central"]
            );
        }
    });

    const clientProps = {
        continentList: continentList,
        playerList: playerList,
        user: user,
        vipPlayerList: vipPlayerList,
        placementResultRecord: placementResultRecord,
        continentPositionRecord: continentPositionRecord,
    }

    return (
        <ContinentMapWrapperClient {...clientProps} />
    )
}