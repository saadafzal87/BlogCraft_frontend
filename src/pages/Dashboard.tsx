import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { usePosts } from '../hooks/usePosts';
import { postsService } from '../services/posts.service';
import { useApi } from '../hooks/useApi';
import type { PostFilters } from '../types';
import { getPaginationRange } from '../utils/pagination';
import StatCard from '../components/StatCard';
import SortHeader from '../components/SortHeader';

const Dashboard = () => {
  const { user } = useAuthContext();
  const { posts, pagination, loading, error, fetchMyPosts, fetchAllPostsAdmin, deletePost, toggleStatus } = usePosts();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const navigate = useNavigate();

  // API handler for platform/personal stats
  const personalStatsApi = useApi(postsService.getMyStats);
  const platformStatsApi = useApi(postsService.getStats);


  const fetchStats = useCallback(async () => {
    // 1. Fetch personal stats (Author/Admin's own data)
    personalStatsApi.execute().catch(() => null);

    // 2. Clear platform stats if not admin (handled by logic below)

    // 3. Fetch global platform stats (Admin only)
    if (user?.role === 'admin') {
      platformStatsApi.execute().catch(() => null);
    }
  }, [user?.role, personalStatsApi.execute, platformStatsApi.execute]);

  const loadData = useCallback(() => {
    const filters: PostFilters = {
      page,
      limit: 10,
      sortBy,
      order,
      search: debouncedSearch
    };
    if (statusFilter !== 'all') filters.status = statusFilter;

    // Admins see all posts on the platform, authors see only their own
    if (user?.role === 'admin') {
      fetchAllPostsAdmin(filters);
    } else {
      fetchMyPosts(filters);
    }
  }, [page, user?.role, fetchMyPosts, fetchAllPostsAdmin, statusFilter, sortBy, order, debouncedSearch]);

  // Fetch stats only on mount
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Fetch posts when page, filter, or search changes
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setPage(1);
  }, [statusFilter, debouncedSearch]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    setActionLoading(id);
    const success = await deletePost(id);
    if (success) fetchStats();
    setActionLoading(null);
  };

  const handleToggleStatus = async (id: string, current: 'draft' | 'published') => {
    setActionLoading(id);
    const success = await toggleStatus(id, current === 'published' ? 'draft' : 'published');
    if (success) fetchStats();
    setActionLoading(null);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setOrder('asc');
    }
    setPage(1);
  };

  return (
    <div className="relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">
              {user?.role === 'admin' ? '⚡ Admin Dashboard' : '✍️ My Dashboard'}
            </h1>
            <p className="text-slate-400 mt-1">Welcome back, {user?.name}</p>
          </div>
          <Link to="/posts/new" className="btn-primary flex items-center gap-2 w-fit">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Post
          </Link>
        </div>

        {/* Platform Stats (Admin only) */}
        {user?.role === 'admin' && platformStatsApi.data?.stats && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-slate-300 mb-4 text-center">Platform KPIs</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <StatCard>
                <StatCard.Value>{platformStatsApi.data?.stats.totalPosts || 0}</StatCard.Value>
                <StatCard.Label className="text-indigo-400">Total Posts</StatCard.Label>
              </StatCard>
              <StatCard>
                <StatCard.Value>{platformStatsApi.data?.stats.publishedPosts || 0}</StatCard.Value>
                <StatCard.Label className="text-emerald-400">Published</StatCard.Label>
              </StatCard>
              <StatCard>
                <StatCard.Value>{platformStatsApi.data?.stats.draftPosts || 0}</StatCard.Value>
                <StatCard.Label className="text-amber-400">Drafts</StatCard.Label>
              </StatCard>
              <StatCard>
                <StatCard.Value>{platformStatsApi.data?.stats.totalUsers || 0}</StatCard.Value>
                <StatCard.Label className="text-blue-400">Total Users</StatCard.Label>
              </StatCard>
            </div>
            {platformStatsApi.data?.stats.topAuthors && platformStatsApi.data.stats.topAuthors.length > 0 && (
              <div className="card">
                <h3 className="text-sm font-semibold text-slate-300 mb-3">🏆 Top Authors</h3>
                <div className="space-y-2">
                  {platformStatsApi.data.stats.topAuthors.map((a: any, i: number) => (
                    <div key={a.author.id} className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500 w-4">{i + 1}.</span>
                        <div className="w-7 h-7 bg-indigo-500/30 rounded-full flex items-center justify-center text-xs font-bold text-indigo-300">
                          {a.author.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm text-slate-200">{a.author.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-indigo-400">{a.postCount} posts</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Personal Stats (Author's/Admin's KPI) */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-slate-300 mb-4 text-center">
            {user?.role === 'admin' ? "Admin's KPIs" : "Author's KPIs"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard>
              <StatCard.Value>{personalStatsApi.data?.stats.totalPosts || 0}</StatCard.Value>
              <StatCard.Label className="text-indigo-400">Total Posts</StatCard.Label>
            </StatCard>
            <StatCard>
              <StatCard.Value>{personalStatsApi.data?.stats.publishedPosts || 0}</StatCard.Value>
              <StatCard.Label className="text-emerald-400">Published</StatCard.Label>
            </StatCard>
            <StatCard>
              <StatCard.Value>{personalStatsApi.data?.stats.draftPosts || 0}</StatCard.Value>
              <StatCard.Label className="text-amber-400">Drafts</StatCard.Label>
            </StatCard>
          </div>

          {/* Posts Table */}
          <div className="card overflow-hidden p-0 mt-8">
            <div className="px-6 py-4 border-b border-slate-700/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
                <div className="flex items-center gap-4 min-w-fit">
                  <h2 className="text-lg font-semibold text-white">
                    {user?.role === 'admin' ? 'All Posts' : 'My Posts'}
                  </h2>
                  <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded-md border border-slate-700/50">
                    {pagination?.totalPosts || 0} posts
                  </span>
                </div>

                {/* Search Bar */}
                <div className="relative flex-1 max-w-md">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search posts..."
                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-2 pl-9 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-hidden focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center bg-slate-900/50 p-1 rounded-xl border border-slate-700/30 w-fit">
                {(['all', 'published', 'draft'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={(e) => {
                      e.stopPropagation();
                      setStatusFilter(s);
                    }}
                    className={`px-4 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${statusFilter === s
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                      }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-400">{error}</div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-400 mb-4">No posts yet.</p>
                <Link to="/posts/new" className="btn-primary">Write your first post</Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700/50">
                      <SortHeader field="title" currentSort={sortBy} currentOrder={order} onSort={handleSort}>
                        <SortHeader.Label>Title</SortHeader.Label>
                        <SortHeader.Icon />
                      </SortHeader>
                      <SortHeader field="status" currentSort={sortBy} currentOrder={order} onSort={handleSort}>
                        <SortHeader.Label>Status</SortHeader.Label>
                        <SortHeader.Icon />
                      </SortHeader>
                      <th className="px-6 py-3 text-left text-xs text-slate-500 uppercase tracking-wider hidden sm:table-cell">Tags</th>
                      <SortHeader field="createdAt" currentSort={sortBy} currentOrder={order} onSort={handleSort} className="hidden md:table-cell">
                        <SortHeader.Label>Date</SortHeader.Label>
                        <SortHeader.Icon />
                      </SortHeader>
                      <th className="px-6 py-3 text-right text-xs text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/30">
                    {posts.map((post) => (
                      <tr
                        key={post._id}
                        onClick={() => navigate(`/blog/${post._id}`)}
                        className="hover:bg-slate-700/20 transition-colors cursor-pointer group"
                      >
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-white group-hover:text-indigo-400 transition-colors line-clamp-1 max-w-xs">
                            {post.title}
                          </span>
                          <p className="text-xs text-slate-500 mt-0.5">by {post.author?.name}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={post.status === 'published' ? 'badge-published' : 'badge-draft'}>
                            {post.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 hidden sm:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {post.tags.slice(0, 10).map((tag) => (
                              <span key={tag} className="text-[10px] bg-slate-700/50 text-slate-300 px-2 py-0.5 rounded-full border border-slate-600/30">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell text-xs text-slate-500">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            {actionLoading === post._id ? (
                              <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <>
                                <button
                                  onClick={() => handleToggleStatus(post._id, post.status)}
                                  title={post.status === 'published' ? 'Unpublish' : 'Publish'}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    {post.status === 'published'
                                      ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                      : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    }
                                  </svg>
                                </button>
                                <Link
                                  to={`/posts/edit/${post._id}`}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </Link>
                                <button
                                  onClick={() => handleDelete(post._id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Footer */}
            {pagination && pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-slate-700/50 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage((p) => p - 1)}
                  disabled={!pagination.hasPrev}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 transition-all border border-slate-700/50"
                  title="Previous Page"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <div className="flex items-center gap-1">
                  {getPaginationRange(page, pagination.totalPages).map((p, i) => {
                    if (p === '...') {
                      return <span key={`dots-${i}`} className="px-2 text-slate-500">&hellip;</span>;
                    }
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(Number(p))}
                        className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${page === p
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                          : 'text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-700/50'
                          }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!pagination.hasNext}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 transition-all border border-slate-700/50"
                  title="Next Page"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
