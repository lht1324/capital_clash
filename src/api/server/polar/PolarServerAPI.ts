'use server'

import {baseDeleteFetch, baseGetFetch, basePostFetch, basePutFetch} from "@/api/baseFetch";
import {GetProductsResponse} from "@/api/client/polar/types/GetProductsTypes";
import {PostCheckoutResponse} from "@/api/client/polar/types/PostCheckoutTypes";

const BASE_URL = "https://sandbox-api.polar.sh/v1/"
const API_KEY = process.env.POLAR_ACCESS_TOKEN!

export async function postCheckoutsServer(
    productId: string,
    amount: number,
    email?: string,
): Promise<PostCheckoutResponse> {
    console.log("postCheckoutsServer")
    return await postFetch("checkouts", {
        products: [productId],
        is_business_customer: false,
        require_billing_address: false,
        amount: amount * 100,
        customer_email: email,
        success_url: "https://capital-clash.vercel.app/"
    })
}

export async function getProductsServer(): Promise<GetProductsResponse> {
    console.log("getProductsServer")
    return await getFetch("products");
}


async function postFetch(path: string, body: any) {
    console.log(`postBody`, body);

    return await basePostFetch(
        `${BASE_URL}${path}`,
        {
            Authorization: `Bearer ${API_KEY}`,
        },
        body
    )
}

async function getFetch(path: string) {
    console.log(`getKeyGlobal = ${API_KEY}`)

    return await baseGetFetch(
        `${BASE_URL}${path}`,
        {
            Authorization: `Bearer ${API_KEY}`,
        },
    )
}

async function putFetch(path: string, body: any) {
    return await basePutFetch(
        `${BASE_URL}${path}`,
        {
            Authorization: `Bearer ${API_KEY}`,
        },
        body
    )
}

async function deleteFetch(path: string) {
    return await baseDeleteFetch(
        `${BASE_URL}${path}`,
        {
            Authorization: `Bearer ${API_KEY}`,
        },
    )
}