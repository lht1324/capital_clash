import {Player} from "@/api/types/supabase/Players";

export enum UpdateType {
    STAKE_CHANGE = 'STAKE_CHANGE',
    NEW_PLAYER = 'NEW_PLAYER',
    CONTINENT_CHANGE = 'CONTINENT_CHANGE',
    PLAYER_REMOVED = 'PLAYER_REMOVED',
    IMAGE_APPROVED = 'IMAGE_APPROVED',
    IMAGE_REJECTED = 'IMAGE_REJECTED',
    IMAGE_PENDING = 'IMAGE_PENDING',
    NONE_UI_UPDATE = 'NONE_UI_UPDATE',
}

export type PlayerUpdateInfo = {
    player: Player;
    updateType: UpdateType;
    previousStake?: number;
};
