import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { AcademicDisclaimer } from './AcademicDisclaimer';

export const Layout: React.FC = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleToggleSidebar = () => {
    if (window.innerWidth < 1024) {
      setIsMobileOpen(prev => !prev);
    } else {
      setIsCollapsed(prev => !prev);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:flex-row overflow-x-hidden">
      {/* Sidebar */}
      <Sidebar
        isOpen={isMobileOpen}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(prev => !prev)}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
        isCollapsed ? 'lg:ml-20' : 'lg:ml-72'
      }`}>
        <Header onToggleSidebar={handleToggleSidebar} />

        <main className="flex-1 p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
          <AcademicDisclaimer />
          <Outlet />
        </main>

        <footer className="border-t border-slate-900 px-6 py-4 text-center text-xs text-slate-500">
          Urban Food Environment Digital Twin V2.2.0 — CRISP-DM Methodology Portal &copy; 2026
        </footer>
      </div>
    </div>
  );
};
