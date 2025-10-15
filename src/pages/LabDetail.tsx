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

type QuestionDto = {
  id: number;
  labId: number;
  questionText: string;
  type: 0 | 1 | 2; // 0: multiple choice, 1: text input, 2: checkbox
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
  const [answers, setAnswers] = useState<Record<number, string | string[]>>({});

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

        const questionsRes = await api.get(`/labs/${dto.id}/questions`);
        setQuestions(questionsRes.data as QuestionDto[]);
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

  const handleAnswerChange = (questionId: number, value: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleCheckboxChange = (questionId: number, choice: string, checked: boolean) => {
    setAnswers((prev) => {
      const current = (prev[questionId] as string[]) || [];
      const updated = checked
        ? [...current, choice]
        : current.filter((c) => c !== choice);
      return { ...prev, [questionId]: updated };
    });
  };

  const handleSubmitAnswers = async () => {
    if (!lab?.id) {
      alert("Lab ID not found");
      return;
    }

    try {
      // Submit each answer individually to match the API endpoint
      const submitPromises = Object.entries(answers).map(async ([questionId, answer]) => {
        const payload = {
          answerJson: JSON.stringify(answer) // Convert answer to JSON string
        };
        
        return api.post(
          `/labs/${lab.id}/questions/${questionId}/answers`,
          payload
        );
      });

      // Wait for all submissions to complete
      await Promise.all(submitPromises);
      
      alert("Answers submitted successfully!");
      
      // Optionally clear answers after successful submission
      // setAnswers({});
    } catch (e) {
      console.error("Submit error:", e);
      alert("Failed to submit answers. Please try again.");
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

      <div className="max-w-7xl mx-auto px-4 pb-16">
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
            {/* Page Title and Description */}
            <div className="mb-6">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{lab?.title}</h1>
              <p className="text-gray-600">{lab?.description}</p>
            </div>

            {/* Main Content Grid (Lab content + TOC) */}
            <div className="lg:grid lg:grid-cols-12 lg:gap-8 mb-12">
              {/* Main content */}
              <div className="lg:col-span-9">
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

            {/* Questions Section - Now outside the grid */}
            {questions.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 sm:px-8 sm:py-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    Lab Questions
                  </h2>
                </div>

                {/* Questions Container */}
                <div className="p-6 sm:p-8 space-y-8">
                  {questions.map((q, idx) => {
                    const choices = parseChoices(q.choicesJson);
                    return (
                      <div key={q.id} className="space-y-4">
                        {/* Question Header */}
                        <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-bold text-sm flex-shrink-0 border border-blue-200">
                            {idx + 1}
                          </span>
                          <p className="text-gray-900 font-medium text-base sm:text-lg flex-1">
                            {q.questionText}
                          </p>
                        </div>

                        {/* Answer Area */}
                        <div className="sm:ml-10">
                          {/* Multiple Choice (type 0) */}
                          {q.type === 0 && (
                            <div className="space-y-3">
                              {choices.map((choice, choiceIdx) => (
                                <label
                                  key={choiceIdx}
                                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors group"
                                >
                                  <input
                                    type="radio"
                                    name={`question-${q.id}`}
                                    value={choice}
                                    checked={answers[q.id] === choice}
                                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                    className="w-4 h-4 mt-1 text-blue-600 focus:ring-2 focus:ring-blue-500 flex-shrink-0"
                                  />
                                  <span className="text-gray-700 group-hover:text-gray-900 text-sm sm:text-base">
                                    {choice}
                                  </span>
                                </label>
                              ))}
                            </div>
                          )}

                          {/* Text Input (type 1) */}
                          {q.type === 1 && (
                            <textarea
                              value={(answers[q.id] as string) || ""}
                              onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                              placeholder="Type your answer here..."
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base transition-all resize-y min-h-[100px]"
                              rows={4}
                            />
                          )}

                          {/* Checkbox (type 2) */}
                          {q.type === 2 && (
                            <div className="space-y-3">
                              {choices.map((choice, choiceIdx) => (
                                <label
                                  key={choiceIdx}
                                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors group"
                                >
                                  <input
                                    type="checkbox"
                                    checked={((answers[q.id] as string[]) || []).includes(choice)}
                                    onChange={(e) => handleCheckboxChange(q.id, choice, e.target.checked)}
                                    className="w-4 h-4 mt-1 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 flex-shrink-0"
                                  />
                                  <span className="text-gray-700 group-hover:text-gray-900 text-sm sm:text-base">
                                    {choice}
                                  </span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Submit Button Section */}
                <div className="bg-gray-50 px-6 py-4 sm:px-8 sm:py-6 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row gap-4 sm:justify-end">
                    <button
                      onClick={handleSubmitAnswers}
                      className="w-full sm:w-auto px-8 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 active:bg-blue-700 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg"
                    >
                      Submit Answers
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}