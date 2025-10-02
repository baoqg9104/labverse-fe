export interface User {
  email: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  role: number;
  subscription: string;
  createdAt: string | null;
}