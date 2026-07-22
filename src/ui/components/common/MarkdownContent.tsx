import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import { highlightPython } from './pythonHighlight';

const markdownComponents: Components = {
  h2: (props) => <h2 className="mb-2 mt-5 text-base font-semibold text-text first:mt-0" {...props} />,
  p: (props) => <p className="mb-3 text-sm leading-relaxed text-text" {...props} />,
  ul: (props) => <ul className="mb-3 ml-5 list-disc text-sm leading-relaxed text-text" {...props} />,
  ol: (props) => <ol className="mb-3 ml-5 list-decimal text-sm leading-relaxed text-text" {...props} />,
  li: (props) => <li className="mb-1" {...props} />,
  strong: (props) => <strong className="font-semibold text-text" {...props} />,
  // VS Code's Dark+ editor background — visually continuous with the live
  // Monaco editor elsewhere in the app, which uses the same theme.
  pre: (props) => <pre className="mb-3 overflow-x-auto rounded border border-border bg-[#1e1e1e] p-3 text-xs leading-relaxed" {...props} />,
  code: ({ className, children }) => {
    const isFencedBlock = /language-/.test(className ?? '');
    const rawText = Array.isArray(children) ? children.join('') : children;
    if (!isFencedBlock || typeof rawText !== 'string') {
      return <code className="rounded bg-bg-inset px-1 py-0.5 font-mono text-[0.9em] text-text">{children}</code>;
    }
    const code = rawText.replace(/\n$/, '');
    return (
      <code className="font-mono">
        {highlightPython(code).map((token, index) =>
          token.className ? (
            <span key={index} className={token.className}>
              {token.text}
            </span>
          ) : (
            token.text
          ),
        )}
      </code>
    );
  },
  table: (props) => (
    <div className="mb-3 overflow-x-auto rounded border border-border">
      <table className="w-full border-collapse text-left text-xs" {...props} />
    </div>
  ),
  th: (props) => <th className="border-b border-border bg-bg-hover p-2 font-semibold text-text" {...props} />,
  td: (props) => <td className="border-b border-border p-2 text-text" {...props} />,
};

export function MarkdownContent({ children }: { children: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
      {children}
    </ReactMarkdown>
  );
}
