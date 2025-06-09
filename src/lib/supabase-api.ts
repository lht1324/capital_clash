import { supabase } from './supabase'
import { Database } from '@/types/database'
import { showSuccess, showError, showInfo } from '@/components/admin/NotificationSystem'

type Tables = Database['public']['Tables']
type UserRow = Tables['users']['Row']
type ContinentRow = Tables['continents']['Row']
type InvestorRow = Tables['investors']['Row']
type InvestmentRow = Tables['investments']['Row']
type ImageRow = Tables['images']['Row']
type CameraTourRow = Tables['camera_tours']['Row']
type NotificationRow = Tables['notifications']['Row']

// 🔐 인증 관련 함수들
export const auth = {
  // 구글 로그인
  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) throw error
    return data
  },

  // 이메일 로그인
  async signInWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data
  },

  // 이메일 회원가입
  async signUpWithEmail(email: string, password: string, name: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    })
    if (error) throw error
    return data
  },

  // 로그아웃
  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  // 현재 사용자 가져오기
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  },

  // 사용자 정보 업데이트
  async updateUser(updates: { name?: string; avatar_url?: string }) {
    const { data, error } = await supabase.auth.updateUser({
      data: updates,
    })
    if (error) throw error
    return data
  },
}

// 👥 사용자 관련 함수들
export const users = {
  // 사용자 생성 또는 업데이트
  async upsert(user: Tables['users']['Insert']) {
    const { data, error } = await supabase
      .from('users')
      .upsert(user)
      .select()
      .single()
    
    if (error) {
      showError('사용자 정보 저장 실패', error.message)
      throw error
    }
    
    showSuccess('사용자 정보 저장 완료', `${user.name}님의 정보가 저장되었습니다.`)
    return data
  },

  // 사용자 조회
  async getById(id: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  // 모든 사용자 조회
  async getAll() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  // 사용자 정보 업데이트
  async update(id: string, updates: Tables['users']['Update']) {
    const { data, error } = await supabase
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      showError('사용자 정보 업데이트 실패', error.message)
      throw error
    }
    
    showSuccess('프로필 업데이트 완료', '사용자 정보가 성공적으로 업데이트되었습니다.')
    return data
  },
}

// 🌍 대륙 관련 함수들
export const continents = {
  // 모든 대륙 조회
  async getAll() {
    const { data, error } = await supabase
      .from('continents')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true })
    
    if (error) throw error
    return data || []
  },

  // 대륙 생성
  async create(continent: Tables['continents']['Insert']) {
    const { data, error } = await supabase
      .from('continents')
      .insert(continent)
      .select()
      .single()
    
    if (error) {
      showError('대륙 생성 실패', error.message)
      throw error
    }
    
    showSuccess('대륙 생성 완료', `${continent.name}이(가) 성공적으로 생성되었습니다.`)
    return data
  },

  // 대륙 업데이트
  async update(id: string, updates: Tables['continents']['Update']) {
    const { data, error } = await supabase
      .from('continents')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      showError('대륙 업데이트 실패', error.message)
      throw error
    }
    
    return data
  },

  // 모든 대륙 삭제 (관리자용)
  async deleteAll() {
    const { error } = await supabase
      .from('continents')
      .update({ is_active: false })
      .eq('is_active', true)
    
    if (error) {
      showError('대륙 삭제 실패', error.message)
      throw error
    }
    
    showSuccess('대륙 초기화 완료', '모든 대륙이 성공적으로 삭제되었습니다.')
  },

  // 대륙별 현재 사용자 수 업데이트
  async updateUserCount(continentId: string, userCount: number) {
    const { error } = await supabase
      .from('continents')
      .update({ current_users: userCount })
      .eq('id', continentId)
    
    if (error) throw error
  },
}

