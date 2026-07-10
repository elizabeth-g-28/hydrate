import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import './index.css';
import { getGoogleClientId } from './lib/auth';

registerSW({ immediate: true });

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element not found');

const googleClientId = getGoogleClientId();

const app = (
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

createRoot(rootEl).render(
  <StrictMode>
    {googleClientId ? (
      <GoogleOAuthProvider clientId={googleClientId}>{app}</GoogleOAuthProvider>
    ) : (
      app
    )}
  </StrictMode>
);
