import {useContinentStore} from "@/store/continentStore";
import {memo, useEffect, useMemo} from "react";
import SingleContinent from "@/components/continent_map/SingleContinent";
import {useInvestorsStore} from "@/store/investorsStore";

function WorldScene() {
    const { continents } = useContinentStore();
    const { investors, getInvestorsByContinent } = useInvestorsStore();

    const investorList = useMemo(() => {
        return Object.values(investors)
    }, [investors]);

    return (
        <>
            {/* 전역 조명 */}
            <ambientLight intensity={0.8} />
            <pointLight position={[20, 20, 20]} intensity={1} />
            <pointLight position={[-20, -20, 20]} intensity={0.5} />

            {/* 모든 대륙 렌더링 */}
            {Object.values(continents).map((continent) => {
                const filteredInvestorList = investorList.filter((investor) => investor.continent_id === continent.id);

                return <SingleContinent
                    key={continent.id}
                    continent={continent}
                    investorList={getInvestorsByContinent(continent.id)}
                />
            })}
        </>
    )
}

export default memo(WorldScene);