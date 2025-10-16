import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Line,
} from "recharts";
import api from "../utils/axiosInstance";
import { toast } from "react-toastify";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

// Lightweight CSV export without extra deps
type CsvRow = Record<string, string | number | boolean | null | undefined>;
function exportCsv(filename: string, rows: CsvRow[]) {
  if (!rows.length) return;
  const header = Object.keys(rows[0]).join(",");
  const body = rows
    .map((r) =>
      Object.values(r)
        .map((v) => `"${String(v ?? "").replaceAll('"', '""')}"`)
        .join(",")
    )
    .join("\n");
  const csv = [header, body].filter(Boolean).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function exportExcel(filename: string, rows: CsvRow[]) {
  if (!rows.length) return;
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Revenue");
  const wbout = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
  const blob = new Blob([wbout], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
}

function exportPdf(filename: string, title: string, rows: CsvRow[]) {
  if (!rows.length) return;
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  doc.setFontSize(14);
  doc.text(title, 40, 40);
  const headers = [Object.keys(rows[0])];
  const data = rows.map((r) => Object.values(r).map((v) => String(v ?? "")));
  autoTable(doc, {
    startY: 60,
    head: headers,
    body: data,
    styles: { fontSize: 10 },
    headStyles: { fillColor: [59, 130, 246] },
    margin: { left: 40, right: 40 },
  });
  doc.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}

function formatVND(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatShortVND(value: number) {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return `${value}`;
}

export default function AdminRevenue() {
  const [showExport, setShowExport] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [period, setPeriod] = useState<"" | "7d" | "30d" | "90d">("");

  // API-driven data/state
  type RevenuePoint = { date: string; subs: number };
  type RevenueSummaryDto = {
    from?: string;
    to?: string;
    totalRevenue?: number;
    transactions?: number;
    currency?: string;
    daily?: Array<{
      date?: string;
      day?: string;
      onDate?: string;
      totalRevenue?: number;
      revenue?: number;
      amount?: number;
      subs?: number;
      value?: number;
    }>;
  };
  const [revenueData, setRevenueData] = useState<RevenuePoint[]>([]);
  const [summary, setSummary] = useState<{
    subs: number;
    aov: number;
    transactions: number;
  } | null>(null);
  // channel filter removed per request

  // No demo fallback: we only display real API data

  // Fetch summary and (optionally) daily series from API
  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      setLoading(true);
      // Decide query params: period overrides manual dates; if neither provided => full range (no params)
      const params: Record<string, string> | undefined = (() => {
        if (period) {
          const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
          const now = new Date();
          const to = new Date(now);
          const from = new Date(now);
          from.setDate(now.getDate() - (days - 1));
          const toISO = new Date(
            to.getTime() - to.getTimezoneOffset() * 60000
          ).toISOString();
          const fromISO = new Date(
            from.getTime() - from.getTimezoneOffset() * 60000
          ).toISOString();
          return { from: fromISO, to: toISO };
        }
        if (fromDate && toDate) {
          let from = new Date(`${fromDate}T00:00:00`);
          let to = new Date(`${toDate}T23:59:59.999`);
          if (from > to) {
            const tmp = from;
            from = to;
            to = tmp;
          }
          const toISO = new Date(
            to.getTime() - to.getTimezoneOffset() * 60000
          ).toISOString();
          const fromISO = new Date(
            from.getTime() - from.getTimezoneOffset() * 60000
          ).toISOString();
          return { from: fromISO, to: toISO };
        }
        return undefined;
      })();
      // Range computed above; no need to derive number of days here
      try {
        // Fetch summary first
        let subsTotal = 0;
        let transactions = 0;
        try {
          const res = await api.get<RevenueSummaryDto>("/admin/revenue", {
            params,
          });
          const dto = res.data || {};
          subsTotal = Math.max(0, Math.round(Number(dto.totalRevenue ?? 0)));
          transactions = Math.max(0, Math.round(Number(dto.transactions ?? 0)));
        } catch {
          if (mounted) toast.info("Không lấy được tổng doanh thu");
        }

        // Try to fetch daily series if backend supports it
        let series: RevenuePoint[] = [];
        try {
          const resSeries = await api.get<unknown>("/admin/revenue/daily", {
            params,
          });
          const data = resSeries.data as unknown;
          let arr: Array<Record<string, unknown>> = [];
          if (Array.isArray(data)) {
            arr = data as Array<Record<string, unknown>>;
          } else if (data && typeof data === "object") {
            const maybeDaily = (data as { daily?: unknown }).daily;
            if (Array.isArray(maybeDaily)) {
              arr = maybeDaily as Array<Record<string, unknown>>;
            }
          }
          if (Array.isArray(arr)) {
            series = arr
              .map((item: Record<string, unknown>) => {
                const dateCandidate = [
                  item["date"],
                  item["day"],
                  item["onDate"],
                ].find((v) => typeof v === "string") as string | undefined;
                const d = dateCandidate ? dateCandidate.slice(0, 10) : "";
                const valueCandidate = [
                  item["totalRevenue"],
                  item["revenue"],
                  item["amount"],
                  item["subs"],
                  item["value"],
                ].find((v) => typeof v === "number" || typeof v === "string");
                const vNum = Math.max(
                  0,
                  Math.round(Number(valueCandidate ?? 0))
                );
                return { date: d, subs: vNum };
              })
              .filter((p: RevenuePoint) => Boolean(p.date));
          }
        } catch {
          // no-op, we'll fallback
        }

        // No synthetic fallback: keep series as-is (may be empty)

        if (mounted) {
          setRevenueData(series);
          const aov =
            transactions > 0 ? Math.round(subsTotal / transactions) : 0;
          setSummary({
            subs: subsTotal || series.reduce((s, r) => s + r.subs, 0),
            aov,
            transactions,
          });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchData();
    return () => {
      mounted = false;
    };
  }, [fromDate, toDate, period]);

  // Data for Recharts (bar + 7-day moving average line)
  const rechartsData = useMemo(() => {
    const win = 7;
    const sma: number[] = revenueData.map((_, i) => {
      const start = Math.max(0, i - win + 1);
      const slice = revenueData.slice(start, i + 1);
      return Math.round(slice.reduce((s, r) => s + r.subs, 0) / slice.length);
    });
    return revenueData.map((d, i) => ({
      date: d.date.slice(5),
      Subscriptions: d.subs,
      SMA7: sma[i],
    }));
  }, [revenueData]);

  // Paging for breakdown
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [hideZero, setHideZero] = useState(false);
  const filteredRows = useMemo(() => {
    return hideZero
      ? revenueData.filter((r) => (r.subs ?? 0) > 0)
      : revenueData;
  }, [revenueData, hideZero]);
  const pagedRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filteredRows.length / pageSize);

  const exportKey = useMemo(() => {
    if (period) return period;
    if (fromDate && toDate) return `${fromDate}_to_${toDate}`;
    return "all_time";
  }, [period, fromDate, toDate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50 pt-8">
      <div className="max-w-6xl mx-auto">
        <div className="rounded-2xl overflow-hidden shadow-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Revenue
            </h1>
            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  className="cursor-pointer px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/70"
                  onClick={() => setShowExport(!showExport)}
                >
                  Export ▼
                </button>
                {showExport && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border rounded-xl shadow-lg z-10 overflow-hidden">
                    <button
                      className="cursor-pointer w-full text-left px-4 py-2 hover:bg-gray-50 active:bg-gray-100 text-sm"
                      onClick={() => {
                        const rows = filteredRows.map((r) => ({
                          Date: r.date,
                          Subscriptions: r.subs,
                        }));
                        exportCsv(`revenue_${exportKey}.csv`, rows);
                        setShowExport(false);
                      }}
                    >
                      Export CSV
                    </button>
                    <button
                      className="cursor-pointer w-full text-left px-4 py-2 hover:bg-gray-50 active:bg-gray-100 text-sm"
                      onClick={() => {
                        const rows = filteredRows.map((r) => ({
                          Date: r.date,
                          Subscriptions: r.subs,
                        }));
                        exportPdf(
                          `revenue_${exportKey}.pdf`,
                          `Revenue (${exportKey})`,
                          rows
                        );
                        setShowExport(false);
                      }}
                    >
                      Export PDF
                    </button>
                    <button
                      className="cursor-pointer w-full text-left px-4 py-2 hover:bg-gray-50 active:bg-gray-100 text-sm"
                      onClick={() => {
                        const rows = filteredRows.map((r) => ({
                          Date: r.date,
                          Subscriptions: r.subs,
                        }));
                        exportExcel(`revenue_${exportKey}.xlsx`, rows);
                        setShowExport(false);
                      }}
                    >
                      Export Excel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <select
              className="rounded-xl border border-gray-300 px-3 py-2 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300"
              value={period}
              onChange={(e) => setPeriod(e.target.value as typeof period)}
            >
              <option value="">All time / Custom</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            <input
              type="date"
              className="rounded-xl border border-gray-300 px-3 py-2 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-60"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              disabled={Boolean(period)}
            />
            <input
              type="date"
              className="rounded-xl border border-gray-300 px-3 py-2 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-60"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              disabled={Boolean(period)}
            />
            <button
              className="cursor-pointer rounded-xl border px-3 py-2 hover:bg-gray-50 active:bg-gray-100 shadow-sm"
              onClick={() => {
                setFromDate("");
                setToDate("");
                setPeriod("");
              }}
            >
              Reset Filters
            </button>
            <div className="rounded-xl border px-3 py-2 bg-gray-50 text-gray-700 flex items-center justify-center">
              Currency: VND
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200">
              <div className="text-sm text-emerald-700">Subscriptions</div>
              <div className="text-2xl font-bold text-emerald-900">
                {summary
                  ? formatVND(summary.subs)
                  : loading
                  ? "…"
                  : formatVND(0)}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200">
              <div className="text-sm text-indigo-700">Avg. Order Value</div>
              <div className="text-2xl font-bold text-indigo-900">
                {summary
                  ? formatVND(summary.aov)
                  : loading
                  ? "…"
                  : formatVND(0)}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 p-4 mb-6">
            <div className="text-gray-700 font-semibold mb-2 flex items-center justify-between">
              <span>Revenue trends</span>
              <span className="text-xs text-gray-500">Subscriptions (VND)</span>
            </div>
            <div className="w-full h-64 bg-gray-50 rounded-xl border border-dashed">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={rechartsData}
                  margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                  />
                  <YAxis
                    tickFormatter={(v) => formatShortVND(v as number)}
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                  />
                  <Tooltip
                    formatter={(v: number) => formatVND(v)}
                    labelFormatter={(l) => `Ngày ${l}`}
                  />
                  <Legend />
                  <Bar
                    dataKey="Subscriptions"
                    fill="#3b82f6"
                    radius={[6, 6, 0, 0]}
                  />
                  <Line
                    type="monotone"
                    dataKey="SMA7"
                    stroke="#10b981"
                    dot={false}
                    strokeWidth={2}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 p-4 mb-6">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-gray-700 font-semibold flex items-center gap-2">
                <span>Revenue breakdown</span>
                <span className="text-xs text-gray-500">
                  {filteredRows.length} result
                  {filteredRows.length === 1 ? "" : "s"}
                </span>
              </div>
              <button
                className="cursor-pointer text-sm px-3 py-1 rounded-lg border hover:bg-gray-50 active:bg-gray-100 shadow-sm"
                onClick={() => {
                  setHideZero((v) => !v);
                  setPage(1);
                }}
                aria-pressed={hideZero}
              >
                {hideZero ? "Show all" : "Hide zero days"}
              </button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              {filteredRows.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No matching data
                </div>
              ) : (
                <>
                  <table className="min-w-full bg-white">
                    <thead className="sticky top-0 bg-white z-10">
                      <tr className="text-left text-gray-600 border-b">
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Subscriptions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedRows.map((r, idx) => (
                        <tr
                          key={r.date}
                          className={`border-t ${
                            idx % 2 ? "bg-gray-50/50" : ""
                          } hover:bg-gray-50`}
                        >
                          <td className="px-4 py-3 text-gray-700">{r.date}</td>
                          <td className="px-4 py-3 text-gray-800 font-medium">
                            {formatVND(r.subs)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex justify-between items-center gap-2 mt-4">
                    <span className="text-xs text-gray-500">
                      Hiển thị {pagedRows.length} / {filteredRows.length}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={page === 1}
                        onClick={() => setPage(page - 1)}
                        className="px-3 py-1 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50"
                      >
                        Prev
                      </button>
                      <span className="text-sm">
                        Page {page} / {totalPages}
                      </span>
                      <button
                        disabled={page === totalPages}
                        onClick={() => setPage(page + 1)}
                        className="px-3 py-1 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
