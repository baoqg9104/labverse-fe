export interface RecentActivity {
  id: number;
  userId: number;
  labId: number | null;
  questionId: number | null;
  action: string; // e.g., 'login', 'logout', 'enroll_lab', 'complete_lab'
  description?: string | null; // human-readable message from backend
  metadataJson: string | null; // JSON string from backend
  createdAt: string; // ISO date string
}

export type RecentActivityResponse = RecentActivity[];

export interface RecentActivityPagedResponse {
  items: RecentActivity[];
  page: number;
  pageSize: number;
  total: number;
}
