import type { ReactNode } from 'react';
import type { CodeQuestion } from '../../../content/types';
import type { useQuestionPlayer } from '../../hooks/useQuestionPlayer';
import { MonacoEditor } from '../editor/MonacoEditor';
import { PromptPane } from './PromptPane';
import { HintsLadder } from './HintsLadder';
import { Scorecard } from './Scorecard';
import { VisualizationPanel } from './VisualizationPanel';

interface QuestionPlayerLayoutProps {
  question: CodeQuestion;
  player: ReturnType<typeof useQuestionPlayer>;
  headerLeft: ReactNode;
  headerRight?: ReactNode;
  /** Rendered below the scorecard — e.g. a Guided Build "Next step" button. */
  footer?: ReactNode;
  /** Chrome-stripped presentation for Interview Mode: no hints, no Run, no visualization. */
  interviewMode?: boolean;
}

export function QuestionPlayerLayout({
  question,
  player,
  headerLeft,
  headerRight,
  footer,
  interviewMode = false,
}: QuestionPlayerLayoutProps) {
  return (
    <div className="flex h-screen flex-col bg-bg text-text">
      <header className="flex items-center justify-between border-b border-border px-4 py-2">
        {headerLeft}
        <h1 className="text-sm font-semibold">{question.title}</h1>
        {headerRight ?? <span />}
      </header>
      <div className="flex min-h-0 flex-1">
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
                className="rounded border border-border bg-bg-raised px-3 py-1.5 text-sm text-text hover:border-accent disabled:opacity-50"
              >
                Run
              </button>
            )}
            <button
              type="button"
              onClick={() => void player.submit()}
              disabled={player.isRunning}
              className="rounded bg-accent px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
            >
              Submit
            </button>
            <button
              type="button"
              onClick={player.reset}
              disabled={player.isRunning}
              className="rounded px-3 py-1.5 text-sm text-text-muted hover:text-text disabled:opacity-50"
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
    </div>
  );
}
