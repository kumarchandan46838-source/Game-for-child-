/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { LevelConfig, MiniGameId, PlayerProfile } from './types/game';
import { LEVELS } from './game/levels';
import { loadProfile, saveProfile, resetProfile, DEFAULT_PROFILE } from './utils/storage';
import { adManager } from './utils/admob';
import { sound } from './utils/audio';
import { computeNextUnlockedLevel } from './game/logic';

// Main Menu & Screens
import { MainMenu } from './components/MainMenu';
import { LevelSelectModal } from './components/modals/LevelSelectModal';
import { MiniGamesHubModal } from './components/modals/MiniGamesHubModal';
import { RewardsModal } from './components/modals/RewardsModal';
import { DailyChallengeModal } from './components/modals/DailyChallengeModal';
import { ParentSettingsModal } from './components/modals/ParentSettingsModal';
import { ParentGateModal } from './components/modals/ParentGateModal';
import { PrivacyPolicyModal } from './components/modals/PrivacyPolicyModal';
import { VictoryModal } from './components/modals/VictoryModal';
import { GameOverModal } from './components/modals/GameOverModal';
import { AdMobModal } from './components/modals/AdMobModal';
import { ApkDownloadModal } from './components/modals/ApkDownloadModal';

// 8 Playable Mini-Games
import { ArmyRunnerGame } from './components/minigames/ArmyRunnerGame';
import { JeepAdventureGame } from './components/minigames/JeepAdventureGame';
import { ObstacleCourseGame } from './components/minigames/ObstacleCourseGame';
import { StarCollectorGame } from './components/minigames/StarCollectorGame';
import { AnimalRescueGame } from './components/minigames/AnimalRescueGame';
import { MemoryMissionGame } from './components/minigames/MemoryMissionGame';
import { PuzzleCampGame } from './components/minigames/PuzzleCampGame';
import { TargetPracticeGame } from './components/minigames/TargetPracticeGame';

