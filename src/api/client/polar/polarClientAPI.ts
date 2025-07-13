'use client'

import {baseDeleteFetch, baseGetFetch, basePostFetch, basePutFetch} from "@/api/baseFetch";
import {GetProductsResponse} from "@/api/types/polar/GetProductsTypes";
import {PostCheckoutResponse} from "@/api/types/polar/PostCheckoutTypes";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL + "polar/";

export const polarClientAPI = {
    async postCheckoutsStakeClient(
        productId: string,
        userId: string,
        amount: number,
        email: string,
        name: string | null, // Additional -> null
        continentId: string | null, // Additional -> null
    ): Promise<PostCheckoutResponse> {
        return await postFetch("checkouts/request/stake", {
            productId: productId,
            amount: amount,
            customer_email: email,
            metadata: (name && continentId) ? {
                user_id: userId,
                stake_amount: amount,
                email: email,
                name: name,
                continent_id: continentId,
            } : {
                user_id: userId,
                stake_amount: amount,
                email: email,
            }
        })
    },

    async postCheckoutsChangeContinentClient(
        productId: string,
        playerId: string,
        targetContinentId: string,
        email: string,
    ): Promise<PostCheckoutResponse> {
        return await postFetch("checkouts/request/change-continent", {
            productId: productId,
            playerId: playerId,
            targetContinentId: targetContinentId,
            email: email,
        })
    },

    async getProductsClient(): Promise<GetProductsResponse> {
        return await getFetch("products");
    }
}


async function postFetch(path: string, body: any) {
    return await basePostFetch(
        `${BASE_URL}${path}`,
        undefined,
        body
    )
}

async function getFetch(path: string) {
    return await baseGetFetch(
        `${BASE_URL}${path}`
    )
}

async function putFetch(path: string, body: any) {
    return await basePutFetch(
        `${BASE_URL}${path}`,
        undefined,
        body
    )
}

async function deleteFetch(path: string) {
    return await baseDeleteFetch(
        `${BASE_URL}${path}`
    )
}