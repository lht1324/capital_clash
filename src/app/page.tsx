'use server'

import SidebarServer from "@/components/main/sidebar/SidebarServer";
import HeaderServer from "@/components/main/header/HeaderServer";
import ContinentMapWrapperServer from "@/components/main/continent_map/ContinentMapWrapperServer";
import StoreInitializer from "@/components/main/StoreInitializer";
import {Continent} from "@/api/types/supabase/Continents";
import {Player} from "@/api/types/supabase/Players";
import {continentsServerAPI} from "@/api/server/supabase/continentsServerAPI";
import {playersServerAPI} from "@/api/server/supabase/playersServerAPI";
import {calculateSquareLayout, getContinentPosition, PlacementResult, Position} from "@/lib/treemapAlgorithm";

export default async function Page() {
    const continentList: Continent[] = await continentsServerAPI.getAll();
    const playerList: Player[] = await playersServerAPI.getAll();
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