// 💰 투자자 관련 함수들
export const investors = {
  // 대륙별 투자자 조회
  async getByContinentId(continentId: string) {
    const { data, error } = await supabase
      .from('investors')
      .select(`
        *,
        users (*)
      `)
      .eq('continent_id', continentId)
      .order('investment_amount', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  // 모든 투자자 조회
  async getAll() {
    const { data, error } = await supabase
      .from('investors')
      .select(`
        *,
        users (*),
        continents (*)
      `)
      .order('investment_amount', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  // 사용자별 투자자 정보 조회
  async getByUserId(userId: string) {
    const { data, error } = await supabase
      .from('investors')
      .select(`
        *,
        continents (*)
      `)
      .eq('user_id', userId)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  // 투자자 생성
  async create(investor: Tables['investors']['Insert']) {
    const { data, error } = await supabase
      .from('investors')
      .insert(investor)
      .select()
      .single()
    
    if (error) {
      showError('투자 등록 실패', error.message)
      throw error
    }
    
    showSuccess('투자 등록 완료', `${investor.name}님의 투자가 등록되었습니다.`)
    return data
  },

  // 투자자 정보 업데이트
  async update(id: string, updates: Tables['investors']['Update']) {
    const { data, error } = await supabase
      .from('investors')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      showError('투자자 정보 업데이트 실패', error.message)
      throw error
    }
    
    return data
  },

  // 투자자 삭제
  async delete(id: string) {
    const { error } = await supabase
      .from('investors')
      .delete()
      .eq('id', id)
    
    if (error) {
      showError('투자자 삭제 실패', error.message)
      throw error
    }
    
    showSuccess('투자자 삭제 완료', '투자자 정보가 삭제되었습니다.')
  },

  // VIP 상태 업데이트
  async updateVipStatus(id: string, isVip: boolean) {
    const { data, error } = await supabase
      .from('investors')
      .update({ is_vip: isVip, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // 위치 업데이트
  async updatePosition(id: string, position: { x: number; y: number; width: number; height: number }) {
    const { data, error } = await supabase
      .from('investors')
      .update({
        position_x: position.x,
        position_y: position.y,
        width: position.width,
        height: position.height,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },
}

// 📈 투자 히스토리 관련 함수들
export const investments = {
  // 사용자별 투자 히스토리 조회
  async getByUserId(userId: string) {
    const { data, error } = await supabase
      .from('investments')
      .select(`
        *,
        continents (name, color)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  // 투자 기록 생성
  async create(investment: Tables['investments']['Insert']) {
    const { data, error } = await supabase
      .from('investments')
      .insert(investment)
      .select()
      .single()
    
    if (error) {
      showError('투자 기록 생성 실패', error.message)
      throw error
    }
    
    return data
  },

  // 결제 상태 업데이트
  async updatePaymentStatus(id: string, status: 'pending' | 'completed' | 'failed' | 'refunded', paymentId?: string) {
    const { data, error } = await supabase
      .from('investments')
      .update({
        payment_status: status,
        payment_id: paymentId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },
}

// 🖼️ 이미지 관련 함수들
export const images = {
  // 대기중인 이미지 조회 (관리자용)
  async getPending() {
    const { data, error } = await supabase
      .from('images')
      .select(`
        *,
        users (name, email),
        investors (name, title)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
    
    if (error) throw error
    return data || []
  },

  // 이미지 상태 업데이트 (관리자용)
  async updateStatus(id: string, status: 'approved' | 'rejected', rejectionReason?: string, reviewedBy?: string) {
    const { data, error } = await supabase
      .from('images')
      .update({
        status,
        rejection_reason: rejectionReason,
        reviewed_by: reviewedBy,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      showError('이미지 상태 업데이트 실패', error.message)
      throw error
    }
    
    showSuccess(
      status === 'approved' ? '이미지 승인 완료' : '이미지 거절 완료',
      `이미지가 ${status === 'approved' ? '승인' : '거절'}되었습니다.`
    )
    return data
  },

  // 이미지 업로드
  async upload(file: File, userId: string, investorId: string) {
    // 파일 업로드
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${investorId}/${Date.now()}.${fileExt}`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('investor-images')
      .upload(fileName, file)
    
    if (uploadError) {
      showError('이미지 업로드 실패', uploadError.message)
      throw uploadError
    }
    
    // 공개 URL 가져오기
    const { data: { publicUrl } } = supabase.storage
      .from('investor-images')
      .getPublicUrl(fileName)
    
    // 이미지 레코드 생성
    const { data, error } = await supabase
      .from('images')
      .insert({
        user_id: userId,
        investor_id: investorId,
        original_url: publicUrl,
        file_size: file.size,
        file_type: file.type,
        status: 'pending',
      })
      .select()
      .single()
    
    if (error) {
      showError('이미지 정보 저장 실패', error.message)
      throw error
    }
    
    showInfo('이미지 업로드 완료', '이미지가 업로드되었으며 관리자 승인을 기다리고 있습니다.')
    return data
  },
}

// 🎥 카메라 투어 관련 함수들
export const cameraTours = {
  // 모든 투어 조회
  async getAll() {
    const { data, error } = await supabase
      .from('camera_tours')
      .select('*')
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  // 투어 저장
  async create(tour: Tables['camera_tours']['Insert']) {
    const { data, error } = await supabase
      .from('camera_tours')
      .insert(tour)
      .select()
      .single()
    
    if (error) {
      showError('투어 저장 실패', error.message)
      throw error
    }
    
    showSuccess('투어 저장 완료', `"${tour.name}" 투어가 저장되었습니다.`)
    return data
  },

  // 투어 업데이트
  async update(id: string, updates: Tables['camera_tours']['Update']) {
    const { data, error } = await supabase
      .from('camera_tours')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      showError('투어 업데이트 실패', error.message)
      throw error
    }
    
    return data
  },

  // 기본 투어 설정
  async setDefault(id: string) {
    // 먼저 모든 투어의 기본값 해제
    await supabase
      .from('camera_tours')
      .update({ is_default: false })
      .eq('is_default', true)
    
    // 선택한 투어를 기본값으로 설정
    const { data, error } = await supabase
      .from('camera_tours')
      .update({ is_default: true, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },
}

// 🔔 알림 관련 함수들
export const notifications = {
  // 사용자별 알림 조회
  async getByUserId(userId: string, limit = 20) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data || []
  },

  // 알림 생성
  async create(notification: Tables['notifications']['Insert']) {
    const { data, error } = await supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // 알림 읽음 처리
  async markAsRead(id: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
    
    if (error) throw error
  },

  // 모든 알림 읽음 처리
  async markAllAsRead(userId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)
    
    if (error) throw error
  },
}

// 📊 관리자 로그 관련 함수들
export const adminLogs = {
  // 로그 생성
  async create(log: Tables['admin_logs']['Insert']) {
    const { data, error } = await supabase
      .from('admin_logs')
      .insert(log)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // 로그 조회
  async getRecent(limit = 50) {
    const { data, error } = await supabase
      .from('admin_logs')
      .select(`
        *,
        users!admin_logs_admin_id_fkey (name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data || []
  },
}

// 🔄 실시간 구독 함수들
export const subscriptions = {
  // 투자자 변경사항 구독
  subscribeToInvestors(callback: (payload: any) => void) {
    return supabase
      .channel('investors-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'investors' },
        callback
      )
      .subscribe()
  },

  // 대륙 변경사항 구독
  subscribeToContinents(callback: (payload: any) => void) {
    return supabase
      .channel('continents-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'continents' },
        callback
      )
      .subscribe()
  },

  // 이미지 상태 변경 구독
  subscribeToImages(callback: (payload: any) => void) {
    return supabase
      .channel('images-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'images' },
        callback
      )
      .subscribe()
  },

  // 알림 구독
  subscribeToNotifications(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`notifications-${userId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe()
  },

  // 구독 해제
  unsubscribe(channel: any) {
    return supabase.removeChannel(channel)
  },
}

// 🎯 통계 및 분석 함수들
export const analytics = {
  // 대시보드 통계 조회
  async getDashboardStats() {
    const [
      { count: totalUsers },
      { data: investments },
      { count: totalTiles },
      { count: pendingImages }
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('investments').select('amount').eq('payment_status', 'completed'),
      supabase.from('investors').select('*', { count: 'exact', head: true }),
      supabase.from('images').select('*', { count: 'exact', head: true }).eq('status', 'pending')
    ])

    const totalInvestment = investments?.reduce((sum, inv) => sum + inv.amount, 0) || 0
    const averageInvestment = totalUsers ? totalInvestment / totalUsers : 0

    return {
      totalUsers: totalUsers || 0,
      totalInvestment,
      totalTiles: totalTiles || 0,
      pendingImages: pendingImages || 0,
      averageInvestment,
    }
  },

  // 최근 활동 조회
  async getRecentActivity(limit = 10) {
    const { data, error } = await supabase
      .from('investments')
      .select(`
        id,
        amount,
        transaction_type,
        created_at,
        users (name),
        continents (name)
      `)
      .eq('payment_status', 'completed')
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data || []
  },
} 