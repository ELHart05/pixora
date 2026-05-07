import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MantineProvider } from '@mantine/core'
import { QueryClientProvider } from '@tanstack/react-query'
import { FontProvider } from './components/fontContext'
import { trpc, queryClient, trpcClient } from './lib/trpc'
import { ToastProvider } from './context/ToastContext'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <MantineProvider>
          <FontProvider>
            <ToastProvider>
              <App />
            </ToastProvider>
          </FontProvider>
        </MantineProvider>
      </QueryClientProvider>
    </trpc.Provider>
  </StrictMode>,
)
