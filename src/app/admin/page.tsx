'use server'

import AdminPageServer from "@/components/admin/AdminPageServer";
import StoreInitializer from "@/components/main/StoreInitializer";
import {playersServerAPI} from "@/api/server/supabase/playersServerAPI";
import {getSupabaseUser} from "@/utils/userUtils";
import {usersServerAPI} from "@/api/server/supabase/usersServerAPI";
import {Continent} from "@/api/types/supabase/Continents";
import {continentsServerAPI} from "@/api/server/supabase/continentsServerAPI";
import {Player} from "@/api/types/supabase/Players";
import {calculateSquareLayout, getContinentPosition, PlacementResult, Position} from "@/lib/treemapAlgorithm";
import {CheckoutSuccessStatus} from "@/api/types/polar/CheckoutSuccessStatus";

export default async function AdminPage() {
    const continentList: Continent[] = await continentsServerAPI.getContinents();
    const playerList: Player[] = await playersServerAPI.getPlayers();
    const vipPlayerList: Player[] = Object.values(
        playerList.reduce((acc, player) => {
            const id = player.continent_id;

            if (!acc[id] || player.stake_amount > acc[id].stake_amount) {
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
        <div>
            <StoreInitializer {...props} />
            <AdminPageServer/>
        </div>
    )
}
