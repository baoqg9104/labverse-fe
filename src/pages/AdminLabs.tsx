import { useMemo, useState } from "react";

interface LabRow {
  id: number;
  title: string;
  author: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  status: "Draft" | "Published";
  views: number;
}

export default function AdminLabs() {
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const rows = useMemo<LabRow[]>(() => {
    const base: LabRow[] = Array.from({ length: 126 }).map((_, i) => ({
      id: 2000 + i,
      title: `Security Lab #${i}`,
      author: i % 3 === 0 ? "alice" : i % 3 === 1 ? "bob" : "carol",
      difficulty: i % 5 === 0 ? "Advanced" : i % 2 === 0 ? "Intermediate" : "Beginner",
      status: i % 4 === 0 ? "Draft" : "Published",
      views: Math.round(150 + Math.random() * 3000),
    }));
    return base;
  }, []);

  const filtered = useMemo(() => rows.filter(r =>
    (!query || `${r.title} ${r.author}`.toLowerCase().includes(query.toLowerCase())) &&
    (difficulty === "all" || r.difficulty.toLowerCase() === difficulty) &&
    (status === "all" || r.status.toLowerCase() === status)
  ), [rows, query, difficulty, status]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="mt-5 min-h-screen bg-gradient-to-b from-white to-blue-50 pt-8">
      <div className="max-w-6xl mx-auto">
        <div className="rounded-2xl overflow-hidden shadow-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Labs</h1>
            <div className="flex items-center gap-2">
              <button className="cursor-pointer px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold">Create Lab</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
            <input className="rounded-xl border border-gray-300 px-3 py-2" placeholder="Search title or author" value={query} onChange={(e)=>{ setQuery(e.target.value); setPage(1); }} />
            <select className="rounded-xl border border-gray-300 px-3 py-2" value={difficulty} onChange={(e)=>{ setDifficulty(e.target.value); setPage(1);} }>
              <option value="all">Difficulty: All</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
            <select className="rounded-xl border border-gray-300 px-3 py-2" value={status} onChange={(e)=>{ setStatus(e.target.value); setPage(1);} }>
              <option value="all">Status: All</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
            <div className="rounded-xl border px-3 py-2 bg-gray-50 text-gray-700 flex items-center">Total: {filtered.length}</div>
            <select className="rounded-xl border border-gray-300 px-3 py-2" value={pageSize} onChange={(e)=> { setPageSize(Number(e.target.value)); setPage(1);} }>
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pageRows.map(r => (
              <div key={r.id} className="p-5 rounded-2xl bg-white border border-gray-200 hover:shadow transition">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-lg font-semibold text-gray-800">{r.title}</div>
                    <div className="text-sm text-gray-500 mt-1">By {r.author} • {r.views} views</div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${r.status === 'Draft' ? 'bg-gray-100 text-gray-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {r.status}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 rounded bg-indigo-100 text-indigo-700 text-xs">{r.difficulty}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="cursor-pointer px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100">Edit</button>
                    <button className="cursor-pointer px-3 py-1 rounded-lg bg-red-50 text-red-700 hover:bg-red-100">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end items-center gap-2 p-3 mt-4">
            <button disabled={page===1} onClick={()=>setPage(1)} className="px-3 py-1 rounded bg-gray-100">First</button>
            <button disabled={page===1} onClick={()=>setPage(page-1)} className="px-3 py-1 rounded bg-gray-100">Prev</button>
            <span className="text-sm">Page {page} / {totalPages}</span>
            <button disabled={page===totalPages} onClick={()=>setPage(page+1)} className="px-3 py-1 rounded bg-gray-100">Next</button>
            <button disabled={page===totalPages} onClick={()=>setPage(totalPages)} className="px-3 py-1 rounded bg-gray-100">Last</button>
          </div>

        </div>
      </div>
    </div>
  );
}
