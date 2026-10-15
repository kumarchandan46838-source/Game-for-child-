import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateStars,
  canUnlockLevel,
  computeNextUnlockedLevel,
  checkCollision,
  checkCircleCollision,
  formatGameTime,
  calculateDailyBonus,
  checkAdMobEligibility,
  validateParentMathGate,
  evaluateBadgeUnlocks,
  deductLife,
  checkIsGameOver,
} from './logic.ts';

test('deductLife reduces lives accurately down to zero', () => {
  assert.equal(deductLife(3, 1), 2);
  assert.equal(deductLife(2, 1), 1);
  assert.equal(deductLife(1, 1), 0);
  assert.equal(deductLife(0, 1), 0, 'Cannot drop below zero');
});

test('checkIsGameOver triggers when lives reach zero or time runs out', () => {
  assert.equal(checkIsGameOver(3, 10), false);
  assert.equal(checkIsGameOver(1, 2), false);
  assert.equal(checkIsGameOver(0, 10), true, 'Zero lives triggers Game Over');
  assert.equal(checkIsGameOver(2, 0), true, 'Time expiring triggers Game Over');
  assert.equal(checkIsGameOver(2, -1), true);
});

test('calculateStars awards correct stars according to score and target', () => {
  assert.equal(calculateStars(0, 100), 0);
  assert.equal(calculateStars(50, 100), 1);
  assert.equal(calculateStars(100, 100), 2);
  assert.equal(calculateStars(130, 100), 3);
  assert.equal(calculateStars(200, 100), 3);
});

test('canUnlockLevel protects locked levels correctly', () => {
  assert.equal(canUnlockLevel(1, 1), true, 'Level 1 must always be unlocked');
  assert.equal(canUnlockLevel(1, 2), false, 'Level 2 must be locked initially');
  assert.equal(canUnlockLevel(5, 5), true, 'Level 5 must be accessible when reached');
  assert.equal(canUnlockLevel(5, 4), true, 'Previous levels must remain accessible');
  assert.equal(canUnlockLevel(5, 6), false, 'Unreached levels must stay locked');
});

test('computeNextUnlockedLevel advances only when higher level won', () => {
  assert.equal(computeNextUnlockedLevel(1, 1, 20), 2);
  assert.equal(computeNextUnlockedLevel(5, 2, 20), 5, 'Replaying earlier level does not lower unlocked level');
  assert.equal(computeNextUnlockedLevel(20, 20, 20), 20, 'Cannot exceed max level 20');
});

test('checkCollision detects overlapping rectangles', () => {
  const boxA = { x: 10, y: 10, width: 20, height: 20 };
  const boxB = { x: 25, y: 25, width: 20, height: 20 };
  const boxC = { x: 100, y: 100, width: 20, height: 20 };

  assert.equal(checkCollision(boxA, boxB), true);
  assert.equal(checkCollision(boxA, boxC), false);
});

test('checkCircleCollision accurately tests circular hitboxes', () => {
  assert.equal(checkCircleCollision(0, 0, 10, 15, 0, 10), true);
  assert.equal(checkCircleCollision(0, 0, 10, 30, 0, 10), false);
});

test('formatGameTime properly formats minutes and seconds', () => {
  assert.equal(formatGameTime(0), '00:00');
  assert.equal(formatGameTime(45), '00:45');
  assert.equal(formatGameTime(75), '01:15');
  assert.equal(formatGameTime(125), '02:05');
});

test('calculateDailyBonus scales with streak', () => {
  assert.equal(calculateDailyBonus(0), 50);
  assert.equal(calculateDailyBonus(1), 60);
  assert.equal(calculateDailyBonus(5), 100);
  assert.equal(calculateDailyBonus(20), 150); // Capped at 150
});

test('checkAdMobEligibility enforces conservative kid-safe frequency limit', () => {
  // Should NOT show after 1 or 2 levels
  assert.equal(checkAdMobEligibility(1, 3, true), false);
  assert.equal(checkAdMobEligibility(2, 3, true), false);
  // Should show only after 3 completed levels
  assert.equal(checkAdMobEligibility(3, 3, true), true);
  // Never show if ad is not loaded
  assert.equal(checkAdMobEligibility(3, 3, false), false);
});

test('validateParentMathGate confirms correct addition', () => {
  assert.equal(validateParentMathGate(7, 8, 15), true);
  assert.equal(validateParentMathGate(7, 8, 14), false);
  assert.equal(validateParentMathGate(12, 13, 25), true);
});

test('evaluateBadgeUnlocks computes proper achievements', () => {
  const recruitBadges = evaluateBadgeUnlocks({
    coins: 10,
    stars: 2,
    completedLevels: 1,
    miniGamesPlayed: 1,
  });
  assert.ok(recruitBadges.includes('cadet_recruit'));
  assert.ok(!recruitBadges.includes('star_gatherer'));

  const championBadges = evaluateBadgeUnlocks({
    coins: 600,
    stars: 50,
    completedLevels: 20,
    miniGamesPlayed: 8,
  });
  assert.ok(championBadges.includes('star_champion'));
  assert.ok(championBadges.includes('star_superstar'));
  assert.ok(championBadges.includes('treasury_guard'));
  assert.ok(championBadges.includes('master_commander'));
  assert.ok(championBadges.includes('all_rounder'));
});
