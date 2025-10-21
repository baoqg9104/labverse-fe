import { useEffect, useState } from "react";
import type { Lab, LabLevel } from "../../../types/lab";
import { labsApi } from "../../../libs/labsApi";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";

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

interface EditLabModalProps {
  labId: number;
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

// map difficulty levels to lab levels
const mapDifficultyToLabLevel = (difficulty: number): LabLevel => {
  if (difficulty === 0) return "Basic";
  if (difficulty === 1) return "Intermediate";
  if (difficulty === 2) return "Advanced";
  return "Basic"; // default fallback
};

export default function EditLabModal({
  labId,
  open,
  onClose,
  onSaved,
}: EditLabModalProps) {
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
    if (!open) return;
    let cancelled = false;
    (async () => {
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
  }, [labId, open]);

  const DIFFICULTY_MAP: Record<LabLevel, 0 | 1 | 2> = {
    Basic: 0,
    Intermediate: 1,
    Advanced: 2,
  };

  const onSave = async () => {
    if (!lab) return;
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
      if (onSaved) onSaved();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update lab");
    } finally {
      setSaving(false);
    }
  };

  // handle Escape key to close modal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          aria-modal="true"
          role="dialog"
        >
          {/* Backdrop: slightly lighter to avoid being too dark */}
          <motion.div
            className="absolute inset-0 bg-black/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg relative border border-blue-100 z-10"
            initial={{ scale: 0.95, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-blue-600 text-2xl transition-colors"
              onClick={onClose}
              disabled={saving}
              aria-label="Close"
            >
              ×
            </button>
            <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">
              Edit Lab
            </h2>
            {loading ? (
              <div className="text-center py-8 text-gray-500">
                Loading lab...
              </div>
            ) : error ? (
              <div className="text-red-600 text-center py-8">{error}</div>
            ) : !lab ? (
              <div className="text-center py-8">Lab not found.</div>
            ) : (
              <form
                className="space-y-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  onSave();
                }}
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Title
                  </label>
                  <input
                    className="mt-1 w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow shadow-sm"
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
                      className="mt-1 w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow shadow-sm"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      disabled={autoSlug}
                    />
                  </div>
                  <label className="mt-6 inline-flex items-center gap-2 text-sm select-none">
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
                    className="mt-1 w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow shadow-sm"
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
                    className="mt-1 w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow shadow-sm"
                    value={level}
                    onChange={(e) => setLevel(e.target.value as LabLevel)}
                  >
                    <option value="Basic">Basic</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
                <div className="mt-8 flex items-center justify-center gap-4">
                  <button
                    type="button"
                    className="cursor-pointer px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 focus:ring-2 focus:ring-gray-400 focus:outline-none transition-colors"
                    onClick={onClose}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`cursor-pointer px-5 py-2 rounded-lg text-white font-semibold shadow-md focus:ring-2 focus:ring-blue-400 focus:outline-none transition-colors ${
                      saving ? "bg-blue-300" : "bg-blue-600 hover:bg-blue-500"
                    }`}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
