import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { postsService } from '../services/posts.service';
import { useApi } from '../hooks/useApi';
import { useAuthContext } from '../context/AuthContext';
import { useForm } from '../hooks/useForm';
import { commentSchema } from '../schemas';
import type { CommentFormData } from '../schemas';
import type { Comment } from '../types';
import ContentRenderer from '../components/editor/ContentRenderer';

const PostDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthContext();

  const [commentError, setCommentError] = useState<string | null>(null);
  const [postError, setPostError] = useState<string | null>(null);
  const [localComments, setLocalComments] = useState<Comment[]>([]);

  const getPostApi = useApi(postsService.getById);
  const getCommentsApi = useApi(postsService.getComments);
  const addCommentApi = useApi(postsService.addComment);

  const { values, errors, handleChange, validate, reset } = useForm<CommentFormData>({ content: '' });

  useEffect(() => {
    if (!id) return;
    getPostApi.execute(id).catch(() => setPostError('Post not found.'));
    getCommentsApi.execute(id).then(data => {
      if (data) setLocalComments(data.comments);
    }).catch(() => null);
  }, [id, getPostApi.execute, getCommentsApi.execute]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCommentError(null);
    if (!validate(commentSchema)) return;

    try {
      const data = await addCommentApi.execute(id!, values.content);
      if (data) {
        setLocalComments((prev) => [data.comment, ...prev]);
        reset();
      }
    } catch (err) {
      setCommentError('Failed to post comment.');
    }
  };

  const post = getPostApi.data?.post;

  if (getPostApi.loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (postError || !post) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="card max-w-md text-center">
          <h2 className="text-xl font-bold text-white mb-2">Post Not Found</h2>
          <p className="text-slate-400 mb-4">{postError}</p>
          <Link to="/" className="btn-primary">Back to Blog</Link>
        </div>
      </div>
    );
  }

  const canEdit =
    isAuthenticated && (user?.role === 'admin' || user?.id === post.author._id);

  return (
    <div className="relative">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <button onClick={() => navigate(-1)} className="btn-ghost flex items-center gap-2 mb-8 text-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>

        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag) => (
              <span key={tag} className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        )}

        <h1 className="text-4xl font-bold text-white mb-4 leading-tight">{post.title}</h1>

        <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-500/30 rounded-full flex items-center justify-center text-sm font-bold text-indigo-300">
              {post.author.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-200">{post.author.name}</p>
              <p className="text-xs text-slate-500">
                {new Date(post.createdAt).toLocaleDateString('en-US', {
                  month: 'long', day: 'numeric', year: 'numeric'
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={post.status === 'published' ? 'badge-published' : 'badge-draft'}>
              {post.status}
            </span>
            {canEdit && (
              <Link to={`/posts/edit/${post._id}`} className="btn-ghost text-sm px-3 py-1.5">
                Edit
              </Link>
            )}
          </div>
        </div>

        <div className="mb-12">
          <ContentRenderer content={post.content} />
        </div>
        <div className="border-t border-slate-700/50 pt-10">
          <h2 className="text-xl font-bold text-white mb-6">
            Comments <span className="text-slate-500 font-normal text-base">({localComments.length})</span>
          </h2>

          {isAuthenticated ? (
            <form onSubmit={handleCommentSubmit} className="mb-8" noValidate>
              {commentError && (
                <div className="mb-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                  {commentError}
                </div>
              )}
              <textarea
                id="comment-input"
                rows={3}
                className={`input-field resize-none mb-3 ${errors.content ? 'border-red-500' : ''}`}
                placeholder="Share your thoughts..."
                value={values.content}
                onChange={handleChange('content')}
              />
              {errors.content && <p className="mb-2 text-xs text-red-400">{errors.content}</p>}
              <div className="flex justify-end">
                <button
                  id="submit-comment-btn"
                  type="submit"
                  disabled={addCommentApi.loading}
                  className="btn-primary flex items-center gap-2"
                >
                  {addCommentApi.loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : 'Post Comment'}
                </button>
              </div>
            </form>
          ) : (
            <div className="mb-8 p-4 glass-card text-center">
              <p className="text-slate-400 text-sm">
                <Link to="/login" className="text-indigo-400 hover:text-indigo-300">Sign in</Link> to leave a comment.
              </p>
            </div>
          )}

          {getCommentsApi.loading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="card animate-pulse h-20" />
              ))}
            </div>
          ) : localComments.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-6">No comments yet. Be the first!</p>
          ) : (
            <div className="space-y-4">
              {localComments.map((comment) => (
                <div key={comment._id} className="card">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-7 h-7 bg-indigo-500/20 rounded-full flex items-center justify-center text-xs font-bold text-indigo-300">
                      {comment.author.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-200">{comment.author.name}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(comment.createdAt).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed">{comment.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostDetail;
