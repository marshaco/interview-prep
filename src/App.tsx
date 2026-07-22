import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { CommandPalette } from './ui/components/common/CommandPalette';
import { pythonRunner } from './ui/pythonRunner';

// Route-level code splitting: Monaco is pulled into only the routes that
// actually render it, instead of every route eagerly shipping it. React
// Flow is gone entirely (Home's tiered map is a static grid + SVG overlay).
const HomePage = lazy(() => import('./ui/routes/HomePage').then((m) => ({ default: m.HomePage })));
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
          <Route path="/" element={<HomePage />} />
          <Route path="/modules/:moduleId" element={<ModulePage />} />
          <Route path="/modules/:moduleId/learn" element={<LearnPage />} />
          <Route path="/modules/:moduleId/:stageSlug/:stepNumber" element={<GuidedSequencePage />} />
          {/* Roadmap and Dashboard are merged into Home (Triecode UI spec §5/§3). */}
          <Route path="/roadmap" element={<Navigate to="/" replace />} />
          <Route path="/dashboard" element={<Navigate to="/" replace />} />
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
