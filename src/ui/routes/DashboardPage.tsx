import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { modules, questions, getQuestion, allSkillIds } from '../../content/registry';
import { computeModuleMastery, computeSkillScore } from '../../engine/mastery/mastery';
import { buildTodaysReview } from '../../engine/srs/queue';
import { currentStreak, localDateIso, longestStreak } from '../../engine/srs/streaks';
import { storageAdapter } from '../storageAdapter';
import { ProgressRing } from '../components/common/ProgressRing';
import { AppNav } from '../components/common/AppNav';
import { StreakCalendar } from '../components/common/StreakCalendar';
import type { Attempt, ReviewRecord } from '../../storage/types';

interface DashboardData {
  attempts: Attempt[];
  dayLog: string[];
  reviewRecords: ReviewRecord[];
}

const WEAKEST_SKILLS_LIMIT = 5;
const RECENT_ATTEMPTS_LIMIT = 10;

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([storageAdapter.getAttempts(), storageAdapter.getDayLog(), storageAdapter.getReviewRecords()]).then(
      ([attempts, dayLog, reviewRecords]) => {
        if (cancelled) return;
        setData({ attempts, dayLog, reviewRecords });
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  if (!data) {
    return (
      <div>
        <AppNav />
        <div className="mx-auto max-w-2xl px-6 py-10">
          <p className="text-text-muted">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  const skillById = new Map(modules.flatMap((m) => m.skills).map((s) => [s.id, s]));
  const today = localDateIso(new Date());
  const attemptedQuestionIds = new Set(data.attempts.map((a) => a.questionId));

  const current = currentStreak(data.dayLog, today);
  const longest = longestStreak(data.dayLog);
  const skillScores = new Map(allSkillIds.map((id) => [id, computeSkillScore(id, questions, data.attempts)]));
  const dueToday = buildTodaysReview(data.reviewRecords, skillScores, today, allSkillIds, Number.MAX_SAFE_INTEGER);

  const weakestSkills = allSkillIds
    .filter((skillId) => questions.some((q) => q.skillIds.includes(skillId) && attemptedQuestionIds.has(q.id)))
    .map((skillId) => ({ skillId, score: skillScores.get(skillId) ?? 0 }))
    .sort((a, b) => a.score - b.score)
    .slice(0, WEAKEST_SKILLS_LIMIT);

  const recentAttempts = data.attempts
    .slice()
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, RECENT_ATTEMPTS_LIMIT);

  const dataStructureModules = modules.filter((m) => m.kind === 'data_structure');
  const algorithmModules = modules.filter((m) => m.kind === 'algorithm');

  return (
    <div>
      <AppNav />
      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="mb-1 text-xl font-semibold text-text">Dashboard</h1>
        <p className="mb-8 text-sm text-text-muted">Your mastery, streaks, and what to work on next.</p>

        <section className="mb-8 rounded-lg border border-border bg-bg-raised p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-8">
              <div>
                <p className="text-2xl font-semibold text-text">
                  {current} <span className="text-base font-normal text-text-muted">day{current === 1 ? '' : 's'}</span>
                </p>
                <p className="text-xs text-text-muted">Current streak</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-text">
                  {longest} <span className="text-base font-normal text-text-muted">day{longest === 1 ? '' : 's'}</span>
                </p>
                <p className="text-xs text-text-muted">Longest streak</p>
              </div>
            </div>
            <Link
              to="/review"
              className="rounded border border-border bg-bg px-3 py-2 text-sm text-text transition-colors duration-200 ease-out-motion hover:border-accent hover:bg-bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <span className="font-semibold text-accent">{dueToday.length}</span> due today — start review →
            </Link>
          </div>
          <StreakCalendar dayLog={data.dayLog} today={new Date()} />
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">Mastery by module</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="mb-2 text-xs font-semibold text-accent">Data Structures</p>
              <ul className="flex flex-col gap-2">
                {dataStructureModules.map((module) => (
                  <li key={module.id}>
                    <Link
                      to={`/modules/${module.id}`}
                      className="flex items-center gap-2 rounded border border-border bg-bg-raised px-3 py-2 text-sm text-text transition-colors duration-200 ease-out-motion hover:border-accent hover:bg-bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      <ProgressRing progress={computeModuleMastery(module, data.attempts, false)} size="sm" />
                      <span className="truncate">{module.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold text-accent-secondary">Algorithms</p>
              <ul className="flex flex-col gap-2">
                {algorithmModules.map((module) => (
                  <li key={module.id}>
                    <Link
                      to={`/modules/${module.id}`}
                      className="flex items-center gap-2 rounded border border-border bg-bg-raised px-3 py-2 text-sm text-text transition-colors duration-200 ease-out-motion hover:border-accent hover:bg-bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      <ProgressRing progress={computeModuleMastery(module, data.attempts, false)} size="sm" />
                      <span className="truncate">{module.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">Weakest skills</h2>
          {weakestSkills.length === 0 ? (
            <p className="text-sm text-text-muted">No attempts yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {weakestSkills.map((m) => (
                <li
                  key={m.skillId}
                  className="flex items-center justify-between rounded border border-border bg-bg-raised px-3 py-2 text-sm"
                >
                  <span className="text-text">{skillById.get(m.skillId)?.title ?? m.skillId}</span>
                  <span className="text-text-muted">{Math.round(m.score * 100)}%</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">Recent attempts</h2>
          {recentAttempts.length === 0 ? (
            <p className="text-sm text-text-muted">No attempts yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {recentAttempts.map((attempt) => (
                <li
                  key={attempt.id}
                  className="flex items-center justify-between rounded border border-border bg-bg-raised px-3 py-2 text-sm"
                >
                  <span className="text-text">{getQuestion(attempt.questionId)?.title ?? attempt.questionId}</span>
                  <span className="text-text-muted">
                    {attempt.scorecard.overall} · {new Date(attempt.createdAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
