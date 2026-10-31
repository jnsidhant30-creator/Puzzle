import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './components/common/ThemeProvider'
import { SettingsProvider } from './store/SettingsContext'
import { NotificationProvider } from './store/NotificationContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <SettingsProvider>
        <NotificationProvider>
          <App />
        </NotificationProvider>
      </SettingsProvider>
    </ThemeProvider>
  </StrictMode>,
)
