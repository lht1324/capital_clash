import { create } from 'zustand'
import {CheckoutSuccessStatus} from "@/api/types/polar/CheckoutSuccessStatus";

interface ComponentState {
    isSidebarOpen: boolean,
    checkoutSuccessStatus: CheckoutSuccessStatus | null,

    setIsSidebarOpen: (isOpen: boolean) => void,
    setCheckoutSuccessStatus: (status: CheckoutSuccessStatus | null) => void,
}

export const useComponentStateStore = create<ComponentState>((set) => ({
    isSidebarOpen: false,
    checkoutSuccessStatus: null,

    setIsSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
    setCheckoutSuccessStatus: (status: CheckoutSuccessStatus | null) => set({ checkoutSuccessStatus: status }),
}))