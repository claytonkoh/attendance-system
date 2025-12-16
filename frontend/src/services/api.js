import axios from 'axios';

// ⚙️ CONFIGURATION: Set your backend URL here
const BACKEND_URL = 'https://attendance-system-production-4c65.up.railway.app'; // Change this to your Railway URL

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the auth token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
