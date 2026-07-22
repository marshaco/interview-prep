import { useParams } from 'react-router-dom';
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
      interviewHref={`/interview/${question.id}`}
    />
  );
}
