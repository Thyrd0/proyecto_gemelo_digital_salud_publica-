import { useState, useEffect } from 'react';
import { NavSection, Navbar } from './components/layout/Navbar';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { HomePage } from './pages/HomePage';
import { DashboardPage } from './pages/DashboardPage';
import { SimulatorPage } from './pages/SimulatorPage';
import { Simulator3DPage } from './pages/Simulator3DPage';
import { ResultsPage } from './pages/ResultsPage';
import { ComparisonPage } from './pages/ComparisonPage';
import { MethodologyPage } from './pages/MethodologyPage';
import { PolicyConfig, SimulationSummary } from './types';
import { runApiSimulation } from './services/apiClient';
import { Building2 } from 'lucide-react';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { ChatbotWidget } from './components/common/ChatbotWidget';

function AppContent() {
  const [activeSection, setActiveSection] = useState<NavSection>('home');
  const { t } = useLanguage();
  const [currentSummary, setCurrentSummary] = useState<SimulationSummary | null>(null);

  useEffect(() => {
    const defaultConfig: PolicyConfig = {
      taxEnabled: false,
      taxRate: 20,
      subsidyEnabled: false,
      subsidyRate: 30,
      restrictionEnabled: false,
      restrictionRadius: 500,
      horizon: 5,
      isBaseline: true
    };

    runApiSimulation(defaultConfig)
      .then(summary => setCurrentSummary(summary))
      .catch(err => console.warn('[App] Real API baseline simulation fetch failed:', err));
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeSection]);

  const handleSimulationUpdate = (newSummary: SimulationSummary) => {
    setCurrentSummary(newSummary);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-['Plus_Jakarta_Sans',sans-serif] transition-colors duration-200">
      <Navbar
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        hasSimulationResults={true}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-12">
        <ErrorBoundary fallbackTitle="Error al cargar la sección seleccionada">
          {activeSection === 'home' && (
            <HomePage onNavigate={setActiveSection} />
          )}
          {activeSection === 'dashboard' && (
            <DashboardPage />
          )}
          {activeSection === 'simulator' && (
            <SimulatorPage />
          )}
          {activeSection === 'simulator3d' && (
            <Simulator3DPage
              currentSummary={currentSummary || undefined}
              onSimulationUpdate={handleSimulationUpdate}
              onNavigate={setActiveSection}
            />
          )}
          {activeSection === 'results' && (
            <ResultsPage />
          )}
          {activeSection === 'comparator' && (
            <ComparisonPage />
          )}
          {activeSection === 'methodology' && (
            <MethodologyPage />
          )}
        </ErrorBoundary>
      </main>

      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 mt-auto py-8 text-xs text-slate-500 dark:text-slate-400 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
            <div className="w-8 h-8 rounded-lg bg-teal-600 dark:bg-teal-500 text-white dark:text-slate-950 flex items-center justify-center font-bold">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100">
                {t('footerTitle')}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-400">
                V2.1 — CDC PLACES 2022 + USDA FARA 2019 (Philadelphia County, PA)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            <button onClick={() => setActiveSection('home')} className="hover:text-teal-700 dark:hover:text-teal-400 transition cursor-pointer">{t('navHome')}</button>
            <button onClick={() => setActiveSection('dashboard')} className="hover:text-teal-700 dark:hover:text-teal-400 transition cursor-pointer">{t('navDashboard')}</button>
            <button onClick={() => setActiveSection('simulator')} className="hover:text-teal-700 dark:hover:text-teal-400 transition cursor-pointer">{t('navSimulator')}</button>
            <button onClick={() => setActiveSection('simulator3d')} className="hover:text-teal-700 dark:hover:text-teal-400 transition cursor-pointer font-semibold text-teal-600 dark:text-teal-400">{t('navSimulator3D')} (3D)</button>
            <button onClick={() => setActiveSection('results')} className="hover:text-teal-700 dark:hover:text-teal-400 transition cursor-pointer">{t('navResults')}</button>
            <button onClick={() => setActiveSection('comparator')} className="hover:text-teal-700 dark:hover:text-teal-400 transition cursor-pointer">{t('navComparator')}</button>
            <button onClick={() => setActiveSection('methodology')} className="hover:text-teal-700 dark:hover:text-teal-400 transition cursor-pointer">{t('navMethodology')}</button>
          </div>

          <div className="text-center md:text-right text-[11px] text-slate-400 dark:text-slate-400 max-w-md">
            <span>Prototipo académico basado en datos públicos agregados (CDC PLACES 2022, USDA FARA 2019, TIGER/Line 2019). No posee validez clínica.</span>
          </div>
        </div>
      </footer>

      <ChatbotWidget summary={currentSummary || undefined} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <ErrorBoundary fallbackTitle="Error en la aplicación principal">
          <AppContent />
        </ErrorBoundary>
      </LanguageProvider>
    </ThemeProvider>
  );
}
