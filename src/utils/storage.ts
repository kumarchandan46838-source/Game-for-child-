import { PlayerProfile } from '../types/game';

const STORAGE_KEY = 'army_kids_adventure_save_v1';

export const DEFAULT_PROFILE: PlayerProfile = {
  coins: 50,
  stars: 0,
  unlockedLevel: 1,
  levelStars: {},
  levelScores: {},
  badges: ['cadet_recruit'],
  unlockedCustomizations: ['Leo', 'GreenJeep'],
  activeCharacter: 'Leo',
  activeVehicle: 'GreenJeep',
  soundEnabled: true,
  musicEnabled: true,
  soundVolume: 0.8,
  musicVolume: 0.5,
  dailyChallengeDate: '',
  dailyChallengeCompleted: false,
  dailyStreak: 0,
  completedLevelsSinceLastAd: 0,
  totalLevelsCompleted: 0,
};

export function loadProfile(): PlayerProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PROFILE };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PROFILE,
      ...parsed,
      levelStars: parsed.levelStars || {},
      levelScores: parsed.levelScores || {},
      badges: parsed.badges || ['cadet_recruit'],
      unlockedCustomizations: parsed.unlockedCustomizations || ['Leo', 'GreenJeep'],
    };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

export function saveProfile(profile: PlayerProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.warn('Failed to save game state to localStorage:', e);
  }
}

export function resetProfile(): PlayerProfile {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
  return { ...DEFAULT_PROFILE };
}
