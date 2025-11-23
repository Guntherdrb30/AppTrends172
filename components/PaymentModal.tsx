
import React, { useEffect, useState } from 'react';
import { getAdminConfig } from '../services/authService';
import { User } from '../types';

interface PaymentModalProps {
  user: User;
  onClose: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ user, onClose }) => {
  const [config, setConfig] = useState(getAdminConfig());

  useEffect(() => {
    setConfig(getAdminConfig());
  }, []);

  const whatsappUrl = `https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent(
    `Hola Trends172, soy el usuario ${user.email}. Ya consumí mis 3 pruebas gratuitas y me gustaría comprar monedas/créditos para seguir generando contenido. ID: ${user.id}`
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-8 shadow-2xl border border-red-500/30 relative text-center">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        </div>

        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">¡Se agotaron tus pruebas!</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">
            Has utilizado tus 3 generaciones gratuitas. Para continuar creando contenido premium, necesitas adquirir créditos.
        </p>

        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl mb-6 border border-slate-200 dark:border-slate-700">
            <p className="font-semibold text-slate-800 dark:text-white mb-1">Precio por Generación</p>
            <p className="text-2xl font-bold text-red-600">$1.00 USD</p>
            <p className="text-xs text-slate-500 mt-2">Incluye: 3 Imágenes + 1 Video + Voz IA</p>
        </div>

        <a 
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-full py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-lg font-bold transition-all shadow-lg gap-2"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592z"/>
            </svg>
            Comprar Monedas en WhatsApp
        </a>
      </div>
    </div>
  );
};

export default PaymentModal;
