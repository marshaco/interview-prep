import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { CodeQuestion } from '../../../content/types';
import type { useQuestionPlayer } from '../../hooks/useQuestionPlayer';
import type { AttemptTag } from '../../../storage/types';
import { FocusShell } from '../shell/FocusShell';
import { MonacoEditor } from '../editor/MonacoEditor';
import { PromptPane } from './PromptPane';
import { HintsLadder } from './HintsLadder';
import { Scorecard } from './Scorecard';
import { VisualizationPanel } from './VisualizationPanel';

const SELF_TAGS: { tag: AttemptTag; label: string }[] = [
  { tag: 'edge_case', label: 'Edge case' },
  { tag: 'off_by_one', label: 'Off-by-one' },
  { tag: 'wrong_approach', label: 'Wrong approach' },
  { tag: 'syntax', label: 'Syntax' },
];

interface QuestionPlayerLayoutProps {
  question: CodeQuestion;
  player: ReturnType<typeof useQuestionPlayer>;
  backHref: string;
  backLabel: ReactNode;
  headerRight?: ReactNode;
  /** Rendered as a thin strip below the header, above the editor — e.g. Review's progress bar. */
  subHeader?: ReactNode;
  /** Rendered below the scorecard — e.g. a Guided Build "Next step" button. */
  footer?: ReactNode;
  /** Chrome-stripped presentation for Interview Mode: no hints, no Run, no visualization. */
  interviewMode?: boolean;
  /** Present only on the non-interview player — a deliberate toolbar button to start a timed, hint-free attempt. */
  interviewHref?: string;
}

export function QuestionPlayerLayout({
  question,
  player,
  backHref,
  backLabel,
  headerRight,
  subHeader,
  footer,
  interviewMode = false,
  interviewHref,
}: QuestionPlayerLayoutProps) {
  const [showSolution, setShowSolution] = useState(false);
  const scorecard = player.playerResult?.scorecard;
  const hasPassed = scorecard?.overall === 100;
  const hasFailed = scorecard !== undefined && scorecard.overall < 100;

  return (
    <FocusShell backHref={backHref} backLabel={backLabel} title={question.title} headerRight={headerRight} subHeader={subHeader}>
      <div className="flex h-full min-h-0">
        <aside className="w-[380px] min-w-[280px] max-w-[40%] shrink overflow-y-auto border-r border-border p-4">
          <PromptPane question={question} />
          {!interviewMode && (
            <div className="mt-6">
              <HintsLadder hints={question.hints} revealedCount={player.hintsRevealed} onReveal={player.revealHint} />
            </div>
          )}
        </aside>
        <main className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-center gap-2 border-b border-border px-4 py-2">
            {!interviewMode && (
              <button
                type="button"
                onClick={() => void player.run()}
                disabled={player.isRunning}
                className="rounded border border-border bg-bg-raised px-3 py-1.5 text-sm text-text transition-colors duration-200 ease-out-motion hover:border-accent disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Run <span className="ml-1 text-[10px] text-text-muted">⌘⏎</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => void player.submit()}
              disabled={player.isRunning}
              className="rounded bg-accent-solid px-3 py-1.5 text-sm font-medium text-white transition-colors duration-200 ease-out-motion hover:bg-accent-solid/90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Submit <span className="ml-1 text-[10px] text-white/70">⌘⇧⏎</span>
            </button>
            <button
              type="button"
              onClick={player.reset}
              disabled={player.isRunning}
              className="rounded px-3 py-1.5 text-sm text-text-muted transition-colors duration-200 ease-out-motion hover:text-text disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Reset
            </button>
            {player.isRunning && <span className="text-xs text-text-muted">Running…</span>}
            {interviewHref && !interviewMode && (
              <Link
                to={interviewHref}
                className="ml-auto rounded border border-border px-3 py-1.5 text-sm text-text-muted transition-colors duration-200 ease-out-motion hover:border-accent hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Start interview mode →
              </Link>
            )}
          </div>
          <div className="min-h-0 flex-1">
            <MonacoEditor
              value={player.code}
              onChange={player.setCode}
              onRun={() => void player.run()}
              onSubmit={() => void player.submit()}
              onSave={player.saveDraftNow}
            />
          </div>
          <div className="flex h-64 shrink-0 flex-col border-t border-border">
            <p className="border-b border-border/50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
              Results
            </p>
            <div className="flex-1 overflow-y-auto p-4">
              {player.playerResult ? (
                <Scorecard result={player.playerResult.result} scorecard={scorecard} />
              ) : (
                <p className="text-sm text-text-muted">Run or Submit to see results.</p>
              )}
              {!interviewMode && question.visualization && scorecard !== undefined && (
                <div className="mt-4">
                  <VisualizationPanel question={question} code={player.code} />
                </div>
              )}
              {!interviewMode && hasPassed && (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => setShowSolution((v) => !v)}
                    className="text-sm text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    {showSolution ? 'Hide reference solution' : 'Compare with reference solution'}
                  </button>
                  {showSolution && (
                    <pre className="mt-2 overflow-x-auto rounded border border-border bg-bg-inset p-3 font-mono text-xs text-text">
                      {question.solution}
                    </pre>
                  )}
                </div>
              )}
              {!interviewMode && hasFailed && (
                <div className="mt-4">
                  <p className="mb-2 text-xs text-text-muted">What went wrong? (optional)</p>
                  <div className="flex flex-wrap gap-2">
                    {SELF_TAGS.map(({ tag, label }) => {
                      const isSelected = player.selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => player.toggleTag(tag)}
                          className={`rounded-full border px-3 py-1 text-xs transition-colors duration-200 ease-out-motion focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                            isSelected
                              ? 'border-accent bg-accent-muted text-text'
                              : 'border-border text-text-muted hover:border-accent hover:text-text'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {footer}
            </div>
          </div>
        </main>
      </div>
    </FocusShell>
  );
}
