import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { usePosts } from '../hooks/usePosts';
import type { PostFilters } from '../types';
import { getPaginationRange } from '../utils/pagination';
import { getExcerpt, getCoverImage } from '../components/editor/ContentRenderer';

const Blog = () => {
  const { posts, pagination, loading, error, fetchPosts } = usePosts();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(() => {
    const filters: PostFilters = { page, limit: 9, status: 'published' };
    if (debouncedSearch) filters.search = debouncedSearch;
    fetchPosts(filters);
  }, [page, debouncedSearch, fetchPosts]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (search) setPage(1);
  }, [search]);

  return (
    <div className="relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">

        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
            Live Blog
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-white mb-4">
            Stories that{' '}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-400 to-purple-400">
              inspire
            </span>
          </h1>
          <p className="text-slate-400 text-xl max-w-2xl mx-auto">
            Discover insights, tutorials, and perspectives from our community of writers.
          </p>
        </div>

        <div className="max-w-xl mx-auto mb-10">
          <div className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
              fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              id="blog-search"
              type="text"
              placeholder="Search posts by title or tag..."
              className="input-field pl-11 pr-4"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {debouncedSearch && (
            <p className="text-center text-xs text-slate-500 mt-2">
              Showing results for "<span className="text-indigo-400">{debouncedSearch}</span>"
            </p>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card animate-pulse h-64">
                <div className="h-4 bg-slate-700 rounded w-3/4 mb-3" />
                <div className="h-3 bg-slate-700 rounded w-full mb-2" />
                <div className="h-3 bg-slate-700 rounded w-5/6" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16 text-red-400">{error}</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No posts found</h3>
            <p className="text-slate-400">
              {debouncedSearch ? 'Try a different search term.' : 'No published posts yet.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Link
                key={post._id}
                to={`/blog/${post._id}`}
                className="card group flex flex-col hover:border-indigo-500/40 hover:-translate-y-1 transition-all duration-300"
              >
                {post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {post.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <h2 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors mb-2 line-clamp-2">
                  {post.title}
                </h2>
                {getCoverImage(post.content) && (
                  <div className="w-full h-40 mb-4 overflow-hidden rounded-lg bg-slate-900 border border-slate-700/50">
                    <img
                      src={getCoverImage(post.content)!}
                      alt="Cover"
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                )}

                <p className="text-slate-400 text-sm leading-relaxed line-clamp-3 flex-1">
                  {getExcerpt(post.content, 180)}
                </p>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700/50">
                  <span className="text-xs text-slate-400">by {post.author?.name}</span>
                  <span className="text-xs text-slate-500">
                    {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-center gap-2 mt-12 pb-8">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={!pagination.hasPrev}
              className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-all border border-slate-700/50"
              title="Previous Page"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="flex items-center gap-1">
              {getPaginationRange(page, pagination.totalPages).map((p, i) => {
                if (p === '...') {
                  return (
                    <span key={`dots-${i}`} className="w-9 h-9 flex items-center justify-center text-slate-500">
                      &hellip;
                    </span>
                  );
                }

                return (
                  <button
                    key={p}
                    onClick={() => setPage(Number(p))}
                    className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all duration-200 ${page === p
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700'
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
              className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-all border border-slate-700/50"
              title="Next Page"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Blog;
