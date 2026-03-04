
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { Toaster } from 'sonner'
import { ThemeProvider } from './contexts/ThemeContext'

createRoot(document.getElementById('root')).render(
  
    <BrowserRouter>
      <ThemeProvider>
        <App />
        <Toaster 
          position='top-right'
          toastOptions={{
            style: {
              background: '#0B2447',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '12px',
              fontFamily: 'Outfit, sans-serif',
              fontSize: '14px',
              fontWeight: '500',
              boxShadow: '0 8px 24px rgba(11, 36, 71, 0.4)',
            },
          }}
        />
      </ThemeProvider>
    </BrowserRouter>
 
)
