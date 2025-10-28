import { useEffect, useMemo, useState } from "react";
import Modal from "./Modal";
import api from "../utils/axiosInstance";
import { handleAxiosError } from "../utils/handleAxiosError";
import type { ReportSeverity, ReportType } from "../types/report";
import { toast } from "react-toastify";
import { supabase } from "../libs/supabaseClient";
import { useTranslation } from "react-i18next";

interface Props {
  open: boolean;
  onClose: () => void;
  defaultType?: ReportType;
  currentRoute?: string;
}

export default function ReportIssueModal({
  open,
  onClose,
  defaultType = "Bug",
  // currentRoute,
}: Props) {
  const { t } = useTranslation();
  const [type, setType] = useState<ReportType>(defaultType);
  const [severity, setSeverity] = useState<ReportSeverity>("Medium");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const MAX_FILES = 5;
  const MAX_SIZE_MB = 5;
  const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

  const previews = useMemo(
    () => files.map((f) => ({ file: f, url: URL.createObjectURL(f) })),
    [files]
  );

  useEffect(() => {
    return () => {
      // Cleanup object URLs on unmount
      previews.forEach((p) => URL.revokeObjectURL(p.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Revoke previous URLs when files change
    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [previews]);

  const onFilesSelected = (list: FileList | null) => {
    if (!list?.length) return;
    const incoming = Array.from(list);
    const valid: File[] = [];
    for (const f of incoming) {
      const isImage = f.type.startsWith("image/");
      if (!isImage) {
        toast.error(t("reportIssue.toasts.unsupportedFileType", { file: f.name }));
        continue;
      }
      if (f.size > MAX_SIZE_BYTES) {
        toast.error(t("reportIssue.toasts.fileTooLarge", { file: f.name, size: MAX_SIZE_MB }));
        continue;
      }
      valid.push(f);
    }
    if (valid.length === 0) return;

    setFiles((prev) => {
      const merged = [...prev, ...valid].slice(0, MAX_FILES);
      if (prev.length + valid.length > MAX_FILES) {
        toast.info(t("reportIssue.toasts.maxFilesAdded", { max: MAX_FILES }));
      }
      return merged;
    });
  };

  const removeFileAt = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const onSubmit = async () => {
    if (!title.trim() || !description.trim()) return;
    try {
      setSubmitting(true);

      // 1) upload images to Supabase Storage and collect storage paths
      let imagePaths: string[] = [];
      if (files.length > 0) {
        setUploading(true);
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, "0");
        const baseDir = `reports/${y}/${m}`;
        const bucket = "reports"; // ensure this bucket exists in Supabase

        const genId = () =>
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? (crypto as Crypto).randomUUID()
            : Math.random().toString(36).slice(2);
        const uploaded = await Promise.all(
          files.map(async (file) => {
            const safe = file.name.replace(/[^\w.-]+/g, "_");
            const uid = genId();
            const path = `${baseDir}/${uid}-${safe}`;
            const { error } = await supabase.storage
              .from(bucket)
              .upload(path, file, {
                contentType: file.type,
                upsert: false,
              });
            if (error) throw error;
            return path; // store only storage path
          })
        );
        imagePaths = uploaded;
        setUploading(false);
      }

      // 2) send JSON payload including storage paths
      // Map enums to numeric codes as required by backend (0-based)
      const TYPE_ORDER: ReportType[] = ["Bug", "Abuse", "Payment", "Other"];
      const SEVERITY_ORDER: ReportSeverity[] = ["Low", "Medium", "High"];
      const typeCode = Math.max(0, TYPE_ORDER.indexOf(type));
      const severityCode = Math.max(0, SEVERITY_ORDER.indexOf(severity));
      const payload = {
        type: typeCode,
        severity: severityCode,
        title: title.trim(),
        description: description.trim(),
        // route: currentRoute ?? window.location.pathname,
        // userAgent: navigator.userAgent,
        imagePaths, // array of Supabase storage paths
      };
      await api.post("/reports", payload);
      toast.success(t("reportIssue.toasts.success"));
      setFiles([]);
      onClose();
    } catch (err) {
      handleAxiosError(err, { fallbackMessage: t("reportIssue.toasts.failed") });
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={t("reportIssue.title")}>
      <div className="w-[700px] max-w-[95vw] flex flex-col max-h-[70vh]">
        <div className="space-y-3 overflow-y-auto pr-1">
          <div>
            <label className="block text-sm text-gray-700 mb-1">{t("reportIssue.labels.type")}</label>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
              value={type}
              onChange={(e) => setType(e.target.value as ReportType)}
            >
              <option value="Bug">{t("reportIssue.options.type.Bug")}</option>
              <option value="Abuse">{t("reportIssue.options.type.Abuse")}</option>
              <option value="Payment">{t("reportIssue.options.type.Payment")}</option>
              <option value="Other">{t("reportIssue.options.type.Other")}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">{t("reportIssue.labels.severity")}</label>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
              value={severity}
              onChange={(e) => setSeverity(e.target.value as ReportSeverity)}
            >
              <option value="Low">{t("reportIssue.options.severity.Low")}</option>
              <option value="Medium">{t("reportIssue.options.severity.Medium")}</option>
              <option value="High">{t("reportIssue.options.severity.High")}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">{t("reportIssue.labels.title")}</label>
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("reportIssue.placeholders.title")}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">{t("reportIssue.labels.description")}</label>
            <textarea
              className="w-full rounded-lg border border-gray-300 px-3 py-2 min-h-28"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("reportIssue.placeholders.description")}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm text-gray-700">{t("reportIssue.images.label")}</label>
              <span className="text-xs text-gray-500">{t("reportIssue.images.hint", { max: MAX_FILES, size: MAX_SIZE_MB })}</span>
            </div>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => onFilesSelected(e.target.files)}
              disabled={submitting}
              className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
            />
            {files.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-3 max-h-56 overflow-y-auto pr-1">
                {previews.map((p, idx) => (
                  <div key={idx} className="relative group border rounded-lg overflow-hidden">
                    <img src={p.url} alt={t("reportIssue.imageAlt", { index: idx + 1 })} className="w-full h-28 object-cover" />
                    <button
                      type="button"
                      onClick={() => removeFileAt(idx)}
                      className="absolute top-1 right-1 bg-black/60 text-white text-xs rounded px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition cursor-pointer"
                      aria-label={t("reportIssue.removeImage")}
                    >
                      {t("reportIssue.remove")}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-3 mt-3 border-t sticky bottom-0 bg-white py-3">
          <button
            className="px-4 py-2 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 cursor-pointer"
            onClick={onClose}
            disabled={submitting || uploading}
          >
            {t("reportIssue.buttons.cancel")}
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 cursor-pointer disabled:opacity-70"
            onClick={onSubmit}
            disabled={submitting || uploading || !title.trim() || !description.trim()}
          >
            {submitting || uploading ? t("reportIssue.buttons.submitting") : t("reportIssue.buttons.submit")}
          </button>
        </div>
      </div>
    </Modal>
  );
}
