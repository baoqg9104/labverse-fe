import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from 'react-i18next';
import api from "../utils/axiosInstance";
import { handleAxiosError } from "../utils/handleAxiosError";
import type { Report, ReportStatus } from "../types/report";
import { toast } from "react-toastify";
import Modal from "../components/Modal";
import Skeleton from "@mui/material/Skeleton";
import LinearProgress from "@mui/material/LinearProgress";
import SkeletonImage from "../components/skeletons/SkeletonImage";
import { supabase } from "../libs/supabaseClient";

type CsvRow = Record<string, string | number | boolean | null | undefined>;

function exportCsv(filename: string, rows: CsvRow[]) {
  const header = Object.keys(rows[0] || {}).join(",");
  const body = rows
    .map((r) =>
      Object.values(r)
        .map((v) => `"${String(v).replaceAll('"', '""')}"`)
        .join(",")
    )
    .join("\n");
  const csv = [header, body].filter(Boolean).join("\n");
  // Prepend UTF-8 BOM so Excel on Windows detects UTF-8 correctly and Vietnamese characters render properly
  const csvWithBOM = "\uFEFF" + csv;
  const blob = new Blob([csvWithBOM], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function AdminReports() {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState("30d");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("open");
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewPaths, setPreviewPaths] = useState<string[]>([]);
  const [previewTitle, setPreviewTitle] = useState<string>("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsReport, setDetailsReport] = useState<Report | null>(null);

  // Track requests to avoid out-of-order updates
  const latestFetchId = useRef(0);

  // Date helpers: treat timestamps without timezone as UTC
  const normalizeToDate = (input: string): Date => {
    if (!input) return new Date(NaN);
    const hasTZ = /Z$|[+-]\d{2}:?\d{2}$/.test(input);
    const normalized = hasTZ
      ? input
      : `${input.endsWith("Z") ? input : input + "Z"}`;
    return new Date(normalized);
  };
  // CSV vẫn xuất UTC chuẩn qua toISOString dùng normalizeToDate ở dưới

  // Localized display for end-users (uses browser locale and timezone)
  const formatLocalDisplay = (input: string): string => {
    const d = normalizeToDate(input);
    if (isNaN(d.getTime())) return "";
    try {
      return new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(d);
    } catch {
      return d.toLocaleString();
    }
  };

  // Encode status label to backend numeric code: Open=0, In Review=1, Resolved=2
  const STATUS_ORDER = ["Open", "In Review", "Resolved"] as const;
  const encodeStatus = (s: ReportStatus): number => {
    const idx = STATUS_ORDER.findIndex((x) => x === s);
    return idx >= 0 ? idx : 0;
  };

  useEffect(() => {
    const TYPE_ORDER = ["Bug", "Abuse", "Payment", "Other"] as const;
    const SEVERITY_ORDER = ["Low", "Medium", "High"] as const;
    const STATUS_ORDER = ["Open", "In Review", "Resolved"] as const;

    const decodeEnum = <T extends readonly string[]>(
      value: unknown,
      order: T,
      fallback: T[number]
    ) => {
      if (typeof value === "number") return order[value] ?? fallback;
      if (typeof value === "string") {
        const found = order.find(
          (o) => o.toLowerCase() === value.toLowerCase()
        );
        return (found as T[number]) ?? fallback;
      }
      return fallback;
    };

    // Safe pickers without using 'any'
    const pickString = (
      obj: Record<string, unknown>,
      keys: string[],
      fallback = ""
    ): string => {
      for (const k of keys) {
        const v = obj[k];
        if (typeof v === "string") return v;
        if (typeof v === "number" || typeof v === "boolean") return String(v);
        if (v instanceof Date && !isNaN(v.getTime())) return v.toISOString();
      }
      return fallback;
    };

    const pickNumber = (
      obj: Record<string, unknown>,
      keys: string[]
    ): number | null => {
      for (const k of keys) {
        const v = obj[k];
        if (typeof v === "number" && !Number.isNaN(v)) return v;
        if (
          typeof v === "string" &&
          v.trim() !== "" &&
          !Number.isNaN(Number(v))
        )
          return Number(v);
      }
      return null;
    };

    const pickStringArray = (
      obj: Record<string, unknown>,
      keys: string[]
    ): string[] | null => {
      for (const k of keys) {
        const v = obj[k];
        if (Array.isArray(v)) {
          const arr = v.filter((x) => typeof x === "string") as string[];
          return arr.length > 0 ? arr : null;
        }
        if (typeof v === "string" && v) return [v];
      }
      return null;
    };

    const normalizeReport = (
      r: Partial<Report> & Record<string, unknown>
    ): Report => ({
      id: Number(r.id),
      type: decodeEnum(r.type, TYPE_ORDER, "Bug") as Report["type"],
      title: String(r.title ?? ""),
      description: String(r.description ?? ""),
      severity: decodeEnum(
        r.severity,
        SEVERITY_ORDER,
        "Medium"
      ) as Report["severity"],
      status: decodeEnum(r.status, STATUS_ORDER, "Open") as Report["status"],
      createdAt: pickString(
        r,
        ["createdAt", "created_at"],
        new Date().toISOString()
      ),
      reporterEmail: pickString(r, ["reporterEmail", "reporter_email"], ""),
      reporterId: pickNumber(r, ["reporterId", "reporter_id"]),
      labId: pickNumber(r, ["labId", "lab_id"]),
      labTitle: pickString(r, ["labTitle", "lab_title"], "") || null,
      imagePaths: pickStringArray(r, ["imagePaths"]),
    });

    const fetchReports = async () => {
      const seq = ++latestFetchId.current;
      try {
        setLoading(true);
        const params: Partial<{
          type: string;
          status: string;
          period: string;
          q: string;
        }> = {};
        if (type !== "all") {
          const mappedType = type.charAt(0).toUpperCase() + type.slice(1);
          params.type = mappedType; // e.g., Bug | Abuse | Payment
        }
        if (status !== "all") {
          const statusMap: Record<string, ReportStatus> = {
            open: "Open",
            inreview: "In Review",
            resolved: "Resolved",
          };
          params.status = statusMap[status];
    }
    if (period !== "all") params.period = period; // e.g., 7d/30d
    if (query) params.q = query;
        const { data } = await api.get("/reports", { params });
    if (seq !== latestFetchId.current) return; // stale response
        const rawItems: Array<Partial<Report> & Record<string, unknown>> =
          Array.isArray(data)
            ? (data as Array<Partial<Report> & Record<string, unknown>>)
            : (data?.items as Array<
                Partial<Report> & Record<string, unknown>
              >) ?? [];
        const items = rawItems.map(normalizeReport);
        setReports(items);
      } catch (err) {
        handleAxiosError(err, { fallbackMessage: t("adminReports.failedLoad") });
      } finally {
        if (seq === latestFetchId.current) setLoading(false);
      }
    };
    fetchReports();
  }, [type, status, period, query, t]);

  const data = useMemo(() => reports, [reports]);

  const toPublicUrl = (path: string) => {
    // Use Supabase helper to build public URL (expects full path relative to bucket root)
    const { data } = supabase.storage.from("reports").getPublicUrl(path);
    return data.publicUrl;
  };

  const openPreview = (r: Report) => {
    const paths = Array.isArray(r.imagePaths)
      ? (r.imagePaths.filter(Boolean) as string[])
      : [];
    if (paths.length === 0) return;
    setPreviewPaths(paths);
    setPreviewTitle(t("adminReports.previewTitle", { id: r.id }));
    setPreviewOpen(true);
  };

  const openDetails = (r: Report) => {
    setDetailsReport(r);
    setDetailsOpen(true);
  };

  const updateStatus = async (id: number, newStatus: ReportStatus) => {
    try {
      const body: { status: number; resolvedAt?: string } = {
        status: encodeStatus(newStatus),
      };
      if (newStatus === "Resolved") {
        body.resolvedAt = new Date().toISOString();
      }
      await api.patch(`/reports/${id}`, body);
      setReports((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
      );
      toast.success(t("adminReports.statusUpdated"));
    } catch (err) {
      handleAxiosError(err, { fallbackMessage: t("adminReports.updateFailed") });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50 pt-8">
      <div className="max-w-6xl mx-auto">
        <div className="rounded-2xl overflow-hidden shadow-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{t('adminReports.title')}</h1>
            <div className="flex items-center gap-2">
              <button
                className="cursor-pointer px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                onClick={() =>
                  exportCsv(
                    `reports_${period}.csv`,
                    (data ?? []).map((r) => ({
                      id: r.id,
                      type: r.type,
                      severity: r.severity,
                      title: r.title,
                      description: r.description,
                      status: r.status,
                      reporterEmail: r.reporterEmail,
                      reporterId: r.reporterId ?? "",
                      labId: r.labId ?? "",
                      labTitle: r.labTitle ?? "",
                      createdAt: formatLocalDisplay(r.createdAt),
                    }))
                  )
                }
              >
                {t('adminReports.exportCsv')}
              </button>
            </div>
          </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
            <select
              className="rounded-xl border border-gray-300 px-3 py-2"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              <option value="7d">{t('adminReports.period.7d')}</option>
              <option value="30d">{t('adminReports.period.30d')}</option>
              <option value="all">{t('adminReports.period.all')}</option>
            </select>
            <select
              className="rounded-xl border border-gray-300 px-3 py-2"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="all">{t('adminReports.type.all')}</option>
              <option value="abuse">{t('adminReports.type.abuse')}</option>
              <option value="bug">{t('adminReports.type.bug')}</option>
              <option value="payment">{t('adminReports.type.payment')}</option>
            </select>
            <select
              className="rounded-xl border border-gray-300 px-3 py-2"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="open">{t('adminReports.status.open')}</option>
              <option value="inreview">{t('adminReports.status.inreview')}</option>
              <option value="resolved">{t('adminReports.status.resolved')}</option>
              <option value="all">{t('adminReports.status.all')}</option>
            </select>
            <input
              className="rounded-xl border border-gray-300 px-3 py-2"
              placeholder={t("adminReports.searchPlaceholder")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
              <div className="text-sm text-blue-700">{t('adminReports.status.open')}</div>
              <div className="text-2xl font-bold text-blue-900">
                {data.filter((d) => d.status === "Open").length}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200">
              <div className="text-sm text-amber-700">{t('adminReports.status.inreview')}</div>
              <div className="text-2xl font-bold text-amber-900">
                {data.filter((d) => d.status === "In Review").length}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200">
              <div className="text-sm text-emerald-700">{t('adminReports.status.resolved')}</div>
              <div className="text-2xl font-bold text-emerald-900">
                {data.filter((d) => d.status === "Resolved").length}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-200 relative">
            {loading && data.length > 0 && (
              <div className="absolute left-0 right-0 top-0">
                <LinearProgress />
              </div>
            )}
            <table className="min-w-full bg-white">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="px-4 py-3">{t('adminReports.table.id')}</th>
                  <th className="px-4 py-3">{t('adminReports.table.type')}</th>
                  <th className="px-4 py-3">{t('adminReports.table.reporter')}</th>
                  <th className="px-4 py-3">{t('adminReports.table.lab')}</th>
                  <th className="px-4 py-3">{t('adminReports.table.description')}</th>
                  <th className="px-4 py-3">{t('adminReports.table.images')}</th>
                  <th className="px-4 py-3">{t('adminReports.table.status')}</th>
                  <th className="px-4 py-3">{t('adminReports.table.created')}</th>
                  <th className="px-4 py-3">{t('adminReports.table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {loading && data.length === 0 ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={`skeleton-${i}`} className="border-t">
                      <td className="px-4 py-3">
                        <Skeleton width={24} />
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton width={60} />
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton width={160} />
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton width={120} />
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton width={160} />
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton width={50} />
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton width={80} />
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton width={140} />
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton width={160} />
                      </td>
                    </tr>
                  ))
                ) : data.length === 0 ? (
                  <tr>
                    <td
                      className="px-4 py-6 text-center text-gray-500"
                      colSpan={9}
                    >
                      {t('adminReports.noReports')}
                    </td>
                  </tr>
                ) : (
                  data.map((r) => (
                    <tr key={r.id} className="border-t">
                      <td className="px-4 py-3 text-gray-700">{r.id}</td>
                      <td className="px-4 py-3 text-gray-800 font-medium">
                        {r.type}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {r.reporterEmail}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {r.labTitle || "-"}
                      </td>
                      <td className="px-4 py-3 text-gray-700 max-w-[320px] truncate">{r.description || "-"}</td>
                      <td className="px-4 py-3">
                        {Array.isArray(r.imagePaths) &&
                        r.imagePaths.length > 0 ? (
                          <button
                            className="px-2 py-1 text-xs rounded-md border cursor-pointer"
                            onClick={() => openPreview(r)}
                          >
                            {t('adminReports.view')}
                          </button>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-lg text-xs ${
                            r.status === "Resolved"
                              ? "bg-emerald-100 text-emerald-700"
                              : r.status === "In Review"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {t(
                            `adminReports.status.${
                              r.status === "In Review" ? "inreview" : r.status.toLowerCase()
                            }`
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {formatLocalDisplay(r.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {r.status !== "Open" && (
                            <button
                              className="px-2 py-1 text-xs rounded-md border cursor-pointer"
                              onClick={() => updateStatus(r.id, "Open")}
                            >
                              {t('adminReports.actions.markOpen')}
                            </button>
                          )}
                          {r.status !== "In Review" && (
                            <button
                              className="px-2 py-1 text-xs rounded-md border cursor-pointer"
                              onClick={() => updateStatus(r.id, "In Review")}
                            >
                              {t('adminReports.actions.markInReview')}
                            </button>
                          )}
                          {r.status !== "Resolved" && (
                            <button
                              className="px-2 py-1 text-xs rounded-md border cursor-pointer"
                              onClick={() => updateStatus(r.id, "Resolved")}
                            >
                              {t('adminReports.actions.resolve')}
                            </button>
                          )}
                          <button
                            className="px-2 py-1 text-xs rounded-md border cursor-pointer"
                            onClick={() => openDetails(r)}
                          >
                            {t('adminReports.actions.showDetails')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={previewTitle}
      >
        <div className="w-[900px] max-w-[95vw]">
          {previewPaths.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {previewPaths.map((p, idx) => {
                const url = toPublicUrl(p);
                return (
                  <a
                    key={idx}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="block"
                  >
                    <SkeletonImage
                      src={url}
                      alt={`report-image-${idx + 1}`}
                      className="w-full h-56"
                      imgClassName="w-full h-56 object-cover rounded-lg border"
                    />
                  </a>
                );
              })}
            </div>
          ) : (
            <div className="text-gray-500">{t('adminReports.noImages')}</div>
          )}
        </div>
      </Modal>

      <Modal
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        title={detailsReport ? t('adminReports.details.title', { id: detailsReport.id }) : t('adminReports.details.titleGeneric')}
      >
        <div className="w-[900px] max-w-[95vw] space-y-4">
          {detailsReport ? (
            <div className="text-sm text-gray-800">
              <div className="grid grid-cols-2 gap-3">
                <div className="font-medium">{t('adminReports.table.id')}</div>
                <div>{detailsReport.id}</div>

                <div className="font-medium">{t('adminReports.table.type')}</div>
                <div>{detailsReport.type}</div>

                <div className="font-medium">{t('adminReports.details.severity')}</div>
                <div>{detailsReport.severity}</div>

                <div className="font-medium">{t('adminReports.table.status')}</div>
                <div>{t(`adminReports.status.${detailsReport.status === 'In Review' ? 'inreview' : detailsReport.status.toLowerCase()}`)}</div>

                <div className="font-medium">{t('adminReports.table.reporter')}</div>
                <div>{detailsReport.reporterEmail ?? '-'}</div>

                <div className="font-medium">{t('adminReports.table.lab')}</div>
                <div>{detailsReport.labTitle ?? '-'}</div>

                <div className="font-medium">{t('adminReports.table.created')}</div>
                <div>{formatLocalDisplay(detailsReport.createdAt)}</div>
              </div>

              <div className="mt-4">
                <div className="font-medium mb-2">{t('adminReports.table.description')}</div>
                <div className="whitespace-pre-wrap text-gray-700">{detailsReport.description || '-'}</div>
              </div>

              <div className="mt-4">
                <div className="font-medium mb-2">{t('adminReports.table.images')}</div>
                {Array.isArray(detailsReport.imagePaths) && detailsReport.imagePaths.length > 0 ? (
                  <div className="flex gap-2 flex-wrap">
                    {detailsReport.imagePaths.map((p, i) => (
                      <a key={i} href={toPublicUrl(p)} target="_blank" rel="noreferrer" className="text-sm underline">
                        {t('adminReports.view')} #{i + 1}
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500">{t('adminReports.noImages')}</div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-gray-500">{t('adminReports.noReports')}</div>
          )}
        </div>
      </Modal>
    </div>
  );
}
