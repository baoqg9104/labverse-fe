import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import ActivityCalendar, { type Activity } from "react-activity-calendar";

const FALLBACK_ACTIVITY: Activity[] = [
  { date: "2025-01-21", count: 0, level: 0 },
  { date: "2025-01-22", count: 1, level: 1 },
  { date: "2025-02-23", count: 2, level: 2 },
  { date: "2025-02-24", count: 1, level: 1 },
  { date: "2025-02-25", count: 0, level: 0 },
  { date: "2025-02-26", count: 3, level: 3 },
  { date: "2025-07-27", count: 4, level: 4 },
  { date: "2025-07-28", count: 2, level: 2 },
  { date: "2025-07-29", count: 1, level: 1 },
  { date: "2025-07-30", count: 0, level: 0 },
  { date: "2025-07-31", count: 3, level: 3 },
  { date: "2025-08-01", count: 4, level: 4 },
  { date: "2025-08-02", count: 2, level: 2 },
  { date: "2025-08-03", count: 1, level: 1 },
  { date: "2025-08-04", count: 0, level: 0 },
  { date: "2025-08-05", count: 2, level: 2 },
  { date: "2025-08-06", count: 3, level: 3 },
  { date: "2025-08-07", count: 1, level: 1 },
  { date: "2025-08-08", count: 0, level: 0 },
  { date: "2025-08-09", count: 4, level: 4 },
  { date: "2025-08-10", count: 3, level: 3 },
  { date: "2025-08-11", count: 2, level: 2 },
  { date: "2025-08-12", count: 1, level: 1 },
  { date: "2025-08-13", count: 0, level: 0 },
  { date: "2025-08-14", count: 2, level: 2 },
  { date: "2025-08-15", count: 3, level: 3 },
  { date: "2025-08-16", count: 4, level: 4 },
  { date: "2025-08-17", count: 1, level: 1 },
  { date: "2025-08-18", count: 0, level: 0 },
  { date: "2025-08-19", count: 2, level: 2 },
  { date: "2025-08-20", count: 3, level: 3 },
  { date: "2025-08-21", count: 1, level: 1 },
  { date: "2025-08-22", count: 0, level: 0 },
  { date: "2025-08-23", count: 4, level: 4 },
  { date: "2025-08-24", count: 3, level: 3 },
  { date: "2025-08-25", count: 2, level: 2 },
  { date: "2025-08-26", count: 1, level: 1 },
  { date: "2025-08-27", count: 0, level: 0 },
  { date: "2025-08-28", count: 2, level: 2 },
  { date: "2025-08-29", count: 4, level: 4 },
  { date: "2025-08-30", count: 3, level: 3 },
  { date: "2025-08-31", count: 1, level: 1 },
  { date: "2025-09-01", count: 0, level: 0 },
  { date: "2025-09-02", count: 3, level: 3 },
  { date: "2025-09-03", count: 2, level: 2 },
  { date: "2025-09-04", count: 1, level: 1 },
  { date: "2025-09-05", count: 0, level: 0 },
  { date: "2025-09-06", count: 4, level: 4 },
  { date: "2025-09-07", count: 3, level: 3 },
  { date: "2025-09-08", count: 2, level: 2 },
  { date: "2025-09-09", count: 1, level: 1 },
  { date: "2025-09-10", count: 0, level: 0 },
  { date: "2025-09-11", count: 2, level: 2 },
  { date: "2025-09-12", count: 3, level: 3 },
  { date: "2025-09-13", count: 4, level: 4 },
  { date: "2025-09-14", count: 2, level: 2 },
  { date: "2025-09-15", count: 1, level: 1 },
  { date: "2025-09-16", count: 0, level: 0 },
  { date: "2025-09-17", count: 2, level: 2 },
  { date: "2025-09-18", count: 3, level: 3 },
  { date: "2025-09-19", count: 1, level: 1 },
  { date: "2025-09-20", count: 0, level: 0 },
  { date: "2025-09-21", count: 4, level: 4 },
  { date: "2025-09-22", count: 3, level: 3 },
  { date: "2025-09-23", count: 2, level: 2 },
  { date: "2025-09-24", count: 1, level: 1 },
  { date: "2025-09-25", count: 0, level: 0 },
  { date: "2025-09-26", count: 2, level: 2 },
  { date: "2025-09-27", count: 3, level: 3 },
  { date: "2025-09-28", count: 4, level: 4 },
  { date: "2025-09-29", count: 2, level: 2 },
  { date: "2025-09-30", count: 1, level: 1 },
  { date: "2025-12-01", count: 0, level: 0 },
];

type Props = {
  data?: Activity[];
  username?: string;
  className?: string;
};

export function ActivitySection({ data = [], className }: Props) {
  const { t } = useTranslation();
  const items = useMemo<Activity[]>(() => {
    if (data.length > 0) return data;
    return FALLBACK_ACTIVITY;
  }, [data]);

  return (
    <div
      className={[
        "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">
          {t("profile.activity.title", "Activity")}
        </h3>
        {/* {username && <div className="text-sm text-slate-500">@{username}</div>} */}
      </div>
      <ActivityCalendar
        data={items}
        colorScheme="light"
        theme={{
          light: ["#e4ecff", "#c7d7ff", "#a8c1ff", "#7ea4ff", "#4f7fff"],
          dark: ["#17324a", "#1c436b", "#20558b", "#2a6bb0", "#3b86d6"],
        }}
        labels={{
          totalCount: "contributions in",
        }}
        blockSize={15}
        blockMargin={5}
        fontSize={15}
        
        // hideColorLegend
      />
    </div>
  );
}
