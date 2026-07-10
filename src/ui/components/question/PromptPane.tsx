import type { CodeQuestion } from '../../../content/types';
import { MarkdownContent } from '../common/MarkdownContent';

export function PromptPane({ question }: { question: CodeQuestion }) {
  return (
    <div>
      <MarkdownContent>{question.prompt}</MarkdownContent>
    </div>
  );
}
