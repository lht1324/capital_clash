'use client'

import {memo, useEffect, useMemo} from "react";
import {useComponentStateStore} from "@/store/componentStateStore";
import {CheckoutSuccessStatus} from "@/api/types/polar/CheckoutSuccessStatus";

function CheckoutSuccessModal() {
    const { checkoutSuccessStatus, setCheckoutSuccessStatus } = useComponentStateStore();

    const message = useMemo(() => {
        switch (checkoutSuccessStatus) {
            case CheckoutSuccessStatus.NEW_STAKE:
                return 'All set! Your stake has been added.';
            case CheckoutSuccessStatus.CONTINENT_CHANGE:
                return 'A new frontier awaits!\nWelcome to your new continent.';
            default:
                return 'Payment completed successfully!';
        }
    }, [checkoutSuccessStatus]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setCheckoutSuccessStatus(null);
            }
        }

        document.addEventListener('keydown', handleEscape)
        return () => document.removeEventListener('keydown', handleEscape)
    }, [setCheckoutSuccessStatus]);

    return (
        <>
            {/* 배경 오버레이 */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4"
                onClick={() => setCheckoutSuccessStatus(null)}
            >
                {/* 모달 콘텐츠 */}
                <div
                    className="bg-gray-900 rounded-lg shadow-xl w-full max-w-md"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* 헤더 */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-700">
                        <h2 className="text-2xl font-bold text-white">
                            🎉 Payment Completed!
                        </h2>
                        <button
                            onClick={() => setCheckoutSuccessStatus(null)}
                            className="text-gray-400 hover:text-white transition-colors text-2xl"
                        >
                            ×
                        </button>
                    </div>

                    {/* 콘텐츠 */}
                    <div className="p-8 text-center">
                        <p className="text-lg text-gray-300 whitespace-pre-line">{message}</p>
                    </div>

                    {/* 버튼 */}
                    <div className="p-6 flex justify-end space-x-4 bg-gray-900/50 rounded-b-lg">
                        <button
                            onClick={() => setCheckoutSuccessStatus(null)}
                            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors w-full"
                        >
                            Confirm
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}

export default memo(CheckoutSuccessModal);
