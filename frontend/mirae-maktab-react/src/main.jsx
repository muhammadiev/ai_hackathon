// Boot: ensure document can always scroll (mobile)
(function unlockScrollBoot() {
  try {
    const html = document.documentElement;
    const body = document.body;
    html.style.overflowY = 'auto';
    body.style.overflowY = 'auto';
    html.style.height = 'auto';
    body.style.height = 'auto';
  } catch (e) { /* ignore */ }
})();

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './ThemeContext.jsx';
import { AuthProvider } from './AuthContext.jsx';
import { WalletProvider } from './WalletContext.jsx';
import { SubjectProvider } from './SubjectContext.jsx';
import { I18nProvider } from './I18nContext.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <I18nProvider>
          <ThemeProvider>
            <AuthProvider>
              <WalletProvider>
                <SubjectProvider>
                  <App />
                </SubjectProvider>
              </WalletProvider>
            </AuthProvider>
          </ThemeProvider>
        </I18nProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);

// Offline PWA shell (optional)
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {});
  });
}
