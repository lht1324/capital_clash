'use server'

import {NextRequest, NextResponse} from "next/server";
import {gumroadServerAPI} from "@/api/server/gumroad/gumroadServerAPI";
import {playersServerAPI} from "@/api/server/supabase/playersServerAPI";
import {decodeBase64} from "@/utils/base64Utils";

enum PurchaseType {
    NEW_STAKE = "NEW_STAKE",
    MOVE_CONTINENT = "MOVE_CONTINENT",
}

export async function POST(nextReq: NextRequest) {
    try {
        // Gumroad에서 전송된 form data 파싱
        const formData = await nextReq.formData();

        const saleId = formData.get('sale_id') as (string | null);
        const productId = formData.get('product_id') as (string | null);

        const encodedUserId = formData.get('url_params[user_id]') as (string | null); // base64
        const encodedPlayerId = formData.get('url_params[player_id]') as (string | null); // base64
        const decodedUserId = encodedUserId
            ? decodeBase64(encodedUserId)
            : null;
        const decodedPlayerId = encodedPlayerId
            ? decodeBase64(encodedPlayerId)
            : null;

        const continentId = formData.get('url_params[continent_id]') as (string | null);
        const name = formData.get('url_params[name]') as (string | null);

        if (!saleId || !productId || !decodedUserId) throw Error("Ping's data is not valid.");

        const saleInfo = await gumroadServerAPI.getSalesBySaleId(saleId);

        if (!saleInfo) throw Error("Sale data is not valid.");

        const purchasedProduct = await gumroadServerAPI.getProductById(productId);

        console.log("🔔 Gumroad Ping 수신", {
            productId: productId,
            playerId: decodedPlayerId,
            userId: decodedUserId,
            continentId: continentId,
            saleInfo: saleInfo,
            purchasedProduct: purchasedProduct,
        });

        if (purchasedProduct) {
            const purchaseType = !purchasedProduct.name.includes("continent")
                ? PurchaseType.NEW_STAKE
                : PurchaseType.MOVE_CONTINENT;

            switch (purchaseType) {
                case PurchaseType.NEW_STAKE: {
                    if (name && continentId) {
                        const result = await playersServerAPI.postPlayers({
                            user_id: decodedUserId,
                            continent_id: continentId,
                            stake_amount: saleInfo.price / 100,
                            name: name
                        });

                        if (!result) throw Error("Insert to 'Players' failed.");

                        break;
                    } else {
                        const prevPlayer = await playersServerAPI.getPlayersByUserId(decodedUserId);

                        if (!prevPlayer || !decodedPlayerId) throw Error("Player not found!");

                        const result = await playersServerAPI.patchPlayersById(decodedPlayerId, {
                            stake_amount: prevPlayer.stake_amount + saleInfo.price / 100,
                        });

                        if (result) {
                            break;
                        } else {
                            throw Error("Patch to 'Players' failed.");
                        }
                    }
                }
                case PurchaseType.MOVE_CONTINENT: {
                    const prevPlayer = await playersServerAPI.getPlayersByUserId(decodedUserId);

                    if (!prevPlayer || !continentId || !decodedPlayerId) throw Error("Player not found!");

                    const result = await playersServerAPI.patchPlayersById(decodedPlayerId, {
                        continent_id: continentId,
                        stake_amount: prevPlayer.stake_amount + 2,
                    })

                    if (result) {
                        break;
                    } else {
                        throw Error("Patch to 'Players' failed.");
                    }
                }
                default: {
                    throw Error("Invalid purchase.");
                }
            }
        } else {
            throw Error("Product is not found.");
        }


        // Gumroad에게 성공 응답 (필수!)
        return new Response('OK', { status: 200 });
    } catch (error) {
        console.error(error)
        return NextResponse.json(
            { error: (error as Error).message },
            { status: 500 },
        )
    }
}