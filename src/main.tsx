import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { registerSW } from 'virtual:pwa-register';
import './index.css';

// Suppress benign [vite] socket connection warnings and unhandled Supabase fetch errors
if (typeof window !== 'undefined') {
  const originalError = console.error;
  console.error = function (...args) {
    const message = args.map(String).join(' ');
    if (
      message.includes('[vite]') ||
      message.includes('websocket') ||
      message.includes('WebSocket') ||
      message.includes('Failed to fetch') ||
      message.includes('supabase')
    ) {
      return;
    }
    originalError.apply(console, args);
  };

  const originalWarn = console.warn;
  console.warn = function (...args) {
    const message = args.map(String).join(' ');
    if (message.includes('[vite]') || message.includes('websocket') || message.includes('WebSocket')) {
      return;
    }
    originalWarn.apply(console, args);
  };

  window.addEventListener('unhandledrejection', (event) => {
    const reasonStr = String(event.reason || '');
    const messageStr = String(event.reason?.message || '');
    if (
      reasonStr.includes('Failed to fetch') ||
      messageStr.includes('Failed to fetch') ||
      reasonStr.includes('supabase') ||
      messageStr.includes('supabase')
    ) {
      event.preventDefault();
      event.stopPropagation();
    }
  });
}

registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
