'use server'

import HeaderClient from "@/components/main/header/HeaderClient";
import {continentsServerAPI} from "@/api/server/supabase/continentsServerAPI";
import {playersServerAPI} from "@/api/server/supabase/playersServerAPI";
import {usersServerAPI} from "@/api/server/supabase/usersServerAPI";
import {getSupabaseUser} from "@/utils/userUtils";
import {Continent} from "@/api/server/supabase/types/Continents";
import {Player} from "@/api/server/supabase/types/Players";

export default async function HeaderServer() {
    const continentList: Continent[] = await continentsServerAPI.getAll();
    const playerList: Player[] = await playersServerAPI.getAll();
    const authUser = await getSupabaseUser();
    const user = await usersServerAPI.getByUserid(authUser?.id);

    const userPlayerInfo = playerList.find((player) => {
        return player.user_id === user?.id;
    }) ?? null;

    const headerClientProps = {
        continentList: continentList,
        playerList: playerList,
        userPlayerInfo: userPlayerInfo,
        user: user,
    }

    return (
        <HeaderClient
            {...headerClientProps}
        />
    )
}