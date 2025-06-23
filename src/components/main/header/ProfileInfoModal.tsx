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

    const avatarUrl = useMemo(() => {
        return user?.avatar_url;
    }, [user?.avatar_url]);

    const userName = useMemo(() => {
        return user?.name;
    }, [user?.name]);

    const userEmail = useMemo(() => {
        return user?.email;
    }, [user?.email]);

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
                                    {avatarUrl ? (
                                        <div className="relative w-24 h-24 rounded-full overflow-hidden">
                                            <Image
                                                src={avatarUrl}
                                                alt="Profile"
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-white text-4xl">
                                            {userName?.charAt(0) || userEmail?.charAt(0) || '?'}
                                        </div>
                                    )}
                                </div>

                                {/* 사용자 정보 */}
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-400">Name</h3>
                                        <p className="text-white text-lg">{userName}</p>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-medium text-gray-400">Email</h3>
                                        <p className="text-white text-lg">{userEmail}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <div className="text-4xl mb-3">👤</div>
                                <h3 className="text-lg font-medium text-white mb-2">No login information</h3>
                                <p className="text-gray-400">You can check profile information after login</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

export default memo(ProfileInfoModal);
