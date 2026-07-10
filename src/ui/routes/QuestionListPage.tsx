import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getModule, getQuestion } from '../../content/registry';
import { masteryStars } from '../../engine/mastery/mastery';
import { storageAdapter } from '../storageAdapter';
import { StarRating } from '../components/common/StarRating';
import type { SkillId } from '../../content/types';

const MODULE_ID = 'linked-list';

export function QuestionListPage() {
  const module = getModule(MODULE_ID);
  const [starsBySkill, setStarsBySkill] = useState<ReadonlyMap<SkillId, number>>(new Map());

  useEffect(() => {
    let cancelled = false;
    void storageAdapter.getMastery().then((records) => {
      if (cancelled) return;
      setStarsBySkill(new Map(records.map((record) => [record.skillId, masteryStars(record)])));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!module) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-10">
        <p className="text-text">Module not found.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-1 text-xl font-semibold text-text">{module.title}</h1>
      <p className="mb-8 text-sm text-text-muted">{module.summary}</p>

      {module.stages.map((stage) => (
        <section key={stage.type} className="mb-8">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">{stage.title}</h2>

          {stage.type === 'learn' && (
            <Link
              to="/learn"
              className="block rounded border border-border bg-bg-raised px-4 py-3 text-sm text-text transition-colors hover:border-accent"
            >
              Start Learn
            </Link>
          )}

          {stage.type === 'guided_build' && (
            <Link
              to="/guided-build/1"
              className="block rounded border border-border bg-bg-raised px-4 py-3 text-sm text-text transition-colors hover:border-accent"
            >
              Start Guided Build ({stage.items.filter((item) => item.type === 'question').length} steps)
            </Link>
          )}

          {(stage.type === 'independent_build' || stage.type === 'method_drills') && (
            <ul className="flex flex-col gap-2">
              {stage.items.map((item) => {
                if (item.type !== 'question') return null;
                const question = getQuestion(item.questionId);
                if (!question) return null;
                const stars = starsBySkill.get(question.skillIds[0] ?? '') ?? 0;
                return (
                  <li key={item.questionId}>
                    <Link
                      to={`/questions/${item.questionId}`}
                      className="flex items-center justify-between rounded border border-border bg-bg-raised px-4 py-3 text-sm text-text transition-colors hover:border-accent"
                    >
                      <span>{question.title}</span>
                      <StarRating stars={stars} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
