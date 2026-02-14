/**
 * Row shape for public.user_gear_playcount.
 * Matches schema.sql. Use when typing select("*") results or future reward logic.
 */
export interface UserGearPlaycountRow {
  user_id: string;
  gear_type: string;
  today_play_count: number;
  total_play_count: number;
  has_claimed_reward: boolean;
}
