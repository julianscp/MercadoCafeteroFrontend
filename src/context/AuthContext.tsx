"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

type User = {
  id: number;
  email: string;
  nombre: string;
  direccion?: string;
  telefono?: string;
  rol: string;
  verificado: boolean;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (data: {
    email: string;
    password: string;
    nombre: string;
    direccion?: string;
    telefono?: string;
  }) => Promise<string>;
  confirmEmail: (token: string) => Promise<string>;
  resendConfirmation: (email: string) => Promise<string>;
  requestPasswordReset: (email: string) => Promise<string>;
  resetPassword: (token: string, newPassword: string) => Promise<string>;
  resetInactivityTimer: () => void;
  showTimeoutWarning: boolean;
  timeLeft: number;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Configuración del timeout
const INACTIVITY_TIMEOUT = 60 * 1000; // 1 minuto en milisegundos
const WARNING_TIME = 10 * 1000; // Mostrar advertencia 10 segundos antes

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showTimeoutWarning, setShowTimeoutWarning] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  
  // Referencias para los timers
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const storedToken =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;

        if (storedToken) {
          api.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
          const profileRes = await api.get<User>("/autenticacion/perfil");
          setUser(profileRes.data);
          setToken(storedToken);
          // Iniciar el timer de inactividad si hay un usuario logueado
          startInactivityTimer();
        }
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        delete api.defaults.headers.common["Authorization"];
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, [startInactivityTimer]);

  // Función para iniciar el timer de inactividad
  const startInactivityTimer = useCallback(() => {
    // Limpiar timers existentes
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

    setShowTimeoutWarning(false);
    setTimeLeft(0);

    // Timer para mostrar la advertencia
    warningTimerRef.current = setTimeout(() => {
      setShowTimeoutWarning(true);
      setTimeLeft(WARNING_TIME / 1000);
      
      // Timer de countdown
      countdownTimerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Cerrar sesión automáticamente
            logout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, INACTIVITY_TIMEOUT - WARNING_TIME);

    // Timer principal de inactividad
    inactivityTimerRef.current = setTimeout(() => {
      logout();
    }, INACTIVITY_TIMEOUT);
  }, [logout]);

  // Función para resetear el timer de inactividad
  const resetInactivityTimer = useCallback(() => {
    if (user && token) {
      startInactivityTimer();
    }
  }, [user, token, startInactivityTimer]);

  // Eventos que indican actividad del usuario
  useEffect(() => {
    if (!user || !token) return;

    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
      'keydown'
    ];

    const handleActivity = () => {
      resetInactivityTimer();
    };

    // Agregar listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [user, token, resetInactivityTimer]);

  const saveAuth = (userData: User, jwt: string) => {
    localStorage.setItem("token", jwt);
    localStorage.setItem("user", JSON.stringify(userData));
    api.defaults.headers.common["Authorization"] = `Bearer ${jwt}`;
    setToken(jwt);
    setUser(userData);
    // Iniciar timer después del login
    startInactivityTimer();
  };

  const login = async (email: string, password: string) => {
    const res = await api.post<{ access_token: string }>(
      "/autenticacion/login",
      { email, password }
    );
    const jwt = res.data.access_token;
    api.defaults.headers.common["Authorization"] = `Bearer ${jwt}`;

    const profileRes = await api.get<User>("/autenticacion/perfil");
    saveAuth(profileRes.data, jwt);
  };

  const logout = () => {
    // Limpiar todos los timers
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    delete api.defaults.headers.common["Authorization"];
    setUser(null);
    setToken(null);
    setShowTimeoutWarning(false);
    setTimeLeft(0);
    router.push("/auth/login");
  };

  const register = async (data: {
    email: string;
    password: string;
    nombre: string;
    direccion?: string;
    telefono?: string;
  }) => {
    const res = await api.post<{ message: string; user: User }>(
      "/autenticacion/registro",
      data
    );
    return res.data.message;
  };

  const confirmEmail = async (token: string) => {
    const res = await api.post<{ message: string }>(
      "/autenticacion/confirm-email",
      { token }
    );
    return res.data.message;
  };

  const resendConfirmation = async (email: string) => {
    const res = await api.post<{ message: string }>(
      "/autenticacion/resend-confirmation",
      { email }
    );
    return res.data.message;
  };

  const requestPasswordReset = async (email: string) => {
    const res = await api.post<{ message: string }>(
      "/autenticacion/request-password-reset",
      { email }
    );
    return res.data.message;
  };

  const resetPassword = async (token: string, newPassword: string) => {
    const res = await api.post<{ message: string }>(
      "/autenticacion/reset-password",
      { token, newPassword }
    );
    return res.data.message;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        register,
        confirmEmail,
        resendConfirmation,
        requestPasswordReset,
        resetPassword,
        resetInactivityTimer,
        showTimeoutWarning,
        timeLeft,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};