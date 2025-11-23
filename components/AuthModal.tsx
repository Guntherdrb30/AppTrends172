
import React, { useState } from 'react';
import { loginUser, registerUser } from '../services/authService';
import { User } from '../types';

interface AuthModalProps {
  onSuccess: (user: User) => void;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onSuccess, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.includes('@')) {
        setError("Por favor ingresa un email válido.");
        return;
    }

    try {
      const user = isLogin ? loginUser(email) : registerUser(email);
      onSuccess(user);
    } catch (err: any) {
      setError(err.message || "Ocurrió un error.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-8 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                {isLogin ? 'Bienvenido a Trends172' : 'Crear Cuenta'}
            </h2>
            <p className="text-sm text-slate-500">
                {isLogin ? 'Ingresa para acceder a tus proyectos.' : 'Regístrate y recibe 3 pruebas gratuitas.'}
            </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
                    placeholder="tu@email.com"
                    required
                />
            </div>
            
            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button 
                type="submit"
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-all shadow-lg shadow-red-500/30"
            >
                {isLogin ? 'Ingresar' : 'Registrarse'}
            </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
            {isLogin ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
            <button 
                onClick={() => { setIsLogin(!isLogin); setError(''); }}
                className="text-red-600 font-semibold hover:underline"
            >
                {isLogin ? 'Regístrate Gratis' : 'Inicia Sesión'}
            </button>
        </div>
        
        <div className="mt-4 text-xs text-slate-400 text-center">
            Nota: Versión demo. No se requiere contraseña.
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
