import {baseDeleteFetch, baseGetFetch, basePatchFetch, basePostFetch, basePutFetch} from "@/api/baseFetch";
import {Player} from "@/api/types/supabase/Players";
import {PostPlayersReq} from "@/api/types/supabase/players/PostPlayersReq";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL + "players/";

export const playersClientAPI = {
    async getPlayers(): Promise<Player[]> {
        return await getFetch("");
    },

    async postPlayers(req: Partial<Player>): Promise<Player | null> {
        return await postFetch("", req);
    },

    async getPlayersById(id: string): Promise<Player> {
        return await getFetch(`${id}`)
    },

    async patchPlayersById(id: string, req: Partial<Player>): Promise<Player | null> {
        return await patchFetch(`${id}`, req)
    }
}


async function postFetch(path: string, body: any) {
    return await basePostFetch(`${BASE_URL}${path}`, undefined, body);
}

async function getFetch(path: string) {
    return await baseGetFetch(`${BASE_URL}${path}`, undefined)
}

async function putFetch(path: string, body: any) {
    return await basePutFetch(`${BASE_URL}${path}`, undefined, body)
}

async function deleteFetch(path: string) {
    return await baseDeleteFetch(`${BASE_URL}${path}`, undefined)
}

async function patchFetch(path: string, body: any) {
    return await basePatchFetch(`${BASE_URL}${path}`, undefined, body);
}