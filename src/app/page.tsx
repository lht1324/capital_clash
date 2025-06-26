'use server'

import SidebarServer from "@/components/main/sidebar/SidebarServer";
import HeaderServer from "@/components/main/header/HeaderServer";
import ContinentMapWrapperServer from "@/components/main/continent_map/ContinentMapWrapperServer";

export default async function Page() {
    return (
        <>
            <HeaderServer/>
            <div className="flex min-h-screen">
                <SidebarServer/>
                <ContinentMapWrapperServer/>
            </div>
        </>
    )
}