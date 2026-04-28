import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { LocaleProvider } from './hooks/useLocale'
import { initSentry } from './lib/sentry'

// Vor React rendern: Errors aus dem ersten Render werden sonst nicht erfasst.
initSentry()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LocaleProvider>
      <App />
    </LocaleProvider>
  </StrictMode>,
)
