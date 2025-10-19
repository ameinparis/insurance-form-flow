// src/main.tsx
import { createRoot } from 'react-dom/client'
import React from 'react'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from '../src/lib/authlibrary.tsx' 

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider> 
      <App />
    </AuthProvider>
  </React.StrictMode>
)
