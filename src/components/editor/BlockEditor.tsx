import { useRef, useCallback } from 'react';
import { uploadService } from '../../services/upload.service';

export type TextBlock = {
  id: string;
  type: 'text';
  value: string;
};

export type ImageBlock = {
  id: string;
  type: 'image';
  url: string;
  publicId: string;
  caption: string;
  width?: number;
  height?: number;
  uploading?: boolean;
  error?: string;
};

export type ContentBlock = TextBlock | ImageBlock;

let _idCounter = 0;
const uid = () => `block-${Date.now()}-${_idCounter++}`;

export const blocksFromString = (raw: string): ContentBlock[] => {
  if (!raw) return [{ id: uid(), type: 'text', value: '' }];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((b) => ({ ...b, id: b.id || uid() }));
    }
  } catch { }
  return [{ id: uid(), type: 'text', value: raw }];
};

export const blocksToString = (blocks: ContentBlock[]): string => {
  const clean = blocks.map((b) => {
    if (b.type === 'image') {
      const { id: _id, uploading: _up, error: _err, ...rest } = b;
      return rest;
    } else {
      const { id: _id, ...rest } = b;
      return rest;
    }
  });
  return JSON.stringify(clean);
};


interface BlockEditorProps {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
}

const BlockEditor = ({ blocks, onChange }: BlockEditorProps) => {
  const blocksRef = useRef(blocks);
  blocksRef.current = blocks;

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const update = useCallback((next: ContentBlock[]) => {
    onChange(next);
  }, [onChange]);

  const handleTextChange = (id: string, value: string) => {
    update(blocksRef.current.map((b) => (b.id === id ? { ...b, value } : b)));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, index: number) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const newBlock: TextBlock = { id: uid(), type: 'text', value: '' };
      const next = [...blocksRef.current];
      next.splice(index + 1, 0, newBlock);
      update(next);
      setTimeout(() => {
        (document.getElementById(`block-text-${newBlock.id}`) as HTMLTextAreaElement)?.focus();
      }, 0);
    }
    if (e.key === 'Backspace') {
      const block = blocksRef.current[index] as TextBlock;
      if (block.value === '' && blocksRef.current.length > 1) {
        e.preventDefault();
        const next = blocksRef.current.filter((_, i) => i !== index);
        update(next);
        setTimeout(() => {
          const prevId = next[Math.max(0, index - 1)]?.id;
          (document.getElementById(`block-text-${prevId}`) as HTMLTextAreaElement)?.focus();
        }, 0);
      }
    }
  };

  const insertImagesAfter = (afterIndex: number, files: File[]) => {
    const placeholders: ImageBlock[] = files.map((f) => ({
      id: uid(),
      type: 'image',
      url: URL.createObjectURL(f),
      publicId: '',
      caption: '',
      uploading: true,
    }));

    const trailingText: TextBlock = { id: uid(), type: 'text', value: '' };
    const next = [...blocksRef.current];
    next.splice(afterIndex + 1, 0, ...placeholders, trailingText);
    update(next);
    placeholders.forEach((placeholder, fi) => {
      uploadService
        .uploadImages([files[fi]])
        .then(([img]) => {
          update(
            blocksRef.current.map((b) => {
              if (b.id !== placeholder.id) return b;
              return {
                ...b,
                url: img.url,
                publicId: img.publicId,
                width: img.width,
                height: img.height,
                uploading: false,
                error: undefined,
              } as ImageBlock;
            })
          );
        })
        .catch((err: Error) => {
          update(
            blocksRef.current.map((b) =>
              b.id !== placeholder.id
                ? b
                : { ...b, uploading: false, error: err.message || 'Upload failed' }
            )
          );
        });
    });
  };

  const handleFileInput = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    e.target.value = '';
    insertImagesAfter(index, files);
  };

  const removeBlock = (id: string) => {
    const blk = blocksRef.current.find((b) => b.id === id) as ImageBlock | undefined;
    if (blk?.publicId) {
      uploadService.deleteImage(blk.publicId).catch(() => null);
    }
    const next = blocksRef.current.filter((b) => b.id !== id);
    update(next.length > 0 ? next : [{ id: uid(), type: 'text', value: '' }]);
  };

  const handleCaptionChange = (id: string, caption: string) => {
    update(blocksRef.current.map((b) => (b.id === id ? { ...b, caption } : b)));
  };

  const moveBlock = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= blocksRef.current.length) return;
    const next = [...blocksRef.current];
    [next[index], next[target]] = [next[target], next[index]];
    update(next);
  };

  return (
    <div className="space-y-0.5 pl-10">
      {blocks.map((block, index) => (
        <div key={block.id} className="group/block relative">
          {block.type === 'text' ? (
            <>
              <div className="absolute -left-10 top-0.5 opacity-0 group-hover/block:opacity-100 transition-opacity">
                <button
                  type="button"
                  title="Insert image here"
                  onClick={() => fileInputRefs.current[block.id]?.click()}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-indigo-600 border border-slate-700 hover:border-indigo-500 flex items-center justify-center text-slate-500 hover:text-white transition-all shadow-md"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
              <input
                ref={(el) => { fileInputRefs.current[block.id] = el; }}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                className="hidden"
                onChange={(e) => handleFileInput(index, e)}
              />
              <AutoResizeTextarea
                id={`block-text-${block.id}`}
                value={block.value}
                placeholder={
                  index === 0
                    ? 'Start writing your post… (Shift+Enter for line break)'
                    : 'Continue writing…'
                }
                onChange={(v) => handleTextChange(block.id, v)}
                onKeyDown={(e) => handleKeyDown(e, index)}
              />
            </>
          ) : (
            <ImageBlockView
              block={block as ImageBlock}
              index={index}
              total={blocks.length}
              onRemove={() => removeBlock(block.id)}
              onCaptionChange={(cap) => handleCaptionChange(block.id, cap)}
              onMoveUp={() => moveBlock(index, -1)}
              onMoveDown={() => moveBlock(index, 1)}
            />
          )}
        </div>
      ))}
      <div className="flex items-center gap-3 pt-4 border-t border-slate-800/60 mt-2">
        <label className="flex items-center gap-2 text-xs text-slate-500 hover:text-indigo-400 cursor-pointer transition-colors group/add">
          <div className="w-6 h-6 rounded-full border border-dashed border-slate-700 group-hover/add:border-indigo-500 flex items-center justify-center transition-colors">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          Add image at end
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              if (files.length) { e.target.value = ''; insertImagesAfter(blocks.length - 1, files); }
            }}
          />
        </label>
        <span className="text-slate-700">·</span>
        <span className="text-xs text-slate-700">Hover a paragraph to insert image beside it</span>
      </div>
    </div>
  );
};

