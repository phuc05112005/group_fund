import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import keycloak from './keycloak';
import { ThemeProvider } from './theme/ThemeProvider';
import { AmbientBackground } from './components/AmbientBackground';
import { FxLayer } from './components/FxLayer';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

// Khởi tạo Keycloak trước khi render toàn bộ ứng dụng
keycloak
  .init({
    onLoad: 'login-required',
    checkLoginIframe: false,
    pkceMethod: 'S256',
  })
  .then((authenticated) => {
    if (authenticated) {
      root.render(
        <React.StrictMode>
          <ThemeProvider>
            <AmbientBackground />
            <App />
            <FxLayer />
          </ThemeProvider>
        </React.StrictMode>
      );
    } else {
      window.location.reload();
    }
  })
  .catch((error) => {
    console.error('Lỗi kết nối Keycloak:', error);
  });