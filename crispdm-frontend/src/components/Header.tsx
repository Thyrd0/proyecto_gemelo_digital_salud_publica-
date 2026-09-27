import React from 'react';
import { Menu, Sun, Moon, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useLocation } from 'react-router-dom';

interface HeaderProps {
  onToggleSidebar: () => void;
}

const ROUTE_TITLE_KEYS: Record<string, string> = {
  '/': 'nav.dashboard',
  '/comprension-negocio': 'nav.business_understanding',
  '/comprension-datos': 'nav.data_understanding',
  '/preparacion-datos': 'nav.data_preparation',
  '/modelado': 'nav.modeling',
  '/evaluacion': 'nav.evaluation',
  '/despliegue': 'nav.deployment'
};

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const currentTitleKey = ROUTE_TITLE_KEYS[location.pathname] || 'nav.dashboard';

  const toggleLanguage = () => {
    const nextLang = i18n.language.startsWith('es') ? 'en' : 'es';
    i18n.changeLanguage(nextLang);
  };

  return (
    <header className="h-16 bg-slate-900/90 dark:bg-slate-900/90 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-turquoise-500/50"
          aria-label="Alternar menú de navegación"
          id="toggle-sidebar-button"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        <h1 className="text-base sm:text-lg font-semibold text-slate-100 truncate">
          {t(currentTitleKey)}
        </h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Language Selector */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          aria-label="Cambiar idioma"
          id="language-toggle-button"
        >
          <Globe className="w-3.5 h-3.5 text-turquoise-400" />
          <span className="uppercase">{i18n.language.substring(0, 2)}</span>
        </button>

        {/* Day/Night Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          aria-label="Alternar modo claro u oscuro"
          id="theme-toggle-button"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-sky-400" />
          )}
        </button>
      </div>
    </header>
  );
};
