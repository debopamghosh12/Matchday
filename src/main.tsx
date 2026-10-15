import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
// Self-hosted fonts (no render-blocking third-party CSS; cached for offline use).
// Each file declares unicode-range subsets, so browsers only fetch what a page needs.
import '@fontsource-variable/inter/wght.css'
import '@fontsource/bebas-neue/index.css'
import './index.css'
import App from './App.tsx'
import { queryClient } from './lib/queryClient'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
