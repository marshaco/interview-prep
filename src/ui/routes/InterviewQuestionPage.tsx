import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getQuestion } from '../../content/registry';
import { useQuestionPlayer } from '../hooks/useQuestionPlayer';
import { QuestionPlayerLayout } from '../components/question/QuestionPlayerLayout';
import { EmptyState } from '../components/common/EmptyState';

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function InterviewQuestionPage() {
  const params = useParams<{ '*': string }>();
  const questionId = params['*'];
  const question = questionId ? getQuestion(questionId) : undefined;

  const player = useQuestionPlayer(question);

  // Ref, not state: writing it during an effect isn't a "setState in effect"
  // and Date.now() (impure) can't be read during render anyway — same split
  // useQuestionPlayer.sessionStartRef uses.
  const sessionStartRef = useRef(0);
  const [activeQuestionId, setActiveQuestionId] = useState(question?.id);
  const [elapsedMs, setElapsedMs] = useState(0);

  // Reset the displayed timer during render when the question changes —
  // adjusting state during render avoids an extra commit-then-reset pass.
  if (question?.id !== activeQuestionId) {
    setActiveQuestionId(question?.id);
    setElapsedMs(0);
  }

  useEffect(() => {
    sessionStartRef.current = Date.now();
  }, [activeQuestionId]);

  useEffect(() => {
    const interval = setInterval(() => setElapsedMs(Date.now() - sessionStartRef.current), 1000);
    return () => clearInterval(interval);
  }, [activeQuestionId]);

  if (!question) {
    return (
      <EmptyState
        title="Question not found"
        description="This question doesn't exist, or its id changed."
        actionLabel="← Back to roadmap"
        actionHref="/"
      />
    );
  }

  return (
    <QuestionPlayerLayout
      question={question}
      player={player}
      interviewMode
      headerLeft={
        <Link
          to={`/modules/${question.moduleId}`}
          className="text-sm text-text-muted transition-colors duration-200 ease-out-motion hover:text-accent"
        >
          ← Exit interview
        </Link>
      }
      headerRight={
        <span className="rounded border border-border bg-bg-raised px-2 py-1 font-mono text-xs text-text">
          {formatElapsed(elapsedMs)}
        </span>
      }
    />
  );
}
