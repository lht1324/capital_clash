import {memo, useCallback, useMemo, useState} from "react";
import {ImageStatus, useInvestorStore} from "@/store/investorsStore";
import ImageReviewListItem from "@/components/admin/image_review_modal/ImageReviewListItem";
import {Player} from "@/api/server/supabase/types/Players";

function ImageReviewModal({
    playerList,
    onClose
} : {
    playerList: Player[],
    onClose: () => void;
}) {
    const { updatePlayerImageStatus } = useInvestorStore();

    const reviewDataList = useMemo(() => {
        return playerList.filter((player) => {
            return player.image_url && player.image_status === "pending";
        }).sort((a, b) => {
            return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        });
    }, [playerList]);

    const onClickImageStatusChangeButton = useCallback(async (id: string, imageStatus: ImageStatus) => {
        await updatePlayerImageStatus(id, imageStatus);
    }, [updatePlayerImageStatus]);

    return (
        <>
            {/* 배경 오버레이 */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-start justify-center pt-20 p-4"
                onClick={onClose}
            >
                {/* 모달 콘텐츠 */}
                <div
                    className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[calc(100vh-6rem)] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* 헤더 */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200">
                        <h2 className="text-2xl font-bold text-gray-800">이미지 승인 관리</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 transition-colors text-2xl"
                        >
                            ×
                        </button>
                    </div>

                    {/* 콘텐츠 영역 */}
                    <div className="p-6">
                        <div className="space-y-4">
                            {reviewDataList.length > 0 ? (
                                reviewDataList.map((player) => (
                                    <ImageReviewListItem
                                        key={player.id}
                                        player={player}
                                        onClickImageStatusChangeButton={onClickImageStatusChangeButton}
                                    />
                                ))
                            ) : (
                                <div className="text-center py-8">
                                    <div className="text-4xl mb-3">📷</div>
                                    <h3 className="text-lg font-medium text-gray-800 mb-2">검토할 이미지가 없습니다</h3>
                                    <p className="text-gray-500">현재 검토 대기 중인 이미지가 없습니다.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default memo(ImageReviewModal);
