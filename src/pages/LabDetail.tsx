import { useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/axiosInstance";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css";
import previous from "../assets/previous.png";

type LabDto = {
  id: number;
  title: string;
  slug: string;
  mdPath: string;
  mdPublicUrl: string;
  description: string;
  difficultyLevel: number | string;
  authorId: number;
  categoryId: number;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
};

type TocItem = { id: string; text: string; level: 1 | 2 | 3 };

export default function LabDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [lab, setLab] = useState<LabDto | null>(null);
  const [md, setMd] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // TOC state and refs
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [toc, setToc] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const baseUrl = useMemo(() => {
    if (!lab?.mdPublicUrl) return "";
    // remove index.md or trailing file from mdPublicUrl to get folder base
    try {
      const url = new URL(lab.mdPublicUrl);
      const parts = url.pathname.split("/");
      parts.pop(); // remove file
      url.pathname = parts.join("/") + "/";
      return url.toString();
    } catch {
      // fallback simple replace
      return lab.mdPublicUrl.replace(/index\.md(\?.*)?$/, "");
    }
  }, [lab?.mdPublicUrl]);

  useEffect(() => {
    const load = async () => {
      if (!slug) return;
      setIsLoading(true);
      setError(null);
      try {
        // Fetch lab by slug from backend
        const res = await api.get(`/labs/slug/${encodeURIComponent(slug)}`);
        const dto = res.data as LabDto;
        setLab(dto);
        // Fetch markdown content via public URL
        if (dto.mdPublicUrl) {
          const mdRes = await fetch(dto.mdPublicUrl);
          if (!mdRes.ok) throw new Error("Failed to fetch lab content");
          const text = await mdRes.text();
          setMd(text);
        } else {
          setMd("# Missing content\nThis lab has no mdPublicUrl.");
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Failed to load lab";
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [slug]);

  // Build TOC from rendered headings after markdown updates
  useEffect(() => {
    const root = contentRef.current;
    if (!root) return;

    const headings = Array.from(root.querySelectorAll("h1, h2, h3")) as HTMLHeadingElement[];
    const items: TocItem[] = headings
      .filter((h) => !!h.id && !!h.textContent)
      .map((h) => ({
        id: h.id,
        text: h.textContent!.trim(),
        level: (Number(h.tagName.substring(1)) as 1 | 2 | 3) || 2,
      }));
    setToc(items);

    // Track active heading while scrolling
    const observer = new IntersectionObserver(
      (entries) => {
        // choose the first visible heading near top
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) =>
              (a.target as HTMLElement).getBoundingClientRect().top -
              (b.target as HTMLElement).getBoundingClientRect().top
          );
        if (visible[0]?.target instanceof HTMLElement) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        root: null,
        rootMargin: "0px 0px -70% 0px",
        threshold: 0.1,
      }
    );

    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [md]);

  const onTocClick = (e: MouseEvent, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    const yOffset = -12; // adjust if a fixed header exists
    const y = el.getBoundingClientRect().top + window.scrollY + yOffset;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 md:px-10 lg:px-16 py-6">
        <button
          onClick={() => navigate(-1)}
          className="cursor-pointer inline-flex items-center gap-2 text-xl text-gray-600 hover:text-gray-800"
        >
          <img src={previous} alt="" className="size-6" /> Back
        </button>
      </div>
      <div className="max-w-6xl mx-auto px-4 pb-16">
        {isLoading ? (
          <div className="space-y-4">
            <div className="h-8 w-2/3 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
            <div className="rounded-2xl border bg-white p-6">
              <div className="h-4 w-full bg-gray-200 rounded mb-2 animate-pulse" />
              <div className="h-4 w-5/6 bg-gray-200 rounded mb-2 animate-pulse" />
              <div className="h-4 w-2/3 bg-gray-200 rounded mb-2 animate-pulse" />
            </div>
          </div>
        ) : error ? (
          <div className="text-center text-red-600 py-10">{error}</div>
        ) : (
          <>
            <div className="lg:grid lg:grid-cols-12 lg:gap-8">
              {/* Main content */}
              <div className="lg:col-span-9">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{lab?.title}</h1>
                <p className="text-gray-600 mb-6">{lab?.description}</p>
                <div className="rounded-2xl border bg-white p-6">
                  <div ref={contentRef} className="markdown-body max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkBreaks]}
                      rehypePlugins={[
                        rehypeRaw,
                        rehypeSlug,
                        [rehypeAutolinkHeadings, { behavior: "wrap" }],
                        rehypeHighlight,
                      ]}
                      components={{
                        img({ ...props }) {
                          const raw = (props.src || "").toString();
                          const isAbsolute = /^https?:\/\//i.test(raw);
                          const src = isAbsolute ? raw : (baseUrl || "") + raw.replace(/^\/?/, "");
                          return (
                            <img
                              {...props}
                              src={src}
                              alt={(props.alt as string) || "image"}
                              className="max-w-full rounded"
                            />
                          );
                        },
                      }}
                    >
                      {md}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>

              {/* Table of Contents */}
              <aside className="hidden lg:block lg:col-span-3">
                <div className="sticky top-24">
                  <div className="rounded-xl border bg-white p-4">
                    <div className="text-sm font-semibold text-gray-700 mb-3">Contents</div>
                    {toc.length === 0 ? (
                      <div className="text-xs text-gray-400">No headings found</div>
                    ) : (
                      <nav className="text-sm">
                        <ul className="space-y-1">
                          {toc.map((h) => {
                            const indent = h.level === 1 ? "" : h.level === 2 ? "pl-3" : "pl-6";
                            const isActive = activeId === h.id;
                            return (
                              <li key={h.id} className={indent}>
                                <a
                                  href={`#${h.id}`}
                                  onClick={(e) => onTocClick(e, h.id)}
                                  className={[
                                    "block rounded px-2 py-1 transition-colors",
                                    isActive
                                      ? "bg-indigo-50 text-indigo-700"
                                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
                                  ].join(" ")}
                                  title={h.text}
                                >
                                  {h.text}
                                </a>
                              </li>
                            );
                          })}
                        </ul>
                      </nav>
                    )}
                  </div>
                </div>
              </aside>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
