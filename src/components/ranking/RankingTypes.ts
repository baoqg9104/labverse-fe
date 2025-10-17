export type Criteria = "points" | "streak" | "badges";
export type TabKey = "users" | "authors";

export type RankingItem = {
  userId: string;
  username: string;
  avatarUrl?: string | null;
  points: number;
  streakCurrent: number;
  badgesCount: number;
};
