import {baseDeleteFetch, baseGetFetch, basePostFetch, basePutFetch} from "@/api/baseFetch";
import {GetProductsResponse} from "@/api/types/polar/GetProductsTypes";
import {PostCheckoutResponse} from "@/api/types/polar/PostCheckoutTypes";
import {GetCheckoutsResponse} from "@/api/types/polar/GetCheckoutsResponse";

const BASE_URL = "https://api.gumroad.com/v2/"
const API_KEY = process.env.GUMROAD_ACCESS_TOKEN!

export const gumroadServerAPI = {
    async postCheckoutsChangeContinentServer(
        originUrl: string,
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
            // success_url: `http://localhost:3000/api/polar/checkouts/success/change-continent` +
            success_url: `${originUrl}/api/polar/checkouts/success/change-continent` +
                `?checkout_id={CHECKOUT_ID}` +
                `&player_id=${playerId}` +
                `&target_continent_id=${targetContinentId}`,
        })
    },

    async getProductsServer(): Promise<GetProductsResponse> {
        return await getFetch("products");
    },

    async getCheckout(checkoutId: string): Promise<GetCheckoutsResponse> {
        return await getFetch(`checkouts/${checkoutId}`);
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