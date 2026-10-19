import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import keycloak from './keycloak.ts';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root')!);

keycloak
  .init({
    onLoad: 'login-required',
    checkLoginIframe: false,
  })
  .then((authenticated) => {
    if (authenticated) {
      root.render(
        <React.StrictMode>
          <App />
        </React.StrictMode>
      );
    } else {
      window.location.reload();
    }
  })
  .catch((error) => {
    console.error('Lỗi kết nối Keycloak:', error);
  });