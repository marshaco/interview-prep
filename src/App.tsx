import { useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { RoadmapPage } from './ui/routes/RoadmapPage';
import { ModulePage } from './ui/routes/ModulePage';
import { QuestionPlayerPage } from './ui/routes/QuestionPlayerPage';
import { LearnPage } from './ui/routes/LearnPage';
import { GuidedSequencePage } from './ui/routes/GuidedSequencePage';
import { DashboardPage } from './ui/routes/DashboardPage';
import { ReviewPage } from './ui/routes/ReviewPage';
import { pythonRunner } from './ui/pythonRunner';

function App() {
  useEffect(() => {
    void pythonRunner.warmup();
  }, []);

  return (
    <BrowserRouter>
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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
