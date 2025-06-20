'use client'

import {memo, useMemo} from 'react'
import { useUserStore } from "@/store/userStore"
import Image from 'next/image'

function ProfileInfoModal({
    onClose,
}: {
    onClose: () => void
}) {
    const { user } = useUserStore();

    const authProvider = useMemo(() => {
        const provider = user?.app_metadata?.provider;

        if (!provider) return 'Google';

        return provider[0].toUpperCase() + provider.slice(1);
    }, [user?.app_metadata.provider])

    return (
        <>
            {/* 배경 오버레이 */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-start justify-center pt-20 p-4"
                onClick={onClose}
            >
                {/* 모달 콘텐츠 */}
                <div
                    className="bg-gray-900 rounded-lg shadow-xl w-full max-w-md overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* 헤더 */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-700">
                        <h2 className="text-2xl font-bold text-white">👤 프로필 정보</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors text-2xl"
                        >
                            ×
                        </button>
                    </div>

                    {/* 프로필 정보 */}
                    <div className="p-6">
                        {user ? (
                            <div className="space-y-6">
                                {/* 프로필 이미지 */}
                                <div className="flex justify-center">
                                    {user.user_metadata?.avatar_url ? (
                                        <div className="relative w-24 h-24 rounded-full overflow-hidden">
                                            <Image
                                                src={user.user_metadata.avatar_url}
                                                alt="Profile"
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-white text-4xl">
                                            {user.user_metadata?.name?.charAt(0) || user.email?.charAt(0) || '?'}
                                        </div>
                                    )}
                                </div>

                                {/* 사용자 정보 */}
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-400">Name</h3>
                                        <p className="text-white text-lg">{user.user_metadata?.name || '이름 없음'}</p>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-medium text-gray-400">Email</h3>
                                        <p className="text-white text-lg">{user.email || '이메일 없음'}</p>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-medium text-gray-400">Login Method</h3>
                                        <div className="flex items-center space-x-2 mt-1">
                                            <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
                                                {authProvider}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <div className="text-4xl mb-3">👤</div>
                                <h3 className="text-lg font-medium text-white mb-2">로그인 정보 없음</h3>
                                <p className="text-gray-400">로그인 후 프로필 정보를 확인할 수 있습니다.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

export default memo(ProfileInfoModal);
