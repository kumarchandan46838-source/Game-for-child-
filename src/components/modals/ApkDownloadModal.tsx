import React, { useState, useEffect } from 'react';
import { X, Smartphone, Download, CheckCircle, Github, Sparkles } from 'lucide-react';
import { sound } from '../../utils/audio';

interface Props {
  onClose: () => void;
}

export const ApkDownloadModal: React.FC<Props> = ({ onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handlePwaInstall = async () => {
    if (deferredPrompt) {
      sound.playSnap();
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      // Guide for manual Chrome install
      alert('To install on Android: Tap the 3 dots (⋮) in Chrome, then tap "Add to Home screen" or "Install App"!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-3 sm:p-4 select-none">
      <div className="w-full max-w-lg bg-gradient-to-b from-stone-900 to-emerald-950 border-4 border-amber-400 rounded-3xl p-5 sm:p-6 text-white shadow-2xl relative flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center text-xl shadow-md">
              <Smartphone size={22} className="stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-amber-300">
                Android APK & App Install
              </h2>
              <p className="text-xs text-emerald-200">
                Play on any Android phone or tablet!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-stone-800 hover:bg-stone-700 active:scale-95 rounded-2xl border border-stone-600 text-white cursor-pointer"
            aria-label="Close APK Modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Tabs / Methods */}
        <div className="flex-1 overflow-y-auto pr-1 my-3 space-y-3.5 text-xs">
          {/* Method 1: Instant Android Install (WebAPK) */}
          <div className="bg-emerald-900/80 border-2 border-emerald-500 rounded-2xl p-4 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <span className="font-extrabold text-sm text-amber-300 flex items-center gap-1.5">
                <Sparkles size={16} className="text-yellow-400" />
                Method 1: Direct Android Install (Fastest)
              </span>
              <span className="text-[10px] bg-emerald-400/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                Recommended
              </span>
            </div>
            <p className="text-emerald-100 text-[11px] leading-relaxed mb-3">
              Installs Army Kids Adventure directly onto your Android device home screen with full-screen mode, no browser bar, and offline support.
            </p>
            <button
              onClick={handlePwaInstall}
              className="w-full py-3 bg-gradient-to-b from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 active:from-amber-500 active:to-amber-700 text-stone-950 font-black text-sm rounded-xl shadow-lg border-b-3 border-amber-800 flex items-center justify-center gap-2 cursor-pointer active:translate-y-1"
            >
              <Download size={18} /> INSTALL ON ANDROID NOW
            </button>
          </div>

          {/* Method 2: GitHub Actions Automated APK Builder */}
          <div className="bg-stone-800/80 border border-stone-700 rounded-2xl p-4 shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <Github size={18} className="text-amber-400" />
              <span className="font-extrabold text-sm text-stone-100">
                Method 2: GitHub Actions APK File
              </span>
            </div>
            <p className="text-stone-300 text-[11px] leading-relaxed">
              We have configured an automated GitHub Actions build workflow in your repository (<code>.github/workflows/build-apk.yml</code>):
            </p>
            <ol className="list-decimal list-inside space-y-1 mt-2 text-stone-300 text-[11px] bg-stone-950/80 p-3 rounded-xl border border-stone-800">
              <li>Open your repository on GitHub.</li>
              <li>Click on the <strong>Actions</strong> tab.</li>
              <li>Select <strong>Build Android APK</strong> and click <strong>Run workflow</strong>.</li>
              <li>Once completed (takes ~2 minutes), download <code>ArmyKidsAdventure-Debug-APK.zip</code> containing your <code>.apk</code> file!</li>
              <li>Transfer or open the <code>.apk</code> on your Android phone and tap <strong>Install</strong>.</li>
            </ol>
          </div>

          {/* Method 3: Android Studio / Capacitor */}
          <div className="bg-stone-800/80 border border-stone-700 rounded-2xl p-4 shadow-md">
            <span className="font-extrabold text-sm text-stone-200 block mb-1">
              Method 3: Build locally via Capacitor
            </span>
            <div className="font-mono text-[10px] bg-stone-950 p-2.5 rounded-xl border border-stone-800 text-emerald-300 space-y-1 overflow-x-auto">
              <div>npm run build</div>
              <div>npx cap add android</div>
              <div>npx cap open android</div>
            </div>
            <p className="text-stone-400 text-[10px] mt-2">
              In Android Studio, click <strong>Build &gt; Build Bundle(s) / APK(s) &gt; Build APK(s)</strong>.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-stone-800 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs rounded-xl cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
