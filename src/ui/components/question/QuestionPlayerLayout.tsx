import type { ReactNode } from 'react';
import type { CodeQuestion } from '../../../content/types';
import type { useQuestionPlayer } from '../../hooks/useQuestionPlayer';
import { FocusShell } from '../shell/FocusShell';
import { MonacoEditor } from '../editor/MonacoEditor';
import { PromptPane } from './PromptPane';
import { HintsLadder } from './HintsLadder';
import { Scorecard } from './Scorecard';
import { VisualizationPanel } from './VisualizationPanel';

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
}: QuestionPlayerLayoutProps) {
  return (
    <FocusShell backHref={backHref} backLabel={backLabel} title={question.title} headerRight={headerRight} subHeader={subHeader}>
      <div className="flex h-full min-h-0">
        <aside className="w-[380px] shrink-0 overflow-y-auto border-r border-border p-4">
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
                Run
              </button>
            )}
            <button
              type="button"
              onClick={() => void player.submit()}
              disabled={player.isRunning}
              className="rounded bg-accent-solid px-3 py-1.5 text-sm font-medium text-white transition-colors duration-200 ease-out-motion hover:bg-accent-solid/90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Submit
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
          </div>
          <div className="min-h-0 flex-1">
            <MonacoEditor
              value={player.code}
              onChange={player.setCode}
              onRun={() => void player.run()}
              onSave={player.saveDraftNow}
            />
          </div>
          <div className="max-h-[40%] overflow-y-auto border-t border-border p-4">
            {player.playerResult ? (
              <Scorecard result={player.playerResult.result} scorecard={player.playerResult.scorecard} />
            ) : (
              <p className="text-sm text-text-muted">Run or Submit to see results.</p>
            )}
            {!interviewMode && question.visualization && player.playerResult?.scorecard !== undefined && (
              <div className="mt-4">
                <VisualizationPanel question={question} code={player.code} />
              </div>
            )}
            {footer}
          </div>
        </main>
      </div>
    </FocusShell>
  );
}
