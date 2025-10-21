import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { labsApi } from "../libs/labsApi";
import type { Lab, LabLevel } from "../types/lab";
import { toast } from "react-toastify";
import { motion } from "framer-motion";

const slugify = (input: string): string =>
  input
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

// map difficulty levels to lab levels
const mapDifficultyToLabLevel = (difficulty: number): LabLevel => {
  if (difficulty === 0) return "Basic";
  if (difficulty === 1) return "Intermediate";
  if (difficulty === 2) return "Advanced";
  return "Basic"; // default fallback
};

export default function EditLab() {
  const { id } = useParams();
  const labId = useMemo(() => {
    const n = Number(id);
    return Number.isFinite(n) ? n : null;
  }, [id]);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lab, setLab] = useState<Lab | null>(null);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState<LabLevel>("Basic");
  const [autoSlug, setAutoSlug] = useState(true);

  useEffect(() => {
    if (autoSlug) setSlug(slugify(title));
  }, [title, autoSlug]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (labId === null) {
        setError("Invalid lab id");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await labsApi.getById(labId);
        if (cancelled) return;
        const data = res.data;
        setLab(data);
        setTitle(data.title ?? "");
        setSlug(data.slug ?? "");
        setDescription(data.description ?? "");
        setLevel(mapDifficultyToLabLevel(data.difficultyLevel));
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to load lab");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [labId]);

  const DIFFICULTY_MAP: Record<LabLevel, 0 | 1 | 2> = {
    Basic: 0,
    Intermediate: 1,
    Advanced: 2,
  };

  const onSave = async () => {
    if (!lab || labId === null) return;
    if (!title.trim() || !slug.trim() || !description.trim()) {
      toast.warn("Please fill in title, slug, and description.");
      return;
    }
    try {
      setSaving(true);
      await labsApi.update(labId, {
        title: title.trim(),
        slug: slug.trim(),
        description: description.trim(),
        mdPath: lab.mdPath,
        mdPublicUrl: lab.mdPublicUrl,
        difficultyLevel: DIFFICULTY_MAP[level],
      });
      toast.success("Lab updated.");
      navigate(-1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update lab");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="max-w-3xl mx-auto p-6">Loading lab...</div>;
  }
  if (error) {
    return <div className="max-w-3xl mx-auto p-6 text-red-600">{error}</div>;
  }
  if (!lab) {
    return <div className="max-w-3xl mx-auto p-6">Lab not found.</div>;
  }

  return (
    <motion.div
      className="max-w-3xl mx-auto p-6 bg-white shadow-md rounded-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <h1 className="text-3xl font-bold mb-6 text-center text-blue-600">
        Edit Lab
      </h1>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            className="mt-1 w-full rounded border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">
              Slug
            </label>
            <input
              className="mt-1 w-full rounded border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              disabled={autoSlug}
            />
          </div>
          <label className="mt-6 inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoSlug}
              onChange={(e) => setAutoSlug(e.target.checked)}
            />
            Auto slug
          </label>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            className="mt-1 w-full rounded border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Difficulty
          </label>
          <select
            className="mt-1 w-full rounded border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={level}
            onChange={(e) => setLevel(e.target.value as LabLevel)}
          >
            <option value="Basic">Basic</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-center gap-4">
        <button
          className="cursor-pointer px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 focus:ring-2 focus:ring-gray-400 focus:outline-none"
          onClick={() => navigate(-1)}
          disabled={saving}
        >
          Cancel
        </button>
        <button
          className={`cursor-pointer px-5 py-2 rounded text-white font-semibold shadow-md focus:ring-2 focus:ring-blue-400 focus:outline-none ${
            saving ? "bg-blue-300" : "bg-blue-600 hover:bg-blue-500"
          }`}
          onClick={onSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </motion.div>
  );
}
