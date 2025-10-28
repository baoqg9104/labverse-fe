import { useEffect, useState } from "react";
import type {
  RecentActivity,
  RecentActivityPagedResponse,
} from "../../../types/activity";
import api from "../../../utils/axiosInstance";
import { handleAxiosError } from "../../../utils/handleAxiosError";
import {
  formatLocalDateTime,
  relativeTimeFromNow,
} from "../../../utils/dateTime";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";

function titleForActivity(a: RecentActivity, t: TFunction): string {
  if (a.description && a.description.trim().length > 0) return a.description;
  // Fallback mapping when description is not provided
  switch (a.action) {
    case "login":
      return t("profile.activity.actions.login", "Logged in");
    case "logout":
      return t("profile.activity.actions.logout", "Logged out");
    case "enroll_lab":
      return t("profile.activity.actions.enrollLab", {
        defaultValue: "Enrolled lab #{{id}}",
        id: a.labId ?? "?",
      }) as unknown as string;
    case "complete_lab":
      return t("profile.activity.actions.completeLab", {
        defaultValue: "Completed lab #{{id}}",
        id: a.labId ?? "?",
      }) as unknown as string;
    case "create_question":
      return t("profile.activity.actions.createQuestion", {
        defaultValue: "Created a question #{{id}}",
        id: a.questionId ?? "?",
      }) as unknown as string;
    default:
      return a.action
        .split("_")
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join(" ");
  }
}

function formatDateTime(iso: string): string {
  return formatLocalDateTime(iso);
}

export default function ActivityTab() {
  const { t } = useTranslation();
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [hasNext, setHasNext] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    const fetchActivities = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get<RecentActivityPagedResponse>(
          "/activities/me/recent",
          {
            params: { page, pageSize },
          }
        );
        if (!cancelled) {
          const { items = [], total = 0 } =
            res.data ?? ({} as RecentActivityPagedResponse);
          setActivities(items);
          setHasNext(page * pageSize < total);
        }
      } catch (err) {
        const msg = handleAxiosError(err, { silent: true });
        if (!cancelled) setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchActivities();
    return () => {
      cancelled = true;
    };
  }, [page, pageSize]);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-2">
          <span className="text-2xl">📊</span>
          {t("profile.activity.title", "Recent Activity")}
        </h3>
        <div className="flex items-center justify-between gap-3">
          <p className="text-gray-600">
            {t("profile.activity.desc", "Your latest activities and accomplishments")}
          </p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="pageSize" className="text-sm text-gray-600">
                {t("profile.activity.itemsPerPage", "Items per page")}
              </label>
              <select
                id="pageSize"
                className="rounded-xl border border-gray-300 px-3 py-2 text-sm"
                value={pageSize}
                onChange={(e) => {
                  setPage(1);
                  setPageSize(Number(e.target.value));
                }}
              >
                {[5, 10, 20, 50].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="px-3 py-2 text-sm rounded-xl border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={loading || page === 1}
              >
                {t("profile.activity.prev", "Prev")}
              </button>
              <div className="text-sm text-gray-600">Page {page}</div>
              <button
                type="button"
                className="px-3 py-2 text-sm rounded-xl border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => setPage((p) => (hasNext ? p + 1 : p))}
                disabled={loading || !hasNext}
              >
                {t("profile.activity.next", "Next")}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-4">
        {loading && (
          <ul className="space-y-3 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => (
              <li
                key={i}
                className="p-4 bg-white rounded-2xl border border-gray-200"
              >
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/4" />
              </li>
            ))}
          </ul>
        )}
        {!loading && error && (
          <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700">
            {error}
          </div>
        )}
        {!loading && !error && activities.length === 0 && (
          <div className="p-4 rounded-xl border border-gray-200 bg-white text-gray-600">
            {t("profile.activity.noActivity", "No recent activity yet.")}
          </div>
        )}
        {!loading && !error && activities.length > 0 && (
          <ul className="space-y-3">
            {activities.map((a) => (
              <li
                key={a.id}
                className="p-4 bg-white rounded-2xl border border-gray-200 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="font-semibold text-gray-800 whitespace-pre-wrap break-words line-clamp-2 flex-1">
                    {titleForActivity(a, t)}
                  </div>
                  <div className="text-xs text-gray-500 shrink-0">
                    {relativeTimeFromNow(a.createdAt)}
                  </div>
                </div>
                <div className="mt-1 text-sm text-gray-600">
                  {formatDateTime(a.createdAt)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
