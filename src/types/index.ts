export type UserRole = 'admin' | 'author';
export type PostStatus = 'draft' | 'published';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt?: string;
}

export interface Post {
  _id: string;
  title: string;
  content: string;
  author: {
    _id: string;
    name: string;
    email: string;
  };
  status: PostStatus;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  _id: string;
  content: string;
  author: {
    _id: string;
    name: string;
    email: string;
  };
  post: string;
  createdAt: string;
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalPosts: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PostsResponse {
  success: boolean;
  posts: Post[];
  pagination: Pagination;
}

export interface PostStats {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  totalUsers: number;
  totalComments: number;
  topAuthors: {
    author: { id: string; name: string; email: string };
    postCount: number;
  }[];
}

export interface ApiError {
  message: string;
  success: false;
  code?: string;
}

export interface PostFormData {
  title: string;
  content: string;
  status: PostStatus;
  tags: string[];
}

export interface PostFilters {
  search?: string;
  status?: PostStatus | '';
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
  tags?: string;
}
