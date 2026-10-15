import React, { useState } from 'react';
import { PlayerProfile } from '../../types/game';
import { ADMOB_ANDROID_INTEGRATION_DOCS, ADMOB_TEST_CONFIG } from '../../utils/admob';
import { resetProfile } from '../../utils/storage';
import { sound } from '../../utils/audio';
import { X, Volume2, VolumeX, Music, ShieldCheck, Code, AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  profile: PlayerProfile;
  onUpdateProfile: (updated: Partial<PlayerProfile>) => void;
  onReset: () => void;
  onClose: () => void;
}

export const ParentSettingsModal: React.FC<Props> = ({
  profile,
  onUpdateProfile,
  onReset,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'audio' | 'admob' | 'safety' | 'reset'>('audio');
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-3 sm:p-4 select-none">
      <div className="w-full max-w-2xl bg-gradient-to-b from-stone-900 to-stone-950 border-4 border-amber-500 rounded-3xl p-4 sm:p-6 text-white shadow-2xl relative flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🛡️</span>
            <div>
              <h2 className="text-2xl font-black text-amber-300">Parental Settings</h2>
              <p className="text-xs text-stone-300">
                Child safety controls, audio preferences, and AdMob integration docs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-stone-800 hover:bg-stone-700 active:scale-95 rounded-2xl border border-stone-600 text-white cursor-pointer"
            aria-label="Close Parent Settings"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab buttons */}
        <div className="grid grid-cols-4 gap-1.5 my-3">
          <button
            onClick={() => setActiveTab('audio')}
            className={`py-2 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors
              ${
                activeTab === 'audio'
                  ? 'bg-amber-500 text-stone-950 shadow-md'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
          >
            <Volume2 size={15} /> Audio
          </button>
          <button
            onClick={() => setActiveTab('safety')}
            className={`py-2 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors
              ${
                activeTab === 'safety'
                  ? 'bg-amber-500 text-stone-950 shadow-md'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
          >
            <ShieldCheck size={15} /> Safety
          </button>
          <button
            onClick={() => setActiveTab('admob')}
            className={`py-2 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors
              ${
                activeTab === 'admob'
                  ? 'bg-amber-500 text-stone-950 shadow-md'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
          >
            <Code size={15} /> AdMob Setup
          </button>
          <button
            onClick={() => setActiveTab('reset')}
            className={`py-2 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors
              ${
                activeTab === 'reset'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
          >
            <RotateCcw size={15} /> Data
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pr-1 text-sm">
          {activeTab === 'audio' && (
            <div className="flex flex-col gap-4 p-2">
              <div className="bg-stone-800/80 p-4 rounded-2xl border border-stone-700 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {profile.soundEnabled ? <Volume2 size={20} className="text-amber-400" /> : <VolumeX size={20} className="text-stone-400" />}
                    <span className="font-bold text-white">Sound Effects (SFX)</span>
                  </div>
                  <button
                    onClick={() => {
                      const next = !profile.soundEnabled;
                      sound.setSoundMuted(!next);
                      onUpdateProfile({ soundEnabled: next });
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs ${
                      profile.soundEnabled ? 'bg-emerald-600 text-white' : 'bg-stone-700 text-stone-400'
                    }`}
                  >
                    {profile.soundEnabled ? 'Enabled' : 'Muted'}
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-stone-400">Volume</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={profile.soundVolume}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      sound.setSoundVolume(v);
                      onUpdateProfile({ soundVolume: v });
                    }}
                    className="flex-1 accent-amber-400 cursor-pointer"
                  />
                  <span className="text-xs font-mono text-amber-300 w-8 text-right">
                    {Math.round(profile.soundVolume * 100)}%
                  </span>
                </div>
              </div>

              <div className="bg-stone-800/80 p-4 rounded-2xl border border-stone-700 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Music size={20} className="text-amber-400" />
                    <span className="font-bold text-white">Background Music (BGM)</span>
                  </div>
                  <button
                    onClick={() => {
                      const next = !profile.musicEnabled;
                      sound.setMusicMuted(!next);
                      onUpdateProfile({ musicEnabled: next });
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs ${
                      profile.musicEnabled ? 'bg-emerald-600 text-white' : 'bg-stone-700 text-stone-400'
                    }`}
                  >
                    {profile.musicEnabled ? 'Playing' : 'Muted'}
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-stone-400">Volume</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={profile.musicVolume}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      sound.setMusicVolume(v);
                      onUpdateProfile({ musicVolume: v });
                    }}
                    className="flex-1 accent-amber-400 cursor-pointer"
                  />
                  <span className="text-xs font-mono text-amber-300 w-8 text-right">
                    {Math.round(profile.musicVolume * 100)}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'safety' && (
            <div className="flex flex-col gap-3 p-1">
              <div className="bg-emerald-950/60 border border-emerald-600/70 p-4 rounded-2xl">
                <h4 className="font-extrabold text-emerald-300 text-base flex items-center gap-2">
                  <ShieldCheck size={20} /> Verified Child Safety Guarantees
                </h4>
                <ul className="mt-2.5 space-y-1.5 text-xs text-emerald-100 list-disc list-inside">
                  <li><strong>Zero Chat & Social Features:</strong> No public or private communication.</li>
                  <li><strong>Zero Location Tracking:</strong> GPS and precise location are completely disabled.</li>
                  <li><strong>Zero Behavioral Profiling:</strong> No tracking cookies or advertising identifiers.</li>
                  <li><strong>Local Persistence Only:</strong> Game saves, stars, and coins remain on this device.</li>
                  <li><strong>Parent-Gated Access:</strong> Math challenges safeguard external links and sensitive controls.</li>
                  <li><strong>No In-App Purchases:</strong> All unlocks are earned through gameplay achievements.</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'admob' && (
            <div className="flex flex-col gap-3 p-1 text-xs">
              <div className="bg-stone-800 p-3 rounded-2xl border border-stone-700">
                <h4 className="font-bold text-amber-300 text-sm mb-1">
                  Google AdMob Android SDK Integration (Family Policy Compliant)
                </h4>
                <p className="text-stone-300 text-[11px]">
                  Configured with official Google test units and child-directed treatment:
                </p>
                <div className="mt-2 font-mono text-[10px] bg-stone-950 p-2.5 rounded-xl border border-stone-800 space-y-1 text-stone-300">
                  <div>App ID: {ADMOB_TEST_CONFIG.appId}</div>
                  <div>Interstitial: {ADMOB_TEST_CONFIG.interstitialAdUnitId}</div>
                  <div>tagForChildDirectedTreatment: true</div>
                  <div>maxAdContentRating: "G"</div>
                  <div>Frequency Capping: Max 1 interstitial / 3 completed levels</div>
                </div>
              </div>

              <div className="bg-stone-800 p-3 rounded-2xl border border-stone-700">
                <h5 className="font-bold text-stone-200 mb-1">Production Activation Steps:</h5>
                <ol className="list-decimal list-inside space-y-1 text-stone-300 text-[11px]">
                  {ADMOB_ANDROID_INTEGRATION_DOCS.productionSteps.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
              </div>

              <div className="bg-stone-950 p-3 rounded-2xl border border-stone-800 font-mono text-[10px] text-emerald-300 whitespace-pre overflow-x-auto">
                {ADMOB_ANDROID_INTEGRATION_DOCS.initializationCode}
              </div>
            </div>
          )}

          {activeTab === 'reset' && (
            <div className="p-3 bg-stone-800/80 rounded-2xl border border-stone-700 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-base">
                <AlertTriangle size={22} /> Reset Saved Progress
              </div>
              <p className="text-xs text-stone-300">
                This will reset all unlocked levels back to Level 1, clear earned stars and coins, and reset customizations to defaults.
              </p>

              {!showConfirmReset ? (
                <button
                  onClick={() => setShowConfirmReset(true)}
                  className="py-3 px-4 bg-rose-700 hover:bg-rose-600 text-white font-bold rounded-2xl border border-rose-500 cursor-pointer text-xs"
                >
                  I want to reset all game data
                </button>
              ) : (
                <div className="flex flex-col gap-2 p-3 bg-rose-950/60 rounded-xl border border-rose-600">
                  <span className="text-xs text-rose-200 font-bold">
                    Are you sure? This action cannot be undone.
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        resetProfile();
                        onReset();
                        setShowConfirmReset(false);
                        onClose();
                      }}
                      className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white font-extrabold rounded-xl text-xs cursor-pointer"
                    >
                      Yes, Reset Everything
                    </button>
                    <button
                      onClick={() => setShowConfirmReset(false)}
                      className="px-4 py-2 bg-stone-700 hover:bg-stone-600 text-white font-bold rounded-xl text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
