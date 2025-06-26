import {playersServerAPI} from "@/api/server/supabase/playersServerAPI";
import {usersServerAPI} from "@/api/server/supabase/usersServerAPI";
import {getSupabaseUser} from "@/utils/userUtils";
import AdminPageClient from "@/components/admin/AdminPageClient";

export default async function AdminPageServer() {
    const playerList = await playersServerAPI.getAll();
    const authUser = await getSupabaseUser();
    const user = await usersServerAPI.getByUserid(authUser?.id);

    const isUserAdmin = user?.role === 'admin';

    const clientProps = {
        playerList: playerList,
        isUserAdmin: isUserAdmin,
    }

    return (
        <AdminPageClient {...clientProps} />
    )
}