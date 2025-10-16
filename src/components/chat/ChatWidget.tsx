import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FiSend, FiTrash2, FiX, FiCopy } from "react-icons/fi";
import {
  FaRegThumbsUp,
  FaRegThumbsDown,
  FaThumbsUp,
  FaThumbsDown,
} from "react-icons/fa6";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeSanitize from "rehype-sanitize";
import api from "../../utils/axiosInstance";
import chatBotImg from "../../assets/chatbot.png";
// import { useContext } from "react";
// import { AuthContext } from "../../contexts/AuthContext";

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "error";
  content: string;
  ts: number;
  rating?: "up" | "down";
}

// Simple typing indicator component
const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-center gap-1 pl-2 py-1">
      <span className="w-2 h-2 bg-lime-400 rounded-full animate-bounce [animation-delay:-0.2s]"></span>
      <span className="w-2 h-2 bg-lime-400 rounded-full animate-bounce [animation-delay:-0.1s]"></span>
      <span className="w-2 h-2 bg-lime-400 rounded-full animate-bounce"></span>
    </div>
  );
};

function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [darkMode, setDarkMode] = useState(true); // optional toggle later
  const [entered, setEntered] = useState(false); // for entrance animation timing
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const STORAGE_KEY = "nexa_chat_history";
  // const { user } = useContext(AuthContext);

  // Learning mode state
  const MODES = [
    { key: "tutor", label: "Gia sư" },
    { key: "explainer", label: "Giải thích" },
    { key: "quiz", label: "Kiểm tra" },
  ] as const;
  type ModeKey = (typeof MODES)[number]["key"];
  const [mode, setMode] = useState<ModeKey>("tutor");

  // Auto scroll to bottom when messages change or sending state changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending]);

  // Load history on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        type StoredMsg = {
          id?: string;
          role?: string;
          content?: string;
          ts?: unknown;
        };
        const parsed = JSON.parse(raw) as StoredMsg[];
        const normalized: ChatMessage[] = parsed.map(
          (m): ChatMessage => ({
            id: m.id || crypto.randomUUID(),
            role:
              m.role === "user" || m.role === "assistant" || m.role === "error"
                ? (m.role as "user" | "assistant" | "error")
                : "assistant",
            content: m.content || "",
            ts: typeof m.ts === "number" ? (m.ts as number) : Date.now(),
          })
        );
        setMessages(normalized);
      }
    } catch {
      /* noop */
    }
  }, []);

  // No draggable/resizable behavior; single layout for all breakpoints

  // No size/pos persistence needed anymore

  // Persist history when messages change (exclude transient errors if muốn)
  useEffect(() => {
    try {
      const toSave = messages.filter((m) => m.role !== "error");
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch {
      /* noop */
    }
  }, [messages]);

  // Focus input when open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Control quick entrance animation state
  useEffect(() => {
    if (isOpen) {
      setEntered(false);
      const t = setTimeout(() => setEntered(true), 10);
      return () => clearTimeout(t);
    } else {
      setEntered(false);
    }
  }, [isOpen]);

  // Close on ESC
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  const toggleOpen = () => setIsOpen((o) => !o);

  const clearChat = () => {
    setMessages([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* noop */
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
  };

  const modeInstruction = useMemo(() => {
    // Inject a brief role instruction in Vietnamese to steer the assistant
    switch (mode) {
      case "tutor":
        return "Bạn là một gia sư thân thiện. Hãy hướng dẫn người học theo từng bước, đưa ví dụ ngắn gọn, và khuyến khích họ tiếp tục. Luôn trả lời bằng tiếng Việt.";
      case "explainer":
        return "Hãy giải thích khái niệm một cách dễ hiểu, dùng ví dụ gần gũi và so sánh minh hoạ. Luôn trả lời bằng tiếng Việt.";
      case "quiz":
        return "Hãy biến nội dung thành câu hỏi trắc nghiệm/ngắn gọn để người học tự kiểm tra. Đưa đáp án và giải thích sau khi người học trả lời. Luôn trả lời bằng tiếng Việt.";
      default:
        return "Luôn trả lời bằng tiếng Việt.";
    }
  }, [mode]);

  const sendMessage = useCallback(
    async (overrideContent?: string) => {
      const content = (overrideContent ?? input).trim();
      if (!content || sending) return;
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content,
        ts: Date.now(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setSending(true);
      try {
        // Prefix content with lightweight instruction to steer the assistant according to mode
        const fullMessage = `${modeInstruction}\n\n${content}`;
        const res = await api.post("chat", { message: fullMessage });
        const replyRaw: string = (res.data?.reply ?? "").toString();
        const reply: string =
          replyRaw
            .replace(/\r\n/g, "\n")
            .replace(/\n{3,}/g, "\n\n")
            .trim() || "(Không có phản hồi)";
        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: reply,
          ts: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } catch {
        const errorMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "error",
          content: "Không thể kết nối đến máy chủ. Vui lòng thử lại.",
          ts: Date.now(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setSending(false);
        // refocus input
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    },
    [input, sending, modeInstruction]
  );

  // Handle Enter submit (Shift+Enter for newline)
  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (
    e
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const containerClasses = useMemo(
    () =>
      `flex flex-col h-full w-full md:w-[430px] md:h-[620px] rounded-xl shadow-2xl border ${
        darkMode
          ? "bg-[#1f1f29]/95 border-gray-700 text-gray-100"
          : "bg-white border-gray-200 text-gray-900"
      } backdrop-blur-lg`,
    [darkMode]
  );


  // Autosize textarea
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    const next = Math.min(el.scrollHeight, 180);
    el.style.height = `${next}px`;
  }, [input]);

  // General prompt pool (randomized on load)
  const PROMPT_POOL = useMemo(
    () => [
      // Onboarding & website-general prompts for new users
      "Labverse là gì? Hãy giới thiệu nhanh các tính năng chính",
      "Tôi nên bắt đầu từ đâu khi mới dùng Labverse?",
      "Hướng dẫn đăng ký tài khoản và xác thực email",
      "Cách tạo và chỉnh sửa hồ sơ cá nhân (avatar, giới thiệu)",
      "Điểm (Points) và streak là gì? Làm sao để nhận mỗi ngày?",
      "Sự khác nhau giữa gói Free và Premium là gì?",
      "Làm thế nào để thanh toán và nhận hóa đơn?",
      "Các bước tham gia và học trong một phòng Lab",
      "Gợi ý cách học hiệu quả với trợ lý Nexa",
      "Tôi có thể đổi ngôn ngữ giao diện ở đâu?",
      "Làm sao để liên hệ hỗ trợ khi gặp vấn đề?",
      "Chính sách hoàn tiền và bảo mật dữ liệu gồm những gì?",
      "Tổng quan trang Profile: tôi xem và quản lý gì ở đây?",
      "Trang Pricing có gì? Tôi nên chọn gói nào?",
      "Làm sao để nhận ưu đãi/khuyến mại (nếu có)?",
    ],
    []
  );

  const [quickPrompts, setQuickPrompts] = useState<string[]>([]);

  const pickRandomPrompts = useCallback(
    (n: number) => {
      const pool = PROMPT_POOL;
      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, Math.min(n, pool.length));
    },
    [PROMPT_POOL]
  );

  // Randomize prompts on first mount (and thus on every reload)
  useEffect(() => {
    setQuickPrompts(pickRandomPrompts(5));
  }, [pickRandomPrompts]);

  const handleQuickPrompt = (text: string) => {
    setInput(text);
    // gửi ngay lập tức với nội dung đã chọn
    sendMessage(text);
  };

  const formatTime = (ts: number) => {
    try {
      return new Date(ts).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={toggleOpen}
        aria-label={isOpen ? "Đóng trò chuyện" : "Mở trò chuyện"}
        className="overflow-visible fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-gradient-to-br from-lime-400 to-lime-600 hover:to-lime-500 text-gray-900 font-semibold px-6 py-3.5 rounded-full shadow-lg shadow-lime-500/40 transition cursor-pointer"
      >
        {/* Subtle glow to highlight the button */}
        <span className="pointer-events-none absolute -inset-2 rounded-full bg-lime-400/30 blur-xl animate-pulse" />
        {/* <FiMessageCircle className="text-xl" /> */}
        <img src={chatBotImg} alt="" className="size-8" />
        <span className="hidden md:inline-flex items-center gap-1">
          <span className="text-lg">Hey! I'm here</span>
        </span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-end justify-center md:justify-end pointer-events-none">
          {/* Backdrop (click to close on mobile) */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto md:hidden"
            onClick={toggleOpen}
          />
          <div
            className={`pointer-events-auto w-full md:w-auto md:mr-6 md:mb-6 mb-0 transform transition-all ease-out ${
              entered
                ? "opacity-100 translate-y-0 scale-100"
                : "opacity-0 translate-y-2 scale-[0.99]"
            }`}
            style={{ maxWidth: "100%", transitionDuration: "150ms" }}
          >
            <div className={containerClasses} style={{ position: "relative" }}>
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <div className="flex items-center gap-2 font-semibold text-base tracking-wide">
                  {/* <span>🤖</span> */}
                  <img src={chatBotImg} alt="" className="size-8" />
                  <span className="flex items-center gap-2">
                    <span className="text-xl">Nexa</span>
                    <span
                      className={`ml-1 text-[12px] px-2 py-0.5 rounded-full ${
                        darkMode
                          ? "bg-white/5 border border-white/20 text-white/80"
                          : "bg-gray-100 border border-gray-300 text-gray-600"
                      }`}
                    >
                      v1.0.0
                    </span>
                  </span>
                  {/* {user && (
                    <div className="hidden md:flex items-center gap-2 px-2 py-1 rounded-md border border-white/10 bg-white/5 ml-2 text-xs">
                      <span title="Streak hiện tại">
                        🔥 {user.streakCurrent}
                      </span>
                      <span title="Điểm">⭐ {user.points}</span>
                    </div>
                  )} */}
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <button
                    onClick={() => setDarkMode((d) => !d)}
                    className="text-xs px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 transition cursor-pointer"
                  >
                    {darkMode ? "Sáng" : "Tối"}
                  </button>
                  {messages.length > 0 && (
                    <button
                      onClick={clearChat}
                      title="Xoá hội thoại"
                      className="p-2 rounded-md hover:bg-white/10 text-red-400 hover:text-red-300 transition cursor-pointer"
                    >
                      <FiTrash2 />
                    </button>
                  )}
                  <button
                    onClick={toggleOpen}
                    className="p-2 rounded-md hover:bg-white/10 transition cursor-pointer"
                    aria-label="Đóng"
                  >
                    <FiX />
                  </button>
                </div>
              </div>
              {/* Mode selector */}
              <div className="px-4 pt-3 flex flex-wrap gap-2">
                {MODES.map((m) => (
                  <button
                    key={m.key}
                    onClick={() => setMode(m.key)}
                    className={`text-[11px] px-2.5 py-1 rounded-full border transition cursor-pointer ${
                      mode === m.key
                        ? "bg-lime-500/20 border-lime-400"
                        : darkMode
                        ? "bg-white/5 border-white/10 text-white/80 hover:bg-white/10"
                        : "bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200"
                    }`}
                    aria-pressed={mode === m.key}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              {/* Messages list */}
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin"
              >
                {messages.length === 0 && !sending && (
                  <div className="mt-6">
                    <div className="text-sm opacity-80 text-center leading-relaxed mb-3">
                      Bắt đầu bằng cách nhập câu hỏi ở bên dưới hoặc chọn một
                      gợi ý nhanh.
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {quickPrompts.map((p) => (
                        <button
                          key={p}
                          onClick={() => handleQuickPrompt(p)}
                          className={`text-xs px-3 py-2 rounded-full border transition cursor-pointer ${
                            darkMode
                              ? "bg-white/5 border-white/15 hover:bg-white/10"
                              : "bg-gray-100 border-gray-200 hover:bg-gray-200"
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                      <button
                        onClick={() => setQuickPrompts(pickRandomPrompts(5))}
                        className={`text-xs px-3 py-2 rounded-full border transition cursor-pointer ${
                          darkMode
                            ? "bg-white/5 border-white/15 hover:bg-white/10"
                            : "bg-gray-100 border-gray-200 hover:bg-gray-200"
                        }`}
                        title="Đổi gợi ý"
                      >
                        Đổi gợi ý
                      </button>
                    </div>
                  </div>
                )}
                {messages.map((m, i) => (
                  <div
                    key={m.id}
                    className={`group relative flex ${
                      m.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[82%] md:max-w-[85%] rounded-2xl px-4 py-2 text-sm break-words ${
                        m.role === "assistant" ? "" : "whitespace-pre-wrap"
                      } ${
                        m.role === "user"
                          ? "bg-gradient-to-tr from-lime-500 to-lime-400 text-gray-900 shadow-lg"
                          : m.role === "assistant"
                          ? darkMode
                            ? "bg-[#262b3b] text-gray-100 border border-white/10 shadow"
                            : "bg-gray-100 text-gray-900 border border-gray-200"
                          : "bg-rose-600/90 text-white"
                      }`}
                    >
                      {m.role === "assistant" ? (
                        <>
                          <div
                            className={`${
                              darkMode
                                ? "prose prose-sm prose-invert"
                                : "prose prose-sm"
                            } max-w-none`}
                            role="status"
                            aria-live="polite"
                            style={{
                              background: "transparent",
                              color: "inherit",
                            }}
                          >
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              rehypePlugins={[rehypeHighlight, rehypeSanitize]}
                            >
                              {m.content}
                            </ReactMarkdown>
                          </div>
                          <div className="text-[10px] opacity-60 mt-1 flex items-center justify-between gap-2">
                            <span>{formatTime(m.ts)}</span>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                              <button
                                onClick={() => copyToClipboard(m.content)}
                                title="Sao chép trả lời"
                                className="bg-gray-800 text-white p-1 rounded-full shadow cursor-pointer text-xs"
                              >
                                <FiCopy />
                              </button>
                              <button
                                onClick={() =>
                                  setMessages((prev) =>
                                    prev.map((x) =>
                                      x.id === m.id
                                        ? {
                                            ...x,
                                            rating:
                                              x.rating === "up"
                                                ? undefined
                                                : "up",
                                          }
                                        : x
                                    )
                                  )
                                }
                                title="Hữu ích"
                                className="p-1 rounded-full bg-white/10 hover:bg-white/20"
                              >
                                {m.rating === "up" ? (
                                  <FaThumbsUp className="text-lime-400" />
                                ) : (
                                  <FaRegThumbsUp />
                                )}
                              </button>
                              <button
                                onClick={() =>
                                  setMessages((prev) =>
                                    prev.map((x) =>
                                      x.id === m.id
                                        ? {
                                            ...x,
                                            rating:
                                              x.rating === "down"
                                                ? undefined
                                                : "down",
                                          }
                                        : x
                                    )
                                  )
                                }
                                title="Chưa tốt"
                                className="p-1 rounded-full bg-white/10 hover:bg-white/20"
                              >
                                {m.rating === "down" ? (
                                  <FaThumbsDown className="text-rose-400" />
                                ) : (
                                  <FaRegThumbsDown />
                                )}
                              </button>
                            </div>
                          </div>
                          {i === messages.length - 1 && !sending && (
                            <div className="mt-1 flex justify-end">
                              <button
                                onClick={() => {
                                  const lastUser = [...messages]
                                    .reverse()
                                    .find((x) => x.role === "user");
                                  if (lastUser) sendMessage(lastUser.content);
                                }}
                                className="text-[11px] px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 transition"
                              >
                                Tạo lại trả lời
                              </button>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          {m.content}
                          <div className="text-[10px] opacity-60 mt-1 text-right">
                            {formatTime(m.ts)}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {sending && (
                  <div className="flex flex-col gap-2">
                    {/* Skeleton assistant bubble */}
                    <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-[#262b3b] text-gray-100 border border-white/10">
                      <div className="h-3 w-40 bg-white/10 rounded animate-pulse" />
                      <div className="h-3 w-64 bg-white/10 rounded animate-pulse mt-2" />
                      <div className="h-3 w-56 bg-white/10 rounded animate-pulse mt-2" />
                      <div className="mt-2 flex items-center gap-2 text-xs opacity-70">
                        <TypingIndicator />
                        <span>Đang suy nghĩ...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {/* Input area */}
              <div className="border-t border-white/10 p-3">
                <div className="relative flex items-end gap-2">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Nhập câu hỏi của bạn..."
                    rows={1}
                    className={`w-full resize-none outline-none rounded-xl px-4 py-3 text-sm leading-relaxed transition placeholder:text-gray-400 ${
                      darkMode
                        ? "bg-[#2e3345] text-gray-100 focus:ring-2 focus:ring-lime-400/60"
                        : "bg-gray-100 text-gray-900 focus:ring-2 focus:ring-lime-400/60"
                    }`}
                    disabled={sending}
                    style={{ maxHeight: 180 }}
                  />
                  <button
                    aria-label="Gửi"
                    title="Gửi"
                    onClick={() => sendMessage()}
                    disabled={sending || input.trim().length === 0}
                    className="shrink-0 h-11 w-11 flex items-center justify-center rounded-xl bg-lime-500 hover:bg-lime-400 disabled:opacity-40 disabled:cursor-not-allowed text-gray-900 font-semibold shadow cursor-pointer transition"
                  >
                    <FiSend />
                  </button>
                </div>
                <div className="flex justify-between mt-1 px-1">
                  <span className="text-[11px] opacity-60">
                    Nhấn Enter để gửi • Shift+Enter xuống dòng
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ChatWidget;
