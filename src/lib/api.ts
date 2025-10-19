import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000", 
  withCredentials: true,
  timeout: 10000, // 10 seconds timeout
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add timestamp to prevent caching only for certain endpoints
    if (config.method === 'get' && !config.url?.includes('/usuarios/clientes/perfil')) {
      config.params = {
        ...(config.params || {}),
        _t: Date.now(),
      };
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors
    if (error.response?.status === 401) {
      // Clear auth data on unauthorized
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/auth/login";
    }
    
    if (error.response?.status === 429) {
      alert("Demasiadas solicitudes. Por favor, espera un momento antes de intentar nuevamente.");
    }
    
    return Promise.reject(error);
  }
);

export default api;
