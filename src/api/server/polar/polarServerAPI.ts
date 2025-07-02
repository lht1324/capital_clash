import {baseDeleteFetch, baseGetFetch, basePostFetch, basePutFetch} from "@/api/baseFetch";
import {GetProductsResponse} from "@/api/types/polar/GetProductsTypes";
import {PostCheckoutResponse} from "@/api/types/polar/PostCheckoutTypes";

const BASE_URL = "https://sandbox-api.polar.sh/v1/"
const API_KEY = process.env.POLAR_ACCESS_TOKEN!

export const polarServerAPI = {
    async postCheckoutsStakeServer(
        productId: string,
        amount: number,
        metadata: {
            user_id: string,
            stake_amount: number,
            email: string,
            name?: string,
            continent_id?: string,
        },
        email: string,
    ): Promise<PostCheckoutResponse> {
        return await postFetch("checkouts", {
            products: [productId],
            is_business_customer: false,
            require_billing_address: false,
            amount: amount * 100,
            customer_email: email,
            // success_url: "https://capital-clash.vercel.app/polar/checkout/success"
            success_url: `http://localhost:3000/api/polar/checkouts/success/stake` +
                `?checkout_id={CHECKOUT_ID}` +
                `&user_id=${metadata.user_id}` +
                `&stake_amount=${metadata.stake_amount}` +
                `&email=${metadata.email}` +
                (metadata.name ? `&name=${metadata.name}` : ``) +
                (metadata.continent_id ? `&name=${metadata.continent_id}` : ``),
            metadata: metadata,
        })
    },

    async postCheckoutsChangeContinentServer(
        productId: string,
        playerId: string,
        targetContinentId: string,
        email: string,
    ): Promise<PostCheckoutResponse> {
        return await postFetch("checkouts", {
            products: [productId],
            is_business_customer: false,
            require_billing_address: false,
            customer_email: email,
            // success_url: "https://capital-clash.vercel.app/polar/checkout/success"
            success_url: `http://localhost:3000/api/polar/checkouts/success/change-continent` +
                `?checkout_id={CHECKOUT_ID}` +
                `&player_id=${playerId}` +
                `&target_continent_id=${targetContinentId}`,
        })
    },

    async getProductsServer(): Promise<GetProductsResponse> {
        return await getFetch("products");
    }
}

async function postFetch(path: string, body: any) {
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