interface AutoResizeProps {
  id?: string;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

const AutoResizeTextarea = ({ id, value, placeholder, onChange, onKeyDown }: AutoResizeProps) => {
  const ref = useRef<HTMLTextAreaElement>(null);

  const autoResize = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };

  return (
    <textarea
      id={id}
      ref={ref}
      value={value}
      placeholder={placeholder}
      rows={1}
      onInput={autoResize}
      onFocus={autoResize}
      onChange={(e) => { onChange(e.target.value); }}
      onKeyDown={onKeyDown}
      className="w-full bg-transparent text-slate-200 placeholder-slate-600 text-[1rem] leading-[1.8] resize-none border-none outline-none focus:outline-none py-1 px-0 min-h-[2rem]"
      style={{ overflow: 'hidden' }}
    />
  );
};

interface ImageBlockViewProps {
  block: ImageBlock;
  index: number;
  total: number;
  onRemove: () => void;
  onCaptionChange: (cap: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

const ImageBlockView = ({
  block, index, total, onRemove, onCaptionChange, onMoveUp, onMoveDown,
}: ImageBlockViewProps) => (
  <div className="relative group/img my-3 rounded-xl overflow-hidden border border-slate-700/50 bg-slate-900/40">
    {/* Top-right action buttons */}
    <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover/img:opacity-100 transition-all duration-200 z-10">
      {index > 0 && (
        <ActionButton title="Move up" onClick={onMoveUp}>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
          </svg>
        </ActionButton>
      )}
      {index < total - 1 && (
        <ActionButton title="Move down" onClick={onMoveDown}>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </ActionButton>
      )}
      <ActionButton title="Remove image" onClick={onRemove} danger>
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </ActionButton>
    </div>

    {block.uploading ? (
      <div className="h-48 flex flex-col items-center justify-center gap-3 bg-slate-800/60">
        <div className="relative">
          <div className="w-10 h-10 border-2 border-slate-700 rounded-full" />
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin absolute inset-0" />
        </div>
        <p className="text-xs text-slate-500 animate-pulse">Uploading to Cloudinary…</p>
      </div>
    ) : block.error ? (
      <div className="h-32 flex flex-col items-center justify-center gap-2 bg-red-950/30">
        <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="text-xs text-red-400">{block.error}</p>
      </div>
    ) : (
      <img
        src={block.url}
        alt={block.caption || 'Post image'}
        className="w-full max-h-[560px] object-contain bg-slate-950/40"
      />
    )}

    {!block.uploading && !block.error && (
      <div className="px-4 py-2 border-t border-slate-800/60">
        <input
          type="text"
          value={block.caption}
          onChange={(e) => onCaptionChange(e.target.value)}
          placeholder="Add a caption (optional)…"
          className="w-full bg-transparent text-xs text-slate-500 placeholder-slate-700 border-none outline-none focus:outline-none text-center italic"
        />
      </div>
    )}
  </div>
);

const ActionButton = ({
  children, title, onClick, danger,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  danger?: boolean;
}) => (
  <button
    type="button"
    title={title}
    onClick={onClick}
    className={`w-7 h-7 rounded-lg backdrop-blur-sm border flex items-center justify-center transition-all shadow-md
      ${danger
        ? 'bg-slate-900/90 border-slate-700 text-slate-400 hover:text-red-400 hover:border-red-500'
        : 'bg-slate-900/90 border-slate-700 text-slate-300 hover:text-white hover:border-indigo-500'
      }`}
  >
    {children}
  </button>
);

export default BlockEditor;
