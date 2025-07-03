'use server'

import { Metadata } from 'next'
import { decodeBase64 } from "@/utils/base64Utils";
import SidebarServer from "@/components/main/sidebar/SidebarServer";
import HeaderServer from "@/components/main/header/HeaderServer";
import ContinentMapWrapperServer from "@/components/main/continent_map/ContinentMapWrapperServer";
import StoreInitializer from "@/components/main/StoreInitializer";
import {Continent} from "@/api/types/supabase/Continents";
import {Player} from "@/api/types/supabase/Players";
import {continentsServerAPI} from "@/api/server/supabase/continentsServerAPI";
import {playersServerAPI} from "@/api/server/supabase/playersServerAPI";
import {calculateSquareLayout, getContinentPosition, PlacementResult, Position} from "@/lib/treemapAlgorithm";
import {CheckoutSuccessStatus} from "@/api/types/polar/CheckoutSuccessStatus";

type Props = {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
    // searchParams: Promise<URLSearchParams>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
    const defaultMetaData = {
        title: 'Capital Clash',
        description: 'Dominate the world with your capital.',
        // 필요하다면 기본 OG 이미지도 설정할 수 있습니다.
        // openGraph: { images: ['/default-preview-image.png'] },
    }
    const awaitedParams = await searchParams;
    const userIdentifier = awaitedParams?.user_identifier as string;

    // 공유 링크가 아닌, 일반적인 접속일 경우 기본 메타데이터를 보여줍니다.
    if (!userIdentifier) {
        return defaultMetaData;
    }

    try {
        // URL에서 받은 userIdentifier를 디코딩하여 플레이어 ID를 얻습니다.
        const playerId = decodeBase64(decodeURIComponent(userIdentifier));

        console.log("playerIdParam", playerId);
        
        // 해당 ID로 특정 플레이어의 정보를 서버에서 조회합니다.
        // playersServerAPI에 getPlayerById와 같은 함수가 필요합니다.
        const player = await playersServerAPI.getPlayersByPlayerId(playerId);

        if (!player) {
            return defaultMetaData;
        }

        const title = `${player.name}'s Territory | Capital Clash`;
        const description = `Total Stake: ${player.stake_amount.toLocaleString()}`;
        const imageUrl = player.image_url; // 바로 이 부분이 유저의 고유 이미지 URL입니다.

        // 조회된 플레이어 정보로 동적 메타데이터를 생성하여 반환합니다.
        return {
            title: title,
            description: description,
            openGraph: { // 페이스북, 카카오톡 등
                title: title,
                description: description,
                images: imageUrl ? [imageUrl] : [], // 유저 이미지가 있으면 그걸 사용
            },
            twitter: { // X (트위터)
                card: 'summary_large_image',
                title: title,
                description: description,
                images: imageUrl ? [imageUrl] : [], // 유저 이미지가 있으면 그걸 사용
            },
        }
    } catch (error) {
        console.error('Metadata generation error:', error);
        // 에러 발생 시 기본값으로 돌아갑니다.
        return defaultMetaData;
    }
}

export default async function Page({ searchParams }: Props) {
    const awaitedParams = await searchParams;
    const encodedPlayerId = awaitedParams?.user_identifier as string;
    const encodedCheckoutSuccessStatus = awaitedParams?.checkout_success_status as string;
    const targetPlayerId = encodedPlayerId ? decodeBase64(decodeURIComponent(encodedPlayerId)) : null;
    const checkoutSuccessStatus = encodedCheckoutSuccessStatus ? decodeURIComponent(encodedCheckoutSuccessStatus) : null;

    const continentList: Continent[] = await continentsServerAPI.getContinents();
    const playerList: Player[] = await playersServerAPI.getPlayers();
    const vipPlayerList: Player[] = Object.values(
        playerList.reduce((acc, player) => {
            const id = player.continent_id;

            if (!acc[id] || player.stake_amount > acc[id].stake_amount) {
                acc[id] = player; // 최고 투자금액 기준
            }

            return acc;
        }, {} as Record<string, Player>)
    );
    const placementResultRecord: Record<string, PlacementResult> = { }
    const continentPositionRecord: Record<string, Position> = { }

    const getFilteredPlayerListByContinent = (continentId: string) => {
        return playerList.filter((player) => {
            return player.continent_id === continentId;
        })
    };

    continentList.forEach((continent) => {
        const filteredPlayerListByContinent = continent.id !== "central"
            ? getFilteredPlayerListByContinent(continent.id)
            : vipPlayerList

        if (filteredPlayerListByContinent.length !== 0) {
            placementResultRecord[continent.id] = calculateSquareLayout(
                filteredPlayerListByContinent,
                continent.id
            )
        }
    });

    continentList.forEach((continent) => {
        if (placementResultRecord[continent.id]) {
            continentPositionRecord[continent.id] = getContinentPosition(
                placementResultRecord[continent.id],
                placementResultRecord["central"]
            );
        }
    });

    const props = {
        continentList: continentList,
        playerList: playerList,
        placementResultRecord: placementResultRecord,
        continentPositionRecord: continentPositionRecord,

        // params
        targetPlayerId: targetPlayerId,
        checkoutSuccessStatus: checkoutSuccessStatus as CheckoutSuccessStatus,
    }

    return (
        <>
            <StoreInitializer {...props} />
            <HeaderServer/>
            <div className="flex min-h-screen">
                <SidebarServer/>
                <ContinentMapWrapperServer/>
            </div>
        </>
    )
}