import {useContinentStore} from "@/store/continentStore";
import {memo, useCallback, useEffect, useMemo} from "react";
import SingleContinent from "@/components/continent_map/SingleContinent";
import {useInvestorStore} from "@/store/investorsStore";

function WorldScene() {
    const { continents } = useContinentStore();
    const { getFilteredInvestorListByContinent } = useInvestorStore();

    const continentList = useMemo(() => {
        return Object.values(continents);
    }, [continents])

    return (
        <>
            {/* 전역 조명 */}
            <ambientLight intensity={0.8} />
            <pointLight position={[20, 20, 20]} intensity={1} />
            <pointLight position={[-20, -20, 20]} intensity={0.5} />

            {/* 모든 대륙 렌더링 */}
            {continentList.map((continent) => {
                return <SingleContinent
                    key={continent.id}
                    continent={continent}
                    investorList={getFilteredInvestorListByContinent(continent.id)}
                />
            })}
        </>
    )
}

export default memo(WorldScene);