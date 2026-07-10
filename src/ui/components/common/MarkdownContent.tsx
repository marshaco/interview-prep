import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

const markdownComponents: Components = {
  h2: (props) => <h2 className="mb-2 mt-4 text-base font-semibold text-text first:mt-0" {...props} />,
  p: (props) => <p className="mb-3 text-sm leading-relaxed text-text-muted" {...props} />,
  pre: (props) => <pre className="mb-3 overflow-x-auto rounded bg-bg-inset p-3 text-xs" {...props} />,
  code: (props) => <code className="font-mono text-text" {...props} />,
  table: (props) => (
    <div className="mb-3 overflow-x-auto">
      <table className="w-full border-collapse text-left text-xs" {...props} />
    </div>
  ),
  th: (props) => <th className="border-b border-border p-2 font-semibold text-text" {...props} />,
  td: (props) => <td className="border-b border-border p-2 text-text-muted" {...props} />,
};

export function MarkdownContent({ children }: { children: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
      {children}
    </ReactMarkdown>
  );
}
