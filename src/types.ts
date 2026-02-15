import type { Context, Scenes } from 'telegraf';

export type Role = 'OWNER' | 'PARTNER';

export interface User {
  id: number;
  telegram_id: number;
  role: Role;
  created_at: string;
}

export interface Note {
  id: number;
  user_id: number;
  text: string;
  category: 'wish' | 'idea' | 'preference' | 'memory' | 'gift' | 'attention' | 'date_idea' | 'place' | 'other';
  priority: number;
  created_at: string;
}

export interface ImportantDate {
  id: number;
  owner_id: number;
  title: string;
  date: string;
  reminder_type: 'yearly' | 'once';
  remind_before_days: number;
  created_at: string;
}

export interface BotState {
  user?: User;
  /** telegramId, если пользователь ещё не выбрал роль (не owner) */
  pendingRoleSelection?: number;
}

export interface AddDateSceneSession extends Scenes.SceneSessionData {
  stage?: string;
  data?: {
    title?: string;
    date?: string;
    reminder_type?: string;
    remind_before_days?: number;
  };
}

export type BotContext = Context &
  Scenes.SceneContext<AddDateSceneSession> & {
    state: BotState;
  };
