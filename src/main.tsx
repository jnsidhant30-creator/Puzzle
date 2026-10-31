import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css'; /* Unregister any stale PWA service workers from previous architecture */
if  ('serviceWorker' in navigator) { navigator.serviceWorker.getRegistrations().then((registrations) => { let unregisterCount = 0; for (const registration of registrations) { registration.unregister(); unregisterCount++; } if (unregisterCount > 0) { window.location.reload(); } });
} createRoot(document.getElementById('root')!).render( <StrictMode> <App /> </StrictMode>,
);
