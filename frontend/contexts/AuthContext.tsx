"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { User, LoginRequest, LoginResponse, AuthContextType } from "@/types/auth";
import api, {
  getAuthToken,
  setAuthToken,
  removeAuthToken,
} from "@/services/api";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize and verify session on mount
  useEffect(() => {
    let isMounted = true;

    async function initializeAuth() {
      const storedToken = getAuthToken();
      if (!storedToken) {
        if (isMounted) {
          setToken(null);
          setUser(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        setToken(storedToken);
        const currentUser = await api.get<User>("/api/auth/me");
        if (isMounted) {
          setUser(currentUser);
          setIsLoading(false);
        }
      } catch {
        // Token invalid or expired - clear stored session
        removeAuthToken();
        if (isMounted) {
          setToken(null);
          setUser(null);
          setIsLoading(false);
        }
      }
    }

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (credentials: LoginRequest): Promise<void> => {
    setIsLoading(true);
    try {
      const data = await api.post<LoginResponse>("/api/auth/login", credentials);
      if (data?.token) {
        setAuthToken(data.token);
        setToken(data.token);
        setUser(data.user);
      } else {
        throw new Error("Invalid response from login server");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await api.post("/api/auth/logout");
    } catch {
      // Ignore network errors on logout to guarantee client session cleanup
    } finally {
      removeAuthToken();
      setToken(null);
      setUser(null);
    }
  }, []);

  const updateUserProfile = useCallback((updatedFields: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updatedFields } : null));
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      token,
      login,
      logout,
      updateUserProfile,
      isAuthenticated: Boolean(user && token),
      isLoading,
    }),
    [user, token, login, logout, updateUserProfile, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;
