import {continentsServerAPI} from "@/api/server/supabase/continentsServerAPI";
import {playersServerAPI} from "@/api/server/supabase/playersServerAPI";
import {usersServerAPI} from "@/api/server/supabase/usersServerAPI";
import {Continent} from "@/api/types/supabase/Continents";
import {ImageStatus, Player} from "@/api/types/supabase/Players";
import {getSupabaseUser} from "@/utils/userUtils";
import SidebarClient, {SidebarClientProps} from "@/components/main/sidebar/SidebarClient";

export default async function SidebarServer() {
    const clientProps = {

    } as SidebarClientProps;

    return (
        <SidebarClient
            {...clientProps}
        />
    )
}
