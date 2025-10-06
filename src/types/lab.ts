export interface Lab {
  title: string;
  desc: string;
  level: LabLevel;
  // type: LabType;
}

export type LabLevel = "Basic" | "Intermediate" | "Advanced";

// export type LabType = "Rooms" | "Networks";
