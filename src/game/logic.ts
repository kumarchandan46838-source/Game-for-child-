/**
 * Pure game rules, scoring math, level progression, and safety calculations
 * for Army Kids Adventure.
 * Designed for deterministic testing via node:test.
 */

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Calculates 1, 2, or 3 stars based on achieved score and target thresholds.
 */
export function calculateStars(score: number, target: number): number {
  if (score <= 0) return 0;
  if (score >= target * 1.3) return 3;
  if (score >= target) return 2;
  return 1;
}

/**
 * Checks whether a level can be accessed.
 */
export function canUnlockLevel(currentUnlocked: number, targetLevel: number): boolean {
  if (targetLevel <= 1) return true;
  return targetLevel <= currentUnlocked;
}

/**
 * Calculates the next unlocked level threshold after winning.
 */
export function computeNextUnlockedLevel(currentUnlocked: number, wonLevel: number, maxLevels: number = 20): number {
  if (wonLevel >= currentUnlocked && wonLevel < maxLevels) {
    return wonLevel + 1;
  }
  return currentUnlocked;
}

/**
 * Simple 2D AABB bounding box collision detector
 */
export function checkCollision(a: BoundingBox, b: BoundingBox): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/**
 * Circles collision detector
 */
export function checkCircleCollision(
  x1: number,
  y1: number,
  r1: number,
  x2: number,
  y2: number,
  r2: number
): boolean {
  const dx = x1 - x2;
  const dy = y1 - y2;
  const distanceSq = dx * dx + dy * dy;
  const radiusSum = r1 + r2;
  return distanceSq <= radiusSum * radiusSum;
}

/**
 * Formats time in mm:ss format
 */
export function formatGameTime(totalSeconds: number): string {
  const safeSec = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSec / 60);
  const seconds = safeSec % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Calculates daily challenge coin bonus based on consecutive streak
 */
export function calculateDailyBonus(streak: number): number {
  const base = 50;
  const bonus = Math.min(streak * 10, 100);
  return base + bonus;
}

/**
 * Checks AdMob interstitial eligibility under Google Play Families policy.
 * Requirements:
 * 1. Must NOT show on every level.
 * 2. Conservative frequency limit: only after every N completed levels (e.g. 3).
 * 3. Ad must be successfully pre-loaded.
 * 4. Never during active gameplay.
 */
export function checkAdMobEligibility(
  completedSinceLastAd: number,
  minCompletedBetweenAds: number = 3,
  isAdLoaded: boolean = true
): boolean {
  if (!isAdLoaded) return false;
  return completedSinceLastAd >= minCompletedBetweenAds;
}

/**
 * Validates the parent gate math challenge (e.g. 8 + 7 = 15)
 */
export function validateParentMathGate(numA: number, numB: number, answer: number): boolean {
  return numA + numB === answer;
}

/**
 * Evaluates achievement badges from player stats
 */
export function evaluateBadgeUnlocks(stats: {
  coins: number;
  stars: number;
  completedLevels: number;
  miniGamesPlayed: number;
}): string[] {
  const unlocked: string[] = ['cadet_recruit'];

  if (stats.stars >= 5) unlocked.push('star_gatherer');
  if (stats.stars >= 20) unlocked.push('star_champion');
  if (stats.stars >= 45) unlocked.push('star_superstar');

  if (stats.coins >= 100) unlocked.push('coin_collector');
  if (stats.coins >= 500) unlocked.push('treasury_guard');

  if (stats.completedLevels >= 5) unlocked.push('camp_scout');
  if (stats.completedLevels >= 10) unlocked.push('patrol_leader');
  if (stats.completedLevels >= 20) unlocked.push('master_commander');

  if (stats.miniGamesPlayed >= 8) unlocked.push('all_rounder');

  return unlocked;
}
