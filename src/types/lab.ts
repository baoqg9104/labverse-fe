export interface Lab {
  id: number;
  title: string;
  slug: string;
  mdPath: string;
  mdPublicUrl: string;
  desc: string;
  level: LabLevel;
  authorId: number;
  isActive: boolean;
}

export type LabLevel = "Basic" | "Intermediate" | "Advanced";

