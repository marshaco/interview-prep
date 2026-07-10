import { useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { RoadmapPage } from './ui/routes/RoadmapPage';
import { ModulePage } from './ui/routes/ModulePage';
import { QuestionPlayerPage } from './ui/routes/QuestionPlayerPage';
import { LearnPage } from './ui/routes/LearnPage';
import { GuidedBuildPage } from './ui/routes/GuidedBuildPage';
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
        <Route path="/learn" element={<LearnPage />} />
        <Route path="/guided-build/:stepNumber" element={<GuidedBuildPage />} />
        {/* Splat, not :questionId — question ids are namespaced like "linked-list/append"
            and contain a literal slash, which a single dynamic segment can't match. */}
        <Route path="/questions/*" element={<QuestionPlayerPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
