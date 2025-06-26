import { create } from 'zustand'
import {Position} from "@/lib/treemapAlgorithm";

interface CameraState {
    selectedContinentId: string | null,
    isWorldView: boolean,
    cameraTarget: Position | null

    setSelectedContinentId: (id: string | null) => void
    setWorldView: (isWorld: boolean) => void
    setCameraTarget: (target: Position | null) => void
    resetContinentSelection: () => void
}

export const useCameraStateStore = create<CameraState>((set) => ({
    selectedContinentId: null,
    isWorldView: true,
    cameraTarget: null,

    setSelectedContinentId: (id) => set({ selectedContinentId: id }),
    setWorldView: (isWorld) => set({ isWorldView: isWorld }),
    setCameraTarget: (target) => set({ cameraTarget: target }),
    resetContinentSelection: () => set({ selectedContinentId: null, isWorldView: true, cameraTarget: null }),
}))