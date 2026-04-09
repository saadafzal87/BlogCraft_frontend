import api from '../lib/api-client';
import type { Post, PostsResponse, PostStats, Comment, PostFilters } from '../types';

export interface CreatePostPayload {
  title: string;
  content: string;
  status: 'draft' | 'published';
  tags: string[];
}

export interface UpdatePostPayload {
  title?: string;
  content?: string;
  tags?: string[];
  status?: 'draft' | 'published';
}

export const postsService = {
  getAll: (filters?: PostFilters) =>
    api.get<PostsResponse>('/posts', { params: filters }),

  getMy: (filters?: PostFilters) =>
    api.get<PostsResponse>('/posts/user/my', { params: filters }),
  getAllAdmin: (filters?: PostFilters) =>
    api.get<PostsResponse>('/posts/admin/all', { params: filters }),

  getById: (id: string) =>
    api.get<{ success: boolean; post: Post }>(`/posts/${id}`),

  create: (data: CreatePostPayload) =>
    api.post<{ success: boolean; post: Post }>('/posts', data),

  update: (id: string, data: UpdatePostPayload) =>
    api.put<{ success: boolean; post: Post }>(`/posts/${id}`, data),

  delete: (id: string) =>
    api.delete<{ success: boolean; message: string }>(`/posts/${id}`),

  updateStatus: (id: string, status: 'draft' | 'published') =>
    api.patch<{ success: boolean; post: { id: string; status: string } }>(
      `/posts/${id}/status`,
      { status }
    ),

  getComments: (postId: string) =>
    api.get<{ success: boolean; comments: Comment[] }>(
      `/posts/${postId}/comments`
    ),

  addComment: (postId: string, content: string) =>
    api.post<{ success: boolean; comment: Comment }>(`/posts/${postId}/comments`, { content }),

  getStats: () =>
    api.get<{ success: boolean; stats: PostStats }>('/stats/posts'),

  getMyStats: () =>
    api.get<{ success: boolean; stats: PostStats }>('/stats/my'),
};
