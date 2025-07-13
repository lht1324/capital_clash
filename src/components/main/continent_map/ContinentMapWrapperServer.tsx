'use server'

import ContinentMapWrapperClient from "@/components/main/continent_map/ContinentMapWrapperClient";

export default async function ContinentMapWrapperServer() {
    const clientProps = {

    }

    return (
        <ContinentMapWrapperClient {...clientProps} />
    )
}