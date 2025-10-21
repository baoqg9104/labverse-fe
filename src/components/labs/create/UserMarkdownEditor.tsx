import React, { type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeHighlight from "rehype-highlight";

type Props = {
  markdown: string;
  setMarkdown: (v: string) => void;
  images: File[];
  editorTextRef: React.RefObject<HTMLTextAreaElement | null>;
  isEditorDragging: boolean;
  onEditorAreaDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onEditorAreaDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onEditorDragOver: (e: React.DragEvent<HTMLTextAreaElement>) => void;
  onEditorDragLeave: (e: React.DragEvent<HTMLTextAreaElement>) => void;
  onEditorDrop: (e: React.DragEvent<HTMLTextAreaElement>) => void;
  onEditorPaste: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void;
};

export default function UserMarkdownEditor({
  markdown,
  setMarkdown,
  images,
  editorTextRef,
  isEditorDragging,
  onEditorAreaDragOver,
  onEditorAreaDrop,
  onEditorDragOver,
  onEditorDragLeave,
  onEditorDrop,
  onEditorPaste,
}: Props) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const isMac = navigator.platform.toUpperCase().includes("MAC");
    const meta = isMac ? e.metaKey : e.ctrlKey;
    if (!meta) return;
    // Bold
    if (e.key.toLowerCase() === "b") {
      e.preventDefault();
      insertAtSelection("**bold**");
    }
    // Italic
    if (e.key.toLowerCase() === "i") {
      e.preventDefault();
      insertAtSelection("*italic*");
    }
    // Code block: Ctrl/Cmd+Shift+C
    if (e.key.toLowerCase() === "c" && e.shiftKey) {
      e.preventDefault();
      insertAtSelection("\n```\ncode block\n```\n");
    }
  };

  const wordCount = (() => {
    const text = markdown
      .replace(/`{1,3}[^`]*`{1,3}/g, " ") // inline/fenced code
      .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // images
      .replace(/\[[^\]]*\]\([^)]*\)/g, " ") // links
      .replace(/[#>*_`~-]+/g, " ") // md syntax
      .replace(/\n+/g, " ")
      .trim();
    if (!text) return 0;
    return text.split(/\s+/).length;
  })();
  const insertAtSelection = (snippet: string) => {
    const textarea = editorTextRef.current;
    const start = textarea?.selectionStart ?? markdown.length;
    const end = textarea?.selectionEnd ?? markdown.length;
    const next = markdown.slice(0, start) + snippet + markdown.slice(end);
    setMarkdown(next);
    requestAnimationFrame(() => {
      if (editorTextRef.current) {
        const pos = start + snippet.length;
        editorTextRef.current.selectionStart = pos;
        editorTextRef.current.selectionEnd = pos;
        editorTextRef.current.focus();
      }
    });
  };

  const toolbar = (
    <div className="flex flex-wrap gap-2 p-2 border-b bg-white rounded-t-xl">
      <button
        type="button"
        className="px-2 py-1 text-sm rounded border hover:bg-gray-50"
        onClick={() => insertAtSelection("**bold**")}
      >
        B
      </button>
      <button
        type="button"
        className="px-2 py-1 text-sm rounded border hover:bg-gray-50"
        onClick={() => insertAtSelection("*italic*")}
      >
        I
      </button>
      <button
        type="button"
        className="px-2 py-1 text-sm rounded border hover:bg-gray-50"
        onClick={() => insertAtSelection("`code`")}
      >
        Code
      </button>
      <button
        type="button"
        className="px-2 py-1 text-sm rounded border hover:bg-gray-50"
        onClick={() => insertAtSelection("\n> blockquote\n")}
      >
        Quote
      </button>
      <button
        type="button"
        className="px-2 py-1 text-sm rounded border hover:bg-gray-50"
        onClick={() => insertAtSelection("\n- List item\n")}
      >
        List
      </button>
      <button
        type="button"
        className="px-2 py-1 text-sm rounded border hover:bg-gray-50"
        onClick={() => insertAtSelection("\n```\ncode block\n```\n")}
      >
        Code Block
      </button>
      <button
        type="button"
        className="px-2 py-1 text-sm rounded border hover:bg-gray-50"
        onClick={() => insertAtSelection("\n## Heading\n")}
      >
        H2
      </button>
      <button
        type="button"
        className="px-2 py-1 text-sm rounded border hover:bg-gray-50"
        onClick={() => insertAtSelection("\n![alt](images/example.png)\n")}
      >
        Image
      </button>
      <button
        type="button"
        className="px-2 py-1 text-sm rounded border hover:bg-gray-50"
        onClick={() => insertAtSelection("\n[link](https://example.com)\n")}
      >
        Link
      </button>
    </div>
  );

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 gap-4"
      onDragOver={onEditorAreaDragOver}
      onDrop={onEditorAreaDrop}
    >
      <div className="rounded-xl border overflow-hidden">
        {toolbar}
        <textarea
          ref={editorTextRef}
          onDragOver={onEditorDragOver}
          onDragLeave={onEditorDragLeave}
          onDrop={onEditorDrop}
          onPaste={onEditorPaste}
          onKeyDown={handleKeyDown}
          className={`w-full rounded-b-xl border-0 px-4 py-3 focus:outline-none focus:ring-2 min-h-[60vh] ${
            isEditorDragging
              ? "focus:ring-blue-400"
              : "focus:ring-blue-400"
          }`}
          value={markdown}
          onChange={(e) => setMarkdown(e.target.value)}
        />
      </div>
      <div className="rounded-xl border bg-gray-50 p-3 overflow-auto min-h-[60vh]">
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
              code({ inline, className, children }: { inline?: boolean; className?: string; children?: ReactNode }) {
                const cls = className || "";
                const match = /language-(\w+)/.exec(cls);
                return !inline ? (
                  <pre className={cls}>
                    <code className="">{children}</code>
                  </pre>
                ) : (
                  <code className={match ? `hljs language-${match[1]}` : "hljs"}>{children}</code>
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
                  (f) => `images/${f.name}` === normalized || f.name === nameOnly
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
      <div className="md:col-span-2 text-xs text-gray-600 flex justify-end">
        {wordCount} words
      </div>
    </div>
  );
}
