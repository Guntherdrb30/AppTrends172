import React, { useEffect, useState, useRef } from 'react';
import { LiveClient } from '../services/geminiService';

const LiveAssistant: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const liveClient = useRef<LiveClient | null>(null);

  useEffect(() => {
    liveClient.current = new LiveClient(setIsActive);
    return () => {
      liveClient.current?.disconnect();
    };
  }, []);

  const toggleSession = () => {
    if (isActive) {
      liveClient.current?.disconnect();
    } else {
      liveClient.current?.connect();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {isActive && (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 mb-2 w-64 animate-fade-in-up">
           <div className="flex items-center gap-2 mb-2">
             <span className="relative flex h-3 w-3">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
             </span>
             <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Asistente en Vivo</span>
           </div>
           <p className="text-xs text-slate-500 dark:text-slate-400">
             Te escucho. Pide ideas de prompts o ayuda con la app.
           </p>
        </div>
      )}
      
      <button
        onClick={toggleSession}
        className={`
          flex items-center justify-center w-14 h-14 rounded-full shadow-2xl transition-all duration-300
          ${isActive 
            ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
            : 'bg-red-600 hover:bg-red-700 text-white hover:scale-110'
          }
        `}
      >
        {isActive ? (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
          </svg>
        )}
      </button>
    </div>
  );
};

export default LiveAssistant;