export default function App() {
  const [profile, setProfile] = useState<PlayerProfile>(() => loadProfile());
  const [currentLevel, setCurrentLevel] = useState<LevelConfig>(LEVELS[0]);
  const [gameState, setGameState] = useState<
    'menu' | 'playing' | 'victory' | 'gameover'
  >('menu');

  // Active Modals
  const [activeModal, setActiveModal] = useState<
    | null
    | 'level-select'
    | 'mini-games'
    | 'rewards'
    | 'daily-challenge'
    | 'parent-settings'
    | 'privacy-policy'
    | 'parent-gate'
    | 'apk-install'
  >(null);

  const [parentGateTarget, setParentGateTarget] = useState<
    'parent-settings' | 'privacy-policy' | null
  >(null);

  // Victory result storage
  const [victoryData, setVictoryData] = useState<{
    stars: number;
    score: number;
    coins: number;
  }>({ stars: 0, score: 0, coins: 0 });

  // Game Over result storage
  const [gameOverData, setGameOverData] = useState<{
    reason: 'lives' | 'timeout' | 'moves' | 'mistakes' | 'crashed';
    score: number;
    progressPercent: number;
  }>({ reason: 'lives', score: 0, progressPercent: 0 });

  // AdMob Interstitial State
  const [showAdMobInterstitial, setShowAdMobInterstitial] = useState(false);
  const [pendingNextLevel, setPendingNextLevel] = useState<LevelConfig | null>(null);

  // Android Phone Frame toggle (enabled on desktop for authentic mobile preview, toggleable)
  const [isPhoneFrame, setIsPhoneFrame] = useState(false);

  // Fresh game instance session counter
  const [gameSessionId, setGameSessionId] = useState(0);

  // Sync profile to localStorage on change
  useEffect(() => {
    saveProfile(profile);
  }, [profile]);

  // Synchronize document.body.dataset.state for ultra mode & accessibility
  useEffect(() => {
    if (gameState === 'menu') {
      document.body.dataset.state = 'title';
    } else if (gameState === 'playing') {
      document.body.dataset.state = 'playing';
    } else if (gameState === 'victory') {
      document.body.dataset.state = 'gameover';
    }
  }, [gameState]);

  // Handle ?autostart=1 parameter to jump straight to playing
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      setGameState('playing');
    }
  }, []);

  // Update profile helper
  const handleUpdateProfile = useCallback((updated: Partial<PlayerProfile>) => {
    setProfile((prev) => ({ ...prev, ...updated }));
  }, []);

  // Play Game Handler (plays current highest unlocked level)
  const handlePlayGame = useCallback(() => {
    setGameSessionId((s) => s + 1);
    const targetLvl = LEVELS.find((l) => l.id === profile.unlockedLevel) || LEVELS[0];
    setCurrentLevel(targetLvl);
    setGameState('playing');
    setActiveModal(null);
  }, [profile.unlockedLevel]);

  // Keyboard shortcut to start game from menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState === 'menu' && !activeModal) {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          handlePlayGame();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, activeModal, handlePlayGame]);

  // Sound toggles
  const handleToggleSound = () => {
    const next = !profile.soundEnabled;
    sound.setSoundMuted(!next);
    handleUpdateProfile({ soundEnabled: next });
  };

  const handleToggleMusic = () => {
    const next = !profile.musicEnabled;
    sound.setMusicMuted(!next);
    handleUpdateProfile({ musicEnabled: next });
  };

  // Launch a selected level
  const handleSelectLevel = (level: LevelConfig) => {
    setGameSessionId((s) => s + 1);
    setCurrentLevel(level);
    setActiveModal(null);
    setGameState('playing');
  };

  // Launch selected mini-game (picks first level of that game or unlocked level)
  const handleSelectMiniGame = (gameId: MiniGameId) => {
    setGameSessionId((s) => s + 1);
    const match = LEVELS.find((l) => l.gameId === gameId) || LEVELS[0];
    setCurrentLevel(match);
    setActiveModal(null);
    setGameState('playing');
  };

  // Level Won handler
  const handleLevelVictory = (stars: number, score: number, coins: number) => {
    const nextUnlocked = computeNextUnlockedLevel(profile.unlockedLevel, currentLevel.id, 20);

    const updatedStars = {
      ...profile.levelStars,
      [currentLevel.id]: Math.max(profile.levelStars[currentLevel.id] || 0, stars),
    };

    const updatedScores = {
      ...profile.levelScores,
      [currentLevel.id]: Math.max(profile.levelScores[currentLevel.id] || 0, score),
    };

    // Increment completed levels in AdManager for frequency capping
    adManager.registerLevelCompletion();

    handleUpdateProfile({
      coins: profile.coins + coins,
      stars: Object.values(updatedStars).reduce((a, b) => a + b, 0),
      unlockedLevel: nextUnlocked,
      levelStars: updatedStars,
      levelScores: updatedScores,
      totalLevelsCompleted: profile.totalLevelsCompleted + 1,
    });

    setVictoryData({ stars, score, coins });
    setGameState('victory');
  };

  // Level Game Over / Out handler
  const handleLevelGameOver = (
    reason: 'lives' | 'timeout' | 'moves' | 'mistakes' | 'crashed',
    score: number,
    progressPercent: number
  ) => {
    setGameOverData({ reason, score, progressPercent });
    setGameState('gameover');
  };

  // Next level navigation with AdMob Frequency Capping check
  const handleNextLevel = () => {
    const nextLevelIndex = LEVELS.findIndex((l) => l.id === currentLevel.id) + 1;
    if (nextLevelIndex < LEVELS.length) {
      const nextLevel = LEVELS[nextLevelIndex];

      // Check if AdMob interstitial is eligible (after every 3 completed levels, never during active gameplay)
      if (adManager.isEligibleForInterstitial()) {
        adManager.markAdShown();
        setPendingNextLevel(nextLevel);
        setShowAdMobInterstitial(true);
      } else {
        setCurrentLevel(nextLevel);
        setGameState('playing');
      }
    } else {
      setGameState('menu');
    }
  };

  const handleCloseAdMob = () => {
    setShowAdMobInterstitial(false);
    if (pendingNextLevel) {
      setCurrentLevel(pendingNextLevel);
      setPendingNextLevel(null);
      setGameState('playing');
    } else {
      setGameState('playing');
    }
  };

  // Render the active mini-game
  const renderMiniGame = () => {
    const props = {
      key: `${currentLevel.id}-${gameSessionId}`,
      level: currentLevel,
      character: profile.activeCharacter,
      vehicle: profile.activeVehicle,
      onVictory: handleLevelVictory,
      onGameOver: handleLevelGameOver,
      onExit: () => setGameState('menu'),
      onRestart: () => {
        setGameSessionId((s) => s + 1);
        setGameState('playing');
      },
    };

    switch (currentLevel.gameId) {
      case 'army-runner':
        return <ArmyRunnerGame {...props} />;
      case 'jeep-adventure':
        return <JeepAdventureGame {...props} />;
      case 'obstacle-course':
        return <ObstacleCourseGame {...props} />;
      case 'star-collector':
        return <StarCollectorGame {...props} />;
      case 'animal-rescue':
        return <AnimalRescueGame {...props} />;
      case 'memory-mission':
        return <MemoryMissionGame {...props} />;
      case 'puzzle-camp':
        return <PuzzleCampGame {...props} />;
      case 'target-practice':
        return <TargetPracticeGame {...props} />;
      default:
        return <ArmyRunnerGame {...props} />;
    }
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-slate-950 flex items-center justify-center p-0 select-none">
      {/* Device wrapper: Full screen or simulated Android Phone/Tablet */}
      <div
        className={`w-full h-full relative overflow-hidden transition-all duration-300 ${
          isPhoneFrame
            ? 'max-w-[420px] max-h-[880px] rounded-[48px] border-[12px] border-stone-800 shadow-[0_0_50px_rgba(0,0,0,0.8)]'
            : ''
        }`}
      >
        {/* Android Punch-hole camera notch in phone frame mode */}
        {isPhoneFrame && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-black z-50 pointer-events-none border border-stone-800" />
        )}

        {/* Active View: Main Menu or Active Mini-Game */}
        {gameState === 'menu' && (
          <MainMenu
            profile={profile}
            onPlayGame={handlePlayGame}
            onOpenMiniGames={() => setActiveModal('mini-games')}
            onOpenLevelSelect={() => setActiveModal('level-select')}
            onOpenRewards={() => setActiveModal('rewards')}
            onOpenDailyChallenge={() => setActiveModal('daily-challenge')}
            onOpenParentSettings={() => {
              setParentGateTarget('parent-settings');
              setActiveModal('parent-gate');
            }}
            onOpenPrivacyPolicy={() => setActiveModal('privacy-policy')}
            onOpenApkModal={() => setActiveModal('apk-install')}
            onToggleSound={handleToggleSound}
            onToggleMusic={handleToggleMusic}
            isPhoneFrame={isPhoneFrame}
            onTogglePhoneFrame={() => setIsPhoneFrame((f) => !f)}
          />
        )}

        {gameState === 'playing' && renderMiniGame()}

        {/* Victory Celebration Screen */}
        {gameState === 'victory' && (
          <VictoryModal
            level={currentLevel}
            starsEarned={victoryData.stars}
            score={victoryData.score}
            coinsEarned={victoryData.coins}
            onNextLevel={handleNextLevel}
            onRetry={() => setGameState('playing')}
            onHome={() => setGameState('menu')}
            hasNextLevel={currentLevel.id < LEVELS.length}
          />
        )}

        {/* Game Over / Out Screen */}
        {gameState === 'gameover' && (
          <GameOverModal
            level={currentLevel}
            reason={gameOverData.reason}
            score={gameOverData.score}
            progressPercent={gameOverData.progressPercent}
            onRetry={() => {
              setGameSessionId((s) => s + 1);
              setGameState('playing');
            }}
            onHome={() => setGameState('menu')}
          />
        )}

        {/* Modals */}
        {activeModal === 'level-select' && (
          <LevelSelectModal
            profile={profile}
            onSelectLevel={handleSelectLevel}
            onClose={() => setActiveModal(null)}
          />
        )}

        {activeModal === 'mini-games' && (
          <MiniGamesHubModal
            onSelectMiniGame={handleSelectMiniGame}
            onClose={() => setActiveModal(null)}
          />
        )}

        {activeModal === 'rewards' && (
          <RewardsModal
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
            onClose={() => setActiveModal(null)}
          />
        )}

        {activeModal === 'daily-challenge' && (
          <DailyChallengeModal
            profile={profile}
            onStartLevel={handleSelectLevel}
            onUpdateProfile={handleUpdateProfile}
            onClose={() => setActiveModal(null)}
          />
        )}

        {activeModal === 'parent-gate' && (
          <ParentGateModal
            onSuccess={() => {
              setActiveModal(parentGateTarget);
              setParentGateTarget(null);
            }}
            onCancel={() => {
              setActiveModal(null);
              setParentGateTarget(null);
            }}
          />
        )}

        {activeModal === 'parent-settings' && (
          <ParentSettingsModal
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
            onReset={() => setProfile(DEFAULT_PROFILE)}
            onClose={() => setActiveModal(null)}
          />
        )}

        {activeModal === 'privacy-policy' && (
          <PrivacyPolicyModal onClose={() => setActiveModal(null)} />
        )}

        {activeModal === 'apk-install' && (
          <ApkDownloadModal onClose={() => setActiveModal(null)} />
        )}

        {/* Limited AdMob Interstitial Overlay (Family safe test ad) */}
        {showAdMobInterstitial && (
          <AdMobModal onClose={handleCloseAdMob} />
        )}
      </div>
    </div>
  );
}
