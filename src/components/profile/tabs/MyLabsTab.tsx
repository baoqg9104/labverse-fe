import { useContext, useEffect, useMemo, useState } from "react";
import EditLabModal from "./EditLabModal";
import type { LabLevel } from "../../../types/lab";

const levelColor: Record<LabLevel, string> = {
  Basic: "bg-green-100 text-green-700",
  Intermediate: "bg-yellow-100 text-yellow-700",
  Advanced: "bg-red-100 text-red-700",
};

function normalizeLevel(level: unknown): LabLevel {
  switch (level) {
    case 2:
      return "Advanced";
    case 1:
      return "Intermediate";
    case 0:
    default:
      return "Basic";
  }
}
import type { Lab } from "../../../types/lab";
import { labsApi } from "../../../libs/labsApi";
import api from "../../../utils/axiosInstance";
import { AuthContext } from "../../../contexts/AuthContext";

export default function MyLabsTab() {
  const { user } = useContext(AuthContext);
  const [editLabId, setEditLabId] = useState<number | null>(null);
  const [authorId, setAuthorId] = useState<number | null>(null);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resolve current user's id (since User type doesn't include id)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<{ id?: number }>("/users/me");
        if (cancelled) return;
        const id = typeof res?.data?.id === "number" ? res.data.id : null;
        setAuthorId(id);
      } catch {
        if (!cancelled) setAuthorId(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Fetch labs (include inactive) then filter by authorId
  const fetchLabs = async () => {
    if (authorId === null) return;
    setLoading(true);
    setError(null);
    try {
      const res = await labsApi.list(true);
      const all = Array.isArray(res.data) ? res.data : [];
      const mine = all.filter((l) => l.authorId === authorId);
      setLabs(mine);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load labs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorId]);

  const summary = useMemo(() => {
    const published = labs.filter((l) => l.isActive).length;
    const drafts = labs.length - published;
    return { published, drafts, total: labs.length };
  }, [labs]);

  const onToggleActive = async (lab: Lab) => {
    try {
      if (lab.isActive) {
        await labsApi.remove(lab.id);
      } else {
        await labsApi.restore(lab.id);
      }
      setLabs((prev) =>
        prev.map((x) =>
          x.id === lab.id ? { ...x, isActive: !lab.isActive } : x
        )
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update lab status");
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-1">
            <span className="text-2xl">🗒️</span>
            My Labs
          </h3>
          <p className="text-gray-600">
            Manage and track your published and draft labs.
          </p>
          {authorId !== null && (
            <p className="text-xs text-gray-500 mt-1">
              Total: {summary.total} • Published: {summary.published} • Draft:{" "}
              {summary.drafts}
            </p>
          )}
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        </div>
        {/* <button className="cursor-pointer px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow">
          Create New Lab
        </button> */}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-white border border-gray-200 animate-pulse"
            >
              <div className="h-5 w-3/4 bg-gray-200 rounded mb-3" />
              <div className="h-4 w-full bg-gray-200 rounded mb-2" />
              <div className="h-4 w-5/6 bg-gray-200 rounded mb-4" />
              <div className="flex items-center justify-between">
                <div className="h-4 w-24 bg-gray-200 rounded" />
                <div className="h-4 w-16 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : labs.length === 0 ? (
        <div className="text-gray-600">No labs yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {labs.map((r) => (
            <div
              key={r.id}
              className="p-5 rounded-2xl bg-white border border-gray-200 hover:shadow transition"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-lg font-semibold text-gray-800">
                    {r.title}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {(() => {
                      const lvl = normalizeLevel(r.difficultyLevel);
                      return (
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${levelColor[lvl]}`}
                        >
                          {lvl}
                        </span>
                      );
                    })()}
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    r.isActive
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {r.isActive ? "Published" : "Draft"}
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center gap-3">
                  <span>⭐ {r.ratingAverage.toFixed(1)}</span>
                  <span>👀 {r.views}</span>
                  <span>📝 {r.ratingCount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="cursor-pointer px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                    onClick={() => setEditLabId(r.id)}
                  >
                    Edit
                  </button>
                  {/* Edit Lab Modal */}
                  <EditLabModal
                    labId={editLabId ?? 0}
                    open={editLabId !== null}
                    onClose={() => setEditLabId(null)}
                    onSaved={fetchLabs}
                  />
                  <button
                    className="cursor-pointer px-3 py-1 rounded-lg bg-red-50 text-red-700 hover:bg-red-100"
                    onClick={() => onToggleActive(r)}
                  >
                    {r.isActive ? "Hide" : "Publish"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
