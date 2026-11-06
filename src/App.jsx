import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import ScrollToTop from './components/ScrollToTop';
import VaultHome from '@/pages/VaultHome';
import NotePage from '@/pages/NotePage';
import CanvasHome from '@/pages/CanvasHome';
import CanvasPage from '@/pages/CanvasPage';
import TablesHome from '@/pages/TablesHome';
import TablePage from '@/pages/TablePage';
import CodeHome from '@/pages/CodeHome';
import CodePage from '@/pages/CodePage';
import JournalPage from '@/pages/JournalPage';
import TasksPage from '@/pages/TasksPage';
import CardsPage from '@/pages/CardsPage';
import GraphPage from '@/pages/GraphPage';
import QueriesPage from '@/pages/QueriesPage';
import ExtensionsPage from '@/pages/ExtensionsPage';
import ManifestPage from '@/pages/ManifestPage';
import TrashPage from '@/pages/TrashPage';
import ExtensionRuntime from '@/components/extensions/ExtensionRuntime';

// No login: LemonNote keeps everything on this computer, so every page is open.
function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <ScrollToTop />
        <ExtensionRuntime />
        <Routes>
          <Route path="/" element={<VaultHome />} />
          <Route path="/note/:id" element={<NotePage />} />
          <Route path="/canvas" element={<CanvasHome />} />
          <Route path="/canvas/:id" element={<CanvasPage />} />
          <Route path="/tables" element={<TablesHome />} />
          <Route path="/tables/:id" element={<TablePage />} />
          <Route path="/code" element={<CodeHome />} />
          <Route path="/code/:id" element={<CodePage />} />
          <Route path="/journal" element={<JournalPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/cards" element={<CardsPage />} />
          <Route path="/graph" element={<GraphPage />} />
          {/* Ink now lives in the Ink tab of every note; old links land on the vault. */}
          <Route path="/ink" element={<Navigate to="/" replace />} />
          <Route path="/ink/:id" element={<Navigate to="/" replace />} />
          <Route path="/queries" element={<QueriesPage />} />
          <Route path="/extensions" element={<ExtensionsPage />} />
          <Route path="/spaces" element={<ManifestPage />} />
          <Route path="/trash" element={<TrashPage />} />
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  )
}

export default App
