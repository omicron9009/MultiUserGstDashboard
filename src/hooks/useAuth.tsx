import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface AuthState {
  isAuthenticated: boolean;
  username: string | null;
}

interface AuthContextType extends AuthState {
  login: (username: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    const saved = sessionStorage.getItem("gst_auth");
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return { isAuthenticated: false, username: null };
  });

  const login = useCallback((username: string) => {
    const next = { isAuthenticated: true, username };
    setState(next);
    sessionStorage.setItem("gst_auth", JSON.stringify(next));
  }, []);

  const logout = useCallback(() => {
    setState({ isAuthenticated: false, username: null });
    sessionStorage.removeItem("gst_auth");
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
