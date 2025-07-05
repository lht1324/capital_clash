import {baseDeleteFetch, baseFilePostFetch} from "@/api/baseFetch";
import {Image} from "@/api/types/supabase/Images";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL + "images/";

export const imagesClientAPI = {
    async postImage(file: File, userId: string, playerId: string
    ): Promise<Image | null> {
        return await postFileFetch("", {
            file: file,
            userId: userId,
            playerId: playerId,
        })
    },

    async deleteImage(userImageUrl: string) {
        return await deleteFetch("", {
            userImageUrl: userImageUrl,
        })
    },
}

async function postFileFetch(path: string, body: Record<string, any>) {
    return await baseFilePostFetch(`${BASE_URL}${path}`, undefined, body)
}

async function deleteFetch(path: string, body: Record<string, any>) {
    return await baseDeleteFetch(`${BASE_URL}${path}`, undefined, body);
}