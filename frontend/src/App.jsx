import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { PreferencesProvider, usePreferences } from './context/PreferencesContext';

import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import DashboardPage from './pages/DashboardPage';
import ScannerPage from './pages/ScannerPage';
import HistoryPage from './pages/HistoryPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ModelsPage from './pages/ModelsPage';
import SimulatorPage from './pages/SimulatorPage';
import AboutPage from './pages/AboutPage';
import ComparePage from './pages/ComparePage';
import CasesPage from './pages/CasesPage';
import InvestigationPage from './pages/InvestigationPage';
import SettingsPage from './pages/SettingsPage';
import ResearchLabPage from './pages/ResearchLabPage';

import CommandPalette from './components/nexus/CommandPalette';
import GlobalSearch from './components/nexus/GlobalSearch';

function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);

  const { prefs } = usePreferences();
  const collapsed = !!prefs.sidebarCollapsed;

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const closeSidebarMobile = () => {
    setSidebarOpen(false);
  };

  useEffect(() => {
    const handleOpenCmd = () => setCmdPaletteOpen(true);
    window.addEventListener('open-command-palette', handleOpenCmd);
    return () => window.removeEventListener('open-command-palette', handleOpenCmd);
  }, []);

  return (
    <div className="app-layout">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onCloseMobile={closeSidebarMobile} />

      {/* Main Content Area with Header Shell */}
      <div className="main-wrapper">
        <Header
          onToggleSidebar={toggleSidebar}
          sidebarOpen={sidebarOpen}
          onOpenCommandPalette={() => setCmdPaletteOpen(true)}
          onOpenGlobalSearch={() => setGlobalSearchOpen(true)}
        />

        <main className={`main-content ${collapsed ? 'sidebar-collapsed' : ''}`}>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/scan" element={<ScannerPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/cases" element={<CasesPage />} />
            <Route path="/cases/:caseId" element={<InvestigationPage />} />
            <Route path="/investigate/:caseId" element={<InvestigationPage />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/models" element={<ModelsPage />} />
            <Route path="/research-lab" element={<ResearchLabPage />} />
            <Route path="/simulator" element={<SimulatorPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/about" element={<AboutPage />} />
          </Routes>
        </main>
      </div>

      {/* Global Command Palette & Global Search Modals */}
      <CommandPalette isOpen={cmdPaletteOpen} onClose={() => setCmdPaletteOpen(false)} />
      <GlobalSearch isOpen={globalSearchOpen} onClose={() => setGlobalSearchOpen(false)} />
    </div>
  );
}

function App() {
  return (
    <PreferencesProvider>
      <MainLayout />
    </PreferencesProvider>
  );
}

export default App;
