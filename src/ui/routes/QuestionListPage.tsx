import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { questions } from '../../content/registry';
import { masteryStars } from '../../engine/mastery/mastery';
import { storageAdapter } from '../storageAdapter';
import { StarRating } from '../components/common/StarRating';
import type { SkillId } from '../../content/types';

export function QuestionListPage() {
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

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-1 text-xl font-semibold text-text">Linked List</h1>
      <p className="mb-6 text-sm text-text-muted">Pick a question and implement it from memory.</p>
      <ul className="flex flex-col gap-2">
        {questions.map((question) => {
          // Every current question maps to exactly one skill; a question
          // touching multiple skills would need a real aggregation rule.
          const stars = starsBySkill.get(question.skillIds[0] ?? '') ?? 0;
          return (
            <li key={question.id}>
              <Link
                to={`/questions/${question.id}`}
                className="flex items-center justify-between rounded border border-border bg-bg-raised px-4 py-3 text-sm text-text transition-colors hover:border-accent"
              >
                <span>{question.title}</span>
                <StarRating stars={stars} />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
