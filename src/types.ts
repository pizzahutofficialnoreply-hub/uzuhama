export interface DailyStat {
  day: string;
  count: number;
  probability: number; // overall percentage (0-100)
  firstChoiceTime: string;
  firstChoiceShare: number;
  secondChoiceTime: string;
  finalProbability: number;
}

export interface TimeStat {
  time: string;
  label: string;
  count: number;
  probability: number;
  description: string;
}

export interface DurationStat {
  label: string;
  count: number;
  probability: number;
  description: string;
}

export interface MonthlyStat {
  month: string;
  days: number;
  totalDays: number;
  attendanceRate: number;
}

export interface LinkItem {
  title: string;
  url: string;
}

export interface GameItem {
  name: string;
  link: string;
  category?: string;
}

export interface BroadcastLog {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  endTime?: string;
  game: string; // Legacy fallback
  games?: GameItem[];
  category: string;
  vods: LinkItem[];
  edited: LinkItem[];
  shorts: LinkItem[];
  durationHours: number;
}

export interface PatternGuide {
  id: string;
  title: string;
  content: string;
}

export interface AppData {
  logs: Record<string, BroadcastLog>;
  dailyStats: Record<string, DailyStat>;
  timeStats: Record<string, TimeStat>;
  durationStats: Record<string, DurationStat>;
  monthlyStats: Record<string, MonthlyStat>;
  patternGuides: Record<string, PatternGuide>;
}
