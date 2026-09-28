import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { PhaseProgressProvider } from './context/PhaseProgressContext';
import { Layout } from './components/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { BusinessUnderstandingPage } from './pages/BusinessUnderstandingPage';
import { DataUnderstandingPage } from './pages/DataUnderstandingPage';
import { DataPreparationPage } from './pages/DataPreparationPage';
import { ModelingPage } from './pages/ModelingPage';
import { EvaluationPage } from './pages/EvaluationPage';
import { DeploymentPage } from './pages/DeploymentPage';
import { CopilotPage } from './pages/CopilotPage';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <PhaseProgressProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<DashboardPage />} />
              <Route path="comprension-negocio" element={<BusinessUnderstandingPage />} />
              <Route path="comprension-datos" element={<DataUnderstandingPage />} />
              <Route path="preparacion-datos" element={<DataPreparationPage />} />
              <Route path="modelado" element={<ModelingPage />} />
              <Route path="evaluacion" element={<EvaluationPage />} />
              <Route path="despliegue" element={<DeploymentPage />} />
              <Route path="copiloto" element={<CopilotPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </PhaseProgressProvider>
    </ThemeProvider>
  );
};

