import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { RootStore } from './stores/RootStore';
import { StoreProvider } from './stores/StoreProvider';

// Register Service Worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Use a small timeout to ensure the document is in a "fully active" state,
    // which can prevent "InvalidStateError" in some sandboxed or complex environments.
    setTimeout(() => {
      // Construct an absolute URL to sw.js to avoid potential base URL issues in some environments.
      const swUrl = `${window.location.origin}/sw.js`;
      navigator.serviceWorker.register(swUrl)
        .then(registration => {
          console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch(err => {
          console.error('Service Worker registration failed:', err);
        });
    }, 0);
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const rootStore = new RootStore();
const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <StoreProvider store={rootStore}>
      <App />
    </StoreProvider>
  </React.StrictMode>
);