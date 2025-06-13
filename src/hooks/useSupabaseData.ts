import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/supabase'
import { continentsAPI } from '@/lib/supabase/supabase-continents-api'
import { investorsAPI } from '@/lib/supabase/supabase-investors-api'
import { useContinentStore } from '@/store/continentStore'
import { useInvestorsStore } from '@/store/investorsStore'
import { showSuccess, showError, showInfo } from '@/components/admin/NotificationSystem'

// 인증 상태 관리 훅
export function useAuth() {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        // 초기 사용자 상태 확인
        auth.getCurrentUser()
            .then(setUser)
            .catch((error: Error) => setError(error.message))
            .finally(() => setLoading(false))

        // 인증 상태 변경 구독
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                setUser(session?.user ?? null)
                setLoading(false)

                if (event === 'SIGNED_IN' && session?.user) {
                    // 사용자 정보를 DB에 저장/업데이트
                    try {
                        await users.upsert({
                            id: session.user.id,
                            email: session.user.email!,
                            name: session.user.user_metadata?.name || session.user.email!,
                            avatar_url: session.user.user_metadata?.avatar_url,
                        })
                    } catch (error) {
                        console.error('사용자 정보 저장 실패:', error)
                    }
                }
            }
        )

        return () => subscription.unsubscribe()
    }, [])

    const signIn = async (email: string, password: string) => {
        try {
            setLoading(true)
            setError(null)
            await auth.signInWithEmail(email, password)
            showSuccess('로그인 성공', '환영합니다!')
        } catch (err: any) {
            setError(err.message)
            showError('로그인 실패', err.message)
        } finally {
            setLoading(false)
        }
    }

    const signUp = async (email: string, password: string, name: string) => {
        try {
            setLoading(true)
            setError(null)
            await auth.signUpWithEmail(email, password, name)
            showInfo('회원가입 완료', '이메일을 확인하여 계정을 활성화해주세요.')
        } catch (err: any) {
            setError(err.message)
            showError('회원가입 실패', err.message)
        } finally {
            setLoading(false)
        }
    }

    const signInWithGoogle = async () => {
        try {
            setLoading(true)
            setError(null)
            await auth.signInWithGoogle()
        } catch (err: any) {
            setError(err.message)
            showError('Google 로그인 실패', err.message)
        } finally {
            setLoading(false)
        }
    }

    const signOut = async () => {
        try {
            await auth.signOut()
            showSuccess('로그아웃 완료', '안전하게 로그아웃되었습니다.')
        } catch (err: any) {
            showError('로그아웃 실패', err.message)
        }
    }

    return {
        user,
        loading,
        error,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
    }
}

// 대륙 데이터 실시간 동기화 훅
export function useContinentSync() {
    const { setContinents, setLoading } = useContinentStore()
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let subscription: any = null

        const loadContinents = async () => {
            try {
                setLoading(true)
                const continentsData = await continentsAPI.getAll()

                // Supabase 데이터를 로컬 스토어 형식으로 변환
                const formattedContinents = continentsData.reduce((acc, continent) => {
                    acc[continent.id] = {
                        id: continent.id,
                        name: continent.name,
                        color: continent.color,
                        themeColor: continent.theme_color,
                        description: continent.description,
                        maxUsers: continent.max_users,
                        position: [continent.position_x, continent.position_y, continent.position_z] as [number, number, number],
                        cameraTarget: [continent.camera_target_x, continent.camera_target_y, continent.camera_target_z] as [number, number, number],
                        currentUsers: continent.current_users,
                        isActive: continent.is_active,
                    }
                    return acc
                }, {} as any)

                setContinents(formattedContinents)

                // 실시간 구독 설정
                subscription = subscriptions.subscribeToContinents((payload) => {
                    console.log('대륙 변경사항:', payload)
                    // 변경사항을 실시간으로 반영
                    loadContinents()
                })

            } catch (err: any) {
                setError(err.message)
                showError('대륙 데이터 로드 실패', err.message)
            } finally {
                setLoading(false)
            }
        }

        loadContinents()

        return () => {
            if (subscription) {
                subscriptions.unsubscribe(subscription)
            }
        }
    }, [setContinents, setLoading])

    return { error }
}

// 투자자 데이터 실시간 동기화 훅
export function useInvestorSync() {
    const { setInvestors, setLoading } = useContinentStore()
    const { fetchInvestors, subscribeToInvestors, unsubscribeFromInvestors } = useInvestorsStore()
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let subscription: any = null

        const loadInvestors = async () => {
            try {
                setLoading(true)
                const investorsData = await investorsAPI.getAll()

                // 대륙별로 투자자 데이터 그룹화
                const groupedInvestors = investorsData.reduce((acc, investor) => {
                    if (!acc[investor.continent_id]) {
                        acc[investor.continent_id] = []
                    }

                    acc[investor.continent_id].push({
                        id: investor.id,
                        name: investor.name,
                        title: investor.title,
                        investmentAmount: investor.investment_amount,
                        sharePercentage: investor.share_percentage,
                        imageUrl: investor.image_url,
                        imageStatus: investor.image_status,
                        position: { x: investor.position_x, y: investor.position_y },
                        width: investor.width,
                        height: investor.height,
                        isVip: investor.is_vip,
                        userId: investor.user_id,
                    })

                    return acc
                }, {} as any)

                setInvestors(groupedInvestors)

                // 실시간 구독 설정
                subscription = subscribeToInvestors()

            } catch (err: any) {
                setError(err.message)
                showError('투자자 데이터 로드 실패', err.message)
            } finally {
                setLoading(false)
            }
        }

        loadInvestors()

        return () => {
            if (subscription) {
                unsubscribeFromInvestors()
            }
        }
    }, [setInvestors, setLoading, subscribeToInvestors, unsubscribeFromInvestors])

    return { error }
}

