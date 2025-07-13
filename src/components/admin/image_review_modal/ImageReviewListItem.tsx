import {memo, useCallback, useMemo, useState} from "react";
import {ImageStatus, Player} from "@/api/types/supabase/Players";
import {getLocaleDateString} from "@/utils/dateUtils";

function ImageReviewListItem({
    player,
    onClickImageStatusChangeButton,
} : {
    player: Player,
    onClickImageStatusChangeButton: (id: string, imageStatus: ImageStatus) => void;
}) {
    const [isExpanded, setIsExpanded] = useState(false);

    const imageStatusText = useMemo(() => {
        switch (player.image_status) {
            case ImageStatus.PENDING: {
                return "리뷰 진행 중"
            }
            case ImageStatus.APPROVED: {
                return "승인됨"
            }
            case ImageStatus.REJECTED: {
                return "거부됨"
            }
        }
    }, [player.image_status]);

    const onClickItem = useCallback(() => {
        setIsExpanded(prev => !prev);
    }, []);

    /*
    헤더
    이미지
    업데이트 날짜
    현재 이미지 상태
    승인, 거부 버튼
     */
    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
            {/* 아이템 헤더 (클릭 시 펼쳐짐) */}
            <div
                className="bg-gray-50 p-4 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={onClickItem}
            >
                <div className="flex items-center space-x-3">
                    <span className="font-medium text-gray-800">{player.name}</span>
                    <span className="text-sm text-gray-500">업로드: {getLocaleDateString(player.updated_at)}</span>
                    <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                        승인 대기
                    </span>
                </div>
                <div className="text-gray-500">
                    {isExpanded ? '▲' : '▼'}
                </div>
            </div>

            {/* 펼쳐진 콘텐츠 */}
            {isExpanded && (
                <div className="p-4 border-t border-gray-200">
                    <div className="text-center p-8 text-gray-500">
                        <img
                            className="w-full rounded-lg"
                            src={player.image_url}
                            alt="image"
                        />
                    </div>
                    <div className="flex justify-end space-x-3 mt-4">
                        <button
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            onClick={() => {
                                if (confirm("이미지를 승인하시겠습니까?")) {
                                    onClickImageStatusChangeButton(player.id, ImageStatus.APPROVED);
                                }
                            }}
                        >
                            승인
                        </button>
                        <button
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            onClick={() => {
                                if (confirm("이미지를 반려하시겠습니까?")) {
                                    onClickImageStatusChangeButton(player.id, ImageStatus.REJECTED);
                                }
                            }}
                        >
                            거부
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default memo(ImageReviewListItem);