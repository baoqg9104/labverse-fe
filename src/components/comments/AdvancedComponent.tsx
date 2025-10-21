import { useEffect, useState, useContext, useRef } from "react";
import { Card, Avatar, Button, Input, List, Spin } from "antd";
import "@ant-design/v5-patch-for-react-19";
import EmojiPicker from "emoji-picker-react";
import {
  UserOutlined,
  LikeOutlined,
  MessageOutlined,
  DeleteOutlined,
  SendOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { toast } from "react-toastify";
import { labsApi } from "../../libs/labsApi";
import { AuthContext } from "../../contexts/AuthContext";
import type { LabCommentDto, PagedResult } from "../../types/lab";
import { getRoleMeta } from "../../components/profile/RoleUtils";
import { DEFAULT_AVATAR_URL } from "../../constants/config";
import "./AdvancedComponent.css";

type Props = {
  labId?: number | null;
  pageSize?: number;
};

const AdvancedComponent = ({ labId, pageSize = 10 }: Props) => {
  // internal comment node which may include additional author metadata
  type CommentNode = {
    id: number;
    labId?: number;
    parentId: number | null;
    userId: number;
    content: string;
    createdAt: string;
    updatedAt?: string;
    isActive?: boolean;
    isSending?: boolean;
    authorName: string;
    authorAvatarUrl: string;
    authorRole?: number;
    replies?: CommentNode[];
  };

  // Edit state and handlers (move to top-level scope)
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const startEdit = (comment: CommentNode) => {
    setEditingId(comment.id);
    setEditText(comment.content);
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };
  const saveEdit = async (comment: CommentNode) => {
    if (!editText.trim()) return toast.warn("Nội dung không được để trống");
    try {
      await labsApi.updateComment(comment.id, editText.trim());
      setCommentData((prev) => {
        const updateRec = (items: CommentNode[]): CommentNode[] =>
          items.map((it) =>
            it.id === comment.id
              ? { ...it, content: editText.trim() }
              : { ...it, replies: updateRec(it.replies || []) }
          );
        return updateRec(prev);
      });
      cancelEdit();
      toast.success("Đã cập nhật bình luận");
    } catch {
      toast.error("Lỗi khi cập nhật bình luận");
    }
  };

  // UiComment type removed — we render directly from CommentNode

  const [commentData, setCommentData] = useState<CommentNode[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // get current logged-in user from AuthContext
  const { user } = useContext(AuthContext);

  // note: currentUserForLib was used by previous 3rd-party UI - no longer needed

  const buildTree = (items: CommentNode[]) => {
    const map = new Map<number, CommentNode>();
    items.forEach((it) => {
      map.set(it.id, { ...it, replies: [] });
    });
    const roots: CommentNode[] = [];
    map.forEach((val) => {
      if (val.parentId == null) roots.push(val);
      else if (map.has(val.parentId)) map.get(val.parentId)!.replies!.push(val);
      else roots.push(val); // orphaned replies treated as roots
    });
    return roots;
  };

  // Normalize server-provided timestamps so the frontend interprets them
  // consistently as UTC when the server omits timezone information.
  // Many backends return 'YYYY-MM-DD HH:mm:ss' or 'YYYY-MM-DDTHH:mm:ss' without
  // a timezone. Treat those as UTC by appending 'Z' so `new Date(...)` parses
  // the value correctly and displays local time to the user.
  const normalizeServerDate = (raw?: string | null) => {
    if (!raw) return new Date().toISOString();
    const s = raw.trim();
    try {
      // common format: 'YYYY-MM-DD HH:mm:ss' -> convert space -> 'T' and add Z
      if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d+)?$/.test(s)) {
        return s.replace(" ", "T") + "Z";
      }
      // ISO-like without timezone: 'YYYY-MM-DDTHH:mm:ss' -> append Z
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(s)) {
        return s + "Z";
      }
      // If it already contains a timezone (Z or ±hh:mm), return as-is
      return s;
    } catch {
      return new Date().toISOString();
    }
  };
  const loadPage = async (p = 1) => {
    if (!labId) return;
    setLoading(true);
    try {
      const res = await labsApi.listComments(labId, p, pageSize);
      const data = res.data as PagedResult<LabCommentDto>;
      const items = data.items ?? [];
      // backend uses userId / parentId
      const mapped: CommentNode[] = items.map((x) => {
        return {
          id: x.id,
          parentId: x.parentId,
          userId: x.userId,
          content: x.content,
          createdAt: normalizeServerDate(x.createdAt),
          authorName: x.username || "User",
          authorAvatarUrl: x.avatarUrl || DEFAULT_AVATAR_URL,
          authorRole: (x as Partial<LabCommentDto>).role,
          replies: [],
        };
      });
      if (p === 1) {
        setCommentData(buildTree(mapped));
      } else {
        // append and rebuild tree
        const flat: CommentNode[] = [];
        commentData.forEach((r) => {
          const collect = (node: CommentNode) => {
            flat.push({
              id: node.id,
              parentId: node.parentId ?? null,
              userId: node.userId ?? 0,
              content: node.content,
              createdAt: node.createdAt,
              authorName: node.authorName,
              authorAvatarUrl: node.authorAvatarUrl || DEFAULT_AVATAR_URL,
              replies: [],
            });
            (node.replies || []).forEach(collect);
          };
          collect(r);
        });
        const appended = flat.concat(mapped);
        setCommentData(buildTree(appended));
      }
      setTotal(data.total ?? items.length);
      setPage(p);
    } catch (e) {
      console.error("Failed to load comments", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // reset when labId changes
    setCommentData([]);
    setPage(1);
    setTotal(0);
    if (labId) loadPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [labId]);

  // legacy onSubmit removed; custom composer handlers (postFromComposer) are used below

  const onDelete = async (commentId: number) => {
    if (!commentId || !labId) return;
    // If this is a temp/optimistic node (negative id), remove locally
    if (commentId < 0) {
      removeTempNode(commentId);
      setTotal((t) => Math.max(0, t - 1));
      toast.success("Comment removed");
      return;
    }
    try {
      await labsApi.deleteComment(commentId);
      // reload first page to reflect soft-delete
      await loadPage(1);
      toast.success("Comment deleted");
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete comment");
    }
  };

  // uiData memo was removed — we render directly from commentData

  // UI state and handlers
  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const [composerText, setComposerText] = useState("");
  const [replyToId, setReplyToId] = useState<number | null>(null);
  // track which emoji picker is open: 'composer' (root composer) or 'reply' (inline reply)
  const [emojiAnchor, setEmojiAnchor] = useState<"composer" | "reply" | null>(
    null
  );
  const emojiComposerRef = useRef<HTMLDivElement | null>(null);
  const emojiReplyRef = useRef<HTMLDivElement | null>(null);

  // Close emoji picker when clicking outside of the active picker
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!emojiAnchor) return;
      const target = e.target as Node;
      if (
        emojiAnchor === "composer" &&
        emojiComposerRef.current &&
        !emojiComposerRef.current.contains(target)
      ) {
        setEmojiAnchor(null);
      }
      if (
        emojiAnchor === "reply" &&
        emojiReplyRef.current &&
        !emojiReplyRef.current.contains(target)
      ) {
        setEmojiAnchor(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [emojiAnchor]);

  const startReply = (commentId: number) => {
    setReplyToId(commentId);
    setComposerText("");
    setTimeout(() => composerRef.current?.focus(), 50);
  };

  const cancelReply = () => {
    setReplyToId(null);
    setComposerText("");
    setEmojiAnchor(null);
  };

  const insertTempNode = (text: string, parentId?: number | undefined) => {
    const tempId = Date.now() * -1;
    const tempNode: CommentNode = {
      id: tempId,
      parentId: parentId ?? null,
      userId: 0,
      content: text,
      createdAt: new Date().toISOString(),
      isSending: true,
      authorName: user?.username || user?.email || "You",
      authorAvatarUrl: user?.avatarUrl || DEFAULT_AVATAR_URL,
      replies: [],
    };

    if (!parentId) {
      setCommentData((c) => [tempNode, ...c]);
    } else {
      const insertRec = (items: CommentNode[]): CommentNode[] =>
        items.map((it) => {
          if (it.id === parentId)
            return { ...it, replies: [...(it.replies || []), tempNode] };
          return { ...it, replies: insertRec(it.replies || []) };
        });
      setCommentData((c) => insertRec(c));
    }
    return tempId;
  };

  const replaceTempWithServerNode = (
    tempId: number,
    serverNode: CommentNode
  ) => {
    const replaceRec = (items: CommentNode[]): CommentNode[] =>
      items.map((it) => {
        if (it.id === tempId) {
          // preserve any replies added locally to temp (unlikely) by merging
          return {
            ...serverNode,
            replies: [...(it.replies || []), ...(serverNode.replies || [])],
          };
        }
        return { ...it, replies: replaceRec(it.replies || []) };
      });
    setCommentData((c) => replaceRec(c));
  };

  const removeTempNode = (tempId: number) => {
    const removeRec = (items: CommentNode[]): CommentNode[] =>
      items
        .filter((it) => it.id !== tempId)
        .map((it) => ({ ...it, replies: removeRec(it.replies || []) }));
    setCommentData((c) => removeRec(c));
  };

  const postFromComposer = async () => {
    if (!labId) return toast.warn("No lab selected");
    const text = composerText.trim();
    if (!text) return toast.warn("Please enter a comment");
    const parent = replyToId ?? undefined;
    const tempId = insertTempNode(text, parent);
    setComposerText("");
    setReplyToId(null);
    setEmojiAnchor(null);
    try {
      const res = await labsApi.createComment(labId, text, parent);
      const dto = res.data as LabCommentDto;
      const serverNode: CommentNode = {
        id: dto.id,
        parentId: dto.parentId ?? null,
        userId: dto.userId,
        // use server content if present, otherwise fall back to the original input text
        content:
          dto.content && dto.content.trim().length > 0 ? dto.content : text,
        // normalize server provided createdAt or use now
        createdAt: normalizeServerDate(
          dto.createdAt || new Date().toISOString()
        ),
        authorName: dto.username ?? user?.username ?? user?.email ?? "You",
        authorAvatarUrl: dto.avatarUrl ?? user?.avatarUrl ?? DEFAULT_AVATAR_URL,
        replies: [],
      };
      replaceTempWithServerNode(tempId, serverNode);
      setTotal((t) => t + 1);
      // Refresh from server to ensure canonical content and metadata
      // (this fixes cases where server alters/sanitizes content or provides extra fields)
      await loadPage(1);
    } catch (e) {
      console.error(e);
      removeTempNode(tempId);
      toast.error("Failed to post comment");
    }
  };

  // getInitials removed (not used in AntD Avatar)

  const timeAgo = (date: string) => {
    try {
      const now = Date.now();
      const then = new Date(date).getTime();
      if (isNaN(then)) return "just now";
      const seconds = Math.floor((now - then) / 1000);
      // very recent => show 'just now'
      if (seconds < 60) return "just now";
      const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
      const minutes = Math.round(seconds / 60);
      if (minutes < 60) return rtf.format(-minutes, "minute");
      const hours = Math.round(seconds / 3600);
      if (hours < 24) return rtf.format(-hours, "hour");
      const days = Math.round(seconds / 86400);
      if (days < 30) return rtf.format(-days, "day");
      const months = Math.round(seconds / 2592000);
      if (months < 12) return rtf.format(-months, "month");
      const years = Math.round(seconds / 31536000);
      return rtf.format(-years, "year");
    } catch {
      return new Date(date).toLocaleString();
    }
  };

  const [expandedReplies, setExpandedReplies] = useState<Set<number>>(
    new Set()
  );
  const INDENT_PX = 16;
  const MAX_LEVEL = 3; // maximum visual nesting levels before we stop shifting horizontally
  const MAX_INDENT = INDENT_PX * MAX_LEVEL;

  const toggleExpanded = (id: number) => {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderNode = (node: CommentNode, depth = 0) => {
    const isOwner =
      !!user &&
      (user.username === node.authorName || user.email === node.authorName);
    const isReplying = replyToId === node.id;
    // Reference edit state and handlers
    // editingId, editText, setEditText, cancelEdit, saveEdit, startEdit
    return (
      <Card
        key={node.id}
        style={{
          marginLeft: Math.min(depth * INDENT_PX, MAX_INDENT),
          marginBottom: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          // padding: "16px 20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start" }}>
          <Avatar
            src={node.authorAvatarUrl || DEFAULT_AVATAR_URL}
            icon={<UserOutlined />}
            size={44}
            style={{ marginRight: 16 }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span>{node.authorName ?? `user${node.userId}`}</span>
                {/* role badge */}
                {typeof (node.authorRole ?? user?.role) === "number" &&
                  (() => {
                    const meta = getRoleMeta(node.authorRole ?? user?.role);
                    return (
                      <span
                        className={meta.badgeClass}
                        style={{
                          fontSize: 11,
                          padding: "2px 8px",
                          borderRadius: 999,
                          display: "inline-flex",
                          gap: 6,
                          alignItems: "center",
                        }}
                      >
                        <span style={{ lineHeight: 1 }}>{meta.icon}</span>
                        <span>{meta.label}</span>
                      </span>
                    );
                  })()}
              </span>
              <span style={{ color: "#888", fontSize: 12 }}>
                {timeAgo(node.createdAt)}
              </span>
              {node.isSending && (
                <Spin size="small" style={{ marginLeft: 8 }} />
              )}
            </div>
            {/* Edit mode */}
            {editingId === node.id ? (
              <div style={{ marginTop: 8, marginBottom: 8 }}>
                <Input.TextArea
                  value={editText}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setEditText(e.target.value)
                  }
                  rows={3}
                  style={{ marginBottom: 8, borderRadius: 8 }}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <Button onClick={cancelEdit}>Hủy</Button>
                  <Button type="primary" onClick={() => saveEdit(node)}>
                    Lưu
                  </Button>
                </div>
              </div>
            ) : (
              <div style={{ marginTop: 4, marginBottom: 8, color: "#222" }}>
                {node.content}
              </div>
            )}
            <div style={{ display: "flex", gap: 16 }}>
              <Button
                type="text"
                icon={<MessageOutlined />}
                size="small"
                onClick={() => startReply(node.id)}
              >
                Reply
              </Button>
              <Button type="text" icon={<LikeOutlined />} size="small">
                Like
              </Button>
              {isOwner && (
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  size="small"
                  onClick={() => startEdit(node)}
                >
                  Edit
                </Button>
              )}
              {isOwner && (
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  size="small"
                  onClick={() => onDelete(node.id)}
                >
                  Delete
                </Button>
              )}
            </div>
            {/* Reply input appears directly under the comment being replied to */}
            {isReplying && (
              <div style={{ marginTop: 16, marginBottom: 8 }}>
                <Input.TextArea
                  ref={composerRef}
                  value={composerText}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setComposerText(e.target.value)
                  }
                  rows={3}
                  placeholder={
                    user
                      ? "Viết phản hồi..."
                      : "Vui lòng đăng nhập để bình luận"
                  }
                  disabled={!user}
                  style={{ marginBottom: 8, borderRadius: 8 }}
                />
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <Button onClick={cancelReply}>Hủy</Button>
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={postFromComposer}
                    disabled={!user || !composerText.trim()}
                  >
                    Gửi
                  </Button>
                  <div
                    ref={emojiReplyRef}
                    style={{ position: "relative", display: "inline-block" }}
                  >
                    <Button
                      type="text"
                      onClick={() =>
                        setEmojiAnchor((prev) =>
                          prev === "reply" ? null : "reply"
                        )
                      }
                    >
                      😊
                    </Button>
                    {emojiAnchor === "reply" && (
                      <div
                        style={{
                          position: "absolute",
                          top: "calc(100% + 8px)",
                          right: 0,
                          zIndex: 1000,
                        }}
                      >
                        <EmojiPicker
                          onEmojiClick={(emojiData) =>
                            setComposerText((prev) => prev + emojiData.emoji)
                          }
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            {/* Replies */}
            {(node.replies || []).length > 0 && (
              <div style={{ marginTop: 12 }}>
                {/* If replies are deeply nested, show a compact collapsed entry */}
                {depth >= MAX_LEVEL && !expandedReplies.has(node.id) ? (
                  <div style={{ marginLeft: 12 }}>
                    <button
                      className="px-2 py-1 text-sm text-blue-600"
                      onClick={() => toggleExpanded(node.id)}
                    >
                      Show {node.replies!.length} replies
                    </button>
                  </div>
                ) : (
                  // For deep replies we render them in a bordered container and
                  // cap the visual indentation so the overall width doesn't grow.
                  <div
                    style={
                      depth >= MAX_LEVEL
                        ? { borderLeft: "2px solid #f5f5f5", paddingLeft: 12 }
                        : {}
                    }
                  >
                    {node.replies!.map((r) =>
                      // cap child depth so marginLeft doesn't exceed MAX_INDENT
                      renderNode(r, Math.min(depth + 1, MAX_LEVEL))
                    )}
                  </div>
                )}
                {depth >= MAX_LEVEL && expandedReplies.has(node.id) && (
                  <div style={{ marginLeft: 12, marginTop: 8 }}>
                    <button
                      className="px-2 py-1 text-sm text-gray-600"
                      onClick={() => toggleExpanded(node.id)}
                    >
                      Collapse replies
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="rounded-md border bg-white p-4 mt-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Comments ({total})</h3>
        <div className="text-sm text-gray-500">
          {loading
            ? "Loading..."
            : `${Math.min(total, page * pageSize)} of ${total}`}
        </div>
      </div>

      {/* Composer (only for new root comments) */}
      {!replyToId && (
        <Card
          style={{ marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
        >
          <div style={{ display: "flex", alignItems: "flex-start" }}>
            <Avatar
              src={user?.avatarUrl || DEFAULT_AVATAR_URL}
              icon={<UserOutlined />}
              size={48}
              style={{ marginRight: 16 }}
            />
            <div style={{ flex: 1 }}>
              <Input.TextArea
                ref={composerRef}
                value={composerText}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setComposerText(e.target.value)
                }
                rows={3}
                placeholder={
                  user ? "Viết bình luận..." : "Vui lòng đăng nhập để bình luận"
                }
                disabled={!user}
                style={{ marginBottom: 8, borderRadius: 8 }}
              />
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <Button
                  onClick={() => {
                    setComposerText("");
                  }}
                >
                  Xóa
                </Button>
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={postFromComposer}
                  disabled={!user || !composerText.trim()}
                >
                  Gửi
                </Button>
                <div
                  ref={emojiComposerRef}
                  style={{ position: "relative", display: "inline-block" }}
                >
                  <Button
                    type="text"
                    onClick={() =>
                      setEmojiAnchor((prev) =>
                        prev === "composer" ? null : "composer"
                      )
                    }
                  >
                    😊
                  </Button>
                  {emojiAnchor === "composer" && (
                    <div
                      style={{
                        position: "absolute",
                        top: "calc(100% + 8px)",
                        right: 0,
                        zIndex: 1000,
                      }}
                    >
                      <EmojiPicker
                        onEmojiClick={(emojiData) =>
                          setComposerText((prev) => prev + emojiData.emoji)
                        }
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Comments list */}
      <div>
        {loading && commentData.length === 0 ? (
          <Spin
            tip="Loading comments..."
            style={{ width: "100%", margin: "32px 0" }}
          />
        ) : commentData.length === 0 ? (
          <div
            style={{ color: "#888", textAlign: "center", padding: "32px 0" }}
          >
            Be the first to comment on this lab.
          </div>
        ) : (
          <List
            itemLayout="vertical"
            dataSource={commentData}
            renderItem={(item: CommentNode) => renderNode(item)}
            style={{ background: "none" }}
          />
        )}
      </div>

      {/* Load more */}
      {total > 0 && page * pageSize < total && (
        <div className="mt-3 text-center">
          <button
            className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200"
            onClick={() => void loadPage(page + 1)}
          >
            {loading ? "Loading..." : "Load more comments"}
          </button>
        </div>
      )}
    </div>
  );
};

export default AdvancedComponent;
