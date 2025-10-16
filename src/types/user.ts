export interface User {
  email: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  role: number;
  subscription: string;
  createdAt: string | null;
  isActive: boolean;
  emailVerifiedAt?: string | null;
  points: number;
  level: number;
  streakCurrent: number;
  streakBest: number;
  lastActiveAt: string | null;
}