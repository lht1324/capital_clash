export interface Image {
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