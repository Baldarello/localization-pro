
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { RootStore } from './stores/RootStore';
import { StoreProvider } from './stores/StoreProvider';

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
