import {useCallback, useEffect} from 'react'
import { useContinentStore } from '@/store/continentStore'
import { useInvestorStore } from '@/store/investorsStore'
import {useUserStore} from "@/store/userStore";

/**
 * Supabase 데이터 초기화 및 실시간 구독을 관리하는 훅
 */
export function useSupabaseData(onSuccess: () => void) {
    const { fetchContinents } = useContinentStore()
    const {
        fetchInvestors,
        subscribeToInvestors,
        unsubscribeFromInvestors
    } = useInvestorStore()
    const { fetchUser } = useUserStore();

    useEffect(() => {
        // 초기 데이터 로드
        const loadInitialData = async () => {
            console.log('🌍 초기 데이터 로드 시작')

            try {
                await Promise.all([
                    fetchContinents(),
                    fetchInvestors(),
                    // fetchUser(),
                ])

                // 실시간 구독 설정
                await subscribeToInvestors()

                console.log('✅ 초기 데이터 로드 및 구독 설정 완료')
            } catch (error: unknown) {
                if (error instanceof Error) {
                    console.error('❌ 초기 데이터 로드 실패:', error.message)
                } else {
                    console.error('❌ 초기 데이터 로드 실패: 알 수 없는 에러')
                }
            }
        }

        loadInitialData().then(() => {
            onSuccess();
        });

        // 페이지 가시성 변화 감지 및 대응
        const handleVisibilityChange = async () => {
            if (document.visibilityState === 'visible') {
                console.log('🔄 페이지 포커스 감지, 실시간 연결 확인 중...')
                // 페이지 포커스 시 항상 재연결 시도
                // 최신 Supabase 버전에서는 isConnected() 대신 다른 방법 사용

                await unsubscribeFromInvestors();
                await subscribeToInvestors()

                console.log('🔄 실시간 연결 재설정 완료')
            }
        };

        // 네트워크 상태 변화 감지 및 대응
        const handleNetworkChange = async () => {
            if (navigator.onLine) {
                console.log('🌐 네트워크 연결 감지, 실시간 연결 재설정 중...')

                await unsubscribeFromInvestors();
                await subscribeToInvestors()

            } else {
                console.log('🔌 네트워크 연결 끊김')
            }
        };

        // 이벤트 리스너 등록
        document.addEventListener('visibilitychange', handleVisibilityChange)
        window.addEventListener('online', handleNetworkChange)
        window.addEventListener('offline', handleNetworkChange)

        // 컴포넌트 언마운트 시 구독 해제 및 이벤트 리스너 제거
        return () => {
            unsubscribeFromInvestors().then();
            document.removeEventListener('visibilitychange', handleVisibilityChange)
            window.removeEventListener('online', handleNetworkChange)
            window.removeEventListener('offline', handleNetworkChange)
        }
    }, [fetchContinents, fetchInvestors, subscribeToInvestors, unsubscribeFromInvestors])
}