import { useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { QuestionListPage } from './ui/routes/QuestionListPage';
import { QuestionPlayerPage } from './ui/routes/QuestionPlayerPage';
import { pythonRunner } from './ui/pythonRunner';

function App() {
  useEffect(() => {
    void pythonRunner.warmup();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<QuestionListPage />} />
        {/* Splat, not :questionId — question ids are namespaced like "linked-list/append"
            and contain a literal slash, which a single dynamic segment can't match. */}
        <Route path="/questions/*" element={<QuestionPlayerPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
