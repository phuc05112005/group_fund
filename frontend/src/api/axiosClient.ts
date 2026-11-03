import axios from 'axios';
import keycloak from '../keycloak';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosClient.interceptors.request.use(async (config) => {
  if (keycloak.authenticated) {
    try {
      await keycloak.updateToken(30);
    } catch (e) {
      console.error('Token hết hạn, đang chuyển hướng đăng nhập lại', e);
      keycloak.login();
    }
    config.headers.Authorization = `Bearer ${keycloak.token}`;
  }
  return config;
});

// Bổ sung: Trả trực tiếp Promise rejection để UI Modal hứng và hiển thị (không bật alert mặc định)
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosClient;