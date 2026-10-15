import React from 'react';
import { X, ShieldCheck } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<Props> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 select-none">
      <div className="w-full max-w-2xl bg-gradient-to-b from-stone-900 to-stone-950 border-4 border-emerald-500 rounded-3xl p-5 sm:p-6 text-white shadow-2xl relative flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div className="flex items-center gap-2">
            <ShieldCheck size={28} className="text-emerald-400" />
            <div>
              <h2 className="text-2xl font-black text-amber-300">Privacy & Child Safety</h2>
              <p className="text-xs text-stone-300">
                COPPA & Google Play Families Policy Compliance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-stone-800 hover:bg-stone-700 active:scale-95 rounded-2xl border border-stone-600 text-white cursor-pointer"
            aria-label="Close Privacy Policy"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 my-3 text-xs leading-relaxed text-stone-300 space-y-3">
          <section className="bg-stone-800/60 p-3.5 rounded-2xl border border-stone-700">
            <h4 className="font-bold text-sm text-emerald-300 mb-1">1. Commitment to Children's Privacy</h4>
            <p>
              Army Kids Adventure is designed specifically for children under 13. We strictly adhere to the Children's Online Privacy Protection Act (COPPA), the General Data Protection Regulation (GDPR-K), and Google Play Families Policies.
            </p>
          </section>

          <section className="bg-stone-800/60 p-3.5 rounded-2xl border border-stone-700">
            <h4 className="font-bold text-sm text-emerald-300 mb-1">2. Information We Do NOT Collect</h4>
            <ul className="list-disc list-inside space-y-1 mt-1 text-stone-300">
              <li>No names, email addresses, phone numbers, or passwords.</li>
              <li>No GPS, Wi-Fi, or approximate location data.</li>
              <li>No photos, microphone, camera, or contact access.</li>
              <li>No advertising identifiers or cross-app tracking.</li>
            </ul>
          </section>

          <section className="bg-stone-800/60 p-3.5 rounded-2xl border border-stone-700">
            <h4 className="font-bold text-sm text-emerald-300 mb-1">3. Device Local Storage</h4>
            <p>
              All game progress (unlocked levels, earned coins, stars, and customization choices) is stored exclusively on the player's local device via browser LocalStorage. No data is transmitted to external servers.
            </p>
          </section>

          <section className="bg-stone-800/60 p-3.5 rounded-2xl border border-stone-700">
            <h4 className="font-bold text-sm text-emerald-300 mb-1">4. Family-Safe Advertising Guidelines</h4>
            <p>
              When integrated with Google AdMob:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-1 text-stone-300">
              <li>Configured with <code>tagForChildDirectedTreatment = true</code>.</li>
              <li>Strict maximum ad content rating of "G" (General Audiences).</li>
              <li>Conservative frequency capping (maximum 1 ad every 3 completed levels).</li>
              <li>Ads are never displayed during active gameplay or while controlling a character.</li>
            </ul>
          </section>

          <section className="bg-stone-800/60 p-3.5 rounded-2xl border border-stone-700">
            <h4 className="font-bold text-sm text-emerald-300 mb-1">5. Parental Rights & Controls</h4>
            <p>
              Parents have full authority to reset or delete all game progress anytime through the parent-gated settings area. For privacy inquiries, please contact our support team.
            </p>
          </section>
        </div>

        <div className="pt-2 border-t border-stone-800 text-center">
          <button
            onClick={onClose}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 font-bold text-sm rounded-2xl text-white shadow-md cursor-pointer"
          >
            I Understand & Agree
          </button>
        </div>
      </div>
    </div>
  );
};
