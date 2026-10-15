# 🎖️ Army Kids Adventure — Android Kids Game

A colorful, kid-friendly cartoon army gaming adventure designed for children, featuring 8 fully playable mini-games, 20 progressive missions, lives & hearts system, rewards locker, and COPPA & Google Play Families policy compliance.

---

## 🎮 Playable Mini-Games Collection

1. **🏃‍♂️ Army Runner** — Jump over mud puddles, duck under branch canopies, avoid obstacles, and collect coins & stars. (3 Hearts ❤️❤️❤️)
2. **🚙 Army Jeep Adventure** — Steer your cartoon jeep across 3 lanes, dodge roadblocks and rocks, grab fuel cans and gold coins. (3 Hearts ❤️❤️❤️)
3. **🪵 Jungle Obstacle Course** — Platforming training camp: leap across wooden rope bridges, bounce on trampolines, and reach the camp flag. (3 Hearts ❤️❤️❤️)
4. **⭐ Star Collector** — Fly with a mini copter-pack and collect swirling golden stars before time runs out.
5. **🐶 Animal Rescue** — Guide cute puppies, baby pandas, and bunnies safely past boulders to the cozy camp tent within limited moves.
6. **🃏 Memory Mission** — Flip and match cute cadet equipment (jeeps, caps, walkie-talkies, compasses) with move limits.
7. **🧩 Puzzle Camp** — Snap-in-place vehicle jigsaw builder for the army jeep and rescue helicopter.
8. **🎯 Target Practice** — Safe, non-violent target practice popping smiling colorful water balloons and spinning carnival stars with water splashes.

---

## ❤️ Lives, Health & Game Over System

- **3 Cadet Hearts (❤️❤️❤️)**: Colliding with obstacles or hazards deducts 1 heart.
- **Invincibility Flicker**: Provides brief safe recovery frames after taking a hit.
- **Game Over & Out**: If all 3 hearts are lost, or if the mission timer or move limit expires, **GAME OVER** triggers with full progress stats and an instant "TRY AGAIN" retry button!

---

## 📱 How to Get the Android APK / Install on Phone

### Method 1: Instant Android Install (Recommended — 10 Seconds)
1. Open the game URL in **Google Chrome on your Android phone**.
2. Tap the **"Get Android APK"** button on the home screen, or tap the three dots **(⋮)** in Chrome.
3. Select **"Add to Home screen"** or **"Install App"**.
4. Google Chrome will automatically generate and install the **WebAPK** onto your Android phone with full-screen mode, home screen app icon, and offline play!

### Method 2: Download APK from GitHub Actions (Automated .apk Build)
This repository includes an automated GitHub Actions workflow (`.github/workflows/build-apk.yml`):
1. Go to your GitHub repository: `kumarchandan46838-source`.
2. Click on the **Actions** tab at the top.
3. Click **"Build Android APK"** in the left sidebar.
4. Click **"Run workflow"** &gt; **Run workflow**.
5. Once the build finishes (~2 minutes), click on the completed run and scroll down to **Artifacts**.
6. Download **`ArmyKidsAdventure-Debug-APK.zip`** to get your installable `.apk` file!
7. Transfer or download the `.apk` directly onto your Android device and install it.

### Method 3: Build locally via Capacitor & Android Studio
```bash
npm install
npm run build
npx cap add android
npx cap open android
```
In Android Studio: Click **Build > Build Bundle(s) / APK(s) > Build APK(s)** to generate the APK.

---

## 🛡️ Child Safety & COPPA Compliance

- **Parent Gate**: Randomized math challenge protects settings and external links.
- **Zero Data Collection**: No accounts, no personal information, no location tracking, and no chat.
- **Kid-Safe AdMob Setup**: Configured with `tagForChildDirectedTreatment = true`, max rating `"G"`, and conservative frequency capping (max 1 ad every 3 completed levels).
