'use client'

import { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase/supabase'
import RankingModal from './RankingModal'
import PurchaseTerritoryModal from '../PurchaseTerritoryModal'
import { useUserStore } from '@/store/userStore'
import { UserCircleIcon } from '@heroicons/react/24/outline'
import { useContinentStore } from '@/store/continentStore'
import ProfileInfoModal from "@/components/main/header/ProfileInfoModal";
import DropDownMenu from "@/components/main/header/DropDownMenu";
import {useInvestorStore} from "@/store/investorsStore";
import {useOnSizeChanged} from "@/hooks/useOnSizeChanged";

function Header({
    onChangeHeight
} : {
    onChangeHeight?: (height: number) => void
}) {
    const headerRef = useRef(null);

    const [isRankingModalOpen, setIsRankingModalOpen] = useState(false)
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false)
    const [isProfileInfoModalOpen, setIsProfileInfoModalOpen] = useState(false)
    const { user, setUser } = useUserStore()
    const { setSidebarOpen } = useContinentStore()
    const { investors } = useInvestorStore();

    const isAdditionalContribution = useMemo(() => {
        const contributor = Object.values(investors).find((investor) => {
            return investor.user_id === user?.id
        })

        return !!contributor
    }, [investors, user?.id])

    const handleGoogleLogin = useCallback(async () => {
        try {
            await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: "https://capital-clash.vercel.app/",
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    }
                }
            })
        } catch (error) {
            console.error('로그인 중 오류 발생:', error)
        }
    }, []);

    const handleOpenProfileSettingModal = useCallback(() => {
        setIsProfileInfoModalOpen(true);
    }, []);

    const handleSignOut = useCallback(async () => {
        try {
            await supabase.auth.signOut()
            setSidebarOpen(false) // 로그아웃 시 사이드바 닫기
        } catch (error) {
            console.error('로그아웃 중 오류 발생:', error)
        }
    }, []);

    useEffect(() => {
        // 초기 로그인 상태 체크
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (!session?.user) {
                setSidebarOpen(false) // 로그아웃 시 사이드바 닫기
            }
        })

        return () => {
            subscription.unsubscribe()
        }
    }, [setUser, setSidebarOpen])

    if (onChangeHeight) {
        useOnSizeChanged(headerRef, (rect) => {
            onChangeHeight(rect.height)
        })
    }

    return (
        <header
            className="fixed top-0 left-0 right-0 h-16 bg-gray-900 text-white z-50"
            ref={headerRef}
        >
            <div className="container h-full mx-auto px-4 flex items-center justify-between">
                {/* 로고 */}
                <Link href="/public" className="flex items-center space-x-2">
                    <span className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                        CC
                    </span>
                    <span className="text-xl font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        Capital Clash
                    </span>
                </Link>

                {/* 중앙 네비게이션 버튼들 */}
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => setIsRankingModalOpen(true)}
                        className="flex items-center space-x-1 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
                    >
                        <span>🏆</span>
                        <span>Leaderboard</span>
                    </button>

                    <button
                        onClick={() => setIsPurchaseModalOpen(true)}
                        className="flex items-center space-x-1 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-colors"
                    >
                        <span>💎</span>
                        <span>{isAdditionalContribution ? "Additional Purchase" : "Purchase Territory"}</span>
                    </button>
                </div>

                {/* 로그인/프로필 영역 */}
                {!user ? (
                    <button
                        onClick={handleGoogleLogin}
                        className="flex items-center"
                    >
                        <Image
                            src="/signin-assets/google_signin_normal.png"
                            alt="Sign in with Google"
                            width={189}
                            height={40}
                            priority
                            className="hidden sm:block"
                        />
                        <Image
                            src="/signin-assets/google_signin_small.png"
                            alt="Sign in with Google"
                            width={152}
                            height={36}
                            priority
                            className="sm:hidden"
                        />
                    </button>
                ) : (
                    <DropDownMenu
                        trigger={
                            <div className="flex items-center space-x-2">
                                <UserCircleIcon className="h-6 w-6" />
                                <span>{user?.name || 'User'}</span>
                            </div>
                        }
                        items={[
                            {
                                label: 'Profile',
                                onClick: handleOpenProfileSettingModal,
                                icon: '👤'
                            },
                            {
                                label: 'Sign out',
                                onClick: handleSignOut,
                                icon: '👋'
                            }
                        ]}
                    />
                )}
            </div>

            {/* 랭킹 모달 */}
            {isRankingModalOpen && <RankingModal
                onClose={() => setIsRankingModalOpen(false)}
            />}

            {/* 구매 모달 */}
            {isPurchaseModalOpen && <PurchaseTerritoryModal
                onClose={() => setIsPurchaseModalOpen(false)}
            />}

            {/* 프로필 설정 모달 */}
            {isProfileInfoModalOpen && <ProfileInfoModal
                onClose={() => setIsProfileInfoModalOpen(false)}
            />}
        </header>
    )
}

export default memo(Header);