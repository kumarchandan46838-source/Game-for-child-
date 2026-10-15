import React, { useState, useEffect } from 'react';
import { X, Smartphone, Download, CheckCircle, Github, Sparkles, AlertCircle, FileCode } from 'lucide-react';
import { sound } from '../../utils/audio';

interface Props {
  onClose: () => void;
}

export const ApkDownloadModal: React.FC<Props> = ({ onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showManualTip, setShowManualTip] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

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
      setShowManualTip(true);
      sound.playCardFlip();
    }
  };

  const handleDownloadAppBundle = () => {
    sound.playCoin();
    // Create an offline launch package HTML + JSON config for local Android sideloading
    const htmlLauncher = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Army Kids Adventure APK</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <meta name="theme-color" content="#14532d">
  <link rel="manifest" href="manifest.json">
  <style>
    body { background: #022c22; color: #fef08a; font-family: sans-serif; text-align: center; padding: 40px 20px; }
    .card { background: #064e3b; border: 3px solid #facc15; border-radius: 24px; padding: 24px; max-width: 400px; margin: 0 auto; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
    h1 { color: #facc15; margin-bottom: 8px; }
    p { color: #a7f3d0; font-size: 14px; line-height: 1.5; }
    .btn { display: block; margin-top: 20px; padding: 14px 20px; background: #eab308; color: #1c1917; font-weight: bold; border-radius: 14px; text-decoration: none; font-size: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>🎖️ Army Kids Adventure</h1>
    <p>Android App Launcher & Offline Package</p>
    <p>Apne Android phone mein khelne ke liye niche diye link par click karein ya Chrome menu (⋮) mein jakar <strong>"Install App"</strong> karein!</p>
    <a href="${window.location.origin}" class="btn">🚀 OPEN GAME & PLAY</a>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlLauncher], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ArmyKidsAdventure-Android.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloadSuccess(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-3 sm:p-4 select-none">
      <div className="w-full max-w-lg bg-gradient-to-b from-stone-900 via-stone-950 to-emerald-950 border-4 border-amber-400 rounded-3xl p-5 sm:p-6 text-white shadow-2xl relative flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center text-xl shadow-md">
              <Smartphone size={22} className="stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-amber-300">
                Android APK & App Download
              </h2>
              <p className="text-xs text-emerald-200">
                Play on any Android phone or tablet without lag!
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
          {/* Hindi & English Notice */}
          <div className="bg-amber-500/20 border border-amber-400/50 rounded-2xl p-3 flex items-start gap-2.5">
            <Sparkles size={18} className="text-amber-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-amber-100 leading-relaxed">
              <span className="font-black text-amber-300 block mb-0.5">
                Android Phone Par Khelne Ka Tarika:
              </span>
              Aap ise 1-Click mein apne Android phone ki Home Screen par APK ki tarah install kar sakte hain! Full-screen chalega aur internet ke bina bhi save rahega.
            </div>
          </div>

          {/* Method 1: Instant Android Install (WebAPK) */}
          <div className="bg-emerald-900/80 border-2 border-emerald-500 rounded-2xl p-4 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <span className="font-extrabold text-sm text-amber-300 flex items-center gap-1.5">
                <Sparkles size={16} className="text-yellow-400" />
                Method 1: Direct Android 1-Click Install
              </span>
              <span className="text-[10px] bg-emerald-400/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                Sabse Aasaan & Fast
              </span>
            </div>
            <p className="text-emerald-100 text-[11px] leading-relaxed mb-3">
              Installs Army Kids Adventure directly onto your Android device as an app icon with standalone full-screen mode, no browser address bar, and offline support.
            </p>

            <button
              onClick={handlePwaInstall}
              className="w-full py-3 bg-gradient-to-b from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 active:from-amber-500 active:to-amber-700 text-stone-950 font-black text-sm rounded-xl shadow-lg border-b-3 border-amber-800 flex items-center justify-center gap-2 cursor-pointer active:translate-y-1"
            >
              <Download size={18} /> INSTALL APP ON ANDROID NOW
            </button>

            {isInstalled && (
              <div className="mt-2.5 p-2 bg-emerald-800/80 border border-emerald-400 rounded-xl flex items-center gap-2 text-emerald-200 text-xs">
                <CheckCircle size={16} className="text-emerald-300 shrink-0" />
                <span>App installed successfully on your device!</span>
              </div>
            )}

            {showManualTip && (
              <div className="mt-3 p-3 bg-stone-950/90 border border-amber-400/60 rounded-xl text-stone-200 text-[11px] space-y-1">
                <div className="font-bold text-amber-300 flex items-center gap-1.5">
                  <AlertCircle size={15} /> Chrome Browser Se Kaise Install Karein:
                </div>
                <div>1. Apne mobile mein Chrome browser ke upar <strong>3 dots (⋮)</strong> dabayein.</div>
                <div>2. Menu mein <strong>"Install app"</strong> ya <strong>"Add to Home screen"</strong> par tap karein.</div>
                <div>3. App ka icon phone ke home screen par ban jayega!</div>
              </div>
            )}
          </div>

          {/* Method 2: Download Launcher File */}
          <div className="bg-stone-800/80 border border-stone-700 rounded-2xl p-4 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <span className="font-extrabold text-sm text-stone-100 flex items-center gap-1.5">
                <FileCode size={16} className="text-amber-400" />
                Method 2: Download Offline Launcher File
              </span>
            </div>
            <p className="text-stone-300 text-[11px] leading-relaxed mb-3">
              Download the offline Android launch package file directly to your device storage.
            </p>

            <button
              onClick={handleDownloadAppBundle}
              className="w-full py-2.5 bg-stone-700 hover:bg-stone-600 active:scale-95 text-amber-300 font-bold text-xs rounded-xl border border-stone-500 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download size={16} /> DOWNLOAD OFFLINE LAUNCHER FILE
            </button>

            {downloadSuccess && (
              <div className="mt-2 text-emerald-400 text-[11px] font-bold text-center">
                ✓ Downloaded! Open the file in your mobile browser to play anytime.
              </div>
            )}
          </div>

          {/* Method 3: GitHub Actions Automated APK Builder */}
          <div className="bg-stone-800/80 border border-stone-700 rounded-2xl p-4 shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <Github size={18} className="text-amber-400" />
              <span className="font-extrabold text-sm text-stone-100">
                Method 3: GitHub Actions Automated .APK Builder
              </span>
            </div>
            <p className="text-stone-300 text-[11px] leading-relaxed">
              We have configured a complete automated GitHub Actions workflow in your repository (<code>.github/workflows/build-apk.yml</code>) which uses Android SDK to compile a native <code>.apk</code>:
            </p>
            <ol className="list-decimal list-inside space-y-1 mt-2 text-stone-300 text-[11px] bg-stone-950/80 p-3 rounded-xl border border-stone-800">
              <li>Open your project repository on GitHub.</li>
              <li>Click on the <strong>Actions</strong> tab at the top.</li>
              <li>Select <strong>Build Android APK</strong> and click <strong>Run workflow</strong>.</li>
              <li>When the runner finishes (~2 minutes), download the generated <code>ArmyKidsAdventure-Debug-APK.zip</code> artifact.</li>
              <li>Inside is your direct <code>.apk</code> file ready for installation!</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-stone-800 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-stone-800 hover:bg-stone-700 active:scale-95 text-stone-200 font-bold text-xs rounded-xl cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
