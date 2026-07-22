import { Link, useParams } from 'react-router-dom';
import { getQuestion } from '../../content/registry';
import { useQuestionPlayer } from '../hooks/useQuestionPlayer';
import { QuestionPlayerLayout } from '../components/question/QuestionPlayerLayout';
import { EmptyState } from '../components/common/EmptyState';

export function QuestionPlayerPage() {
  const params = useParams<{ '*': string }>();
  const questionId = params['*'];
  const question = questionId ? getQuestion(questionId) : undefined;

  const player = useQuestionPlayer(question);

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
      backHref={`/modules/${question.moduleId}`}
      backLabel="Back to module"
      headerRight={
        <Link
          to={`/interview/${question.id}`}
          className="text-xs uppercase tracking-wide text-text-muted transition-colors duration-200 ease-out-motion hover:text-accent"
        >
          Interview Mode →
        </Link>
      }
    />
  );
}
