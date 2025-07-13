import {baseGetFetch} from "@/api/baseFetch";
import {GetProductsResponse, Product} from "@/api/types/gumroad/GetProductsResponse";

const BASE_URL = "https://api.gumroad.com/v2"
const API_KEY = process.env.GUMROAD_ACCESS_TOKEN!

export const gumroadServerAPI = {
    async getProducts(): Promise<Product[]> {
        try {
            const response = await getFetch("products") as GetProductsResponse;

            if (response.success) {
                return response.products;
            } else {
                throw Error("(GET) /products is not successful.")
            }
        } catch (error) {
            console.error(error);
            return [];
        }
    },
}

async function getFetch(path: string) {
    console.log(`getKeyGlobal = ${API_KEY}`)

    return await baseGetFetch(
        `${BASE_URL}/${path}`,
        {
            Authorization: `Bearer ${API_KEY}`,
        },
    )
}