import { Link } from 'react-router-dom';
import { questions } from '../../content/registry';

export function QuestionListPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-1 text-xl font-semibold text-text">Linked List</h1>
      <p className="mb-6 text-sm text-text-muted">Pick a question and implement it from memory.</p>
      <ul className="flex flex-col gap-2">
        {questions.map((question) => (
          <li key={question.id}>
            <Link
              to={`/questions/${question.id}`}
              className="block rounded border border-border bg-bg-raised px-4 py-3 text-sm text-text transition-colors hover:border-accent"
            >
              {question.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
