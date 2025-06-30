'use server'

import HeaderClient from "@/components/main/header/HeaderClient";
import {continentsServerAPI} from "@/api/server/supabase/continentsServerAPI";
import {playersServerAPI} from "@/api/server/supabase/playersServerAPI";
import {usersServerAPI} from "@/api/server/supabase/usersServerAPI";
import {getSupabaseUser} from "@/utils/userUtils";
import {Continent} from "@/api/types/supabase/Continents";
import {Player} from "@/api/types/supabase/Players";

export default async function HeaderServer() {
    const headerClientProps = {

    }

    return (
        <HeaderClient
            {...headerClientProps}
        />
    )
}