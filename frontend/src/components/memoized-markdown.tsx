import { marked } from 'marked';
import { memo, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { cn } from '@/lib/utils';
import 'highlight.js/styles/github-dark.css';

function parseMarkdownIntoBlocks(markdown: string): string[] {
  const tokens = marked.lexer(markdown);
  return tokens.map(token => token.raw);
}

const MemoizedMarkdownBlock = memo(
  ({ content }: { content: string }) => {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // Inline code
          code: ({ node, inline, className, children, ...props }: any) => {
            if (inline) {
              return (
                <code
                  className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm text-foreground"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            // Block code
            return (
              <code
                className={cn('block rounded-lg bg-muted p-4 font-mono text-sm overflow-x-auto', className)}
                {...props}
              >
                {children}
              </code>
            );
          },
          // Links
          a: ({ node, ...props }: any) => (
            <a
              className="text-primary underline underline-offset-4 hover:text-primary/80"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),
          // Lists
          ul: ({ node, ...props }: any) => (
            <ul className="list-disc list-outside ml-4 space-y-1 my-2" {...props} />
          ),
          ol: ({ node, ...props }: any) => (
            <ol className="list-decimal list-outside ml-4 space-y-1 my-2" {...props} />
          ),
          // Paragraphs
          p: ({ node, ...props }: any) => (
            <p className="mb-2 last:mb-0" {...props} />
          ),
          // Headings
          h1: ({ node, ...props }: any) => (
            <h1 className="text-xl font-bold mt-4 mb-2 first:mt-0" {...props} />
          ),
          h2: ({ node, ...props }: any) => (
            <h2 className="text-lg font-bold mt-3 mb-2 first:mt-0" {...props} />
          ),
          h3: ({ node, ...props }: any) => (
            <h3 className="text-base font-bold mt-2 mb-1 first:mt-0" {...props} />
          ),
          // Blockquotes
          blockquote: ({ node, ...props }: any) => (
            <blockquote
              className="border-l-4 border-muted-foreground/30 pl-4 italic my-2"
              {...props}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    );
  },
  (prevProps, nextProps) => {
    if (prevProps.content !== nextProps.content) return false;
    return true;
  },
);

MemoizedMarkdownBlock.displayName = 'MemoizedMarkdownBlock';

export const MemoizedMarkdown = memo(
  ({ content, id }: { content: string; id: string }) => {
    const blocks = useMemo(() => parseMarkdownIntoBlocks(content), [content]);

    return (
      <div className="prose prose-sm dark:prose-invert max-w-none">
        {blocks.map((block, index) => (
          <MemoizedMarkdownBlock content={block} key={`${id}-block_${index}`} />
        ))}
      </div>
    );
  },
);

MemoizedMarkdown.displayName = 'MemoizedMarkdown';
