import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles.css'
import App from './App.tsx'
import { GlassDefs } from './glass-defs.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <GlassDefs />
  </StrictMode>,
)
