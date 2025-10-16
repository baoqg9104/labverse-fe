export type ReportType = "Abuse" | "Bug" | "Payment" | "Other";
export type ReportStatus = "Open" | "In Review" | "Resolved";
export type ReportSeverity = "Low" | "Medium" | "High";

export interface Report {
  id: number;
  type: ReportType;
  title: string;
  description: string;
  severity: ReportSeverity;
  status: ReportStatus;
  createdAt: string; // ISO timestamp
  reporterEmail: string;
  reporterId?: number | null;
  labId?: number | null;
  labTitle?: string | null;
  imagePaths?: string[] | null;
}
