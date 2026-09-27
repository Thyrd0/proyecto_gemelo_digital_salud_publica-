import { useState } from 'react';
import { 
  Building2, 
  LayoutDashboard, 
  Sliders, 
  Boxes,
  BarChart3, 
  GitCompare, 
  BookOpen, 
  Menu, 
  X,
  Sun,
  Moon,
  Globe
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

export type NavSection = 'home' | 'dashboard' | 'simulator' | 'simulator3d' | 'results' | 'comparator' | 'methodology';

interface NavbarProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  hasSimulationResults: boolean;
}

export function Navbar({ activeSection, onSelectSection, hasSimulationResults }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { language, toggleLanguage, t } = useLanguage();
  const { isDark, toggleTheme } = useTheme();

  const navItems = [
    { id: 'home' as NavSection, label: t('navHome'), icon: Building2 },
    { id: 'dashboard' as NavSection, label: t('navDashboard'), icon: LayoutDashboard },
    { id: 'simulator' as NavSection, label: t('navSimulator'), icon: Sliders },
    { 
      id: 'simulator3d' as NavSection, 
      label: t('navSimulator3D'), 
      icon: Boxes,
      badge: '3D'
    },
    { 
      id: 'results' as NavSection, 
      label: t('navResults'), 
      icon: BarChart3,
      badge: hasSimulationResults ? t('readyBadge') : undefined 
    },
    { id: 'comparator' as NavSection, label: t('navComparator'), icon: GitCompare },
    { id: 'methodology' as NavSection, label: t('navMethodology'), icon: BookOpen },
  ];

  const handleSelect = (id: NavSection) => {
    onSelectSection(id);
    setMobileOpen(false);
  };

  return (
    <header className="bg-slate-900 text-slate-100 border-b border-slate-800 sticky top-0 z-40 shadow-sm transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Project Title */}
          <div 
            onClick={() => handleSelect('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 group-hover:bg-teal-500/30 transition">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base tracking-tight text-white font-['Space_Grotesk']">
                  {t('appShortTitle')}
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded">
                  {t('versionBadge')}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                {t('appSubtitle')}
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-2">
            <nav className="flex items-center gap-1 mr-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider ${
                        isActive ? 'bg-white text-teal-800' : 'bg-teal-500/20 text-teal-300'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Utility Toggles: Language & Theme */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
              {/* Language Switcher */}
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 hover:text-white text-slate-200 text-xs font-semibold transition cursor-pointer"
                title={language === 'es' ? 'Switch to English' : 'Cambiar a Español'}
                aria-label={t('language')}
              >
                <Globe className="w-3.5 h-3.5 text-teal-400" />
                <span className="uppercase">{language === 'es' ? 'ES' : 'EN'}</span>
              </button>

              {/* Dark/Light Mode Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
                title={isDark ? t('lightMode') : t('darkMode')}
                aria-label={isDark ? t('lightMode') : t('darkMode')}
              >
                {isDark ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-teal-300" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile menu & utility buttons */}
          <div className="flex lg:hidden items-center gap-2">
            {/* Quick Language Toggle on Mobile */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-200 text-xs font-bold transition"
              aria-label={t('language')}
            >
              <Globe className="w-3.5 h-3.5 text-teal-400" />
              <span className="uppercase text-[11px]">{language === 'es' ? 'ES' : 'EN'}</span>
            </button>

            {/* Quick Dark Mode Toggle on Mobile */}
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-200 transition"
              aria-label={isDark ? t('lightMode') : t('darkMode')}
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-teal-300" />
              )}
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              aria-label="Toggle navigation menu"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-slate-900 px-4 pt-2 pb-4 space-y-1 shadow-lg">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer ${
                  isActive
                    ? 'bg-teal-600 text-white font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-teal-500/20 text-teal-300">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
