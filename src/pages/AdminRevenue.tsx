import { useMemo, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, Line } from "recharts";

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

function formatVND(value: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);
}

function formatShortVND(value: number) {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return `${value}`;
}

export default function AdminRevenue() {
  const [showExport, setShowExport] = useState(false);
  const [period, setPeriod] = useState("30d");
  const [query, setQuery] = useState("");
  // channel filter removed per request

  // Demo data (replace with API response later)
  const revenueData = useMemo(() => {
    const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
    const today = new Date();
    return Array.from({ length: days }).map((_, idx) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (days - 1 - idx));
      const subs = 5_000_000 + Math.round(Math.random() * 8_000_000);
      return { date: d.toISOString().slice(0, 10), subs };
    });
  }, [period]);

  const summary = useMemo(() => {
    const subs = revenueData.reduce((s, r) => s + r.subs, 0);
    const aov = Math.round(subs / (revenueData.length * 40));
    return { subs, aov };
  }, [revenueData]);

  // Data for Recharts (bar + 7-day moving average line)
  const rechartsData = useMemo(() => {
    const win = 7;
    const sma: number[] = revenueData.map((_, i) => {
      const start = Math.max(0, i - win + 1);
      const slice = revenueData.slice(start, i + 1);
      return Math.round(slice.reduce((s, r) => s + r.subs, 0) / slice.length);
    });
    return revenueData.map((d, i) => ({ date: d.date.slice(5), Subscriptions: d.subs, SMA7: sma[i] }));
  }, [revenueData]);

  // Paging for breakdown
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const filteredRows = revenueData.filter((r) => !query || r.date.includes(query));
  const pagedRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filteredRows.length / pageSize);

  return (
    <div className="mt-5 min-h-screen bg-gradient-to-b from-white to-blue-50 pt-8">
      <div className="max-w-6xl mx-auto">
        <div className="rounded-2xl overflow-hidden shadow-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Revenue</h1>
            <div className="flex items-center gap-2">
              <div className="relative">
                <button className="cursor-pointer px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold" onClick={() => setShowExport(!showExport)}>
                  Export ▼
                </button>
                {showExport && (
                  <div className="absolute right-0 mt-2 w-40 bg-white border rounded-xl shadow-lg z-10">
                    <button className="w-full text-left px-4 py-2 hover:bg-gray-100" onClick={() => { exportCsv(`revenue_${period}.csv`, pagedRows.map(r => ({ Date: r.date, Subscriptions: formatVND(r.subs) }))); setShowExport(false); }}>Export CSV</button>
                    <button className="w-full text-left px-4 py-2 hover:bg-gray-100" disabled>Export PDF</button>
                    <button className="w-full text-left px-4 py-2 hover:bg-gray-100" disabled>Export Excel</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <select className="rounded-xl border border-gray-300 px-3 py-2" value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            <input type="date" className="rounded-xl border border-gray-300 px-3 py-2" value={query} onChange={(e) => setQuery(e.target.value)} />
            <button className="cursor-pointer rounded-xl border px-3 py-2 hover:bg-gray-50">Reset Filters</button>
            <div className="rounded-xl border px-3 py-2 bg-gray-50 text-gray-700 flex items-center justify-center">Currency: VND</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200">
              <div className="text-sm text-emerald-700">Subscriptions</div>
              <div className="text-2xl font-bold text-emerald-900">{formatVND(summary.subs)}</div>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200">
              <div className="text-sm text-indigo-700">Avg. Order Value</div>
              <div className="text-2xl font-bold text-indigo-900">{formatVND(summary.aov)}</div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 p-4 mb-6">
            <div className="text-gray-700 font-semibold mb-2 flex items-center justify-between">
              <span>Revenue trends</span>
              <span className="text-xs text-gray-500">Subscriptions (VND)</span>
            </div>
            <div className="w-full h-64 bg-gray-50 rounded-xl border border-dashed">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rechartsData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis tickFormatter={(v) => formatShortVND(v as number)} tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <Tooltip formatter={(v: number) => formatVND(v)} labelFormatter={(l) => `Ngày ${l}`} />
                  <Legend />
                  <Bar dataKey="Subscriptions" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  <Line type="monotone" dataKey="SMA7" stroke="#10b981" dot={false} strokeWidth={2} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 p-4 mb-6">
            <div className="text-gray-700 font-semibold mb-3">Revenue breakdown</div>
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="text-left text-gray-600">
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Subscriptions</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedRows.map((r) => (
                    <tr key={r.date} className="border-t">
                      <td className="px-4 py-3 text-gray-700">{r.date}</td>
                      <td className="px-4 py-3 text-gray-800 font-medium">{formatVND(r.subs)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-end items-center gap-2 mt-4">
                <button disabled={page === 1} onClick={() => setPage(page - 1)} className="px-3 py-1 rounded bg-gray-100">Prev</button>
                <span className="text-sm">Page {page} / {totalPages}</span>
                <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="px-3 py-1 rounded bg-gray-100">Next</button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
