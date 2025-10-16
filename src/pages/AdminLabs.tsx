import { useEffect, useMemo, useState } from "react";
import api from "../utils/axiosInstance";
import { handleAxiosError } from "../utils/handleAxiosError";
import type { Lab, LabLevel } from "../types/lab";
// Removed edit modal and create features per request

function difficultyLabel(level: LabLevel): "Beginner" | "Intermediate" | "Advanced" {
  return level === "Basic" ? "Beginner" : level;
}

function normalizeLabLevel(v: unknown): LabLevel {
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (!s) return "Basic";
    if (s.startsWith("adv")) return "Advanced";
    if (s.startsWith("inter")) return "Intermediate";
    if (s === "advanced" || s === "intermediate" || s === "basic") {
      return (s.charAt(0).toUpperCase() + s.slice(1)) as LabLevel;
    }
    return "Basic";
  }
  if (typeof v === "number") {
    if (v === 2) return "Advanced";
    if (v === 1) return "Intermediate";
    return "Basic";
  }
  return "Basic";
}

function slugify(input: string): string {
  return input
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function toNumber(val: unknown, fallback = 0): number {
  if (typeof val === "number" && Number.isFinite(val)) return val;
  if (typeof val === "string") {
    const n = Number(val);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function toBoolean(val: unknown, fallback = true): boolean {
  if (typeof val === "boolean") return val;
  if (typeof val === "number") return val !== 0;
  if (typeof val === "string") {
    const s = val.toLowerCase();
    return ["true", "1", "active", "yes"].includes(s);
  }
  return fallback;
}

function mapRawLabToLab(item: unknown, idx: number): Lab {
  const x = (item ?? {}) as Record<string, unknown>;
  const title = (x["title"] ?? x["Title"] ?? x["Name"] ?? "Untitled") as string;
  const id = toNumber(x["id"], toNumber(x["Id"], idx + 1));
  const slugVal = (x["slug"] ?? x["Slug"]) as string | undefined;
  const desc = (x["desc"] ?? x["description"] ?? x["Description"] ?? "") as string;
  const levelRaw = x["level"] ?? x["difficultyLevel"] ?? x["DifficultyLevel"] ?? 0;
  const mdPath = (x["mdPath"] ?? x["MdPath"] ?? x["markdownPath"] ?? x["MarkdownPath"] ?? "") as string;
  const mdPublicUrl = (x["mdPublicUrl"] ?? x["MdPublicUrl"] ?? x["mdPublicURL"] ?? "") as string;
  const authorId = toNumber(x["authorId"], toNumber(x["AuthorId"], 0));
  const isActive = toBoolean(x["isActive"] ?? x["IsActive"], true);

  return {
    id,
    title,
    slug: slugVal && slugVal.length ? slugVal : slugify(title),
    mdPath,
    mdPublicUrl,
    desc,
    level: normalizeLabLevel(levelRaw),
    authorId,
    isActive,
  };
}

export default function AdminLabs() {
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(false);
  const [authorNames, setAuthorNames] = useState<Record<number, string>>({});

  // Level badge color classes by level
  const levelBadgeClass = (level: LabLevel) => {
    switch (level) {
      case "Advanced":
        return "bg-rose-100 text-rose-700";
      case "Intermediate":
        return "bg-amber-100 text-amber-700";
      case "Basic":
      default:
        return "bg-green-100 text-green-700";
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get<unknown>("/labs", { params: { includeInactive: true }});
        if (!mounted) return;
        const rawArr = Array.isArray(res.data) ? (res.data as unknown[]) : [];
        setLabs(rawArr.map((it, i) => mapRawLabToLab(it, i)));
      } catch (err) {
        handleAxiosError(err, { fallbackMessage: "Failed to load labs" });
        if (mounted) setLabs([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Fetch author names for display
  useEffect(() => {
    const ids = Array.from(new Set(labs.map(l => l.authorId).filter((n): n is number => typeof n === 'number' && n > 0)));
    const missing = ids.filter(id => authorNames[id] === undefined);
    if (missing.length === 0) return;
    let cancelled = false;
    (async () => {
      try {
        const pairs = await Promise.all(missing.map(async (id) => {
          try {
            const res = await api.get(`/users/${id}`);
            const u = res.data as { username?: string; fullName?: string; name?: string; email?: string };
            const name: string = u?.username || u?.fullName || u?.name || u?.email || `User #${id}`;
            return [id, name] as const;
          } catch {
            return [id, `User #${id}`] as const;
          }
        }));
        if (cancelled) return;
        setAuthorNames(prev => {
          const next = { ...prev };
          for (const [id, name] of pairs) next[id] = name;
          return next;
        });
      } catch {
        // ignore
      }
    })();
    return () => { cancelled = true; };
  }, [labs, authorNames]);

  const filtered = useMemo(() => labs.filter(r =>
    (!query || `${r.title}`.toLowerCase().includes(query.toLowerCase())) &&
    (difficulty === "all" || difficultyLabel(r.level).toLowerCase() === difficulty) &&
    (status === "all" || (r.isActive ? "published" : "hidden") === status)
  ), [labs, query, difficulty, status]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  const onToggleActive = async (lab: Lab) => {
    try {
      const id = lab.id;
      if (lab.isActive) {
        // Hide: DELETE /labs/{id}
        await api.delete(`/labs/${id}`);
      } else {
        // Publish: POST /labs/{id}/restore
        await api.post(`/labs/${id}/restore`);
      }
      setLabs(prev => prev.map(x => x.id === id ? { ...x, isActive: !lab.isActive } : x));
    } catch (err) {
      handleAxiosError(err, { fallbackMessage: "Failed to update lab status" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50 pt-8">
      <div className="max-w-6xl mx-auto">
        <div className="rounded-2xl overflow-hidden shadow-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Labs</h1>
          </div>

          {loading ? (
            <div className="p-6 text-gray-600">Loading labs…</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
                <input className="rounded-xl border border-gray-300 px-3 py-2" placeholder="Search title" value={query} onChange={(e)=>{ setQuery(e.target.value); setPage(1); }} />
                <select className="rounded-xl border border-gray-300 px-3 py-2" value={difficulty} onChange={(e)=>{ setDifficulty(e.target.value); setPage(1);} }>
                  <option value="all">Difficulty: All</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
                <select className="rounded-xl border border-gray-300 px-3 py-2" value={status} onChange={(e)=>{ setStatus(e.target.value); setPage(1);} }>
                  <option value="all">Status: All</option>
                  <option value="published">Published</option>
                  <option value="hidden">Hidden</option>
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
                        <div className="text-sm text-gray-500 mt-1">By {authorNames[r.authorId] ?? `User #${r.authorId}`}</div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${r.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>
                        {r.isActive ? 'Published' : 'Hidden'}
                      </span>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded text-xs ${levelBadgeClass(r.level)}`}>{difficultyLabel(r.level)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="cursor-pointer px-3 py-1 rounded-lg bg-red-50 text-red-700 hover:bg-red-100" onClick={() => onToggleActive(r)}>
                          {r.isActive ? 'Hide' : 'Publish'}
                        </button>
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
            </>
          )}

        </div>
      </div>
    </div>
  );
}
