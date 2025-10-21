import { useEffect, useMemo, useRef, useState, useContext } from "react";
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
import { toast } from "react-toastify";
import { AuthContext } from "../contexts/AuthContext";
import { ROLE } from "../components/profile/RoleUtils";
import { FiCheckCircle, FiClock, FiClipboard } from "react-icons/fi";
import { QuestionContainer } from "../components/quiz/QuestionContainer";
import type { Question as UiQuestion, QuestionType } from "../types/quiz";
import AdvancedComponent from "../components/comments/AdvancedComponent";

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
  views?: number;
  ratingAverage?: number;
  ratingCount?: number;
};

type TocItem = { id: string; text: string; level: 1 | 2 | 3 };

type QuestionDto = {
  id: number;
  labId: number;
  questionText: string;
  type: 0 | 1 | 2 | 3; // 0: SingleChoice, 1: MultipleChoice, 2: TrueFalse, 3: ShortText
  choicesJson: string;
};

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

  const [questions, setQuestions] = useState<QuestionDto[]>([]);

  const { user } = useContext(AuthContext);

  // UserProgress tracking
  const [progressStatus, setProgressStatus] = useState<0 | 1 | 2>(0); // 0: NotStarted, 1: InProgress, 2: Completed

  const baseUrl = useMemo(() => {
    if (!lab?.mdPublicUrl) return "";
    try {
      const url = new URL(lab.mdPublicUrl);
      const parts = url.pathname.split("/");
      parts.pop(); // remove file
      url.pathname = parts.join("/") + "/";
      return url.toString();
    } catch {
      return lab.mdPublicUrl.replace(/index\.md(\?.*)?$/, "");
    }
  }, [lab?.mdPublicUrl]);

  // Scroll to top on initial load and when slug changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [slug]);

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

        const questionsRes = await api.get(`/labs/${dto.id}/questions`);
        setQuestions(questionsRes.data as QuestionDto[]);

        // Fetch current progress status
        try {
          const statusRes = await api.get(`/user-progresses/status/${dto.id}`);
          setProgressStatus(statusRes.data); // 0, 1, or 2
        } catch {
          toast.error("Failed to fetch user progress status.");
          setProgressStatus(0); // NotStarted
        }

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
    // Try to build TOC from DOM headings first (best when rehype-slug added ids)
    const root = contentRef.current;

    const buildFromDom = (): TocItem[] => {
      if (!root) return [];
      const headings = Array.from(
        root.querySelectorAll("h1, h2, h3")
      ) as HTMLHeadingElement[];
      return headings
        .filter((h) => !!h.id && !!h.textContent)
        .map((h) => ({
          id: h.id,
          text: h.textContent!.trim(),
          level: (Number(h.tagName.substring(1)) as 1 | 2 | 3) || 2,
        }));
    };

    const slugify = (s: string) =>
      s
        .toLowerCase()
        .trim()
        // replace spaces and slashes with '-'
        .replace(/[\s/]+/g, "-")
        // remove invalid chars
        .replace(/[^a-z0-9-]/g, "")
        // collapse multiple dashes
        .replace(/-+/g, "-")
        // trim dashes
        .replace(/^-+|-+$/g, "");

    const extractFromMarkdown = (text: string): TocItem[] => {
      const items: TocItem[] = [];
      if (!text) return items;
      const regex = /^\s*(#{1,3})\s+(.*)$/gm;
      let match: RegExpExecArray | null;
      const seen = new Map<string, number>();
      while ((match = regex.exec(text)) !== null) {
        const level = match[1].length as 1 | 2 | 3;
        const raw = match[2].trim();
        let id = slugify(raw);
        // ensure unique ids
        const count = seen.get(id) ?? 0;
        if (count > 0) id = `${id}-${count}`;
        seen.set(slugify(raw), count + 1);
        items.push({ id, text: raw, level });
      }
      return items;
    };

    // prefer DOM; if not available, parse markdown as fallback
    let items = buildFromDom();
    if (items.length === 0 && md) {
      items = extractFromMarkdown(md);
    }

    setToc(items);

    // Track active heading while scrolling if DOM elements exist; otherwise skip
    const headings = root
      ? (Array.from(
          root.querySelectorAll("h1, h2, h3")
        ) as HTMLHeadingElement[])
      : [];
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
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
    const yOffset = -12;
    const scrollToElement = (el: HTMLElement) => {
      const y = el.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
      // update active id if available
      if (el.id) setActiveId(el.id);
    };

    // try direct id match first
    const elById = document.getElementById(id);
    if (elById) {
      scrollToElement(elById);
      return;
    }

    // fallback: try to match heading text (use toc text) to find nearest DOM heading
    const tocItem = toc.find((t) => t.id === id);
    const normalize = (s: string) =>
      s.replace(/\s+/g, " ").trim().toLowerCase();
    const headings = Array.from(
      document.querySelectorAll("h1, h2, h3")
    ) as HTMLElement[];
    if (tocItem) {
      const want = normalize(tocItem.text);
      // exact text match first
      const exact = headings.find(
        (h) => normalize(h.textContent || "") === want
      );
      if (exact) {
        scrollToElement(exact);
        return;
      }
      // then includes
      const incl = headings.find((h) =>
        normalize(h.textContent || "").includes(want)
      );
      if (incl) {
        scrollToElement(incl);
        return;
      }
    }

    // last resort: try partial id matches (some slug generators change chars)
    const partial = headings.find((h) =>
      (h.id || "").toLowerCase().includes(id.toLowerCase())
    );
    if (partial) {
      scrollToElement(partial);
    }
  };

  // Start lab progress previously triggered on first interaction.
  // New flow can start it from QuestionContainer in the future if needed.

  // handleAnswerChange removed; now handled by QuestionContainer

  // Submit a single answer and provide feedback
  const submitSingleAnswer = async (
    q: QuestionDto,
    answer: string | string[] | boolean
  ) => {
    if (!lab?.id) return { isCorrect: false, awardedXp: 0 };
    try {
      const payload = { answerJson: JSON.stringify(answer) };
      const res = await api.post(
        `/labs/${lab.id}/questions/${q.id}/answers`,
        payload
      );
      const data = res.data as {
        isCorrect: boolean;
        awardedXp: number;
        labCompleted: boolean;
        totalUserXp?: number;
        newLevel?: number;
      };
      if (data.labCompleted) setProgressStatus(2);
      return { isCorrect: data.isCorrect, awardedXp: data.awardedXp };
    } catch (e) {
      console.error(e);
      toast.error("Failed to submit answer. Please try again.");
      return { isCorrect: false, awardedXp: 0 };
    }
  };

  const parseChoices = (choicesJson: string): string[] => {
    try {
      return JSON.parse(choicesJson);
    } catch {
      return [];
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Button */}
      <div className="px-4 md:px-10 lg:px-16 py-6">
        <button
          onClick={() => navigate(-1)}
          className="cursor-pointer inline-flex items-center gap-2 text-xl text-gray-600 hover:text-gray-800 transition-colors"
        >
          <img src={previous} alt="" className="size-6" /> Back
        </button>
      </div>
      <div className="max-w-7xl mx-auto pb-16">
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
            {/* Page Title and Description with Status Badge */}
            <div className="mb-6">
              <div className="flex flex-wrap items-center gap-3 mb-2 justify-between">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                    {lab?.title}
                  </h1>
                  <LabStatusChip status={progressStatus} />
                </div>
                {lab && (
                  <div className="flex items-center gap-4 text-lg font-semibold text-gray-700">
                    <span>
                      ⭐{" "}
                      {typeof lab.ratingAverage === "number"
                        ? lab.ratingAverage.toFixed(1)
                        : "0.0"}
                    </span>
                    <span>
                      👀 {typeof lab.views === "number" ? lab.views : 0}
                    </span>
                  </div>
                )}
              </div>
              <p className="text-gray-600">{lab?.description}</p>
            </div>

            {/* Main Content Grid (Lab content + TOC) */}
            <div className="lg:grid lg:grid-cols-12 lg:gap-4 mb-12">
              {/* Main content */}
              <div className="lg:col-span-10">
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
                          const src = isAbsolute
                            ? raw
                            : (baseUrl || "") + raw.replace(/^\/?/, "");
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
              <aside className="hidden lg:block lg:col-span-2">
                <div className="sticky top-24">
                  <div className="rounded-xl border bg-white p-3">
                    <div className="text-sm font-semibold text-gray-700 mb-3">
                      Contents
                    </div>
                    {toc.length === 0 ? (
                      <div className="text-xs text-gray-400">
                        No headings found
                      </div>
                    ) : (
                      <nav className="text-sm">
                        <ul className="space-y-1">
                          {toc.map((h) => {
                            const indent =
                              h.level === 1
                                ? ""
                                : h.level === 2
                                ? "pl-3"
                                : "pl-6";
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

            {/* Questions Section (interactive). We always render the Quiz UI but
                show a dimmed overlay if the current user's role is not permitted */}
            {questions.length > 0 && lab?.id && (
              <div className="relative">
                <QuestionContainer
                  labId={lab.id}
                  questions={questions.map<UiQuestion>((q) => ({
                    id: q.id,
                    text: q.questionText,
                    type: q.type as QuestionType,
                    choices: parseChoices(q.choicesJson),
                  }))}
                  durationSec={30}
                  onSubmitAnswer={async (question, answer) =>
                    submitSingleAnswer(
                      {
                        id: question.id,
                        labId: lab.id!,
                        questionText: question.text,
                        type: question.type as 0 | 1 | 2 | 3,
                        choicesJson: JSON.stringify(question.choices ?? []),
                      },
                      answer as string | string[] | boolean
                    )
                  }
                />

                {/* Overlay when user role is not allowed to take quiz */}
                {!(user && user.role === ROLE.USER) && (
                  <div
                    className="absolute inset-0 flex items-center justify-center rounded-2xl"
                    style={{
                      background: "rgba(255,255,255,0.78)",
                      backdropFilter: "blur(4px)",
                      border: "1px solid rgba(250,204,21,0.25)",
                      pointerEvents: "auto",
                    }}
                  >
                    <div className="text-center p-4">
                      <div className="text-amber-800 font-semibold text-lg mb-2">
                        You are not allowed to take the quiz with your current
                        account role.
                      </div>
                      <div className="text-sm text-amber-700">
                        Contact an administrator if you think this is a mistake.
                      </div>
                    </div>
                  </div>
                )}s
              </div>
            )}

            {/* Comments Section */}

            <AdvancedComponent labId={lab?.id} />
          </>
        )}
      </div>
    </div>
  );
}

// Small presentational chip to show lab status prominently
function LabStatusChip({
  status,
  variant = "default",
}: {
  status: 0 | 1 | 2;
  variant?: "default" | "on-dark";
}) {
  if (status === 0) {
    return (
      <span
        className={
          variant === "on-dark"
            ? "inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 text-white text-sm font-semibold"
            : "inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-sm font-semibold"
        }
        title="Not Started"
      >
        <FiClipboard />
        Not Started
      </span>
    );
  }
  if (status === 1) {
    return (
      <span
        className={
          variant === "on-dark"
            ? "inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-400/90 text-yellow-900 text-sm font-semibold"
            : "inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200 text-sm font-semibold"
        }
        title="In Progress"
      >
        <FiClock />
        In Progress
      </span>
    );
  }
  return (
    <span
      className={
        variant === "on-dark"
          ? "inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-400/90 text-green-900 text-sm font-semibold"
          : "inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 text-green-700 border border-green-200 text-sm font-semibold"
      }
      title="Completed"
    >
      <FiCheckCircle />
      Completed
    </span>
  );
}

// (TimerRing removed; using QuestionContainer's TimerBar instead)
