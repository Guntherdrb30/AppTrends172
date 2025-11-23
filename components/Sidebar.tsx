import React from 'react';
import { Project, User } from '../types';

interface SidebarProps {
  projects: Project[];
  onSelectProject: (p: Project) => void;
  onNewProject: () => void;
  isOpen: boolean;
  setIsOpen: (o: boolean) => void;
  user: User | null;
  onOpenPayment: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  projects, 
  onSelectProject, 
  onNewProject, 
  isOpen, 
  setIsOpen,
  user,
  onOpenPayment
}) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      <div className={`
        fixed top-0 left-0 h-full w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800
        z-50 transform transition-transform duration-300 ease-in-out flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <h1 className="text-xl font-bold text-red-600 dark:text-red-500">
            Trends172
          </h1>
          <button onClick={() => setIsOpen(false)} className="md:hidden text-slate-500">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Credit Management Section - Visible from Start */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 m-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase">Mi Saldo</span>
                {user?.role === 'admin' && (
                    <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold">ADMIN</span>
                )}
            </div>
            <div className="flex items-baseline gap-1 mb-3">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                    {user?.role === 'admin' ? '∞' : (user?.credits || 0)}
                </span>
                <span className="text-xs text-slate-500">créditos</span>
            </div>
            <button 
                onClick={() => {
                    onOpenPayment();
                    if (window.innerWidth < 768) setIsOpen(false);
                }}
                className="w-full py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 9a.75.75 0 00-1.5 0v2.25H9a.75.75 0 000 1.5h2.25V15a.75.75 0 001.5 0v-2.25H15a.75.75 0 000-1.5h-2.25V9z" clipRule="evenodd" />
                </svg>
                Recargar Saldo
            </button>
        </div>

        <div className="px-4 pb-2">
          <button 
            onClick={() => {
              onNewProject();
              if (window.innerWidth < 768) setIsOpen(false);
            }}
            className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-lg shadow-red-500/30 transition-all font-medium flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Nuevo Proyecto
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 mt-4">Proyectos Recientes</div>
          {projects.length === 0 ? (
            <div className="text-sm text-slate-500 italic text-center py-8">Sin historial aún</div>
          ) : (
            <ul className="space-y-2">
              {projects.map(p => (
                <li key={p.id}>
                  <button 
                    onClick={() => {
                        onSelectProject(p);
                        if (window.innerWidth < 768) setIsOpen(false);
                    }}
                    className="w-full text-left p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                  >
                    <div className="font-medium text-slate-800 dark:text-slate-200 truncate">{p.name || "Sin Título"}</div>
                    <div className="text-xs text-slate-500 mt-1 flex justify-between">
                      <span>{p.assets.length} Recursos</span>
                      <span>{new Date(p.date).toLocaleDateString()}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
          
          <div className="mt-8 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs text-slate-600 dark:text-slate-400">
             Nota: Se guardan los últimos 5 proyectos.
          </div>
        </div>
        
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-500 font-medium">Desarrollado por Trends172tech</p>
        </div>
      </div>
    </>
  );
};

export default Sidebar;