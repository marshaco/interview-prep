import { useNavigate, useParams } from 'react-router-dom';
import { getModule, getQuestion } from '../../content/registry';
import { useQuestionPlayer } from '../hooks/useQuestionPlayer';
import { QuestionPlayerLayout } from '../components/question/QuestionPlayerLayout';
import { EmptyState } from '../components/common/EmptyState';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
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
  useDocumentTitle(question ? `${question.title}` : stage?.title ?? 'Guided step');

  const player = useQuestionPlayer(question);

  if (!module || !stage || !question || Number.isNaN(stepIndex) || stepIndex < 0) {
    return (
      <EmptyState
        title="Step not found"
        description="This step doesn't exist, or the stage's question list changed."
        actionLabel="← Back to roadmap"
        actionHref="/"
      />
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
      backHref={`/modules/${module.id}`}
      backLabel="Back to module"
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
            className="mt-4 rounded bg-accent-solid px-4 py-2 text-sm font-medium text-white transition-colors duration-200 ease-out-motion hover:bg-accent-solid/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {nextLabel}
          </button>
        )
      }
    />
  );
}
