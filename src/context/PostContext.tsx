import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { postsService } from '../services/posts.service';
import type { CreatePostPayload, UpdatePostPayload } from '../services/posts.service';
import type { Post, Pagination, PostFilters } from '../types';
import { useApi } from '../hooks/useApi';

interface PostContextType {
  posts: Post[];
  pagination: Pagination | null;
  loading: boolean;
  error: string | null;
  actionLoading: boolean;
  setPosts: (posts: Post[]) => void;
  setError: (error: string | null) => void;
  fetchPosts: (filters?: PostFilters) => Promise<void>;
  fetchMyPosts: (filters?: PostFilters) => Promise<void>;
  fetchAllPostsAdmin: (filters?: PostFilters) => Promise<void>;
  createPost: (payload: CreatePostPayload) => Promise<Post | null>;
  updatePost: (id: string, payload: UpdatePostPayload) => Promise<boolean>;
  deletePost: (id: string) => Promise<boolean>;
  toggleStatus: (id: string, status: 'draft' | 'published') => Promise<boolean>;
}

const PostContext = createContext<PostContextType | null>(null);

export const PostProvider = ({ children }: { children: ReactNode }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getAllApi = useApi(postsService.getAll);
  const getMyApi = useApi(postsService.getMy);
  const getAllAdminApi = useApi(postsService.getAllAdmin);
  const createApi = useApi(postsService.create);
  const updateApi = useApi(postsService.update);
  const deleteApi = useApi(postsService.delete);
  const updateStatusApi = useApi(postsService.updateStatus);

  const fetchPosts = useCallback(async (filters?: PostFilters) => {
    try {
      const data = await getAllApi.execute(filters);
      if (data) {
        setPosts(data.posts);
        setPagination(data.pagination);
      }
    } catch (err) { /* handled by useApi */ }
  }, [getAllApi.execute]);

  const fetchMyPosts = useCallback(async (filters?: PostFilters) => {
    try {
      const data = await getMyApi.execute(filters);
      if (data) {
        setPosts(data.posts);
        setPagination(data.pagination);
      }
    } catch (err) { /* handled by useApi */ }
  }, [getMyApi.execute]);

  const fetchAllPostsAdmin = useCallback(async (filters?: PostFilters) => {
    try {
      const data = await getAllAdminApi.execute(filters);
      if (data) {
        setPosts(data.posts);
        setPagination(data.pagination);
      }
    } catch (err) { /* handled by useApi */ }
  }, [getAllAdminApi.execute]);

  const createPost = useCallback(async (payload: CreatePostPayload): Promise<Post | null> => {
    const tempId = `temp-${Date.now()}`;
    const optimisticPost: Post = {
      _id: tempId,
      title: payload.title,
      content: payload.content,
      status: payload.status,
      tags: payload.tags,
      author: { _id: '', name: 'You', email: '' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setPosts((prev) => [optimisticPost, ...prev]);

    try {
      const data = await createApi.execute(payload);
      if (data) {
        setPosts((prev) => prev.map((p) => (p._id === tempId ? data.post : p)));
        return data.post;
      }
      return null;
    } catch (err) {
      setPosts((prev) => prev.filter((p) => p._id !== tempId));
      return null;
    }
  }, [createApi]);

  const updatePost = useCallback(
    async (id: string, payload: UpdatePostPayload): Promise<boolean> => {
      const previous = posts.find((p) => p._id === id);
      setPosts((prev) =>
        prev.map((p) => (p._id === id ? { ...p, ...payload, updatedAt: new Date().toISOString() } : p))
      );

      try {
        const data = await updateApi.execute(id, payload);
        if (data) {
          setPosts((prev) => prev.map((p) => (p._id === id ? data.post : p)));
          return true;
        }
        return false;
      } catch (err) {
        if (previous) {
          setPosts((prev) => prev.map((p) => (p._id === id ? previous : p)));
        }
        return false;
      }
    },
    [posts, updateApi]
  );

  const deletePost = useCallback(
    async (id: string): Promise<boolean> => {
      const previous = [...posts];
      setPosts((prev) => prev.filter((p) => p._id !== id));

      try {
        await deleteApi.execute(id);
        return true;
      } catch (err) {
        setPosts(previous);
        return false;
      }
    },
    [posts, deleteApi]
  );

  const toggleStatus = useCallback(
    async (id: string, status: 'draft' | 'published'): Promise<boolean> => {
      const previous = posts.find((p) => p._id === id);
      setPosts((prev) => prev.map((p) => (p._id === id ? { ...p, status } : p)));

      try {
        await updateStatusApi.execute(id, status);
        return true;
      } catch (err) {
        if (previous) {
          setPosts((prev) => prev.map((p) => (p._id === id ? previous : p)));
        }
        return false;
      }
    },
    [posts, updateStatusApi]
  );

  return (
    <PostContext.Provider
      value={{
        posts,
        pagination,
        loading: getAllApi.loading || getMyApi.loading || getAllAdminApi.loading,
        error: error || getAllApi.error || getMyApi.error || getAllAdminApi.error,
        actionLoading: updateApi.loading || deleteApi.loading || updateStatusApi.loading || createApi.loading,
        setPosts,
        setError,
        fetchPosts,
        fetchMyPosts,
        fetchAllPostsAdmin,
        createPost,
        updatePost,
        deletePost,
        toggleStatus,
      }}
    >
      {children}
    </PostContext.Provider>
  );
};

export const usePostContext = () => {
  const context = useContext(PostContext);
  if (!context) throw new Error('usePostContext must be used within a PostProvider');
  return context;
};
