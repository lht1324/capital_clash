'use client'

import {baseDeleteFetch, baseGetFetch, basePostFetch, basePutFetch} from "@/api/baseFetch";
import {GetProductsResponse} from "@/api/types/polar/GetProductsTypes";
import {PostCheckoutResponse} from "@/api/types/polar/PostCheckoutTypes";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL + "polar";
// const API_KEY = process.env.POLAR_ACCESS_TOKEN!

export async function postCheckoutsClient(
    productId: string,
    userId: string,
    amount: number,
    name: string,
    continentId: string | null, // Additional -> null
    email?: string,
): Promise<PostCheckoutResponse> {
    console.log("postCheckoutsClient")
    return await postFetch("checkouts", {
        productId: productId,
        amount: amount,
        customer_email: email,
        metadata: {
            user_id: userId,
            continent_id: continentId,
            investment_amount: amount,
            name: name,
            email: email,
        }
    })
}

export async function getProductsClient(): Promise<GetProductsResponse> {
    console.log("getProductsClient")
    return await getFetch("products");
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