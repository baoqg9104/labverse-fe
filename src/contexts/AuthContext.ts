import { createContext } from "react";
import type { User } from "../types/user";

export interface AuthContextType {
  user: User | null;
  login: (token: string) => void;
  logout: () => void;
  isAuthLoading: boolean;
  // Daily login reward UI control
  dailyReward: { visible: boolean; points: number; message?: string } | null;
  dismissDailyReward: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
  isAuthLoading: true,
  dailyReward: null,
  dismissDailyReward: () => {},
});
