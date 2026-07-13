import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { questions } from '../../content/registry';
import { buildTodaysReview, pickReviewQuestion, type DueReviewItem } from '../../engine/srs/queue';
import { localDateIso } from '../../engine/srs/streaks';
import { storageAdapter } from '../storageAdapter';
import { useQuestionPlayer } from '../hooks/useQuestionPlayer';
import { QuestionPlayerLayout } from '../components/question/QuestionPlayerLayout';
import { AppNav } from '../components/common/AppNav';
import type { CodeQuestion } from '../../content/types';

export function ReviewPage() {
  const [queue, setQueue] = useState<DueReviewItem[] | null>(null);
  const [picks, setPicks] = useState<(CodeQuestion | null)[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([storageAdapter.getReviewRecords(), storageAdapter.getMastery(), storageAdapter.getAttempts()]).then(
      ([reviewRecords, masteryRecords, attempts]) => {
        if (cancelled) return;
        const masteryBySkill = new Map(masteryRecords.map((m) => [m.skillId, m]));
        const today = localDateIso(new Date());
        const dueItems = buildTodaysReview(reviewRecords, masteryBySkill, today);
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
        <div className="mx-auto max-w-2xl px-6 py-10">
          <h1 className="mb-2 text-xl font-semibold text-text">Today's Review</h1>
          <p className="text-sm text-text-muted">Nothing due today. Come back tomorrow.</p>
        </div>
      </div>
    );
  }

  if (currentIndex >= queue.length) {
    return (
      <div>
        <AppNav />
        <div className="mx-auto max-w-2xl px-6 py-10">
          <h1 className="mb-2 text-xl font-semibold text-text">You're done for today</h1>
          <p className="mb-6 text-sm text-text-muted">
            Reviewed {queue.length} skill{queue.length === 1 ? '' : 's'}.
          </p>
          <Link to="/dashboard" className="inline-block rounded bg-accent px-4 py-2 text-sm font-medium text-white">
            Back to dashboard
          </Link>
        </div>
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

  return (
    <QuestionPlayerLayout
      question={currentQuestion}
      player={player}
      headerLeft={
        <Link to="/dashboard" className="text-sm text-text-muted hover:text-accent">
          ← Dashboard
        </Link>
      }
      headerRight={
        <span className="text-xs uppercase tracking-wide text-text-muted">
          Review — {currentIndex + 1} of {queue.length}
        </span>
      }
      footer={
        hasSubmitted && (
          <button
            type="button"
            onClick={() => setCurrentIndex((i) => i + 1)}
            className="mt-4 rounded bg-accent px-4 py-2 text-sm font-medium text-white"
          >
            {isLastItem ? 'Finish review →' : 'Next review →'}
          </button>
        )
      }
    />
  );
}
