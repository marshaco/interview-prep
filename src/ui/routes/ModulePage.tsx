import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getModule, getQuestion } from '../../content/registry';
import { masteryStars } from '../../engine/mastery/mastery';
import { storageAdapter } from '../storageAdapter';
import { StarRating } from '../components/common/StarRating';
import { AppNav } from '../components/common/AppNav';
import type { Attempt, SkillMastery } from '../../storage/types';
import type { QuestionId, SkillId, StageType } from '../../content/types';

const STAGE_LINKS: Partial<Record<StageType, string>> = {
  learn: '/learn',
  guided_build: '/guided-build/1',
};

function isSolved(attempts: Attempt[], questionId: QuestionId): boolean {
  return attempts.some((a) => a.questionId === questionId && a.scorecard.overall === 100);
}

export function ModulePage() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const module = moduleId ? getModule(moduleId) : undefined;

  const [masteryBySkill, setMasteryBySkill] = useState<ReadonlyMap<SkillId, SkillMastery>>(new Map());
  const [attempts, setAttempts] = useState<Attempt[]>([]);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([storageAdapter.getMastery(), storageAdapter.getAttempts()]).then(([mastery, allAttempts]) => {
      if (cancelled) return;
      setMasteryBySkill(new Map(mastery.map((record) => [record.skillId, record])));
      setAttempts(allAttempts);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!module) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-10">
        <p className="text-text">Module not found.</p>
        <Link to="/" className="text-accent">
          ← Roadmap
        </Link>
      </div>
    );
  }

  const category = module.kind === 'data_structure' ? 'Data Structures' : 'Algorithms';
  const accentClass = category === 'Data Structures' ? 'text-accent' : 'text-accent-secondary';

  return (
    <div className="mx-auto max-w-2xl">
      <AppNav />
      <div className="px-6 py-10">
      <Link to="/" className="text-sm text-text-muted hover:text-accent">
        ← Roadmap
      </Link>
      <p className={`mt-4 text-xs font-semibold uppercase tracking-wide ${accentClass}`}>{category}</p>
      <h1 className="mb-1 text-xl font-semibold text-text">{module.title}</h1>
      <p className="mb-8 text-sm text-text-muted">{module.summary}</p>

      {module.stages.map((stage) => {
        const questionItems = stage.items.filter((item) => item.type === 'question');
        const solvedCount = questionItems.filter((item) => isSolved(attempts, item.questionId)).length;
        const hasContent = stage.items.length > 0;
        const stageLink = STAGE_LINKS[stage.type];

        return (
          <section key={stage.type} className="mb-8">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-text-muted">{stage.title}</h2>
              {questionItems.length > 0 && (
                <span className="text-xs text-text-muted">
                  {solvedCount}/{questionItems.length} solved
                </span>
              )}
            </div>

            {!hasContent && <p className="text-sm text-text-muted">Content coming soon.</p>}

            {hasContent && stageLink && (
              <Link
                to={stageLink}
                className="block rounded border border-border bg-bg-raised px-4 py-3 text-sm text-text transition-colors hover:border-accent"
              >
                {stage.type === 'learn' ? 'Start Learn' : `Start ${stage.title} (${questionItems.length} steps)`}
              </Link>
            )}

            {hasContent && !stageLink && questionItems.length > 0 && (
              <ul className="flex flex-col gap-2">
                {questionItems.map((item) => {
                  const question = getQuestion(item.questionId);
                  if (!question) return null;
                  const stars = masteryBySkill.get(question.skillIds[0] ?? '');
                  return (
                    <li key={item.questionId}>
                      <Link
                        to={`/questions/${item.questionId}`}
                        className="flex items-center justify-between rounded border border-border bg-bg-raised px-4 py-3 text-sm text-text transition-colors hover:border-accent"
                      >
                        <span>{question.title}</span>
                        <StarRating stars={stars ? masteryStars(stars) : 0} />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}
      </div>
    </div>
  );
}
