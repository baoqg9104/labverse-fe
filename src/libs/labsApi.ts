import api from "../utils/axiosInstance";
import type {
  Lab,
  LabRateRequest,
  LabCommentDto,
  PagedResult,
} from "../types/lab";

const BASE = "/labs";

export const labsApi = {
  // GET {BASE}/?includeInactive={bool}
  list(includeInactive?: boolean) {
    return api.get<Lab[]>(`${BASE}/`, { params: { includeInactive } });
  },
  // GET {BASE}/preview (no auth)
  preview() {
    return api.get<Lab[]>(`${BASE}/preview`);
  },
  // GET {BASE}/{id}
  getById(id: number) {
    return api.get<Lab>(`${BASE}/${id}`);
  },
  // GET {BASE}/slug/{slug}
  getBySlug(slug: string) {
    return api.get<Lab>(`${BASE}/slug/${encodeURIComponent(slug)}`);
  },
  // POST {BASE}
  create(body: {
    title: string;
    slug: string;
    description: string;
    mdPath: string;
    mdPublicUrl: string;
    difficultyLevel: 0 | 1 | 2;
  }) {
    return api.post<Lab>(`${BASE}`, body, {
      headers: { "Content-Type": "application/json" },
    });
  },
  // PATCH {BASE}/{id}
  update(
    id: number,
    body: {
      title: string;
      slug: string;
      description: string;
      mdPath: string;
      mdPublicUrl: string;
      difficultyLevel: 0 | 1 | 2;
    }
  ) {
    return api.patch<Lab>(`${BASE}/${id}`, body, {
      headers: { "Content-Type": "application/json" },
    });
  },
  // DELETE {BASE}/{id}
  remove(id: number) {
    return api.delete<void>(`${BASE}/${id}`);
  },
  // POST {BASE}/{id}/restore
  restore(id: number) {
    return api.post<void>(`${BASE}/${id}/restore`, undefined, {
      headers: { "Content-Type": "application/json" },
    });
  },
  // POST {BASE}/{id}/view
  trackView(id: number) {
    return api.post<void>(`${BASE}/${id}/view`);
  },
  // POST {BASE}/{id}/rate
  rate(id: number, score: number, comment?: string) {
    const normalized = Math.max(1, Math.min(5, Math.round(score)));
    const body: LabRateRequest = { score: normalized, comment };
    return api.post<void>(`${BASE}/${id}/rate`, body, {
      headers: { "Content-Type": "application/json" },
    });
  },
  // POST {BASE}/{id}/comments?parentId={optional}
  createComment(id: number, content: string, parentId?: number) {
    return api.post<LabCommentDto>(
      `${BASE}/${id}/comments`,
      JSON.stringify(content),
      {
        params: { parentId },
        headers: { "Content-Type": "application/json" },
      }
    );
  },
  // GET {BASE}/{id}/comments?page=&pageSize=
  listComments(id: number, page: number, pageSize: number) {
    return api.get<PagedResult<LabCommentDto>>(`${BASE}/${id}/comments`, {
      params: { page, pageSize },
    });
  },
  // GET {BASE}/{id}/comments/tree?page=&pageSize=
  //   listCommentTree(id: number, page: number, pageSize: number) {
  //     return api.get<PagedResult<LabCommentDto>>(`${BASE}/${id}/comments/tree`, {
  //       params: { page, pageSize },
  //     });
  //   },
  // PATCH {BASE}/comments/{commentId}
  updateComment(commentId: number, content: string) {
    return api.patch<void>(
      `${BASE}/comments/${commentId}`,
      { content },
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  },
  // DELETE {BASE}/comments/{commentId}
  deleteComment(commentId: number) {
    return api.delete<void>(`${BASE}/comments/${commentId}`);
  },
};

export type LabsApi = typeof labsApi;
