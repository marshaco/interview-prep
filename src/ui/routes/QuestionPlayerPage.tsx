import { Link, useParams } from 'react-router-dom';
import { getQuestion } from '../../content/registry';
import { useQuestionPlayer } from '../hooks/useQuestionPlayer';
import { QuestionPlayerLayout } from '../components/question/QuestionPlayerLayout';

export function QuestionPlayerPage() {
  const params = useParams<{ '*': string }>();
  const questionId = params['*'];
  const question = questionId ? getQuestion(questionId) : undefined;

  const player = useQuestionPlayer(question);

  if (!question) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-10">
        <p className="text-text">Question not found.</p>
        <Link to="/" className="text-accent">
          ← Roadmap
        </Link>
      </div>
    );
  }

  return (
    <QuestionPlayerLayout
      question={question}
      player={player}
      headerLeft={
        <Link to={`/modules/${question.moduleId}`} className="text-sm text-text-muted hover:text-accent">
          ← Back to module
        </Link>
      }
    />
  );
}
