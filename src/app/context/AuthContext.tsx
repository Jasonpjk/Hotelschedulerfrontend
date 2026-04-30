import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { getMeApi, type UserInfo } from "../utils/api";

interface AuthState {
  token: string | null;
  user: UserInfo | null;
  isLoading: boolean;
  setAuth: (token: string, user: UserInfo) => void;
  logout: () => void;
  isAdmin: () => boolean;
  isScheduler: () => boolean;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken]   = useState<string | null>(() => localStorage.getItem("hotel_token"));
  const [user, setUser]     = useState<UserInfo | null>(() => {
    try { return JSON.parse(localStorage.getItem("hotel_user") ?? "null"); }
    catch { return null; }
  });
  const [isLoading, setIsLoading] = useState(false);

  // 토큰은 있는데 유저 정보가 없으면 /auth/me 로 복원
  useEffect(() => {
    if (token && !user) {
      setIsLoading(true);
      getMeApi()
        .then((u) => setUser(u))
        .catch(() => {
          localStorage.removeItem("hotel_token");
          setToken(null);
        })
        .finally(() => setIsLoading(false));
    }
  }, []);

  const setAuth = (newToken: string, newUser: UserInfo) => {
    localStorage.setItem("hotel_token", newToken);
    localStorage.setItem("hotel_user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem("hotel_token");
    localStorage.removeItem("hotel_user");
    setToken(null);
    setUser(null);
  };

  const isAdmin     = () => user?.role === "admin";
  const isScheduler = () => user?.role === "admin" || user?.role === "scheduler";

  return (
    <AuthContext.Provider value={{ token, user, isLoading, setAuth, logout, isAdmin, isScheduler }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
