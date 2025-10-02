import { useMemo, useState } from "react";

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
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function AdminReports() {
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState("30d");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("open");

  const data = useMemo(
    () =>
      [
        { id: 101, type: "Abuse", user: "alice@mail.com", lab: "Intro to XSS", status: "Open", created: "2025-09-20" },
        { id: 102, type: "Bug", user: "bob@mail.com", lab: "SQL Injection", status: "In Review", created: "2025-09-18" },
        { id: 103, type: "Payment", user: "carol@mail.com", lab: "JWT Basics", status: "Resolved", created: "2025-09-15" },
      ].filter((r) =>
        (type === "all" || r.type.toLowerCase() === type) &&
        (status === "all" || r.status.toLowerCase().replace(" ", "") === status) &&
        (!query || `${r.user} ${r.lab} ${r.type} ${r.status}`.toLowerCase().includes(query.toLowerCase()))
      ),
    [query, type, status]
  );

  return (
    <div className="mt-5 min-h-screen bg-gradient-to-b from-white to-blue-50 pt-8">
      <div className="max-w-6xl mx-auto">
        <div className="rounded-2xl overflow-hidden shadow-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Reports</h1>
            <div className="flex items-center gap-2">
              <button
                className="cursor-pointer px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                onClick={() => exportCsv(`reports_${period}.csv`, data)}
              >
                Export CSV
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
            <select className="rounded-xl border border-gray-300 px-3 py-2" value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="all">All time</option>
            </select>
            <select className="rounded-xl border border-gray-300 px-3 py-2" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="all">Type: All</option>
              <option value="abuse">Abuse</option>
              <option value="bug">Bug</option>
              <option value="payment">Payment</option>
            </select>
            <select className="rounded-xl border border-gray-300 px-3 py-2" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="open">Status: Open</option>
              <option value="inreview">In Review</option>
              <option value="resolved">Resolved</option>
              <option value="all">All</option>
            </select>
            <input
              className="rounded-xl border border-gray-300 px-3 py-2"
              placeholder="Search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
              <div className="text-sm text-blue-700">Open</div>
              <div className="text-2xl font-bold text-blue-900">{data.filter(d => d.status === 'Open').length}</div>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200">
              <div className="text-sm text-amber-700">In Review</div>
              <div className="text-2xl font-bold text-amber-900">{data.filter(d => d.status === 'In Review').length}</div>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200">
              <div className="text-sm text-emerald-700">Resolved</div>
              <div className="text-2xl font-bold text-emerald-900">{data.filter(d => d.status === 'Resolved').length}</div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-200">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Lab</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {data.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-4 py-3 text-gray-700">{r.id}</td>
                    <td className="px-4 py-3 text-gray-800 font-medium">{r.type}</td>
                    <td className="px-4 py-3 text-gray-700">{r.user}</td>
                    <td className="px-4 py-3 text-gray-700">{r.lab}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-lg text-xs ${r.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' : r.status === 'In Review' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{r.created}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