// 관리자 대시보드 데이터 훅
export function useAdminDashboard() {
    const [stats, setStats] = useState<any>(null)
    const [recentActivity, setRecentActivity] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                setLoading(true)

                const [statsData, activityData] = await Promise.all([
                    analytics.getDashboardStats(),
                    analytics.getRecentActivity(10)
                ])

                setStats(statsData)
                setRecentActivity(activityData)

            } catch (err: any) {
                setError(err.message)
                showError('대시보드 데이터 로드 실패', err.message)
            } finally {
                setLoading(false)
            }
        }

        loadDashboardData()

        // 30초마다 데이터 새로고침
        const interval = setInterval(loadDashboardData, 30000)

        return () => clearInterval(interval)
    }, [])

    const refreshData = () => {
        setLoading(true)
        loadDashboardData()
    }

    return {
        stats,
        recentActivity,
        loading,
        error,
        refreshData,
    }
}

// 사용자별 투자 정보 훅
export function useUserInvestment(userId: string | null) {
    const [investor, setInvestor] = useState<any>(null)
    const [investments, setInvestments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!userId) {
            setLoading(false)
            return
        }

        const loadUserData = async () => {
            try {
                setLoading(true)
                console.log('🔄 사용자 투자 데이터 로드 시작:', userId)

                const [investorData, investmentsData] = await Promise.all([
                    investorsAPI.getByUserId(userId),
                    investorsAPI.getInvestmentsByUserId(userId)
                ])

                setInvestor(investorData)
                setInvestments(investmentsData)
                console.log('✅ 사용자 투자 데이터 로드 완료:', investorData, investmentsData)

            } catch (err: any) {
                setError(err.message)
                console.error('❌ 사용자 투자 데이터 로드 실패:', err)
            } finally {
                setLoading(false)
            }
        }

        loadUserData()
    }, [userId])

    return {
        investor,
        investments,
        loading,
        error,
    }
}

// 실시간 알림 훅
export function useNotifications(userId: string | null) {
    const [notifications, setNotifications] = useState<any[]>([])
    const [unreadCount, setUnreadCount] = useState(0)

    useEffect(() => {
        if (!userId) return

        let subscription: any = null

        const loadNotifications = async () => {
            try {
                const notificationsData = await notifications.getByUserId(userId)
                setNotifications(notificationsData)
                setUnreadCount(notificationsData.filter(n => !n.is_read).length)
            } catch (error) {
                console.error('알림 데이터 로드 실패:', error)
            }
        }

        loadNotifications()

        // 실시간 알림 구독
        subscription = subscriptions.subscribeToNotifications(userId, (payload) => {
            console.log('새 알림:', payload)
            loadNotifications()

            // 시스템 알림 표시
            if (payload.new) {
                showInfo(payload.new.title, payload.new.message)
            }
        })

        return () => {
            if (subscription) {
                subscriptions.unsubscribe(subscription)
            }
        }
    }, [userId])

    const markAsRead = async (notificationId: string) => {
        try {
            await notifications.markAsRead(notificationId)
            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
            )
            setUnreadCount(prev => Math.max(0, prev - 1))
        } catch (error) {
            console.error('알림 읽음 처리 실패:', error)
        }
    }

    const markAllAsRead = async () => {
        if (!userId) return

        try {
            await notifications.markAllAsRead(userId)
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
            setUnreadCount(0)
        } catch (error) {
            console.error('모든 알림 읽음 처리 실패:', error)
        }
    }

    return {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
    }
}

/**
 * Supabase 데이터 초기화 및 실시간 구독을 관리하는 훅
 */
export function useSupabaseData(onSuccess: () => void) {
    const { fetchContinents } = useContinentStore()
    const {
        fetchInvestors,
        subscribeToInvestors,
        unsubscribeFromInvestors
    } = useInvestorsStore()

    useEffect(() => {
        // 초기 데이터 로드
        const loadInitialData = async () => {
            console.log('🌍 초기 데이터 로드 시작')

            try {
                await Promise.all([
                    fetchContinents(),
                    fetchInvestors()
                ])

                // 실시간 구독 설정
                await subscribeToInvestors()

                console.log('✅ 초기 데이터 로드 및 구독 설정 완료')
            } catch (error: unknown) {
                if (error instanceof Error) {
                    console.error('❌ 초기 데이터 로드 실패:', error.message)
                    showError('데이터 로드 실패', error.message)
                } else {
                    console.error('❌ 초기 데이터 로드 실패: 알 수 없는 에러')
                    showError('데이터 로드 실패', '알 수 없는 에러가 발생했습니다.')
                }
            }
        }

        loadInitialData().then(() => {
            onSuccess();
        });

        // 컴포넌트 언마운트 시 구독 해제
        return () => {
            unsubscribeFromInvestors()
        }
    }, [fetchContinents, fetchInvestors, subscribeToInvestors, unsubscribeFromInvestors])
}
