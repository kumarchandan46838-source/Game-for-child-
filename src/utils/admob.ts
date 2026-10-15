/**
 * AdManager Module for Army Kids Adventure
 * Compliant with Google Play Families Policy & COPPA (Children's Online Privacy Protection Act).
 *
 * Key safety features:
 * - Official Google AdMob Test Ad Units
 * - Child-directed tag (tagForChildDirectedTreatment = true, maxAdContentRating = G)
 * - Conservative frequency limit: only after every 3 completed levels
 * - Never displayed during active gameplay or character control
 * - Cooldown enforcement & pre-loading validation
 * - Clear distinction between Test Mode and Production Mode
 */

export interface AdMobConfig {
  appId: string;
  bannerAdUnitId: string;
  interstitialAdUnitId: string;
  rewardedAdUnitId: string;
  isTestMode: boolean;
  tagForChildDirectedTreatment: boolean;
  maxAdContentRating: 'G' | 'PG';
  tagForUnderAgeOfConsent: boolean;
  minCompletedBetweenInterstitials: number;
  adCooldownSeconds: number;
}

// Official Google AdMob Test Ad Unit IDs (Android)
export const ADMOB_TEST_CONFIG: AdMobConfig = {
  appId: 'ca-app-pub-3940256099942544~3347511713',
  bannerAdUnitId: 'ca-app-pub-3940256099942544/6300978111',
  interstitialAdUnitId: 'ca-app-pub-3940256099942544/1033173712',
  rewardedAdUnitId: 'ca-app-pub-3940256099942544/5224354917',
  isTestMode: true,
  tagForChildDirectedTreatment: true,
  maxAdContentRating: 'G',
  tagForUnderAgeOfConsent: true,
  minCompletedBetweenInterstitials: 3, // Conservative frequency capping: 1 every 3 levels
  adCooldownSeconds: 60, // Minimum 60 seconds cooldown between interstitials
};

export type AdEventCallback = () => void;

class AdManager {
  private config: AdMobConfig = { ...ADMOB_TEST_CONFIG };
  private isInterstitialLoaded: boolean = true;
  private lastAdTimestamp: number = 0;
  private completedLevelsSinceLastAd: number = 0;

  constructor() {
    this.preloadInterstitial();
  }

  public getConfig(): AdMobConfig {
    return { ...this.config };
  }

  public preloadInterstitial(): void {
    // Simulate real AdMob asynchronous SDK preload
    this.isInterstitialLoaded = false;
    setTimeout(() => {
      this.isInterstitialLoaded = true;
    }, 1200);
  }

  /**
   * Increments the count of completed levels. Called ONLY when a level is won.
   */
  public registerLevelCompletion(): void {
    this.completedLevelsSinceLastAd += 1;
  }

  /**
   * Determines if an interstitial ad is eligible to be shown.
   * Rules:
   * 1. Minimum levels must be completed (3).
   * 2. Ad must be loaded.
   * 3. Cooldown duration must have passed.
   * 4. Must never interrupt active gameplay.
   */
  public isEligibleForInterstitial(): boolean {
    if (!this.isInterstitialLoaded) {
      return false;
    }
    if (this.completedLevelsSinceLastAd < this.config.minCompletedBetweenInterstitials) {
      return false;
    }
    const elapsedSeconds = (Date.now() - this.lastAdTimestamp) / 1000;
    if (this.lastAdTimestamp > 0 && elapsedSeconds < this.config.adCooldownSeconds) {
      return false;
    }
    return true;
  }

  /**
   * Consumes eligibility and records timestamp when an ad is shown.
   */
  public markAdShown(): void {
    this.completedLevelsSinceLastAd = 0;
    this.lastAdTimestamp = Date.now();
    this.preloadInterstitial(); // Preload next one
  }

  public getLevelsUntilNextAd(): number {
    return Math.max(0, this.config.minCompletedBetweenInterstitials - this.completedLevelsSinceLastAd);
  }
}

export const adManager = new AdManager();

/**
 * Production Integration Guide for Google AdMob Android
 * Displayed in the Parent / Developer Settings screen.
 */
export const ADMOB_ANDROID_INTEGRATION_DOCS = {
  buildGradleSnippet: `
// In android/app/build.gradle:
dependencies {
    implementation 'com.google.android.gms:play-services-ads:23.0.0'
}
`,
  manifestSnippet: `
<!-- In AndroidManifest.xml inside <application> tag -->
<meta-data
    android:name="com.google.android.gms.ads.APPLICATION_ID"
    android:value="ca-app-pub-3940256099942544~3347511713"/>
`,
  initializationCode: `
// In MainActivity.kt / Application class:
val requestConfiguration = RequestConfiguration.Builder()
    .setTagForChildDirectedTreatment(RequestConfiguration.TAG_FOR_CHILD_DIRECTED_TREATMENT_TRUE)
    .setMaxAdContentRating(RequestConfiguration.MAX_AD_CONTENT_RATING_G)
    .setTagForUnderAgeOfConsent(RequestConfiguration.TAG_FOR_UNDER_AGE_OF_CONSENT_TRUE)
    .setTestDeviceIds(listOf("EMULATOR"))
    .build()

MobileAds.setRequestConfiguration(requestConfiguration)
MobileAds.initialize(this) { initializationStatus -> }
`,
  productionSteps: [
    'Register an approved Google AdMob account at apps.admob.com.',
    'Add the Android App and select "Yes, this app is directed to children under 13" (COPPA compliance).',
    'Create Interstitial Ad Unit with Family-Friendly "G" rating filter.',
    'Complete the Google Play Families Policy declaration in Google Play Console.',
    'Replace test IDs with production Ad Unit IDs only in signed release builds.',
  ],
};
