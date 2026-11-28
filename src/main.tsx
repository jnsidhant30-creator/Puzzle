import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';
import { setPwaSwRegistration } from './platform/adapter';
import { initPwaPromptCapture } from './platform/detectPlatform';

// Capture browser beforeinstallprompt cleanly on web & ChromeOS
initPwaPromptCapture();

// Load Nunito Sans asynchronously without inline event handlers so strict CSP applies cleanly
if (typeof document !== 'undefined' && navigator.onLine !== false) {
  const fontHref =
    'https://fonts.googleapis.com/css2?family=Nunito+Sans:ital,opsz,wght@0,6..12,400..800;1,6..12,400..700&display=swap';
  if (!document.querySelector(`link[href="${fontHref}"]`)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = fontHref;
    document.head.appendChild(link);
  }
}

// Enable Service Worker PWA offline support strictly on HTTP/HTTPS Web browsers & ChromeOS,
// skipping packaged Electron (app://) and native Capacitor (Android/iOS WebView) runtimes.
const isDesktopRuntime =
  Boolean(window.puzzleverseDesktop?.isDesktop) || window.location.protocol === 'app:';
const isCapacitorNative = Capacitor.isNativePlatform();

if (!isDesktopRuntime && !isCapacitorNative && typeof window !== 'undefined' && window.location.protocol.startsWith('http')) {
  let updateServiceWorker: ((reloadPage?: boolean) => Promise<void>) | undefined;
  updateServiceWorker = registerSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      if (registration) {
        setPwaSwRegistration(registration, Boolean(registration.waiting));
        const safeCheckUpdate = () => {
          if (navigator.onLine && document.visibilityState === 'visible') {
            registration.update().catch(() => {});
          }
        };
        document.addEventListener('visibilitychange', safeCheckUpdate);
        window.addEventListener('online', safeCheckUpdate);
      }
    },
    onNeedRefresh() {
      navigator.serviceWorker.getRegistration().then((reg) => {
        setPwaSwRegistration(reg || null, true);
      });
      // Dispatch clean custom UI event so Settings / Banner can offer Reload Update
      window.dispatchEvent(
        new CustomEvent('pv:pwa-update-available', {
          detail: { apply: () => updateServiceWorker?.(true) },
        })
      );
    },
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
