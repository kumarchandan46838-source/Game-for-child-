export type ScreenType =
  | 'title'
  | 'menu'
  | 'mini-games'
  | 'level-select'
  | 'playing'
  | 'rewards'
  | 'daily-challenge'
  | 'parent-settings'
  | 'privacy-policy';

export type MiniGameId =
  | 'army-runner'
  | 'jeep-adventure'
  | 'obstacle-course'
  | 'star-collector'
  | 'animal-rescue'
  | 'memory-mission'
  | 'puzzle-camp'
  | 'target-practice';

export interface LevelConfig {
  id: number;
  gameId: MiniGameId;
  name: string;
  subtitle: string;
  targetStarsScore: number;
  timeLimitSeconds?: number;
  obstacleCount?: number;
  difficulty: 'Easy' | 'Medium' | 'Fun Challenge';
  description: string;
  icon: string;
}

export interface PlayerProfile {
  coins: number;
  stars: number;
  unlockedLevel: number;
  levelStars: Record<number, number>;
  levelScores: Record<number, number>;
  badges: string[];
  unlockedCustomizations: string[];
  activeCharacter: 'Leo' | 'Bella' | 'Teddy' | 'Maya';
  activeVehicle: 'GreenJeep' | 'DesertJeep' | 'RescueJeep' | 'TigerJeep';
  soundEnabled: boolean;
  musicEnabled: boolean;
  soundVolume: number;
  musicVolume: number;
  dailyChallengeDate: string;
  dailyChallengeCompleted: boolean;
  dailyStreak: number;
  completedLevelsSinceLastAd: number;
  totalLevelsCompleted: number;
}

export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  rewardCoins: number;
}

export interface DailyQuest {
  id: string;
  title: string;
  description: string;
  gameId: MiniGameId;
  targetCount: number;
  rewardCoins: number;
  rewardStars: number;
}
