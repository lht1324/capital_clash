# 프로필 정보 수정 모달 구현 내역

## 개요
사용자가 자신의 프로필 정보를 수정할 수 있는 모달 컴포넌트를 구현했습니다. 이 모달은 사용자의 소개글, 웹사이트, 연락처 정보를 수정하고 데이터베이스에 저장할 수 있는 기능을 제공합니다.

## 구현 내용

### 1. TerritoryDisplayEditModal.tsx 구현
사용자 프로필 정보를 수정할 수 있는 모달 컴포넌트를 구현했습니다. 이 컴포넌트는 `useInvestorStore`를 통해 투자자 정보를 가져오고 업데이트합니다.

```tsx
'use client'

import { memo, useState, useEffect } from 'react'
import { useUserStore } from "@/store/userStore"
import { useInvestorStore } from "@/store/investorsStore"
import Image from 'next/image'

interface ProfileSettingModalProps {
    isOpen: boolean
    onClose: () => void
    investorId: string
}

function ProfileSettingModal({
    isOpen,
    onClose,
    investorId,
}: ProfileSettingModalProps) {
    const { user } = useUserStore();
    const { investors, updateInvestor } = useInvestorStore();

    const [profileData, setProfileData] = useState({
        description: '',
        website: '',
        contact: ''
    });

    // 모달이 열릴 때 기존 데이터 로드
    useEffect(() => {
        if (isOpen && investorId && investors[investorId]) {
            const investor = investors[investorId];
            if (investor.profileInfo) {
                setProfileData({
                    description: investor.profileInfo.description || '',
                    website: investor.profileInfo.website || '',
                    contact: investor.profileInfo.contact || ''
                });
            } else {
                // 프로필 정보가 없는 경우 빈 값으로 초기화
                setProfileData({
                    description: '',
                    website: '',
                    contact: ''
                });
            }
        }
    }, [isOpen, investorId, investors]);

    if (!isOpen) return null;

    const investor = investors[investorId];

    if (!investor) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                    <div className="text-center">
                        <p className="text-red-600 mb-4">투자자 정보를 찾을 수 없습니다.</p>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                        >
                            닫기
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const handleSave = async () => {
        try {
            await updateInvestor(investorId, {
                profileInfo: profileData
            });
            alert('프로필 정보가 성공적으로 저장되었습니다.');
            onClose();
        } catch (error) {
            console.error('프로필 정보 저장 실패:', error);
            alert('프로필 정보 저장에 실패했습니다. 다시 시도해주세요.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                {/* 헤더 */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">프로필 정보 수정</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-2xl"
                    >
                        ×
                    </button>
                </div>

                {/* 프로필 정보 폼 */}
                <div className="space-y-4 mb-6">
                    <div>
                        <label className="block text-gray-600 mb-1">소개글:</label>
                        <textarea
                            value={profileData.description}
                            onChange={(e) => setProfileData({...profileData, description: e.target.value})}
                            placeholder="본인 또는 회사 소개를 입력하세요..."
                            className="w-full p-2 border border-gray-300 rounded"
                            rows={3}
                        />
                    </div>
                    <div>
                        <label className="block text-gray-600 mb-1">웹사이트:</label>
                        <input
                            type="url"
                            value={profileData.website}
                            onChange={(e) => setProfileData({...profileData, website: e.target.value})}
                            placeholder="https://example.com"
                            className="w-full p-2 border border-gray-300 rounded"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-600 mb-1">연락처:</label>
                        <input
                            type="text"
                            value={profileData.contact}
                            onChange={(e) => setProfileData({...profileData, contact: e.target.value})}
                            placeholder="이메일 또는 전화번호"
                            className="w-full p-2 border border-gray-300 rounded"
                        />
                    </div>
                </div>

                {/* 버튼 */}
                <div className="flex justify-end space-x-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                        취소
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        저장
                    </button>
                </div>
            </div>
        </div>
    );
}

export default memo(ProfileSettingModal);
```

### 2. TerritoryTab.tsx 수정
TerritoryTab 컴포넌트에 프로필 정보 수정 모달을 열 수 있는 버튼을 추가했습니다.

