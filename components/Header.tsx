import React from 'react';
import { AppTheme } from '../types';

interface HeaderProps {
  theme: AppTheme;
  setTheme: (t: AppTheme) => void;
  onOpenSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ theme, setTheme, onOpenSidebar }) => {
  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex justify-between items-center">
      <div className="flex items-center gap-4">
        <button onClick={onOpenSidebar} className="md:hidden text-slate-600 dark:text-slate-300">
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
        </button>
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 hidden md:block">Panel de Control</h2>
      </div>

      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <button 
            onClick={() => setTheme(theme === AppTheme.LIGHT ? AppTheme.DARK : AppTheme.LIGHT)}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
        >
            {theme === AppTheme.LIGHT ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                </svg>
            )}
        </button>
      </div>
    </header>
  );
};

export default Header;