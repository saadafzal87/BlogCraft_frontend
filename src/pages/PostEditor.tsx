import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from '../hooks/useForm';
import { postSchema } from '../schemas';
import { postsService } from '../services/posts.service';
import { useApi } from '../hooks/useApi';
import BlockEditor, {
  blocksFromString,
  blocksToString,
} from '../components/editor/BlockEditor';
import type { ContentBlock } from '../components/editor/BlockEditor';

interface FormShape extends Record<string, unknown> {
  title: string;
  status: 'draft' | 'published';
  tags: string;
  content: string;
}

const PostEditor = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [serverError, setServerError] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<ContentBlock[]>(() =>
    blocksFromString('')
  );

  const getPostApi = useApi(postsService.getById);
  const createApi = useApi(postsService.create);
  const updateApi = useApi(postsService.update);

  const { values, errors, handleChange, validate, setValue } = useForm<FormShape>({
    title: '',
    status: 'draft',
    tags: '',
    content: '',
  });

  useEffect(() => {
    if (!id) return;
    getPostApi.execute(id).then((data) => {
      if (data) {
        const p = data.post;
        setValue('title', p.title);
        setValue('status', p.status);
        setValue('tags', p.tags.join(', '));
        setValue('content', p.content);
        setBlocks(blocksFromString(p.content));
      }
    }).catch(() => setServerError('Failed to load post.'));
  }, [id]);

  const handleBlocksChange = useCallback((next: ContentBlock[]) => {
    setBlocks(next);
    setValue('content', blocksToString(next));
  }, [setValue]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validate(postSchema)) return;

    const imagePublicIds = blocks
      .filter((b) => b.type === 'image')
      .map((b) => (b as { publicId: string }).publicId)
      .filter(Boolean);

    const tagsArray =
      typeof values.tags === 'string'
        ? values.tags
          .split(',')
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean)
        : (values.tags as unknown as string[]);

    const payload = {
      title: values.title,
      content: blocksToString(blocks),
      status: values.status,
      tags: tagsArray,
      images: imagePublicIds,
    };

    try {
      if (isEditing && id) {
        await updateApi.execute(id, payload);
      } else {
        await createApi.execute(payload);
      }
      navigate('/dashboard');
    } catch {
      setServerError('Failed to save post. Please try again.');
    }
  };

  const isBusy = createApi.loading || updateApi.loading;

  if (getPostApi.loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="btn-ghost p-2" type="button">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {isEditing ? 'Edit Post' : 'New Post'}
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Hover any paragraph and click the{' '}
                <span className="text-indigo-400">🖼 image button</span> to insert an
                image at that position
              </p>
            </div>
          </div>

          <span
            className={`text-xs font-medium px-3 py-1 rounded-full border ${values.status === 'published'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-slate-700/50 text-slate-400 border-slate-700'
              }`}
          >
            {values.status === 'published' ? '● Published' : '○ Draft'}
          </span>
        </div>

        {serverError && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>

          <div>
            <input
              id="post-title"
              type="text"
              autoComplete="off"
              className={`w-full bg-transparent text-3xl font-bold text-white placeholder-slate-700
                border-none outline-none focus:outline-none py-2 px-0 leading-tight
                ${errors.title ? 'text-red-300' : ''}`}
              placeholder="Post title…"
              value={values.title}
              onChange={handleChange('title')}
            />
            {errors.title && (
              <p className="mt-1 text-xs text-red-400">{errors.title}</p>
            )}
            <div className="border-b border-slate-800 mt-1" />
          </div>

          <div className={`card pt-6 pb-4 ${errors.content ? 'border-red-500/50' : ''}`}>
            <div className="flex items-center gap-2 mb-5 pb-3 border-b border-slate-800/60">
              <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Content
              </span>
              <span className="ml-auto text-xs text-slate-700">
                {blocks.filter((b) => b.type === 'image').length} image
                {blocks.filter((b) => b.type === 'image').length !== 1 ? 's' : ''} embedded
              </span>
            </div>
            <BlockEditor blocks={blocks} onChange={handleBlocksChange} />
            {errors.content && (
              <p className="mt-4 text-xs text-red-400">{errors.content}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="card">
              <label htmlFor="post-tags" className="block text-sm font-medium text-slate-300 mb-2">
                Tags
                <span className="text-slate-500 font-normal ml-2">(comma separated)</span>
              </label>
              <input
                id="post-tags"
                type="text"
                className="input-field"
                placeholder="react, typescript, tutorial"
                value={values.tags}
                onChange={handleChange('tags')}
              />
              <p className="mt-2 text-xs text-slate-600">Max 10 tags</p>
            </div>

            <div className="card">
              <label htmlFor="post-status" className="block text-sm font-medium text-slate-300 mb-2">
                Status
              </label>
              <select
                id="post-status"
                className="input-field"
                value={values.status}
                onChange={handleChange('status')}
              >
                <option value="draft">Draft — Save and edit later</option>
                <option value="published">Published — Visible to everyone</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-secondary"
              disabled={isBusy}
            >
              Cancel
            </button>
            <button
              id="submit-post-btn"
              type="submit"
              disabled={isBusy}
              className={`${values.status === 'published' ? 'btn-primary' : 'btn-secondary'
                } flex items-center justify-center gap-2 min-w-[130px]`}
            >
              {isBusy ? (
                <div
                  className={`w-4 h-4 border-2 rounded-full animate-spin ${values.status === 'published'
                      ? 'border-white/30 border-t-white'
                      : 'border-slate-500 border-t-slate-300'
                    }`}
                />
              ) : (
                <>
                  {values.status === 'published' ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                  )}
                  {values.status === 'published' ? 'Publish' : 'Save Draft'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostEditor;
