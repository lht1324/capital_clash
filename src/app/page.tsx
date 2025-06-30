'use server'

import SidebarServer from "@/components/main/sidebar/SidebarServer";
import HeaderServer from "@/components/main/header/HeaderServer";
import ContinentMapWrapperServer from "@/components/main/continent_map/ContinentMapWrapperServer";
import StoreInitializer from "@/components/main/StoreInitializer";
import {Continent} from "@/api/types/supabase/Continents";
import {continentsServerAPI} from "@/api/server/supabase/continentsServerAPI";
import {Player} from "@/api/types/supabase/Players";
import {playersServerAPI} from "@/api/server/supabase/playersServerAPI";
import {getSupabaseUser} from "@/utils/userUtils";
import {usersServerAPI} from "@/api/server/supabase/usersServerAPI";
import {calculateSquareLayout, getContinentPosition, PlacementResult, Position} from "@/lib/treemapAlgorithm";
import {User} from "@/api/types/supabase/Users";

export default async function Page() {
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

    const props = {
        continentList: continentList,
        playerList: playerList,
        placementResultRecord: placementResultRecord,
        continentPositionRecord: continentPositionRecord,
        user: user
    }

    return (
        <>
            <StoreInitializer {...props} />
            <HeaderServer/>
            <div className="flex min-h-screen">
                <SidebarServer/>
                <ContinentMapWrapperServer/>
            </div>
        </>
    )
}