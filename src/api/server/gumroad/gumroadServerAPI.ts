import {baseGetFetch} from "@/api/baseFetch";
import {GetProductsResponse, Product} from "@/api/types/gumroad/GetProductsResponse";
import {GetSalesResponse, Sale} from "@/api/types/gumroad/GetSalesResponse";
import {GetSalesByIdResponse} from "@/api/types/gumroad/GetSalesByIdResponse";
import {GetProductsByIdResponse} from "@/api/types/gumroad/GetProductsByIdResponse";

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

    async getProductById(productId: string): Promise<Product | null> {
        try {
            const response = await getFetch(`products/${productId}`) as GetProductsByIdResponse;

            if (response.success) {
                return response.product;
            } else {
                throw Error("(GET) /products/:id is not successful.")
            }
        } catch (error) {
            console.error(error);

            return null;
        }
    },

    async getSales(): Promise<Sale[]> {
        try {
            const response = await getFetch("sales") as GetSalesResponse;

            if (response.success) {
                return response.sales;
            } else {
                throw Error("(GET) /sales is not successful.")
            }
        } catch (error) {
            console.error(error);

            return [];
        }
    },

    async getSalesBySaleId(saleId: string): Promise<Sale | null> {
        try {
            const response = await getFetch(`sales/${saleId}`) as GetSalesByIdResponse;

            if (response.success) {
                return response.sale;
            } else {
                throw Error("(GET) /sales/:id is not successful.")
            }
        } catch (error) {
            console.error(error);

            return null;
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