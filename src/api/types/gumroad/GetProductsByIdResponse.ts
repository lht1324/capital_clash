import {Product} from "@/api/types/gumroad/GetProductsResponse";

export interface GetProductsByIdResponse {
    success: boolean;
    product: Product;
}