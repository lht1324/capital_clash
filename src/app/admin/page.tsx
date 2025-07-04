'use client'

import {memo, useEffect, useCallback, useMemo, useState} from "react";
import {useRouter} from "next/navigation";
import {useUserStore} from "@/store/userStore";
import {useSupabaseData} from "@/hooks/useSupabaseData";
import Header from "@/components/main/header/Header";
import ImageReviewModal from "@/components/admin/image_review_modal/ImageReviewModal";

function AdminPage() {
    const router = useRouter()
    const { user } = useUserStore()

    const [isInitialized, setIsInitialized] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [headerHeight, setHeaderHeight] = useState(0);
    const [isImageReviewModalOpen, setIsImageReviewModalOpen] = useState(false);

    const isUserAdmin = useMemo(() => {
        console.log(`role = ${user?.role}`)
        return user?.role === 'admin';
    }, [user?.role]);

    const onChangeHeaderHeight = useCallback((height: number) => {
        console.log(`headerHeight = ${height}`)
        setHeaderHeight(height);
    }, []);

    useSupabaseData(
        () => {
            setIsInitialized(true);
        }
    );

    // 관리자 권한 확인
    useEffect(() => {
        const timer = setTimeout(() => {
            if (isInitialized) {
                if (!isUserAdmin) {
                    // 로그인하지 않은 경우, 관리자가 아닌 경우 홈으로 리다이렉트
                    router.push('/');
                }

                setIsLoading(false);
            }
        }, 3000);

        return () => clearTimeout(timer);
    }, [isInitialized, isUserAdmin, router]);

    if (!isUserAdmin) {
        return null // 리다이렉트 중이므로 아무것도 렌더링하지 않음
    }

    return (
        !isLoading ? (<div className="min-h-screen">
            <Header
                onChangeHeight={onChangeHeaderHeight}
            />
            <div style={{ height: `${headerHeight}px` }}/>
            <div className="p-12">
                <h1 className="text-3xl font-bold mb-8 text-gray-800">관리자 대시보드</h1>

                {/* 관리자 기능 카드 그리드 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* 이미지 승인 관리 카드 */}
                    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-gray-800">이미지 승인 관리</h2>
                            <span className="text-2xl">🖼️</span>
                        </div>
                        <p className="text-gray-600 mb-4">투자자가 업로드한 이미지를 검토하고 승인 또는 거부합니다.</p>
                        <button 
                            onClick={() => setIsImageReviewModalOpen(true)}
                            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            관리하기
                        </button>
                    </div>

                    {/* 추가 기능 카드 (확장성을 위한 자리 표시자) */}
                    <div className="bg-white rounded-lg shadow-md p-6 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center">
                        <span className="text-4xl text-gray-400 mb-2">➕</span>
                        <p className="text-gray-500 text-center">추가 관리 기능</p>
                    </div>
                </div>
            </div>

            {/* 이미지 승인 관리 모달 */}
            {isImageReviewModalOpen && (<ImageReviewModal
                onClose={() => setIsImageReviewModalOpen(false)}
            />)}
        </div>) : (<div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="text-xl font-semibold">로딩 중...</div>
        </div>)
    )
}

export default memo(AdminPage);
