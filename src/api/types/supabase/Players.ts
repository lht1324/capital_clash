export interface Player {
    id: string
    user_id: string
    continent_id: string
    name: string
    description?: string
    x_url?: string
    instagram_url?: string
    contact_email?: string
    stake_amount: number
    image_url?: string
    image_status?: ImageStatus
    created_at: string
    updated_at: string
    daily_views: number[]
    previous_sunday_view: number
    last_viewed_at?: string
    area_color?: string
    is_changed_continent: boolean
}

export enum ImageStatus {
    PENDING = "pending",
    APPROVED = "approved",
    REJECTED = "rejected"
}