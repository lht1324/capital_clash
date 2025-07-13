'use client'

import {useCallback, useEffect} from "react";
import {usePlayersStore} from "@/store/playersStore";

export default function ScreenManager() {
    const { setScreenSize } = usePlayersStore();

    const handleResize = useCallback(() => {
        setScreenSize(window.screen.width, window.screen.height);
    }, [setScreenSize]);

    useEffect(() => {
        window.addEventListener("resize", handleResize);
        handleResize();

        return () => {
            window.removeEventListener("resize", handleResize);
        }
    }, [handleResize]);

    return null;
}