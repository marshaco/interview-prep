import { Link, useNavigate, useParams } from 'react-router-dom';
import { getModule, getQuestion } from '../../content/registry';
import { useQuestionPlayer } from '../hooks/useQuestionPlayer';
import { QuestionPlayerLayout } from '../components/question/QuestionPlayerLayout';

const MODULE_ID = 'linked-list';

export function GuidedBuildPage() {
  const { stepNumber } = useParams<{ stepNumber: string }>();
  const navigate = useNavigate();
  const module = getModule(MODULE_ID);
  const guidedBuildStage = module?.stages.find((stage) => stage.type === 'guided_build');
  const questionIds = (guidedBuildStage?.items ?? [])
    .filter((item) => item.type === 'question')
    .map((item) => item.questionId);

  const stepIndex = Number(stepNumber) - 1; // 1-indexed in the URL
  const questionId = questionIds[stepIndex];
  const question = questionId ? getQuestion(questionId) : undefined;

  const player = useQuestionPlayer(question);

  if (!module || !guidedBuildStage || !question || Number.isNaN(stepIndex) || stepIndex < 0) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-10">
        <p className="text-text">Guided Build step not found.</p>
        <Link to="/" className="text-accent">
          Back to list
        </Link>
      </div>
    );
  }

  const isLastStep = stepIndex === questionIds.length - 1;
  const isStepComplete = player.playerResult?.scorecard?.overall === 100;
  const nextHref = isLastStep ? '/' : `/guided-build/${stepIndex + 2}`;
  const nextLabel = isLastStep ? 'Continue to Independent Build →' : 'Next step →';

  return (
    <QuestionPlayerLayout
      question={question}
      player={player}
      headerLeft={
        <Link to="/" className="text-sm text-text-muted hover:text-accent">
          ← All questions
        </Link>
      }
      headerRight={
        <span className="text-xs uppercase tracking-wide text-text-muted">
          Guided Build — Step {stepIndex + 1} of {questionIds.length}
        </span>
      }
      footer={
        isStepComplete && (
          <button
            type="button"
            onClick={() => void navigate(nextHref)}
            className="mt-4 rounded bg-accent px-4 py-2 text-sm font-medium text-white"
          >
            {nextLabel}
          </button>
        )
      }
    />
  );
}
