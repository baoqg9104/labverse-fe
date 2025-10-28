export type ChangeType =
  | "New"
  | "Improved"
  | "Fixed"
  | "Removed"
  | "Deprecated";

export type ChangelogItem = {
  type: ChangeType;
  // Either a literal description (fallback) or a translation key
  // translation key for the change description
  descriptionKey?: string; // translation key for the change description
  // mark item as upcoming/planned (optional)
  upcoming?: boolean;
};

export type ChangelogEntry = {
  version: string;
  date: string; // YYYY-MM-DD or human-friendly
  // optional literal title or translation key
  titleKey?: string;
  // optional literal details or translation key
  detailsKey?: string;
  // mark entry as upcoming/planned (optional)
  upcoming?: boolean;
  changes: ChangelogItem[];
};

// Newest entries first. To add a new release, insert it at the top of this array.
export const changelog: ChangelogEntry[] = [
  {
    version: "1.5.0",
    date: "2025-11-15",
    upcoming: true,
    titleKey: "changelog.entries.v1_5_0.title",
    detailsKey: "changelog.entries.v1_5_0.details",
    changes: [
      {
        type: "New",
        descriptionKey: "changelog.entries.v1_5_0.changes.0",
        upcoming: true,
      },
      {
        type: "New",
        descriptionKey: "changelog.entries.v1_5_0.changes.1",
        upcoming: true,
      },
    ],
  },
  {
    version: "1.4.0",
    date: "2025-10-28",
    titleKey: "changelog.entries.v1_4_0.title",
    detailsKey: "changelog.entries.v1_4_0.details",
    changes: [
      { type: "New", descriptionKey: "changelog.entries.v1_4_0.changes.0" },
      { type: "New", descriptionKey: "changelog.entries.v1_4_0.changes.1" },
      {
        type: "Improved",
        descriptionKey: "changelog.entries.v1_4_0.changes.2",
      },
      { type: "Fixed", descriptionKey: "changelog.entries.v1_4_0.changes.3" },
    ],
  },
  {
    version: "1.3.2",
    date: "2025-09-12",
    titleKey: "changelog.entries.v1_3_2.title",
    changes: [
      { type: "Fixed", descriptionKey: "changelog.entries.v1_3_2.changes.0" },
      {
        type: "Improved",
        descriptionKey: "changelog.entries.v1_3_2.changes.1",
      },
      { type: "New", descriptionKey: "changelog.entries.v1_3_2.changes.2" },
    ],
  },
  {
    version: "1.3.0",
    date: "2025-07-01",
    titleKey: "changelog.entries.v1_3_0.title",
    detailsKey: "changelog.entries.v1_3_0.details",
    changes: [
      { type: "New", descriptionKey: "changelog.entries.v1_3_0.changes.0" },
      {
        type: "Improved",
        descriptionKey: "changelog.entries.v1_3_0.changes.1",
      },
      { type: "Fixed", descriptionKey: "changelog.entries.v1_3_0.changes.2" },
    ],
  },
  {
    version: "1.1.0",
    date: "2025-04-26",
    titleKey: "changelog.entries.v1_1_0.title",
    detailsKey: "changelog.entries.v1_1_0.details",
    changes: [
      { type: "Fixed", descriptionKey: "changelog.entries.v1_1_0.changes.0" },
      {
        type: "Improved",
        descriptionKey: "changelog.entries.v1_1_0.changes.1",
      },
      {
        type: "Improved",
        descriptionKey: "changelog.entries.v1_1_0.changes.2",
      },
      { type: "New", descriptionKey: "changelog.entries.v1_1_0.changes.3" },
    ],
  },
  {
    version: "1.0.0",
    date: "2025-03-23",
    titleKey: "changelog.entries.v1_0_0.title",
    detailsKey: "changelog.entries.v1_0_0.details",
    changes: [
      { type: "New", descriptionKey: "changelog.entries.v1_0_0.changes.0" },
      { type: "New", descriptionKey: "changelog.entries.v1_0_0.changes.1" },
      { type: "New", descriptionKey: "changelog.entries.v1_0_0.changes.2" },
    ],
  },
];

export default changelog;
