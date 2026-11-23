import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

try {
  const savedTheme = localStorage.getItem('ai_router_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
} catch (_) {}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
