import type { ContentBlock } from './BlockEditor';

interface ContentRendererProps {
  content: string;
  className?: string;
}

const parseContent = (raw: string): ContentBlock[] | null => {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch { }
  return null;
};

const ContentRenderer = ({ content, className = '' }: ContentRendererProps) => {
  const blocks = parseContent(content);

  if (blocks) {
    return (
      <div className={`space-y-4 ${className}`}>
        {blocks.map((block, i) => {
          if (block.type === 'text') {
            const lines = block.value.split('\n');
            return (
              <div key={i} className="space-y-1">
                {lines.map((line, li) =>
                  line.trim() ? (
                    <p key={li} className="text-slate-300 leading-[1.8] text-base">
                      {line}
                    </p>
                  ) : (
                    <br key={li} />
                  )
                )}
              </div>
            );
          }

          if (block.type === 'image') {
            return (
              <figure key={i} className="my-6">
                <img
                  src={block.url}
                  alt={block.caption || 'Post image'}
                  className="w-full max-h-[600px] object-contain rounded-xl border border-slate-700/50 bg-slate-900/40"
                  loading="lazy"
                />
                {block.caption && (
                  <figcaption className="mt-2 text-center text-xs text-slate-500 italic">
                    {block.caption}
                  </figcaption>
                )}
              </figure>
            );
          }

          return null;
        })}
      </div>
    );
  }

  return (
    <div className={`space-y-1 ${className}`}>
      {content.split('\n').map((line, i) =>
        line.trim() ? (
          <p key={i} className="text-slate-300 leading-[1.8] text-base">
            {line}
          </p>
        ) : (
          <br key={i} />
        )
      )}
    </div>
  );
};

export const getExcerpt = (content: string, maxLength = 200): string => {
  try {
    const blocks: ContentBlock[] = JSON.parse(content);
    if (Array.isArray(blocks)) {
      const textParts = blocks
        .filter((b) => b.type === 'text')
        .map((b) => (b as { value: string }).value)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      return textParts.length > maxLength
        ? textParts.substring(0, maxLength) + '…'
        : textParts;
    }
  } catch { /* not JSON */ }
  return content.replace(/[#*`_]/g, '').substring(0, maxLength) + '…';
};


export const getCoverImage = (content: string): string | null => {
  try {
    const blocks: ContentBlock[] = JSON.parse(content);
    if (Array.isArray(blocks)) {
      const img = blocks.find((b) => b.type === 'image') as
        | { url: string }
        | undefined;
      return img?.url ?? null;
    }
  } catch { /* not JSON */ }
  return null;
};

export default ContentRenderer;
