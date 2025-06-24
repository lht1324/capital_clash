'use client'

import {useState, useEffect, useMemo, useCallback, useRef, ChangeEvent, memo} from 'react'
import { useContinentStore, type ContinentId } from '@/store/continentStore'
import {Investor, useInvestorStore} from "@/store/investorsStore";
import {useUserStore} from "@/store/userStore";
import {getProductsClient, postCheckoutsClient} from "@/api/client/polar/PolarClientAPI";

function PurchaseTerritoryModal({
    onClose
}: {
    onClose: () => void
}) {
    const { continents } = useContinentStore();
    const { investors, insertInvestor, updateInvestorInvestmentAmount } = useInvestorStore();
    const { user } = useUserStore();

    // 드래그 상태를 추적하기 위한 ref
    const isDragging = useRef(false);

    const [selectedContinentId, setSelectedContinentId] = useState<ContinentId | null>(null)
    const [investmentAmount, setInvestmentAmount] = useState<number>(1)
    const [investorName, setInvestorName] = useState<string>('')
    const [isCalculating, setIsCalculating] = useState(false)
    const [validationError, setValidationError] = useState<string>('')
    const [showPreview, setShowPreview] = useState(false)

    const continentItemList = useMemo(() => {
        return Object.values(continents).filter((continent) => continent.id !== "central")
    }, [continents]);

    const investorList = useMemo(() => {
        return Object.values(investors);
    }, [investors]);
    const filteredInvestorListByContinent = useMemo(() => {
        return investorList.filter((investor) => { return investor.continent_id === selectedContinentId; });
    }, [investorList, selectedContinentId]);
    const userInvestorInfo: Investor | null = useMemo(() => {
        return investorList.find((investor) => {
            return investor.user_id === user?.id;
        }) ?? null;
    }, [investorList, user]);

    const continentalTotalInvestmentAmount = useMemo(() => {
        return filteredInvestorListByContinent.reduce((acc, investor) => {
            return acc + investor.investment_amount
        }, 0);
    }, [filteredInvestorListByContinent]);
    const isAdditionalInvestment = useMemo(() => {
        return !!userInvestorInfo;
    }, [userInvestorInfo]);

    // isAdditionalInvestment (Current Territory)
    const userContinentId = useMemo(() => {
        return userInvestorInfo?.continent_id;
    }, [userInvestorInfo]);
    const userContinentName = useMemo(() => {
        return continentItemList.find(c => c.id === userContinentId)?.name
    }, [continentItemList, userContinentId]);
    const userInvestmentAmount = useMemo(() => {
        return userInvestorInfo?.investment_amount ?? 0
    }, [userInvestorInfo]);
    const userSharePercentage = useMemo(() => {
        return userInvestmentAmount
            ? Number(userInvestmentAmount / continentalTotalInvestmentAmount) * 100
            : 0;
    }, [userInvestmentAmount, continentalTotalInvestmentAmount]);

    const selectedContinentMaxUserCount = useMemo(() => {
        return selectedContinentId
            ? continents[selectedContinentId].max_users
            : 0
    }, [selectedContinentId, continents]);

    // 실시간 계산 결과
    const expectedSharePercentage = useMemo(() => {
        if (!investmentAmount || investmentAmount <= 0) return 0;

        const newContinentalTotalInvestment = continentalTotalInvestmentAmount + investmentAmount;
        const newSharePercentage = !isAdditionalInvestment
            ? Number((investmentAmount / newContinentalTotalInvestment) * 100)
            : Number(((userInvestmentAmount + investmentAmount) / newContinentalTotalInvestment) * 100);

        if (selectedContinentId) {
            return newSharePercentage > 0.01
                ? newSharePercentage
                : 0.01;
        } else {
            return isAdditionalInvestment
                ? newSharePercentage
                : 0;
        }
    }, [selectedContinentId, investmentAmount, userInvestmentAmount, continentalTotalInvestmentAmount])
    const expectedCellLength = useMemo(() => {
        const maxAreaSize = selectedContinentMaxUserCount * selectedContinentMaxUserCount
        const cells = Math.round(expectedSharePercentage * maxAreaSize / 100)
        return Math.floor(Math.sqrt(cells))
    }, [selectedContinentMaxUserCount, expectedSharePercentage]);
    const expectedCells = useMemo(() => {
        const maxAreaSize = selectedContinentMaxUserCount * selectedContinentMaxUserCount
        return Math.round(expectedSharePercentage * maxAreaSize / 100)
    }, [expectedSharePercentage, selectedContinentMaxUserCount]);

    // 대륙별 현재 투자자 수 계산
    const getContinentUserCount = useCallback((continentId: ContinentId) => {
        return Object.values(investors).filter((investor) => {
            return investor.continent_id === continentId
        }).length;
    }, []);

    // 투자 금액 유효성 검사
    const validateInvestmentAmount = useCallback((value: string) => {
        const amount = parseFloat(value)
        if (!value) {
            setValidationError('Please enter an investment amount.')
            return false
        }
        if (isNaN(amount)) {
            setValidationError('Please enter a valid number.')
            return false
        }

        // 최소 투자금액 체크
        if (amount < 1) {
            setValidationError('The minimum investment amount is $1.')
            return false
        }

        setValidationError('')
        return true
    }, []);

    // 중복 투자 검증
    const validateDuplicateInvestment = useCallback((continentId: ContinentId) => {
        if (isAdditionalInvestment) return true

        // 선택한 대륙이 가득 찬 경우
        const userCount = getContinentUserCount(continentId)
        if (userCount >= selectedContinentMaxUserCount) {
            setValidationError('The selected continent is full. Please select another continent.')
            return false
        }

        return true
    }, [isAdditionalInvestment, selectedContinentMaxUserCount]);

    // 입력 검증
    const isPurchasePossible = useMemo(() => {
        const isValidAmount = investmentAmount >= 1;
        const isValidContinent = isAdditionalInvestment || (selectedContinentId && validateDuplicateInvestment(selectedContinentId))
        const isValidName = isAdditionalInvestment || (investorName.trim() !== '')
        return isValidAmount && isValidContinent && isValidName && !validationError
    }, [investmentAmount, investorName, isAdditionalInvestment, validationError])

    // 투자 금액 변경 핸들러
    const handleAmountChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const updatedValue = e.target.value;

        setInvestmentAmount(Number(updatedValue))
        validateInvestmentAmount(updatedValue)
        setShowPreview(!!updatedValue && parseFloat(updatedValue) > 0)
    }, [validateInvestmentAmount]);

    // 투자자 이름 변경 핸들러
    const handleNameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setInvestorName(e.target.value);
    }, []);

    // 이름, 설명 추가

    // 구매/추가투자 처리
    const handlePurchase = useCallback(async () => {
        if (!isPurchasePossible) return;

        setIsCalculating(true)

        try {
            const getProductsResponse = await getProductsClient();

            const productId = getProductsResponse.items.find((item) => {
                return !item.name.includes("continent");
            })?.id;

            if (!productId) {
                throw new Error("No product found.");
            }

            const postCheckoutsResponse = await postCheckoutsClient(
                productId,
                investmentAmount,
                user?.email
            );

            window.location.href = postCheckoutsResponse.url;
        } catch (error) {
            console.error(error);
            setIsCalculating(false)
            setValidationError('An error occurred while processing your investment. Please try again.')
        }
        // try {
        //     if (user) {
        //         if (isAdditionalInvestment) {
        //             if (userInvestorInfo) {
        //                 await updateInvestorInvestmentAmount(userInvestorInfo, investmentAmount);
        //             }
        //         } else {
        //             if (selectedContinentId) {
        //                 await insertInvestor(user?.id, selectedContinentId, investmentAmount, investorName);
        //             }
        //         }
        //     }
        //
        //     // 성공 시 모달 닫기
        //     setTimeout(() => {
        //         setIsCalculating(false)
        //         onClose()
        //     }, 1000)
        // } catch (error) {
        //     setIsCalculating(false)
        //     setValidationError('An error occurred while processing your investment. Please try again.')
        // }
        // }, [isPurchasePossible, selectedContinentId, investmentAmount, investorName]);
    }, [isPurchasePossible, investmentAmount]);


    // 모달 열림/닫힘 시 초기화
    useEffect(() => {
        setSelectedContinentId(
            isAdditionalInvestment && userContinentId
                ? userContinentId
                : null
        )
    }, [isAdditionalInvestment, userContinentId])

    // ESC 키로 닫기
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose()
            }
        }

        document.addEventListener('keydown', handleEscape)
        return () => document.removeEventListener('keydown', handleEscape)
    }, [onClose])

    // 마우스 드래그 상태 추적
    useEffect(() => {
        const handleMouseDown = () => {
            isDragging.current = false;
        };

        const handleMouseMove = () => {
            isDragging.current = true;
        };

        const handleMouseUp = () => {
            // mouseup 이벤트 발생 후 약간의 지연을 두고 드래그 상태 초기화
            setTimeout(() => {
                isDragging.current = false;
            }, 10);
        };

        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    return (
        <>
            {/* 배경 오버레이 */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-start justify-center pt-20 p-4"
                onClick={(e) => {
                    // 드래그 중일 때는 모달이 닫히지 않도록 함
                    if (!isDragging.current) {
                        onClose();
                    }
                }}
            >
                {/* 모달 콘텐츠 */}
                <div
                    className="bg-gray-900 rounded-lg shadow-xl w-full max-w-2xl max-h-[calc(100vh-6rem)] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* 헤더 */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-700">
                        <h2 className="text-2xl font-bold text-white">
                            {isAdditionalInvestment ? '💰 Additional Investment' : '🎯 Purchase Territory'}
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors text-2xl"
                        >
                            ×
                        </button>
                    </div>

                    {/* 콘텐츠 */}
                    <div className="p-6 space-y-8">
                        {/* 추가 투자 모드일 때 현재 영역 정보 표시 */}
                        {isAdditionalInvestment && userContinentId && (
                            <div className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 rounded-xl p-6 border border-blue-700/50 backdrop-blur-sm">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <span className="text-2xl">📍</span>
                                    <span>Territory Information</span>
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center bg-gray-800/50 p-3 rounded-lg">
                                        <span className="text-gray-300">Continent</span>
                                        <span className="text-white font-medium">
                                            {userContinentName}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center bg-gray-800/50 p-3 rounded-lg">
                                        <span className="text-gray-300">Investment Amount</span>
                                        <span className="text-green-400 font-medium">
                                            ${userInvestmentAmount?.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center bg-gray-800/50 p-3 rounded-lg">
                                        <span className="text-gray-300">Current Continental Share</span>
                                        <span className="text-blue-400 font-medium">
                                            {userSharePercentage.toFixed(2)}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 단계 1: 대륙 선택 (신규 구매시만) */}
                        {!isAdditionalInvestment && (
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-500 text-sm">1</span>
                                    Select Continent
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {continentItemList.map((continent) => {
                                        const userCount = getContinentUserCount(continent.id)
                                        const maxUserCount = continent.max_users
                                        const isFull = userCount >= maxUserCount
                                        const isSelected = selectedContinentId === continent.id

                                        return (
                                            <button
                                                key={continent.id}
                                                onClick={() => !isFull && setSelectedContinentId(continent.id)}
                                                disabled={isFull}
                                                className={`p-5 rounded-xl border-2 transition-all duration-200 ${
                                                    isSelected
                                                        ? 'border-blue-500 bg-gradient-to-br from-blue-500/20 to-purple-500/20 scale-[1.02]'
                                                        : isFull
                                                            ? 'border-gray-600/50 bg-gray-800/50 opacity-50 cursor-not-allowed'
                                                            : 'border-gray-600/50 bg-gray-800/50 hover:border-gray-400 hover:scale-[1.01] hover:bg-gray-700/50'
                                                }`}
                                            >
                                                <div className="flex items-center space-x-4">
                                                    <div
                                                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                                                        style={{ backgroundColor: continent.color + '20' }}
                                                    >
                                                        <div
                                                            className="w-6 h-6 rounded-lg"
                                                            style={{ backgroundColor: continent.color }}
                                                        />
                                                    </div>
                                                    <div className="flex-1 text-left">
                                                        <div className="font-medium text-white mb-1">{continent.name}</div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex-1 h-2 rounded-full bg-gray-700 overflow-hidden">
                                                                <div
                                                                    className="h-full rounded-full transition-all"
                                                                    style={{
                                                                        width: `${(userCount / maxUserCount) * 100}%`,
                                                                        backgroundColor: isFull ? '#EF4444' : '#10B981'
                                                                    }}
                                                                />
                                                            </div>
                                                            <span className={`text-sm ${isFull ? 'text-red-400' : 'text-green-400'}`}>
                                                                {userCount}/{maxUserCount}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* 단계 2: 투자 금액 입력 */}
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                {isAdditionalInvestment ? (
                                    <>
                                        <span className="text-2xl">💵</span>
                                        <span>Additional Investment Amount</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-500 text-sm">2</span>
                                        <span>Investment Amount</span>
                                    </>
                                )}
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-semibold text-gray-400">$</div>
                                        <input
                                            type="number"
                                            value={investmentAmount}
                                            onChange={handleAmountChange}
                                            placeholder="Input contribution amount."
                                            className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border-2 border-gray-600/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-all text-lg"
                                            min="1"
                                            step="1"
                                            onWheel={(e) => e.currentTarget.blur()}
                                        />
                                    </div>
                                    {validationError && (
                                        <p className="mt-3 text-red-400 text-sm flex items-center gap-2">
                                            <span>⚠️</span>
                                            <span>{validationError}</span>
                                        </p>
                                    )}
                                </div>

                                {/* 투자자 이름 입력 */}
                                {!isAdditionalInvestment && <div>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-semibold text-gray-400">👑</div>
                                        <input
                                            type="text"
                                            value={investorName}
                                            onChange={handleNameChange}
                                            placeholder="Input the name as territory owner."
                                            className="w-full pl-12 pr-4 py-3 bg-gray-800/50 border-2 border-gray-600/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-all text-lg"
                                        />
                                    </div>
                                </div>}

                                {/* 실시간 미리보기 */}
                                {showPreview && selectedContinentId && (
                                    <div className="bg-gradient-to-br from-gray-800/50 to-gray-700/50 rounded-xl p-6 border border-gray-600/50 space-y-6">
                                        <h4 className="text-white font-medium flex items-center gap-2">
                                            <span className="text-xl">📊</span>
                                            <span>Result Preview</span>
                                        </h4>

                                        {/* 투자 정보 */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-gray-800/50 rounded-xl p-4 space-y-2">
                                                <div className="text-sm text-gray-400">Expected Continental Share</div>
                                                <div className="text-2xl font-semibold text-blue-400">
                                                    {expectedSharePercentage.toFixed(2)}%
                                                </div>
                                            </div>
                                            <div className="bg-gray-800/50 rounded-xl p-4 space-y-2">
                                                <div className="text-sm text-gray-400">Expected Area Size</div>
                                                <div className="text-2xl font-semibold text-green-400">
                                                    {expectedCellLength}×{expectedCellLength}
                                                </div>
                                            </div>
                                        </div>

                                        {/* 시각적 미리보기 */}
                                        <div className="relative w-full aspect-square bg-gray-900/50 rounded-xl overflow-hidden border border-gray-700/50">
                                            <div
                                                className="absolute bg-gradient-to-br from-blue-500/30 to-purple-500/30 border-2 border-blue-400"
                                                style={{
                                                    width: `${(expectedCellLength / selectedContinentMaxUserCount) * 100}%`,
                                                    height: `${(expectedCellLength / selectedContinentMaxUserCount) * 100}%`,
                                                    left: '50%',
                                                    top: '50%',
                                                    transform: 'translate(-50%, -50%)'
                                                }}
                                            />
                                            <div className="absolute inset-0 grid place-items-center">
                                                <div className="text-center bg-gray-900/80 px-6 py-3 rounded-xl backdrop-blur-sm">
                                                    <div className="text-sm text-gray-400">Expected Number of Cells</div>
                                                    <div className="text-2xl font-semibold text-white">{expectedCells} {expectedCells > 1 ? "cells" : "cell"}</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 투자 효과 설명 */}
                                        <div className="bg-blue-900/20 border border-blue-500/20 rounded-xl p-4 text-sm text-gray-300 leading-relaxed">
                                            {isAdditionalInvestment ? (
                                                <>
                                                    Continental share will be increased from <span className="text-gray-200 font-medium">{userSharePercentage.toFixed(2)}%</span>{' '}
                                                    to <span className="text-blue-400 font-medium">{expectedSharePercentage.toFixed(2)}%</span>,
                                                    Territory size will be changed into <span className="text-green-400 font-medium">{expectedCellLength}×{expectedCellLength}</span>.
                                                </>
                                            ) : (
                                                <>
                                                    You will have <span className="text-blue-400 font-medium">{expectedSharePercentage.toFixed(2)}%</span> as continental share,{' '}
                                                    be occupying an area sized <span className="text-green-400 font-medium">{expectedCellLength}×{expectedCellLength}</span>.
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 버튼 */}
                    <div className="p-6 flex justify-end space-x-4">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 bg-gray-800 text-gray-300 rounded-xl hover:bg-gray-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handlePurchase}
                            disabled={!isPurchasePossible || isCalculating}
                            className={`px-6 py-3 rounded-xl transition-all ${
                                isPurchasePossible && !isCalculating
                                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:opacity-90'
                                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                            }`}
                        >
                            {isCalculating ? (
                                <span className="flex items-center space-x-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    <span>In Progress...</span>
                                </span>
                            ) : (
                                'Purchase'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}

export default memo(PurchaseTerritoryModal);