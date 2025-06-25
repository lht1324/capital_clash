'use client'

import {baseDeleteFetch, baseGetFetch, basePostFetch, basePutFetch} from "@/api/baseFetch";
import {GetProductsResponse} from "@/api/client/polar/types/GetProductsTypes";
import {PostCheckoutResponse} from "@/api/client/polar/types/PostCheckoutTypes";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
// const API_KEY = process.env.POLAR_ACCESS_TOKEN!

export async function postCheckoutsClient(
    productId: string,
    amount: number,
    email?: string,
): Promise<PostCheckoutResponse> {
    console.log("postCheckoutsClient")
    return await postFetch("checkouts", {
        productId: productId,
        amount: amount,
        customer_email: email,
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