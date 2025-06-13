export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            // 사용자 테이블
            users: {
                Row: {
                    id: string
                    email: string
                    name: string
                    avatar_url?: string
                    external_url?: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    email: string
                    name: string
                    avatar_url?: string
                    external_url?: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    name?: string
                    avatar_url?: string
                    external_url?: string
                    updated_at?: string
                }
            }

            // 대륙 테이블
            continents: {
                Row: {
                    id: string
                    name: string
                    color: string
                    theme_color: string
                    description: string
                    max_users: number
                    position_x: number
                    position_y: number
                    position_z: number
                    camera_target_x: number
                    camera_target_y: number
                    camera_target_z: number
                    current_users: number
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    name: string
                    color: string
                    theme_color: string
                    description: string
                    max_users: number
                    position_x: number
                    position_y: number
                    position_z: number
                    camera_target_x: number
                    camera_target_y: number
                    camera_target_z: number
                    current_users?: number
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    color?: string
                    theme_color?: string
                    description?: string
                    max_users?: number
                    position_x?: number
                    position_y?: number
                    position_z?: number
                    camera_target_x?: number
                    camera_target_y?: number
                    camera_target_z?: number
                    current_users?: number
                    is_active?: boolean
                    updated_at?: string
                }
            }

            // 투자자 테이블
            investors: {
                Row: {
                    id: string
                    user_id: string
                    continent_id: string
                    name?: string
                    title?: string
                    investment_amount: number
                    share_percentage: number
                    image_url?: string
                    image_status?: 'none' | 'pending' | 'approved' | 'rejected'
                    created_at?: string
                    updated_at?: string
                    view_count?: number
                    daily_views: number[]
                    previous_sunday_view: number
                    last_viewed_at?: string
                    area_color?: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    continent_id: string
                    name?: string
                    title?: string
                    investment_amount: number
                    share_percentage: number
                    image_url?: string
                    image_status?: 'none' | 'pending' | 'approved' | 'rejected'
                    created_at?: string
                    updated_at?: string
                    view_count?: number
                    daily_views: number[]
                    previous_sunday_view: number
                    last_viewed_at?: string
                    area_color?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    continent_id?: string
                    name?: string
                    title?: string
                    investment_amount?: number
                    share_percentage?: number
                    image_url?: string
                    image_status?: 'none' | 'pending' | 'approved' | 'rejected'
                    updated_at?: string
                    view_count?: number
                    daily_views: number[]
                    previous_sunday_view: number
                    last_viewed_at?: string
                    area_color?: string
                }
            }

            // 투자 히스토리 테이블
            investments: {
                Row: {
                    id: string
                    user_id: string
                    continent_id: string
                    amount: number
                    transaction_type: 'initial' | 'additional' | 'transfer'
                    payment_status: 'pending' | 'completed' | 'failed' | 'refunded'
                    payment_id?: string
                    metadata?: Json
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    continent_id: string
                    amount: number
                    transaction_type: 'initial' | 'additional' | 'transfer'
                    payment_status?: 'pending' | 'completed' | 'failed' | 'refunded'
                    payment_id?: string
                    metadata?: Json
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    continent_id?: string
                    amount?: number
                    transaction_type?: 'initial' | 'additional' | 'transfer'
                    payment_status?: 'pending' | 'completed' | 'failed' | 'refunded'
                    payment_id?: string
                    metadata?: Json
                    updated_at?: string
                }
            }

            // 이미지 관리 테이블
            images: {
                Row: {
                    id: string
                    user_id: string
                    investor_id: string
                    original_url: string
                    optimized_url?: string
                    file_size: number
                    file_type: string
                    status: 'pending' | 'approved' | 'rejected'
                    rejection_reason?: string
                    reviewed_by?: string
                    reviewed_at?: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    investor_id: string
                    original_url: string
                    optimized_url?: string
                    file_size: number
                    file_type: string
                    status?: 'pending' | 'approved' | 'rejected'
                    rejection_reason?: string
                    reviewed_by?: string
                    reviewed_at?: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    investor_id?: string
                    original_url?: string
                    optimized_url?: string
                    file_size?: number
                    file_type?: string
                    status?: 'pending' | 'approved' | 'rejected'
                    rejection_reason?: string
                    reviewed_by?: string
                    reviewed_at?: string
                    updated_at?: string
                }
            }

            // 카메라 투어 테이블
            camera_tours: {
                Row: {
                    id: string
                    name: string
                    description?: string
                    waypoints: Json
                    transitions: Json
                    loop: boolean
                    auto_start: boolean
                    is_default: boolean
                    created_by: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    description?: string
                    waypoints: Json
                    transitions: Json
                    loop?: boolean
                    auto_start?: boolean
                    is_default?: boolean
                    created_by: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    description?: string
                    waypoints?: Json
                    transitions?: Json
                    loop?: boolean
                    auto_start?: boolean
                    is_default?: boolean
                    updated_at?: string
                }
            }

            // 알림 테이블
            notifications: {
                Row: {
                    id: string
                    user_id: string
                    type: 'investment' | 'image_approval' | 'vip_promotion' | 'system'
                    title: string
                    message: string
                    metadata?: Json
                    is_read: boolean
                    created_at: string
                    expires_at?: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    type: 'investment' | 'image_approval' | 'vip_promotion' | 'system'
                    title: string
                    message: string
                    metadata?: Json
                    is_read?: boolean
                    created_at?: string
                    expires_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    type?: 'investment' | 'image_approval' | 'vip_promotion' | 'system'
                    title?: string
                    message?: string
                    metadata?: Json
                    is_read?: boolean
                    expires_at?: string
                }
            }

            // 관리자 로그 테이블
            admin_logs: {
                Row: {
                    id: string
                    admin_id: string
                    action: string
                    target_type: string
                    target_id: string
                    metadata?: Json
                    ip_address?: string
                    user_agent?: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    admin_id: string
                    action: string
                    target_type: string
                    target_id: string
                    metadata?: Json
                    ip_address?: string
                    user_agent?: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    admin_id?: string
                    action?: string
                    target_type?: string
                    target_id?: string
                    metadata?: Json
                    ip_address?: string
                    user_agent?: string
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
