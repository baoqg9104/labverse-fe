import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css";
import type { LabLevel, LabType } from "../../types/lab";

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

type FolderItem = { file: File; path: string };

export default function CreateLab() {
  const [activeTab, setActiveTab] = useState<"upload" | "editor">("upload");

  // Meta fields
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [autoSlug, setAutoSlug] = useState(true);
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState<LabLevel>("Basic");
  const [category, setCategory] = useState<LabType | "">("");

  // Upload mode state
  const [folderPayload, setFolderPayload] = useState<FolderItem[]>([]);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadMarkdown, setUploadMarkdown] = useState<string>("");
  const urlsRef = useRef<Map<string, string>>(new Map());
  const [isReadingIndex, setIsReadingIndex] = useState(false);

  // Editor mode state
  const [markdown, setMarkdown] = useState<string>(
    () =>
      localStorage.getItem("createLab.markdown") ??
      "# Lab Title\n\nWrite your lab content in Markdown here.\n\n## Section\n- Step 1\n- Step 2\n"
  );
  const [images, setImages] = useState<File[]>([]);

  // restore meta from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("createLab.meta");
    if (saved) {
      try {
        const m = JSON.parse(saved) as {
          title?: string;
          slug?: string;
          autoSlug?: boolean;
          description?: string;
          level?: LabLevel;
          category?: LabType | "";
        };
        if (m.title) setTitle(m.title);
        if (typeof m.autoSlug === "boolean") setAutoSlug(m.autoSlug);
        if (m.slug) setSlug(m.slug);
        if (m.description) setDescription(m.description);
        if (m.level) setLevel(m.level);
        if (m.category !== undefined) setCategory(m.category);
      } catch (e) {
        console.debug("Failed to restore createLab.meta", e);
      }
    }
  }, []);

  // Ensure folder picker is available at render-time (Chromium supports these non-standard attributes)
  const directoryPickerProps = useMemo(
    () =>
      ({
        webkitdirectory: "",
        directory: "",
        mozdirectory: "",
        msdirectory: "",
        odirectory: "",
      } as unknown as Record<string, string>),
    []
  );

  useEffect(() => {
    if (autoSlug) setSlug(slugify(title));
  }, [title, autoSlug]);

  // persist editor fields
  useEffect(() => {
    localStorage.setItem("createLab.markdown", markdown);
  }, [markdown]);
  useEffect(() => {
    const meta = { title, slug, autoSlug, description, level, category };
    localStorage.setItem("createLab.meta", JSON.stringify(meta));
  }, [title, slug, autoSlug, description, level, category]);

  // Attach directory selection attributes safely
  useEffect(() => {
    if (uploadInputRef.current) {
      try {
        uploadInputRef.current.setAttribute("webkitdirectory", "");
        uploadInputRef.current.setAttribute("directory", "");
      } catch (e) {
        console.debug("Directory attributes not supported in this browser.", e);
      }
    }
  }, []);

  const hasRequiredMeta = useMemo(() => {
    return (
      title.trim().length > 0 &&
      slug.trim().length > 0 &&
      description.trim().length > 0 &&
      !!category &&
      !!level
    );
  }, [title, slug, description, category, level]);

  const validateFolder = (paths: string[]) => {
    const errs: string[] = [];
    if (!paths.length) {
      errs.push("Please select a folder containing your lab files.");
    }
    const hasIndex = paths.some((p) => /(^|\/)index\.md$/i.test(p));
    if (!hasIndex) {
      errs.push("Missing index.md at the root of your lab folder.");
    }
    const hasImagesFolder = paths.some((p) => /(^|\/)images\//i.test(p));
    if (!hasImagesFolder) {
      errs.push("Missing images/ directory (place all images under images/).");
    }
    setUploadErrors(errs);
    return errs.length === 0;
  };

  const onSelectFolder = (list: FileList | null) => {
    if (!list) return;
    const files = Array.from(list);
    const items: FolderItem[] = files.map((f) => ({
      file: f,
      path: (
        (f as File & { webkitRelativePath?: string }).webkitRelativePath ||
        f.name
      ).replace(/\\/g, "/"),
    }));
    const stripped = stripCommonRoot(items);
    setFolderPayload(stripped);
    validateFolder(stripped.map((i) => i.path));
  };

  // --- Drag & drop folder support (Chrome/Edge) ---
  type FileSystemEntry = {
    isFile: boolean;
    isDirectory: boolean;
    name: string;
  };
  type FileSystemFileEntry = FileSystemEntry & {
    file: (cb: (file: File) => void, onError?: (err: unknown) => void) => void;
  };
  type FileSystemDirectoryReader = {
    readEntries: (
      cb: (entries: FileSystemEntry[]) => void,
      onError?: (err: unknown) => void
    ) => void;
  };
  type FileSystemDirectoryEntry = FileSystemEntry & {
    createReader: () => FileSystemDirectoryReader;
  };
  type DataTransferItemWithEntry = DataTransferItem & {
    webkitGetAsEntry?: () => FileSystemEntry | null;
  };

  const collectDropped = async (dt: DataTransfer): Promise<FolderItem[]> => {
    const out: FolderItem[] = [];
    const items = dt.items;
    const walk = async (entry: FileSystemEntry, prefix: string) => {
      if (!entry) return;
      if (entry.isFile) {
        await new Promise<void>((resolve, reject) => {
          (entry as FileSystemFileEntry).file((file: File) => {
            const path = prefix ? `${prefix}/${file.name}` : file.name;
            out.push({ file, path });
            resolve();
          }, reject);
        });
      } else if (entry.isDirectory) {
        const reader = (entry as FileSystemDirectoryEntry).createReader();
        await new Promise<void>((resolve, reject) => {
          const readAll = () => {
            reader.readEntries(async (entries: FileSystemEntry[]) => {
              if (!entries.length) return resolve();
              const nextPrefix = prefix
                ? `${prefix}/${entry.name}`
                : entry.name;
              for (const e of entries) {
                await walk(e, nextPrefix);
              }
              readAll();
            }, reject);
          };
          readAll();
        });
      }
    };

    if (items && items.length) {
      for (let i = 0; i < items.length; i++) {
        const it = items[i] as DataTransferItemWithEntry;
        const entry = it.webkitGetAsEntry ? it.webkitGetAsEntry() : null;
        if (entry) {
          await walk(entry, "");
        } else if (it.kind === "file") {
          const f = it.getAsFile();
          if (f) out.push({ file: f, path: f.name });
        }
      }
    } else if (dt.files && dt.files.length) {
      Array.from(dt.files).forEach((f) => out.push({ file: f, path: f.name }));
    }
    return out;
  };

  const onDropFolder = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const dt = e.dataTransfer;
    const items = await collectDropped(dt);
    const norm = items.map((it) => ({
      ...it,
      path: it.path.replace(/\\/g, "/"),
    }));
    const stripped = stripCommonRoot(norm);
    setFolderPayload(stripped);
    validateFolder(stripped.map((i) => i.path));
  };
  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  // Remove common top-level directory name (e.g., folder_name/) so our paths are rooted at project root
  function stripCommonRoot(items: FolderItem[]): FolderItem[] {
    if (items.length === 0) return items;
    const parts = items.map((it) => it.path.split("/"));
    const firstSeg = parts[0][0];
    if (!firstSeg) return items;
    const allPrefixed = parts.every(
      (arr) => arr.length > 1 && arr[0] === firstSeg
    );
    if (!allPrefixed) return items;
    return items.map((it) => ({
      ...it,
      path: it.path.slice(firstSeg.length + 1),
    }));
  }

  const onAddImages = (list: FileList | null) => {
    if (!list) return;
    const newFiles = Array.from(list).filter((f) =>
      f.type.startsWith("image/")
    );
    setImages((prev) => [...prev, ...newFiles]);
  };

  const onRemoveImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const onSubmit = async () => {
    if (!hasRequiredMeta) return;

    const form = new FormData();
    form.append("title", title.trim());
    form.append("slug", slug.trim());
    form.append("description", description.trim());
    form.append("level", level);
    form.append("category", category);
    form.append("mode", folderPayload.length ? "upload" : "editor");

    if (folderPayload.length) {
      const paths = folderPayload.map((i) => i.path);
      if (!validateFolder(paths)) return;
      for (const { file, path } of folderPayload) {
        form.append("files", file, path);
      }
    } else {
      const contentBlob = new Blob([markdown], { type: "text/markdown" });
      form.append(
        "files",
        new File([contentBlob], "index.md", { type: "text/markdown" }),
        "index.md"
      );
      for (const img of images) {
        form.append("files", img, `images/${img.name}`);
      }
    }

    alert("Lab created (local mock). Wire up the API to persist this lab.");
  };

  // Build preview from uploaded folder: read index.md and create object URLs for images/*
  useEffect(() => {
    for (const url of urlsRef.current.values()) {
      URL.revokeObjectURL(url);
    }
    urlsRef.current.clear();
    setUploadMarkdown("");
    if (!folderPayload.length) return;

    const run = async () => {
      setIsReadingIndex(true);
      try {
        const idx = folderPayload.find(
          (it) => it.path.toLowerCase() === "index.md"
        );
        if (idx) {
          const text = await idx.file.text();
          setUploadMarkdown(text);
        }
        folderPayload
          .filter((it) => it.path.toLowerCase().startsWith("images/"))
          .forEach((it) => {
            const url = URL.createObjectURL(it.file);
            urlsRef.current.set(it.path, url);
          });
      } finally {
        setIsReadingIndex(false);
      }
    };
    run();
  }, [folderPayload]);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Meta fields */}
      <div className="p-6 rounded-2xl bg-white border border-gray-200 mb-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>🗒️</span>New Lab Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Enter lab title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slug
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  className="cursor-pointer"
                  checked={autoSlug}
                  onChange={(e) => setAutoSlug(e.target.checked)}
                />
                Auto-generate from Title
              </label>
            </div>
            <input
              className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-50"
              placeholder="lab-title"
              value={slug}
              disabled={autoSlug}
              onChange={(e) => setSlug(slugify(e.target.value))}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
              rows={4}
              placeholder="Short description of the lab"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="block text sm font-medium text-gray-700 mb-1">
              Difficulty
            </label>
            <select
              className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={level}
              onChange={(e) => setLevel(e.target.value as LabLevel)}
            >
              <option value="Basic">Basic</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
          <div>
            <label className="block text sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={category}
              onChange={(e) => setCategory(e.target.value as LabType)}
            >
              <option value="">Select a category</option>
              <option value="Rooms">Rooms</option>
              <option value="Networks">Networks</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4">
        <div className="inline-flex rounded-xl bg-gray-100 p-1">
          <button
            className={`cursor-pointer px-4 py-2 rounded-lg text-sm font-semibold ${
              activeTab === "upload"
                ? "bg-white shadow text-gray-900"
                : "text-gray-600 hover:text-gray-800"
            }`}
            onClick={() => setActiveTab("upload")}
          >
            Upload Folder
          </button>
          <button
            className={`cursor-pointer px-4 py-2 rounded-lg text-sm font-semibold ${
              activeTab === "editor"
                ? "bg-white shadow text-gray-900"
                : "text-gray-600 hover:text-gray-800"
            }`}
            onClick={() => setActiveTab("editor")}
          >
            Use Editor
          </button>
        </div>
      </div>

      {activeTab === "upload" && (
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Upload Folder
          </h3>
          <p className="text-gray-600 mb-4">
            Import an existing lab by selecting a folder that contains{" "}
            <code>index.md</code> and an <code>images/</code> directory.
          </p>
          <div className="p-6 rounded-2xl bg-white border border-gray-200">
            <div className="mb-4 rounded-xl border bg-gradient-to-br from-gray-50 to-white p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  📁
                </div>
                <h4 className="text-base font-semibold text-gray-800">
                  Required folder structure
                </h4>
              </div>
              <ul className="text-sm text-gray-700 space-y-1">
                <li className="flex items-center gap-2">
                  <span className="text-gray-500">📂</span>
                  <span className="font-medium">lab_folder/</span>
                </li>
                <li className="ml-6 flex items-center gap-2">
                  <span className="text-gray-500">📝</span>
                  <code>index.md</code>{" "}
                  <span className="text-gray-500">— Markdown content</span>
                </li>
                <li className="ml-6 flex items-center gap-2">
                  <span className="text-gray-500">📂</span>
                  <span className="font-medium">images/</span>{" "}
                  <span className="text-gray-500">— All images</span>
                </li>
                <li className="ml-10 flex items-center gap-2">
                  <span className="text-gray-500">🖼️</span>
                  <code>image-1.png</code>
                </li>
                <li className="ml-10 flex items-center gap-2">
                  <span className="text-gray-500">🖼️</span>
                  <code>image-2.png</code>
                </li>
              </ul>
              <p className="text-gray-600 mt-3 text-sm">
                Use relative paths inside Markdown, e.g.{" "}
                <code>![alt](images/image-1.png)</code>.
              </p>
            </div>

            <div
              className={`rounded-2xl p-6 transition-colors duration-150 ${
                isDragging
                  ? "bg-blue-50 border-2 border-blue-400"
                  : "bg-gray-50 border-2 border-dashed border-gray-300"
              }`}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDropFolder}
            >
              <input
                ref={uploadInputRef}
                type="file"
                multiple
                {...directoryPickerProps}
                onChange={(e) => onSelectFolder(e.target.files)}
                className="hidden"
              />
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${
                      isDragging
                        ? "bg-blue-100 text-blue-700"
                        : "bg-white text-gray-700 border"
                    }`}
                  >
                    📁
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">
                      Drop your lab folder
                    </div>
                    <div className="text-sm text-gray-600">
                      Or click to pick a folder. We’ll import index.md and
                      images/
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="cursor-pointer px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold"
                    onClick={() => uploadInputRef.current?.click()}
                  >
                    Choose Folder
                  </button>
                </div>
              </div>

              {folderPayload.length > 0 && (
                <div className="mt-4 text-sm text-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">
                      Selected files ({folderPayload.length})
                    </div>
                    <button
                      className="cursor-pointer text-xs text-red-600"
                      onClick={() => {
                        setFolderPayload([]);
                        setUploadErrors([]);
                      }}
                    >
                      Clear
                    </button>
                  </div>
                  <div className="mt-2 max-h-64 overflow-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-500">
                          <th className="py-1 pr-3">File</th>
                          <th className="py-1 pr-3">Type</th>
                          <th className="py-1 pr-3">Size</th>
                        </tr>
                      </thead>
                      <tbody>
                        {folderPayload.slice(0, 150).map((it, i) => {
                          const isImg = /\.(png|jpe?g|gif|webp|svg)$/i.test(
                            it.path
                          );
                          const url = isImg
                            ? urlsRef.current.get(it.path)
                            : undefined;
                          return (
                            <tr key={i} className="border-t align-middle">
                              <td className="py-1 pr-3">
                                <div className="flex items-center gap-2">
                                  {isImg && url ? (
                                    <img
                                      src={url}
                                      alt="img"
                                      className="w-8 h-8 object-cover rounded"
                                    />
                                  ) : (
                                    <span className="text-gray-500">
                                      {it.path.endsWith(".md") ? "📝" : "📄"}
                                    </span>
                                  )}
                                  <span
                                    className="truncate max-w-[380px]"
                                    title={it.path}
                                  >
                                    {it.path}
                                  </span>
                                </div>
                              </td>
                              <td className="py-1 pr-3 text-gray-600">
                                {isImg
                                  ? "Image"
                                  : it.path.endsWith(".md")
                                  ? "Markdown"
                                  : "File"}
                              </td>
                              <td className="py-1 pr-3 text-gray-600">
                                {(it.file.size / 1024).toFixed(1)} KB
                              </td>
                            </tr>
                          );
                        })}
                        {folderPayload.length > 150 && (
                          <tr>
                            <td className="py-1 pr-3 text-gray-600" colSpan={3}>
                              ...and more
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {uploadErrors.length > 0 && (
                <div className="mt-3 text-sm text-red-600">
                  {uploadErrors.map((e, i) => (
                    <div key={i}>• {e}</div>
                  ))}
                </div>
              )}

              {/* Markdown preview for uploaded folder */}
              <div className="mt-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold text-gray-800">
                    Markdown Preview (index.md)
                  </div>
                  <button
                    className="cursor-pointer text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200"
                    onClick={async () => {
                      const idx = folderPayload.find(
                        (it) => it.path.toLowerCase() === "index.md"
                      );
                      if (idx) {
                        setIsReadingIndex(true);
                        try {
                          const text = await idx.file.text();
                          setUploadMarkdown(text);
                        } finally {
                          setIsReadingIndex(false);
                        }
                      }
                    }}
                  >
                    Reload
                  </button>
                </div>
                <div className="rounded-xl border bg-white p-3 min-h-[160px]">
                  {isReadingIndex ? (
                    <div className="text-sm text-gray-500">
                      Reading index.md…
                    </div>
                  ) : uploadMarkdown ? (
                    <div className="markdown-body max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkBreaks]}
                        rehypePlugins={[
                          rehypeRaw,
                          rehypeSlug,
                          [rehypeAutolinkHeadings, { behavior: "wrap" }],
                          rehypeHighlight,
                        ]}
                        components={{
                          code({
                            inline,
                            className,
                            children,
                          }: {
                            inline?: boolean;
                            className?: string;
                            children?: ReactNode;
                          }) {
                            const cls = className || "";
                            const match = /language-(\w+)/.exec(cls);
                            return !inline ? (
                              <pre className={cls}>
                                <code
                                  className={
                                    match ? `hljs language-${match[1]}` : "hljs"
                                  }
                                >
                                  {children}
                                </code>
                              </pre>
                            ) : (
                              <code
                                className={
                                  match ? `hljs language-${match[1]}` : "hljs"
                                }
                              >
                                {children}
                              </code>
                            );
                          },
                          img({ ...props }) {
                            const raw = (props.src || "").toString();
                            const normalized = raw
                              .replace(/^\.\{1,2\}\//, "")
                              .replace(/^\//, "");
                            let url = urlsRef.current.get(normalized);
                            if (!url && normalized.includes("/")) {
                              const withoutFirst = normalized.substring(
                                normalized.indexOf("/") + 1
                              );
                              url = urlsRef.current.get(withoutFirst);
                            }
                            if (!url) url = urlsRef.current.get(raw);
                            if (url) {
                              return (
                                <img
                                  src={url}
                                  alt={(props.alt as string) || ""}
                                  className="max-w-full rounded"
                                />
                              );
                            }
                            return (
                              <img {...props} className="max-w-full rounded" />
                            );
                          },
                        }}
                      >
                        {uploadMarkdown}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">
                      No index.md found at folder root.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "editor" && (
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Use Editor
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <textarea
              className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[320px]"
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
            />
            <div className="rounded-xl border bg-gray-50 p-3 overflow-auto min-h-[320px]">
              <div className="text-xs text-gray-500 mb-2">Preview</div>
              <div className="markdown-body max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkBreaks]}
                  rehypePlugins={[
                    rehypeRaw,
                    rehypeSlug,
                    [rehypeAutolinkHeadings, { behavior: "wrap" }],
                    rehypeHighlight,
                  ]}
                  components={{
                    code({
                      inline,
                      className,
                      children,
                    }: {
                      inline?: boolean;
                      className?: string;
                      children?: ReactNode;
                    }) {
                      const cls = className || "";
                      const match = /language-(\w+)/.exec(cls);
                      return !inline ? (
                        <pre className={cls}>
                          <code className="">{children}</code>
                        </pre>
                      ) : (
                        <code
                          className={
                            match ? `hljs language-${match[1]}` : "hljs"
                          }
                        >
                          {children}
                        </code>
                      );
                    },
                    img({ ...props }) {
                      const srcRaw = (props.src || "").toString();
                      const normalized = srcRaw
                        .replace(/^\.\{1,2\}\//, "")
                        .replace(/^\//, "");
                      const nameOnly = normalized.startsWith("images/")
                        ? normalized.slice(7)
                        : normalized;
                      const local = images.find(
                        (f) =>
                          `images/${f.name}` === normalized ||
                          f.name === nameOnly
                      );
                      if (local) {
                        const url = URL.createObjectURL(local);
                        return (
                          <img
                            src={url}
                            alt={props.alt as string}
                            onLoad={() => URL.revokeObjectURL(url)}
                            className="max-w-full rounded"
                          />
                        );
                      }
                      return <img {...props} className="max-w-full rounded" />;
                    },
                  }}
                >
                  {markdown}
                </ReactMarkdown>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <div className="font-medium text-gray-800">Images</div>
              <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100">
                Add Images
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => onAddImages(e.target.files)}
                />
              </label>
            </div>
            {images.length > 0 ? (
              <ul className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-700">
                {images.map((img, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between rounded-lg border px-3 py-2"
                  >
                    <span className="truncate mr-2">{img.name}</span>
                    <button
                      className="cursor-pointer text-red-600 text-xs"
                      onClick={() => onRemoveImage(i)}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-600 mt-2">
                No images added yet. You can reference them as{" "}
                <code>images/your-file.png</code> in Markdown.
              </p>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-end gap-3 mt-6">
        <button
          className="cursor-pointer px-5 py-2 rounded-xl bg-gray-100 text-gray-800 hover:bg-gray-200"
          onClick={() => {
            setTitle("");
            setSlug("");
            setAutoSlug(true);
            setDescription("");
            setLevel("Basic");
            setCategory("");
            setFolderPayload([]);
            setUploadErrors([]);
            setMarkdown(
              "# Lab Title\n\nWrite your lab content in Markdown here.\n"
            );
            setImages([]);
            setIsDragging(false);
            localStorage.removeItem("createLab.markdown");
            localStorage.removeItem("createLab.meta");
          }}
        >
          Reset
        </button>
        <button
          disabled={
            !hasRequiredMeta ||
            (folderPayload.length > 0 && uploadErrors.length > 0)
          }
          className={`cursor-pointer px-5 py-2 rounded-xl text-white font-semibold ${
            !hasRequiredMeta ||
            (folderPayload.length > 0 && uploadErrors.length > 0)
              ? "bg-blue-300"
              : "bg-blue-600 hover:bg-blue-500"
          }`}
          onClick={onSubmit}
        >
          Create Lab
        </button>
      </div>
    </div>
  );
}
