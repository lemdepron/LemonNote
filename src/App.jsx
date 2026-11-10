import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Navigate, Route, Routes, Outlet } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import ScrollToTop from './components/ScrollToTop';
import VaultHome from '@/pages/VaultHome';
import NoteContainer from '@/components/notes/NoteContainer';
import CanvasHome from '@/pages/CanvasHome';
import CanvasPage from '@/pages/CanvasPage';
import TablesHome from '@/pages/TablesHome';
import TablePage from '@/pages/TablePage';
import CodeHome from '@/pages/CodeHome';
import CodePage from '@/pages/CodePage';
import JournalPage from '@/pages/JournalPage';
import CalendarPage from '@/pages/CalendarPage';
import TasksPage from '@/pages/TasksPage';
import CardsPage from '@/pages/CardsPage';
import GraphPage from '@/pages/GraphPage';
import QueriesPage from '@/pages/QueriesPage';
import ExtensionsPage from '@/pages/ExtensionsPage';
import ManifestPage from '@/pages/ManifestPage';
import TrashPage from '@/pages/TrashPage';
import SettingsPage from '@/pages/SettingsPage';
import DevIconsPage from '@/pages/DevIconsPage';
import ExtensionRuntime from '@/components/extensions/ExtensionRuntime';
import { Toaster } from '@/components/ui/toaster';
import { withPageErrorBoundary } from '@/components/PageErrorBoundary';
import { useTaskReminders } from '@/hooks/useTaskReminders';
import useVault from '@/hooks/useVault';
import { useAutoUpdateCheck } from '@/hooks/useUpdater';
import { useEffect } from 'react';
import { applyI18n } from '@/lib/i18n';
import { subscribePrefs } from '@/lib/preferences';

// No login: LemonNote keeps everything on this computer, so every page is open.
const VaultHomeWithErrorBoundary = withPageErrorBoundary(VaultHome);
const NoteContainerWithErrorBoundary = withPageErrorBoundary(NoteContainer);
const CanvasHomeWithErrorBoundary = withPageErrorBoundary(CanvasHome);
const CanvasPageWithErrorBoundary = withPageErrorBoundary(CanvasPage);
const TablesHomeWithErrorBoundary = withPageErrorBoundary(TablesHome);
const TablePageWithErrorBoundary = withPageErrorBoundary(TablePage);
const CodeHomeWithErrorBoundary = withPageErrorBoundary(CodeHome);
const CodePageWithErrorBoundary = withPageErrorBoundary(CodePage);
const JournalPageWithErrorBoundary = withPageErrorBoundary(JournalPage);
const CalendarPageWithErrorBoundary = withPageErrorBoundary(CalendarPage);
const TasksPageWithErrorBoundary = withPageErrorBoundary(TasksPage);
const CardsPageWithErrorBoundary = withPageErrorBoundary(CardsPage);
const GraphPageWithErrorBoundary = withPageErrorBoundary(GraphPage);
const QueriesPageWithErrorBoundary = withPageErrorBoundary(QueriesPage);
const ExtensionsPageWithErrorBoundary = withPageErrorBoundary(ExtensionsPage);
const ManifestPageWithErrorBoundary = withPageErrorBoundary(ManifestPage);
const TrashPageWithErrorBoundary = withPageErrorBoundary(TrashPage);
const SettingsPageWithErrorBoundary = withPageErrorBoundary(SettingsPage);

function ReminderProvider() {
  const { notes } = useVault();
  useTaskReminders(notes);
  return <Outlet />;
}

function App() {
  useAutoUpdateCheck();

  // Keep the html lang/dir attributes in sync with the saved interface language
  // (Arabic shows the whole interface right-to-left).
  useEffect(() => {
    applyI18n();
    return subscribePrefs(() => applyI18n());
  }, []);

  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <ScrollToTop />
        <ExtensionRuntime />
        <Toaster />
        <Routes>
          <Route element={<ReminderProvider />}>
            <Route path="/" element={<VaultHomeWithErrorBoundary />} />
            <Route path="/note/*" element={<NoteContainerWithErrorBoundary />} />
            <Route path="/canvas" element={<CanvasHomeWithErrorBoundary />} />
            <Route path="/canvas/:id" element={<CanvasPageWithErrorBoundary />} />
            <Route path="/tables" element={<TablesHomeWithErrorBoundary />} />
            <Route path="/tables/:id" element={<TablePageWithErrorBoundary />} />
            <Route path="/code" element={<CodeHomeWithErrorBoundary />} />
            <Route path="/code/:id" element={<CodePageWithErrorBoundary />} />
            <Route path="/journal" element={<JournalPageWithErrorBoundary />} />
            <Route path="/calendar" element={<CalendarPageWithErrorBoundary />} />
            <Route path="/tasks" element={<TasksPageWithErrorBoundary />} />
            <Route path="/cards" element={<CardsPageWithErrorBoundary />} />
            <Route path="/graph" element={<GraphPageWithErrorBoundary />} />
            <Route path="/queries" element={<QueriesPageWithErrorBoundary />} />
            <Route path="/extensions" element={<ExtensionsPageWithErrorBoundary />} />
            <Route path="/spaces" element={<ManifestPageWithErrorBoundary />} />
            <Route path="/trash" element={<TrashPageWithErrorBoundary />} />
            <Route path="/settings" element={<SettingsPageWithErrorBoundary />} />
            {/* Ink now lives in the Ink tab of every note; old links land on the vault. */}
            <Route path="/ink" element={<Navigate to="/" replace />} />
            <Route path="/ink/:id" element={<Navigate to="/" replace />} />
            {import.meta.env.DEV && (
              <Route path="/dev/icons" element={<DevIconsPage />} />
            )}
            <Route path="*" element={<PageNotFound />} />
          </Route>
        </Routes>
      </Router>
    </QueryClientProvider>
  )
}

export default App
