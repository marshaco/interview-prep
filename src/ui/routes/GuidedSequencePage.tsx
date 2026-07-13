import { Link, useNavigate, useParams } from 'react-router-dom';
import { getModule, getQuestion } from '../../content/registry';
import { useQuestionPlayer } from '../hooks/useQuestionPlayer';
import { QuestionPlayerLayout } from '../components/question/QuestionPlayerLayout';
import type { StageType } from '../../content/types';

const STAGE_TYPE_BY_SLUG: Record<string, StageType> = {
  'guided-build': 'guided_build',
  'guided-apply': 'guided_apply',
};

export function GuidedSequencePage() {
  const { moduleId, stageSlug, stepNumber } = useParams<{ moduleId: string; stageSlug: string; stepNumber: string }>();
  const navigate = useNavigate();
  const module = moduleId ? getModule(moduleId) : undefined;
  const stageType = stageSlug ? STAGE_TYPE_BY_SLUG[stageSlug] : undefined;
  const stage = stageType ? module?.stages.find((s) => s.type === stageType) : undefined;
  const questionIds = (stage?.items ?? []).filter((item) => item.type === 'question').map((item) => item.questionId);

  const stepIndex = Number(stepNumber) - 1; // 1-indexed in the URL
  const questionId = questionIds[stepIndex];
  const question = questionId ? getQuestion(questionId) : undefined;

  const player = useQuestionPlayer(question);

  if (!module || !stage || !question || Number.isNaN(stepIndex) || stepIndex < 0) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-10">
        <p className="text-text">Step not found.</p>
        <Link to="/" className="text-accent">
          ← Roadmap
        </Link>
      </div>
    );
  }

  const isLastStep = stepIndex === questionIds.length - 1;
  const isStepComplete = player.playerResult?.scorecard?.overall === 100;
  const nextStage = module.stages.find((s) => s.type === 'independent_build' || s.type === 'algorithm_drills');
  const nextHref = isLastStep ? `/modules/${module.id}` : `/modules/${module.id}/${stageSlug}/${stepIndex + 2}`;
  const nextLabel = isLastStep ? `Continue to ${nextStage?.title ?? 'next stage'} →` : 'Next step →';

  return (
    <QuestionPlayerLayout
      question={question}
      player={player}
      headerLeft={
        <Link to={`/modules/${module.id}`} className="text-sm text-text-muted hover:text-accent">
          ← Back to module
        </Link>
      }
      headerRight={
        <span className="text-xs uppercase tracking-wide text-text-muted">
          {stage.title} — Step {stepIndex + 1} of {questionIds.length}
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
