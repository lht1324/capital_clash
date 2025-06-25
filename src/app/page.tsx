import HomeClient from "@/app/HomeClient";
import SidebarServer from "@/components/main/sidebar/SidebarServer";
import HeaderServer from "@/components/main/header/HeaderServer";

export default async function Page() {
    return (
        <>
            <HeaderServer/>
            <div className="flex min-h-screen">
                <SidebarServer/>
                <HomeClient/>
            </div>
        </>
    )
}