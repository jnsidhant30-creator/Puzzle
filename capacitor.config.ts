import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.puzzleverse.app',
  appName: 'PuzzleVerse',
  webDir: 'dist',
  backgroundColor: '#142331',
  server: {
    androidScheme: 'https',
    iosScheme: 'capacitor',
    allowNavigation: [
      'puzzleverse-e16e4.web.app',
      'puzzleverse-e16e4.firebaseapp.com',
      'puzzzleverse.netlify.app',
      'accounts.google.com',
      '*.googleapis.com',
    ],
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 1000,
      backgroundColor: '#142331',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#142331',
      overlaysWebView: false,
    },
  },
};

export default config;
