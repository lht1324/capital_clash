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
                    name: string
                    email: string
                    avatar_url?: string
                    external_url?: string
                    role: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    email: string
                    avatar_url?: string
                    external_url?: string
                    role: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    name?: string
                    avatar_url?: string
                    role: string
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
            players: {
                Row: {
                    id: string
                    user_id: string
                    continent_id: string
                    name: string
                    description?: string
                    x_url?: string
                    instagram_url?: string
                    contact_email?: string
                    stake_amount: number
                    share_percentage: number
                    image_url?: string
                    image_status?: 'pending' | 'approved' | 'rejected'
                    created_at: string
                    updated_at: string
                    daily_views: number[]
                    previous_sunday_view: number
                    last_viewed_at?: string
                    area_color?: string
                    is_changed_continent: boolean
                }
                Insert: {
                    id?: string
                    user_id: string
                    continent_id: string
                    name: string
                    description?: string
                    x_url?: string
                    instagram_url?: string
                    contact_email?: string
                    stake_amount: number
                    share_percentage: number
                    image_url?: string
                    image_status?: 'pending' | 'approved' | 'rejected'
                    created_at: string
                    updated_at: string
                    daily_views: number[]
                    previous_sunday_view: number
                    last_viewed_at?: string
                    area_color?: string
                    is_changed_continent: boolean
                }
                Update: {
                    id?: string
                    user_id?: string
                    continent_id?: string
                    name: string
                    description?: string
                    x_url?: string
                    instagram_url?: string
                    contact_email?: string
                    stake_amount?: number
                    share_percentage?: number
                    image_url?: string
                    image_status?: 'pending' | 'approved' | 'rejected'
                    created_at: string
                    updated_at: string
                    daily_views: number[]
                    previous_sunday_view: number
                    last_viewed_at?: string
                    area_color?: string
                    is_changed_continent: boolean
                }
            }

            // 이미지 관리 테이블
            images: {
                Row: {
                    id: string
                    user_id: string
                    player_id: string
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
                    player_id: string
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
                    player_id?: string
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
