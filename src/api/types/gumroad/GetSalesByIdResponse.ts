import {Sale} from "@/api/types/gumroad/GetSalesResponse";

export interface GetSalesByIdResponse {
    success: boolean,
    sale: Sale,
}