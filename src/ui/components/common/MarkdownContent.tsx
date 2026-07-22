import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

const markdownComponents: Components = {
  h2: (props) => <h2 className="mb-2 mt-5 text-base font-semibold text-text first:mt-0" {...props} />,
  p: (props) => <p className="mb-3 text-sm leading-relaxed text-text-muted" {...props} />,
  ul: (props) => <ul className="mb-3 ml-5 list-disc text-sm leading-relaxed text-text-muted" {...props} />,
  ol: (props) => <ol className="mb-3 ml-5 list-decimal text-sm leading-relaxed text-text-muted" {...props} />,
  li: (props) => <li className="mb-1" {...props} />,
  strong: (props) => <strong className="font-semibold text-text" {...props} />,
  pre: (props) => <pre className="mb-3 overflow-x-auto rounded border border-border bg-bg-inset p-3 text-xs" {...props} />,
  code: (props) => <code className="font-mono text-text" {...props} />,
  table: (props) => (
    <div className="mb-3 overflow-x-auto rounded border border-border">
      <table className="w-full border-collapse text-left text-xs" {...props} />
    </div>
  ),
  th: (props) => <th className="border-b border-border bg-bg-hover p-2 font-semibold text-text" {...props} />,
  td: (props) => <td className="border-b border-border p-2 text-text-muted" {...props} />,
};

export function MarkdownContent({ children }: { children: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
      {children}
    </ReactMarkdown>
  );
}
