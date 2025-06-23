'use client'

import {memo, useState, useEffect, useCallback, useMemo, ChangeEvent} from 'react'
import { useUserStore } from "@/store/userStore"
import { useInvestorStore } from "@/store/investorsStore"
import Image from 'next/image'

function TerritoryInfoEditModal({
    onClose,
}: {
    onClose: () => void
}) {
    const { user } = useUserStore();
    const { investors, updateInvestor } = useInvestorStore();

    const [isInitialized, setIsInitialized] = useState(false);

    const [profileData, setProfileData] = useState({
        name: "",
        description: "",
        xUrl: "",
        instagramUrl: "",
        contactEmail: "",
        areaColor: "#FF0000", // Default red color
    })

    // State for color sliders
    const [hue, setHue] = useState(0)
    const [brightness, setBrightness] = useState(100)

    const userInvestorInfo = useMemo(() => {
        const userId = user?.id;
        const investorList = Object.values(investors);

        return userId
            ? investorList.find((investor) => { return investor.user_id === userId })
            : null;
    }, [user?.id, investors]);

    const isProfileInfoChanged = useMemo(() => {
        const isNameChanged = profileData.name !== userInvestorInfo?.name;
        const isDescriptionChanged = profileData.description !== userInvestorInfo?.description;
        const isXUrlChanged = profileData.xUrl !== userInvestorInfo?.x_url;
        const isInstagramUrlChanged = profileData.instagramUrl !== userInvestorInfo?.instagram_url;
        const isContactEmailChanged = profileData.contactEmail !== userInvestorInfo?.contact_email;
        const isAreaColorChanged = profileData.areaColor !== userInvestorInfo?.area_color;

        return isNameChanged
            || isDescriptionChanged
            || isXUrlChanged
            || isInstagramUrlChanged
            || isContactEmailChanged
            || isAreaColorChanged;
    }, [profileData]);

    const isContactEmailValid = useMemo(() => {
        if (!profileData.contactEmail) return true;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        return emailRegex.test(profileData.contactEmail);
    }, [profileData.contactEmail]);

    const onChangeName = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
        setProfileData({...profileData, name: e.target.value})
    }, [profileData]);

    const onChangeDescription = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
        setProfileData({...profileData, description: e.target.value})
    }, [profileData]);

    const onChangeXUrl = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setProfileData({...profileData, xUrl: e.target.value})
    }, [profileData]);

    const onChangeInstagramUrl = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setProfileData({...profileData, instagramUrl: e.target.value})
    }, [profileData]);

    const onChangeContactEmail = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setProfileData({...profileData, contactEmail: e.target.value})
    }, [profileData]);

    const getIsUrlValid = useCallback((newUrl: string) => {
        if (!newUrl) return true;

        try {
            const url = new URL(newUrl);
            // URL 객체가 생성되고 프로토콜이 http 또는 https인지 확인
            const hasValidProtocol = url.protocol === 'http:' || url.protocol === 'https:';
            // 호스트에 최소 하나의 점(.)이 있는지 확인하여 도메인이 완전한지 검사
            const hasValidDomain = url.hostname.includes('.') && url.hostname.split('.')[1]?.length > 0;

            return hasValidProtocol && hasValidDomain;
        } catch (e) {
            return false;
        }
    }, []);

    const isXUrlValid = useMemo(() => {
        return getIsUrlValid(profileData.xUrl);
    }, [getIsUrlValid, profileData.xUrl]);

    const isInstagramUrlValid = useMemo(() => {
        return getIsUrlValid(profileData.instagramUrl);
    }, [getIsUrlValid, profileData.instagramUrl]);

    // Convert HSL to HEX
    const hslToHex = useCallback((h: number, s: number, l: number): string => {
        l /= 100;
        const a = s * Math.min(l, 1 - l) / 100;
        const f = (n: number) => {
            const k = (n + h / 30) % 12;
            const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
            return Math.round(255 * color).toString(16).padStart(2, '0');
        };
        return `#${f(0)}${f(8)}${f(4)}`;
    }, []);

    // Helper function to convert hex to HSL
    const hexToHsl = useCallback((hex: string): { h: number, s: number, l: number } => {
        // Remove the # if present
        hex = hex.replace(/^#/, '');

        // Parse the hex values
        let r = parseInt(hex.substring(0, 2), 16) / 255;
        let g = parseInt(hex.substring(2, 4), 16) / 255;
        let b = parseInt(hex.substring(4, 6), 16) / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h = 0, s = 0, l = (max + min) / 2;

        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }

            h = Math.round(h * 60);
        }

        s = Math.round(s * 100);
        l = Math.round(l * 100);

        return { h, s, l };
    }, []);

    // Handle hue change
    const onChangeHue = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const newHue = parseInt(e.target.value);
        setHue(newHue);
        const newColor = hslToHex(newHue, 100, brightness).toUpperCase();
        setProfileData({...profileData, areaColor: newColor});
    }, [brightness, hslToHex, profileData]);

    // Handle brightness change
    const onChangeBrightness = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const newBrightness = parseInt(e.target.value);
        setBrightness(newBrightness);
        const newColor = hslToHex(hue, 100, newBrightness).toUpperCase();
        setProfileData({...profileData, areaColor: newColor});
    }, [hue, hslToHex, profileData]);

    const handleSave = useCallback(async () => {
        // 입력값 유효성 검사
        if (profileData.xUrl && (!isXUrlValid || !isInstagramUrlValid)) {
            alert('Please enter a valid website URL.');
            return;
        }

        if (profileData.contactEmail && !isContactEmailValid) {
            alert('Please enter a valid email address.');
            return;
        }

        if (isProfileInfoChanged) {
            try {
                const newInvestorInfo = {
                    ...userInvestorInfo,
                    name: profileData.name,
                    description: profileData.description,
                    x_url: profileData.xUrl,
                    instagram_url: profileData.instagramUrl,
                    contact_email: profileData.contactEmail,
                    area_color: profileData.areaColor,
                }
                await updateInvestor(newInvestorInfo);
                alert('Profile information has been successfully saved.');
                onClose();
            } catch (error) {
                console.error('Failed to save profile information:', error);
                alert('Failed to save profile information. Please try again.');
            }
        } else {
            alert('No changes have been made.');
        }
    }, [isProfileInfoChanged, profileData, isXUrlValid, isInstagramUrlValid, isContactEmailValid, userInvestorInfo, updateInvestor, onClose]);

    // 모달이 열릴 때 기존 데이터 로드
    useEffect(() => {
        if (userInvestorInfo) {
            const defaultColor = userInvestorInfo.area_color || '#FF0000';
            const { h, l } = hexToHsl(defaultColor);

            setHue(h);
            setBrightness(l);

            setProfileData({
                name: userInvestorInfo.name || '',
                description: userInvestorInfo.description || '',
                xUrl: userInvestorInfo.x_url || '',
                instagramUrl: userInvestorInfo.instagram_url || '',
                contactEmail: userInvestorInfo.contact_email || '',
                areaColor: defaultColor
            });
        }
    }, [userInvestorInfo, hexToHsl]);

    if (!userInvestorInfo) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                    <div className="text-center">
                        <p className="text-red-600 mb-4">Can't find investor's information.</p>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => { onClose(); }}
        >
            <div
                className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
                onClick={(e) => { e.stopPropagation(); }}
            >
                {/* 헤더 */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">Territory Display Edit</h2>
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
                        <label className="block text-gray-600 mb-1">Name</label>
                        <textarea
                            value={profileData.name}
                            onChange={onChangeName}
                            placeholder="Name, nickname, whatever."
                            className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 bg-gray-50 hover:bg-white resize-none"
                            rows={3}
                        />
                    </div>
                    <div>
                        <label className="block text-gray-600 mb-1">Description</label>
                        <textarea
                            value={profileData.description}
                            onChange={onChangeDescription}
                            placeholder="Description..."
                            className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 bg-gray-50 hover:bg-white resize-none"
                            rows={3}
                        />
                    </div>
                    <div>
                        <label className="block text-gray-600 mb-1">X</label>
                        <input
                            type="url"
                            value={profileData.xUrl}
                            onChange={onChangeXUrl}
                            placeholder="https://example.com"
                            className={`w-full p-3 border ${profileData.xUrl && !isXUrlValid ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring-2 ${profileData.xUrl && !isXUrlValid ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-blue-500 focus:border-blue-500'} outline-none transition-all duration-200 bg-gray-50 hover:bg-white`}
                        />
                        {profileData.xUrl && !isXUrlValid && (
                            <p className="text-red-500 text-sm mt-1">The website URL format is not valid.<br/>(e.g. https://x.com/[x_id])</p>
                        )}
                    </div>
                    {/*<div>*/}
                    {/*    <label className="block text-gray-600 mb-1">Instagram</label>*/}
                    {/*    <input*/}
                    {/*        type="url"*/}
                    {/*        value={profileData.instagramUrl}*/}
                    {/*        onChange={onChangeInstagramUrl}*/}
                    {/*        placeholder="https://example.com"*/}
                    {/*        className={`w-full p-3 border ${profileData.instagramUrl && !isInstagramUrlValid ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring-2 ${profileData.instagramUrl && !isInstagramUrlValid ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-blue-500 focus:border-blue-500'} outline-none transition-all duration-200 bg-gray-50 hover:bg-white`}*/}
                    {/*    />*/}
                    {/*    {profileData.instagramUrl && !isInstagramUrlValid && (*/}
                    {/*        <p className="text-red-500 text-sm mt-1">The website URL format is not valid.<br/>(e.g. https://instagram.com/[insta_id])</p>*/}
                    {/*    )}*/}
                    {/*</div>*/}
                    <div>
                        <label className="block text-gray-600 mb-1">Contact Email</label>
                        <input
                            type="text"
                            value={profileData.contactEmail}
                            onChange={onChangeContactEmail}
                            placeholder="example@email.com"
                            className={`w-full p-3 border ${profileData.contactEmail && !isContactEmailValid ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring-2 ${profileData.contactEmail && !isContactEmailValid ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-blue-500 focus:border-blue-500'} outline-none transition-all duration-200 bg-gray-50 hover:bg-white`}
                        />
                        {profileData.contactEmail && !isContactEmailValid && (
                            <p className="text-red-500 text-sm mt-1">The email format is not valid.<br/>(e.g. example@email.com)</p>
                        )}
                    </div>

                    {/* Color Selection */}
                    <div>
                        <label className="block text-gray-600 mb-1">Area Color</label>
                        <div className="space-y-4">
                            {/* Color Preview */}
                            <div 
                                className="w-full h-16 rounded-md border border-gray-300 shadow-sm"
                                style={{ backgroundColor: profileData.areaColor }}
                            ></div>

                            {/* Hue Slider */}
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Hue</label>
                                <input
                                    type="range"
                                    min="0"
                                    max="360"
                                    value={hue}
                                    onChange={onChangeHue}
                                    className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                                    style={{
                                        background: 'linear-gradient(to right, #ff0000, #ff8000, #ffff00, #80ff00, #00ff00, #00ff80, #00ffff, #0080ff, #0000ff, #8000ff, #ff00ff, #ff0080, #ff0000)'
                                    }}
                                />
                            </div>

                            {/* Brightness Slider */}
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Brightness</label>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={brightness}
                                    onChange={onChangeBrightness}
                                    className="w-full h-2 bg-gradient-to-r from-gray-900 to-white rounded-lg appearance-none cursor-pointer"
                                />
                            </div>

                            {/* Color Value */}
                            <div className="text-sm text-gray-600">
                                Color value: {profileData.areaColor}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 버튼 */}
                <div className="flex justify-end space-x-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}

export default memo(TerritoryInfoEditModal);
