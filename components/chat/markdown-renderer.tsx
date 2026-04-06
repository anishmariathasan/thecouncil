'use client';

import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import 'katex/dist/katex.min.css';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none break-words">
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeHighlight]}
        components={{
          pre({ children, ...props }) {
            return (
              <pre className="relative rounded-lg bg-muted p-4 overflow-x-auto" {...props}>
                {children}
              </pre>
            );
          },
          code({ children, className, ...props }) {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono" {...props}>
                  {children}
                </code>
              );
            }
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          a({ href, children, ...props }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-4 hover:text-primary/80"
                {...props}
              >
                {children}
              </a>
            );
          },
          table({ children, ...props }) {
            return (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse" {...props}>
                  {children}
                </table>
              </div>
            );
          },
        }}
      />
    </div>
  );
}
