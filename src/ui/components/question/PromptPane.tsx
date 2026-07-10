import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import type { CodeQuestion } from '../../../content/types';

const markdownComponents: Components = {
  h2: (props) => <h2 className="mb-2 mt-4 text-base font-semibold text-text first:mt-0" {...props} />,
  p: (props) => <p className="mb-3 text-sm leading-relaxed text-text-muted" {...props} />,
  pre: (props) => (
    <pre className="mb-3 overflow-x-auto rounded bg-bg-inset p-3 text-xs" {...props} />
  ),
  code: (props) => <code className="font-mono text-text" {...props} />,
};

export function PromptPane({ question }: { question: CodeQuestion }) {
  return (
    <div>
      <ReactMarkdown components={markdownComponents}>{question.prompt}</ReactMarkdown>
    </div>
  );
}
