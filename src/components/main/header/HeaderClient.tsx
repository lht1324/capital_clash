'use client'

import { useState, useCallback, useMemo, memo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import RankingModal from './RankingModal'
import PurchaseTerritoryModal from '../PurchaseTerritoryModal'
import { UserCircleIcon } from '@heroicons/react/24/outline'
import ProfileInfoModal from "@/components/main/header/ProfileInfoModal";
import DropDownMenu from "@/components/main/header/DropDownMenu";
import {usersClientAPI} from "@/api/client/supabase/usersClientAPI";
import {useContinentStore} from "@/store/continentStore";
import {usePlayersStore} from "@/store/playersStore";
import {useUserStore} from "@/store/userStore";
import {useRouter} from "next/navigation";

export interface HeaderClientProps {

}

function HeaderClient(props: HeaderClientProps) {
    const router = useRouter();

    const [isRankingModalOpen, setIsRankingModalOpen] = useState(false)
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false)
    const [isProfileInfoModalOpen, setIsProfileInfoModalOpen] = useState(false)

    const { isContinentsInitialized } = useContinentStore();
    const { isPlayersInitialized, playerList } = usePlayersStore();
    const { isUsersInitialized, user } = useUserStore();

    const isInitialized = useMemo(() => {
        return isContinentsInitialized && isPlayersInitialized && isUsersInitialized;
    }, [isContinentsInitialized, isPlayersInitialized, isUsersInitialized]);

    const userPlayerInfo = useMemo(() => {
        console.log("userHeader", user);
        return playerList.find((player) => {
            return player.user_id === user?.id;
        }) ?? null;
    }, [playerList, user]);

    const handleGoogleLogin = useCallback(async () => {
        try {
            await usersClientAPI.signInWithOAuth();
        } catch (error) {
            console.error('로그인 중 오류 발생', error)
        }
    }, []);

    const handleSignOut = useCallback(async () => {
        try {
            const isConfirmed = confirm("Are you sure you want to sign out?");

            if (isConfirmed) {
                await usersClientAPI.signOutWithOAuth(() => {
                    router.refresh();
                });
            }
        } catch (error) {
            console.error('로그아웃 중 오류 발생', error)
        }
    }, []);

    return (
        isInitialized && <header className="fixed top-0 left-0 right-0 h-16 bg-gray-900 text-white z-50">
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
                        onClick={async () => {
                            if (user) {
                                setIsPurchaseModalOpen(true)
                            } else {
                                const confirmed = confirm("Please sign in first.");

                                if (confirmed) {
                                    await handleGoogleLogin();
                                }
                            }
                        }}
                        className="flex items-center space-x-1 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-colors"
                    >
                        <span>💎</span>
                        <span>{(!!userPlayerInfo) ? "Raise Stake" : "Drop the stake"}</span>
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
                                onClick: () => {
                                    setIsProfileInfoModalOpen(true);
                                },
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

export default memo(HeaderClient);