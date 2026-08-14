import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { registerSW } from 'virtual:pwa-register';
import './index.css';

// Suppress benign [vite] socket connection warnings that occur because HMR is programmatically disabled
if (typeof window !== 'undefined') {
  const originalError = console.error;
  console.error = function (...args) {
    const message = args.map(String).join(' ');
    if (message.includes('[vite]') || message.includes('websocket') || message.includes('WebSocket')) {
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
}

registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
