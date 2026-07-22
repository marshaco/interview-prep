import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { buildTodaysReview, pickReviewQuestion, type DueReviewItem } from '../../engine/srs/queue';
import { localDateIso } from '../../engine/srs/streaks';
import { masteryStars } from '../../engine/mastery/mastery';
import { modules, questions, allSkillIds } from '../../content/registry';
import { storageAdapter } from '../storageAdapter';
import { useQuestionPlayer } from '../hooks/useQuestionPlayer';
import { QuestionPlayerLayout } from '../components/question/QuestionPlayerLayout';
import { AppNav } from '../components/common/AppNav';
import { EmptyState } from '../components/common/EmptyState';
import type { CodeQuestion, SkillId } from '../../content/types';
import type { SkillMastery } from '../../storage/types';

const skillById = new Map(modules.flatMap((m) => m.skills).map((s) => [s.id, s]));

export function ReviewPage() {
  const [queue, setQueue] = useState<DueReviewItem[] | null>(null);
  const [picks, setPicks] = useState<(CodeQuestion | null)[]>([]);
  const [masteryBySkill, setMasteryBySkill] = useState<ReadonlyMap<SkillId, SkillMastery>>(new Map());
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([storageAdapter.getReviewRecords(), storageAdapter.getMastery(), storageAdapter.getAttempts()]).then(
      ([reviewRecords, masteryRecords, attempts]) => {
        if (cancelled) return;
        const bySkill = new Map(masteryRecords.map((m) => [m.skillId, m]));
        const today = localDateIso(new Date());
        const dueItems = buildTodaysReview(reviewRecords, bySkill, today, allSkillIds);
        setMasteryBySkill(bySkill);
        setQueue(dueItems);
        setPicks(dueItems.map((item) => pickReviewQuestion(item.skillId, questions, attempts)));
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const currentQuestion = picks[currentIndex] ?? undefined;
  const player = useQuestionPlayer(currentQuestion);

  if (queue === null) {
    return (
      <div>
        <AppNav />
        <div className="mx-auto max-w-2xl px-6 py-10">
          <p className="text-text-muted">Loading today's review…</p>
        </div>
      </div>
    );
  }

  if (queue.length === 0) {
    return (
      <div>
        <AppNav />
        <EmptyState title="Today's Review" description="Nothing due today. Come back tomorrow." />
      </div>
    );
  }

  if (currentIndex >= queue.length) {
    return (
      <div>
        <AppNav />
        <EmptyState
          title="You're done for today"
          description={`Reviewed ${queue.length} skill${queue.length === 1 ? '' : 's'}.`}
          actionLabel="Back to dashboard"
          actionHref="/dashboard"
        />
      </div>
    );
  }

  if (!currentQuestion) {
    // No question exercises this due skill — a content gap, not a user error. Skip it.
    setCurrentIndex((i) => i + 1);
    return null;
  }

  const hasSubmitted = player.playerResult?.scorecard !== undefined;
  const isLastItem = currentIndex === queue.length - 1;
  const progressPct = Math.round((currentIndex / queue.length) * 100);

  return (
    <QuestionPlayerLayout
      question={currentQuestion}
      player={player}
      headerLeft={
        <Link
          to="/dashboard"
          className="text-sm text-text-muted transition-colors duration-200 ease-out-motion hover:text-accent"
        >
          ← Dashboard
        </Link>
      }
      headerRight={
        <span className="text-xs uppercase tracking-wide text-text-muted">
          Review — {currentIndex + 1} of {queue.length}
        </span>
      }
      subHeader={
        <div className="border-b border-border bg-bg-inset px-4 py-2">
          <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-accent-solid transition-all duration-300 ease-out-motion"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {queue.map((item, index) => {
              const skill = skillById.get(item.skillId);
              const mastery = masteryBySkill.get(item.skillId);
              const isCurrent = index === currentIndex;
              const isDone = index < currentIndex;
              return (
                <div
                  key={`${item.skillId}-${index}`}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs whitespace-nowrap ${
                    isCurrent
                      ? 'border-accent bg-accent-muted text-text'
                      : isDone
                        ? 'border-border text-text-muted opacity-60'
                        : 'border-border text-text-muted'
                  }`}
                >
                  {isDone && <span className="text-success">✓</span>}
                  <span>{skill?.title ?? item.skillId}</span>
                  <span className="text-accent">{'★'.repeat(mastery ? masteryStars(mastery) : 0)}</span>
                </div>
              );
            })}
          </div>
        </div>
      }
      footer={
        hasSubmitted && (
          <button
            type="button"
            onClick={() => setCurrentIndex((i) => i + 1)}
            className="mt-4 rounded bg-accent-solid px-4 py-2 text-sm font-medium text-white transition-colors duration-200 ease-out-motion hover:bg-accent-solid/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {isLastItem ? 'Finish review →' : 'Next review →'}
          </button>
        )
      }
    />
  );
}
