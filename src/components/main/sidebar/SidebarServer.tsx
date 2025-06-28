import {continentsServerAPI} from "@/api/server/supabase/continentsServerAPI";
import {playersServerAPI} from "@/api/server/supabase/playersServerAPI";
import {usersServerAPI} from "@/api/server/supabase/usersServerAPI";
import {Continent} from "@/api/types/supabase/Continents";
import {ImageStatus, Player} from "@/api/types/supabase/Players";
import {getSupabaseUser} from "@/utils/userUtils";
import SidebarClient, {SidebarClientProps} from "@/components/main/sidebar/SidebarClient";

export default async function SidebarServer() {
    const continentList: Continent[] = await continentsServerAPI.getAll();
    const playerList: Player[] = await playersServerAPI.getAll();
    const authUser = await getSupabaseUser();
    const user = await usersServerAPI.getByUserid(authUser?.id);

    console.log("server user", user);

    const vipPlayerList = playerList.sort((a, b) => {
        return b.investment_amount - a.investment_amount;
    }).slice(0, 4);

    const userInvestmentInfo = playerList.find((player) => {
        return player.user_id === user?.id;
    });

    console.log("server sidebar userInvestmentInfo", userInvestmentInfo);

    const filteredPlayerListByContinent = playerList.filter((player) => {
        return player.continent_id === userInvestmentInfo?.continent_id;
    });

    const isVip = vipPlayerList.some((player) => {
        return player.user_id === user?.id;
    })

    const isUserInvestmentInfoExist = !!userInvestmentInfo;

    const investmentAmount = userInvestmentInfo?.investment_amount ?? 0;

    const totalInvestmentAmount = isUserInvestmentInfoExist
        ? filteredPlayerListByContinent.reduce((acc, player) => {
            return acc + player.investment_amount;
        }, 0)
        : 0;

    const newSharePercentage = investmentAmount / totalInvestmentAmount * 100;
    const sharePercentage = newSharePercentage > 0.01
        ? newSharePercentage
        : 0.01;

    const userContinentRank = filteredPlayerListByContinent.length !== 0
        ? filteredPlayerListByContinent.sort((a, b) => {
            return b.investment_amount - a.investment_amount;
        }).findIndex((player) => {
            return player.user_id === userInvestmentInfo?.user_id;
        }) + 1
        : -1;
    const userOverallRank = playerList.length !== 0
        ? playerList.sort((a, b) => {
            return b.investment_amount - a.investment_amount;
        }).findIndex((player) => {
            return player.user_id === userInvestmentInfo?.user_id;
        }) + 1
        : -1;

    const sumDailyViews = (dailyViews: number[]) => {
        return dailyViews.reduce((acc, dailyView) => acc + dailyView, 0);
    }
    const userViewsRank = playerList.length !== 0
        ? playerList.sort((a, b) => {
            return sumDailyViews(b.daily_views) - sumDailyViews(a.daily_views);
        }).findIndex((player) => {
            return player.user_id === userInvestmentInfo?.user_id;
        })
        : -1;

    const imageUrl = userInvestmentInfo?.image_url;
    const imageStatus: ImageStatus = userInvestmentInfo?.image_status ?? ImageStatus.PENDING;

    const continentName = continentList.find((continent) => {
        return continent.id === userInvestmentInfo?.continent_id;
    })?.name ?? "-";

    const userCreatedDate = userInvestmentInfo?.created_at
        ? new Date(userInvestmentInfo.created_at).toLocaleString()
        : "-"

    const userDailyViewList = userInvestmentInfo?.daily_views
        ? userInvestmentInfo.daily_views
        : [0, 0, 0, 0, 0, 0, 0]
    const userPreviousSundayView = userInvestmentInfo?.previous_sunday_view
        ? userInvestmentInfo.previous_sunday_view
        : 0

    const clientProps = {
        user: user,
        continentList: continentList,
        playerList: playerList,
        vipPlayerList: vipPlayerList,
        /* 사용자-특화 데이터 */
        userInvestmentInfo: userInvestmentInfo,
        filteredPlayerListByContinent: filteredPlayerListByContinent,
        isVip: isVip,
        isUserInvestmentInfoExist: isUserInvestmentInfoExist,
        /* 금액·지분 */
        investmentAmount: investmentAmount,
        totalInvestmentAmount: totalInvestmentAmount,
        sharePercentage: sharePercentage,
        /* 랭킹 */
        userContinentRank: userContinentRank,
        userOverallRank: userOverallRank,
        userViewsRank: userViewsRank,
        /* 프로필 이미지 · 상태 */
        imageUrl: imageUrl,
        imageStatus: imageStatus,
        /* 부가 정보 */
        continentName: continentName,
        userCreatedDate: userCreatedDate,
        userDailyViewList: userDailyViewList,
        userPreviousSundayView: userPreviousSundayView,
    } as SidebarClientProps;

    return (
        <SidebarClient
            {...clientProps}
        />
    )
}
