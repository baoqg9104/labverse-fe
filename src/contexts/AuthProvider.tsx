import { AuthContext } from "./AuthContext";
import type { User } from "../types/user";
import api, { setCurrentAccessToken, setLogoutCallback, getCurrentAccessToken } from "../utils/axiosInstance";
import { useEffect, useState, type ReactNode } from "react";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    setLogoutCallback(() => {
      setUser(null);
      setIsAuthLoading(false);
    });

    const token = getCurrentAccessToken();
    if (token) {
      fetchUserData();
    } else {
      setIsAuthLoading(false);
    }
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await api.get("/users/me");
      setUser(response.data);
    } catch {
      setUser(null);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const login = (token: string) => {
    setCurrentAccessToken(token);
    setIsAuthLoading(true);
    fetchUserData();
  };

  const logout = () => {
    setCurrentAccessToken(null);
    setUser(null);
    setIsAuthLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
