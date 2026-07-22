import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { modules, getQuestion, allSkillIds } from '../../content/registry';
import { masteryStars, moduleProgress } from '../../engine/mastery/mastery';
import { buildTodaysReview } from '../../engine/srs/queue';
import { currentStreak, localDateIso, longestStreak } from '../../engine/srs/streaks';
import { storageAdapter } from '../storageAdapter';
import { ProgressRing } from '../components/common/ProgressRing';
import { StarRating } from '../components/common/StarRating';
import { AppNav } from '../components/common/AppNav';
import { StreakCalendar } from '../components/common/StreakCalendar';
import type { Attempt, ReviewRecord, SkillMastery } from '../../storage/types';
import type { SkillId } from '../../content/types';

interface DashboardData {
  mastery: SkillMastery[];
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
    void Promise.all([
      storageAdapter.getMastery(),
      storageAdapter.getAttempts(),
      storageAdapter.getDayLog(),
      storageAdapter.getReviewRecords(),
    ]).then(([mastery, attempts, dayLog, reviewRecords]) => {
      if (cancelled) return;
      setData({ mastery, attempts, dayLog, reviewRecords });
    });
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

  const masteryBySkill = new Map<SkillId, SkillMastery>(data.mastery.map((m) => [m.skillId, m]));
  const skillById = new Map(modules.flatMap((m) => m.skills).map((s) => [s.id, s]));
  const today = localDateIso(new Date());

  const current = currentStreak(data.dayLog, today);
  const longest = longestStreak(data.dayLog);
  const dueToday = buildTodaysReview(data.reviewRecords, masteryBySkill, today, allSkillIds, Number.MAX_SAFE_INTEGER);

  const weakestSkills = data.mastery
    .filter((m) => m.attempts >= 1)
    .slice()
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
                      <ProgressRing progress={moduleProgress(module.skills, masteryBySkill)} size={24} strokeWidth={3} className="stroke-accent" />
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
                      <ProgressRing
                        progress={moduleProgress(module.skills, masteryBySkill)}
                        size={24}
                        strokeWidth={3}
                        className="stroke-accent-secondary"
                      />
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
                  <StarRating stars={masteryStars(m)} />
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
