
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
          theme='system'
          richColors
          toastOptions={{
            classNameFunction: () => 'sonner-toast-custom',
            style: {
              fontFamily: 'Outfit, sans-serif',
              fontSize: '14px',
              fontWeight: '500',
              borderRadius: '12px',
            },
            success: {
              style: {
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#ffffff',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                boxShadow: '0 8px 24px rgba(16, 185, 129, 0.2)',
              },
            },
            error: {
              style: {
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                color: '#ffffff',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                boxShadow: '0 8px 24px rgba(239, 68, 68, 0.2)',
              },
            },
            info: {
              style: {
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                color: '#ffffff',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                boxShadow: '0 8px 24px rgba(59, 130, 246, 0.2)',
              },
            },
          }}
        />
      </ThemeProvider>
    </BrowserRouter>
 
)
