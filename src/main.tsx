import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

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

// Keep PWA service worker management strictly scoped to HTTP/HTTPS web builds (skip in packaged Electron)
const isDesktopRuntime =
  Boolean(window.puzzleverseDesktop?.isDesktop) || window.location.protocol === 'app:';

if (!isDesktopRuntime && 'serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    let unregisterCount = 0;
    for (const registration of registrations) {
      registration.unregister();
      unregisterCount++;
    }
    if (unregisterCount > 0) {
      window.location.reload();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
