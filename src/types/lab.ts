export interface Lab {
  id: number;
  title: string;
  slug: string;
  mdPath: string;
  mdPublicUrl: string;
  description: string;
  difficultyLevel: number;
  authorId: number;
  isActive: boolean;
  views: number;
  uniqueUserViews: number;
  ratingAverage: number; // 0..5
  ratingCount: number;
}

export type LabLevel = "Basic" | "Intermediate" | "Advanced";

export interface LabRateRequest {
  score: number; // 1..5
  comment?: string;
}

export interface LabCommentDto {
  id: number;
  labId: number;
  userId: number;
  username: string;
  role: number;
  avatarUrl: string | null;
  content: string;
  parentId: number | null;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}
