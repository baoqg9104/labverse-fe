import { AuthContext } from "./AuthContext";
import type { User } from "../types/user";
import api, {
  setCurrentAccessToken,
  setLogoutCallback,
  getCurrentAccessToken,
} from "../utils/axiosInstance";
import { useEffect, useState, type ReactNode } from "react";
import { ROLE } from "../components/profile/RoleUtils";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [dailyReward, setDailyReward] = useState<{
    visible: boolean;
    points: number;
    message?: string;
  } | null>(null);

  useEffect(() => {
    setLogoutCallback(() => {
      setUser(null);
      setIsAuthLoading(false);
      setDailyReward(null);
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

      // Only non-admins get daily login rewards
      const isAdmin = Number(response?.data?.role) === ROLE.ADMIN;
      if (!isAdmin) {
        // Attempt to trigger daily login reward (idempotent on backend)
        try {
          const prevPoints: number = Number(response?.data?.points ?? 0);
          const res = await api.post("/users/points/daily-login");

          // Prefer server-provided updated user if available; otherwise fetch latest
          let newUser: User | null = (res?.data?.user as User) || null;
          if (!newUser) {
            try {
              const me = await api.get("/users/me");
              newUser = me?.data ?? null;
            } catch {
              // ignore
            }
          }

          if (newUser) {
            const delta = Math.max(0, Number(newUser.points ?? 0) - prevPoints);
            if (delta > 0) {
              setUser(newUser);
              const message: string | undefined = res?.data?.message;
              setDailyReward({ visible: true, points: delta, message });
            }
          }
        } catch {
          // Ignore daily reward failure to avoid blocking auth flow
        }
      }
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
    setDailyReward(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthLoading,
        dailyReward,
        dismissDailyReward: () => setDailyReward(null),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
