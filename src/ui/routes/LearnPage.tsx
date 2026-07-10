import { Link } from 'react-router-dom';
import { getModule } from '../../content/registry';
import { MarkdownContent } from '../components/common/MarkdownContent';

const MODULE_ID = 'linked-list';

export function LearnPage() {
  const module = getModule(MODULE_ID);
  const learnStage = module?.stages.find((stage) => stage.type === 'learn');

  if (!module || !learnStage) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-10">
        <p className="text-text">Learn content not found.</p>
        <Link to="/" className="text-accent">
          Back to list
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <Link to="/" className="text-sm text-text-muted hover:text-accent">
        ← All questions
      </Link>
      <h1 className="mb-1 mt-4 text-xl font-semibold text-text">{module.title}: Learn</h1>
      <p className="mb-8 text-sm text-text-muted">{module.summary}</p>
      <div className="flex flex-col gap-8">
        {learnStage.items.map((item) =>
          item.type === 'lesson' ? (
            <article key={item.lesson.id} className="rounded border border-border bg-bg-raised p-5">
              <MarkdownContent>{item.lesson.body}</MarkdownContent>
            </article>
          ) : null,
        )}
      </div>
      <Link
        to="/guided-build/1"
        className="mt-8 inline-block rounded bg-accent px-4 py-2 text-sm font-medium text-white"
      >
        Continue to Guided Build →
      </Link>
    </div>
  );
}
