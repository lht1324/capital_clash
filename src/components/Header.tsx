'use client'

import {useState, useEffect, useCallback} from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/supabase'
import RankingModal from './RankingModal'
import PurchaseTileModal from './PurchaseTileModal'
import { ContinentId } from '@/store/continentStore'
import { useUserStore } from '@/store/userStore'
import DropdownMenu from './ui/dropdown-menu'
import { UserCircleIcon } from '@heroicons/react/24/outline'
import { useContinentStore } from '@/store/continentStore'
import ProfileInfoModal from "@/components/ProfileInfoModal";

export default function Header() {
    const router = useRouter()
    const [isRankingModalOpen, setIsRankingModalOpen] = useState(false)
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false)
    const [isProfileInfoModalOpen, setIsProfileInfoModalOpen] = useState(false)
    const { user, setUser } = useUserStore()
    const { setSidebarOpen } = useContinentStore()

    const handleGoogleLogin = useCallback(async () => {
        try {
            await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
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
            if (session?.user) {
                setUser(session.user)
            } else {
                setUser(null)
                setSidebarOpen(false) // 로그아웃 시 사이드바 닫기
            }
        })

        return () => {
            subscription.unsubscribe()
        }
    }, [setUser, setSidebarOpen])

    return (
        <header className="fixed top-0 left-0 right-0 h-16 bg-gray-900 text-white z-50">
            <div className="container h-full mx-auto px-4 flex items-center justify-between">
                {/* 로고 */}
                <Link href="/" className="flex items-center space-x-2">
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
                        <span>Purchase Territory</span>
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
                    <DropdownMenu
                        trigger={
                            <div className="flex items-center space-x-2">
                                <UserCircleIcon className="h-6 w-6" />
                                <span>{user.user_metadata?.name || '사용자'}</span>
                            </div>
                        }
                        items={[
                            {
                                label: '프로필',
                                onClick: handleOpenProfileSettingModal,
                                icon: '👤'
                            },
                            {
                                label: '로그아웃',
                                onClick: handleSignOut,
                                icon: '👋'
                            }
                        ]}
                    />
                )}
            </div>

            {/* 랭킹 모달 */}
            <RankingModal
                isOpen={isRankingModalOpen}
                onClose={() => setIsRankingModalOpen(false)}
            />

            {/* 구매 모달 */}
            <PurchaseTileModal
                isOpen={isPurchaseModalOpen}
                onClose={() => setIsPurchaseModalOpen(false)}
            />

            {/* 프로필 설정 모달 */}
            <ProfileInfoModal
                isOpen={isProfileInfoModalOpen}
                onClose={() => setIsProfileInfoModalOpen(false)}
            />
        </header>
    )
}
