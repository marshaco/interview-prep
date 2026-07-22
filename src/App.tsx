import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { CommandPalette } from './ui/components/common/CommandPalette';
import { pythonRunner } from './ui/pythonRunner';

// Route-level code splitting (ARCHITECTURE §10 / Phase 8 DoD): Monaco and
// React Flow are each pulled into only the routes that actually render them,
// instead of every route eagerly shipping both.
const RoadmapPage = lazy(() => import('./ui/routes/RoadmapPage').then((m) => ({ default: m.RoadmapPage })));
const ModulePage = lazy(() => import('./ui/routes/ModulePage').then((m) => ({ default: m.ModulePage })));
const QuestionPlayerPage = lazy(() =>
  import('./ui/routes/QuestionPlayerPage').then((m) => ({ default: m.QuestionPlayerPage })),
);
const InterviewQuestionPage = lazy(() =>
  import('./ui/routes/InterviewQuestionPage').then((m) => ({ default: m.InterviewQuestionPage })),
);
const LearnPage = lazy(() => import('./ui/routes/LearnPage').then((m) => ({ default: m.LearnPage })));
const GuidedSequencePage = lazy(() =>
  import('./ui/routes/GuidedSequencePage').then((m) => ({ default: m.GuidedSequencePage })),
);
const DashboardPage = lazy(() => import('./ui/routes/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const ReviewPage = lazy(() => import('./ui/routes/ReviewPage').then((m) => ({ default: m.ReviewPage })));

function RouteFallback() {
  return (
    <div className="flex h-screen items-center justify-center bg-bg">
      <p className="text-sm text-text-muted">Loading…</p>
    </div>
  );
}

function App() {
  useEffect(() => {
    void pythonRunner.warmup();
  }, []);

  return (
    <BrowserRouter>
      <CommandPalette />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<RoadmapPage />} />
          <Route path="/modules/:moduleId" element={<ModulePage />} />
          <Route path="/modules/:moduleId/learn" element={<LearnPage />} />
          <Route path="/modules/:moduleId/:stageSlug/:stepNumber" element={<GuidedSequencePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/review" element={<ReviewPage />} />
          {/* Splat, not :questionId — question ids are namespaced like "linked-list/append"
              and contain a literal slash, which a single dynamic segment can't match. */}
          <Route path="/questions/*" element={<QuestionPlayerPage />} />
          <Route path="/interview/*" element={<InterviewQuestionPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
