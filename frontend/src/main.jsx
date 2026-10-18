import '@idds/react/index.css';
import './index.css';

import React from 'react';
import ReactDOM from 'react-dom/client';
import { ToastProvider, ConfirmationProvider } from '@idds/react';
import { AuthProvider } from './context/AuthContext';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ToastProvider maxToasts={4}>
      <ConfirmationProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ConfirmationProvider>
    </ToastProvider>
  </React.StrictMode>
);