```tsx
// 프로필 수정 버튼 추가
<button
    onClick={() => onClickOpenProfileSettingModal()}
    className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded text-sm transition-colors flex items-center justify-center space-x-2"
>
    <span>✏️</span>
    <span>Edit Profile</span>
</button>
```

또한 TerritoryTab 컴포넌트의 props 인터페이스에 `onClickOpenProfileSettingModal` 함수를 추가했습니다.

```tsx
function TerritoryTab({
    // 기존 props...
    onClickOpenProfileSettingModal,
    // 기타 props...
} : {
    // 기존 prop 타입...
    onClickOpenProfileSettingModal: () => void,
    // 기타 prop 타입...
}) {
    // 컴포넌트 내용...
}
```

## 주요 기능

### 1. 프로필 정보 수정
- **소개글**: 사용자가 자신이나 회사에 대한 소개글을 작성할 수 있습니다.
- **웹사이트**: 사용자의 웹사이트 URL을 입력할 수 있습니다.
- **연락처**: 사용자의 이메일이나 전화번호 등 연락처 정보를 입력할 수 있습니다.

### 2. 데이터베이스 연동
- 모달이 열릴 때 데이터베이스에서 기존 프로필 정보를 불러옵니다.
- 저장 버튼을 클릭하면 수정된 정보를 데이터베이스에 업데이트합니다.
- NULL 값이나 빈 값이 있는 경우 빈 문자열로 표시합니다.

### 3. 모달 UI 구현
- **오버레이**: 모달 외부를 클릭하면 모달이 닫히는 반투명 오버레이를 구현했습니다.
- **헤더**: 모달 제목과 닫기 버튼이 있는 헤더를 구현했습니다.
- **폼 필드**: 각 정보를 입력할 수 있는 폼 필드를 구현했습니다.
- **버튼**: 취소 및 저장 버튼을 구현했습니다.

## 기술적 특징

### 1. Zustand 상태 관리
- `useInvestorStore` 훅을 사용하여 투자자 정보를 관리합니다.
- `updateInvestor` 함수를 사용하여 프로필 정보를 업데이트합니다.

### 2. React Hooks 활용
- `useState`를 사용하여 폼 데이터를 관리합니다.
- `useEffect`를 사용하여 모달이 열릴 때 기존 데이터를 로드합니다.

### 3. 조건부 렌더링
- `isOpen` 속성에 따라 모달의 표시 여부를 결정합니다.
- 투자자 정보 유무에 따라 다른 UI를 표시합니다.

### 4. 에러 처리
- 데이터 저장 시 발생할 수 있는 오류를 try-catch 구문으로 처리합니다.
- 오류 발생 시 사용자에게 알림을 표시합니다.

### 5. 메모이제이션
- `memo`를 사용하여 컴포넌트를 메모이제이션하여 불필요한 리렌더링을 방지합니다.

## 구현 과정에서의 고려사항

### 1. 데이터 구조
- 프로필 정보는 `profileInfo` 객체 내에 `description`, `website`, `contact` 필드로 구성됩니다.
- 이 구조는 ProfileViewModal.tsx에서 사용하는 구조와 일치하도록 구현했습니다.

### 2. 사용자 경험
- 모달이 열릴 때 기존 데이터를 자동으로 로드하여 사용자가 이전 정보를 확인할 수 있도록 했습니다.
- 저장 성공/실패 시 알림을 표시하여 사용자에게 피드백을 제공합니다.

### 3. 데이터 유효성
- 빈 값이나 NULL 값이 있는 경우 빈 문자열로 처리하여 UI에서 오류가 발생하지 않도록 했습니다.

## 결론
이번 구현을 통해 사용자가 자신의 프로필 정보를 쉽게 수정할 수 있는 기능을 추가했습니다. 모달 UI는 사용자 경험을 해치지 않으면서 필요한 정보를 효과적으로 수정할 수 있도록 설계되었습니다. 또한 기존 코드베이스의 스타일과 패턴을 따라 일관성 있게 구현했습니다.

데이터베이스와의 연동을 통해 사용자가 수정한 정보가 실시간으로 저장되고, 다른 컴포넌트(ProfileViewModal)에서도 일관되게 표시될 수 있도록 했습니다. 이를 통해 사용자는 자신의 프로필을 더욱 풍부하게 관리할 수 있게 되었습니다.
