import { useEffect, useMemo, useState } from "react";
import ActivityCalendar, { type Activity } from "react-activity-calendar";
import { Tooltip as MuiTooltip } from "@mui/material";
import { eachDayOfInterval, format } from "date-fns";
import api from "../../utils/axiosInstance";
import type { RecentActivity, RecentActivityPagedResponse } from "../../types/activity";
import { handleAxiosError } from "../../utils/handleAxiosError";
import { dateLabelFromYmd, parseApiDate } from "../../utils/dateTime";
import { useTranslation } from "react-i18next";

const generateFullYearFallback = (): Activity[] => {
  const start = new Date(new Date().getFullYear(), 0, 1);
  const end = new Date(new Date().getFullYear(), 11, 31);
  return eachDayOfInterval({ start, end }).map((date) => ({
    date: format(date, "yyyy-MM-dd"),
    count: 0,
    level: 0,
  }));
};

const FALLBACK_ACTIVITY: Activity[] = generateFullYearFallback();

type Props = {
  data?: Activity[];
  username?: string;
  className?: string;
};

export function ActivitySection({ data = [], className }: Props) {
  const { t } = useTranslation();
  const [calendarData, setCalendarData] = useState<Activity[]>([]);

  // Compute items: prefer prop data, else fetched, else fallback full-year
  const items = useMemo<Activity[]>(() => {
    if (data.length > 0) return data;
    if (calendarData.length > 0) return calendarData;
    return FALLBACK_ACTIVITY;
  }, [data, calendarData]);

  useEffect(() => {
    let cancelled = false;
    const buildLevel = (count: number): number => {
      if (count <= 0) return 0;
      if (count === 1) return 1;
      if (count <= 3) return 2;
      if (count <= 6) return 3;
      return 4;
    };

    const buildCalendarFromActivities = (
      acts: RecentActivity[]
    ): Activity[] => {
      const year = new Date().getFullYear();
      const start = new Date(year, 0, 1);
      const end = new Date(year, 11, 31);
      const counts = new Map<string, number>();
      for (const a of acts) {
        const d = parseApiDate(a.createdAt);
        if (isNaN(d.getTime())) continue;
        if (d.getFullYear() !== year) continue; // only current year on calendar
        const key = format(d, "yyyy-MM-dd");
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
      return eachDayOfInterval({ start, end }).map((date) => {
        const key = format(date, "yyyy-MM-dd");
        const count = counts.get(key) ?? 0;
        return { date: key, count, level: buildLevel(count) } as Activity;
      });
    };

    const fetchAndBuild = async () => {
      try {
        const res = await api.get<RecentActivityPagedResponse>("/activities/me/recent", {
          params: { page: 1, pageSize: 365 },
        });
        if (!cancelled) {
          const list: RecentActivity[] = res.data?.items ?? [];
          const built = buildCalendarFromActivities(list);
          setCalendarData(built);
        }
      } catch (err) {
        handleAxiosError(err, { silent: true });
        if (!cancelled) setCalendarData([]);
      } finally {
        // no-op
      }
    };

    // Only fetch if no data prop supplied
    if (data.length === 0) {
      fetchAndBuild();
    }
    return () => {
      cancelled = true;
    };
  }, [data.length]);

  return (
    <div
      className={[
        "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex items-center justify-center flex-col",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <ActivityCalendar
        data={items}
        colorScheme="light"
        theme={{
          light: ["#e4ecff", "#c7d7ff", "#a8c1ff", "#7ea4ff", "#4f7fff"],
          dark: ["#17324a", "#1c436b", "#20558b", "#2a6bb0", "#3b86d6"],
        }}
        blockSize={14}
        blockMargin={4.5}
        fontSize={14}
        blockRadius={2}
        renderBlock={(block, activity) => (
          <MuiTooltip
            title={t("profile.activity.tooltip.activitiesOn", "{{count}} activities on {{date}}", {
              count: activity.count,
              date: dateLabelFromYmd(activity.date),
            })}
          >
            {block}
          </MuiTooltip>
        )}
        renderColorLegend={(block, level) => (
          <MuiTooltip title={t("profile.activity.tooltip.level", "Level: {{level}}", { level })}>
            {block}
          </MuiTooltip>
        )}
      />
    </div>
  );
}
