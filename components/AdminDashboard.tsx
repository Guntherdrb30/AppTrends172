
import React, { useState, useEffect } from 'react';
import { getUsers, addCredits, getAdminConfig, saveAdminConfig } from '../services/authService';
import { User } from '../types';

interface AdminDashboardProps {
  onClose: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [config, setConfig] = useState(getAdminConfig());
  const [whatsappInput, setWhatsappInput] = useState(config.whatsappNumber);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setUsers(getUsers());
  };

  const handleAddCredits = (userId: string, amount: number) => {
    addCredits(userId, amount);
    refreshData();
  };

  const handleSaveConfig = () => {
    saveAdminConfig({ ...config, whatsappNumber: whatsappInput });
    alert("Configuración actualizada correctamente.");
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-50 dark:bg-slate-900 animate-fade-in overflow-hidden">
        {/* Header Admin */}
        <div className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md">
            <h1 className="text-xl font-bold flex items-center gap-2">
                <span className="bg-red-600 px-2 py-1 rounded text-xs uppercase">Admin</span>
                Panel de Control Trends172
            </h1>
            <button onClick={onClose} className="text-slate-300 hover:text-white flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                </svg>
                Volver a la App
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 max-w-7xl mx-auto w-full space-y-8">
            
            {/* Config Section */}
            <section className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold mb-4 text-slate-800 dark:text-white">Configuración de Pagos</h2>
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Número de WhatsApp (con código de país, sin +)</label>
                        <input 
                            type="text" 
                            value={whatsappInput}
                            onChange={(e) => setWhatsappInput(e.target.value)}
                            className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-900"
                            placeholder="584141234567"
                        />
                    </div>
                    <button 
                        onClick={handleSaveConfig}
                        className="px-6 py-2 bg-slate-800 text-white rounded hover:bg-slate-700 font-medium"
                    >
                        Guardar Configuración
                    </button>
                </div>
            </section>

            {/* Users Section */}
            <section className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Gestión de Usuarios y Créditos</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">
                                <th className="p-4 border-b border-slate-200 dark:border-slate-700">Usuario / Email</th>
                                <th className="p-4 border-b border-slate-200 dark:border-slate-700">Rol</th>
                                <th className="p-4 border-b border-slate-200 dark:border-slate-700">Créditos Disponibles</th>
                                <th className="p-4 border-b border-slate-200 dark:border-slate-700">Recargar Monedas</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {users.map(user => (
                                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="p-4 font-medium text-slate-900 dark:text-white">
                                        {user.email}
                                        <div className="text-xs text-slate-500 font-normal mt-0.5">{user.id}</div>
                                    </td>
                                    <td className="p-4 text-slate-600 dark:text-slate-300">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${user.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="p-4 text-slate-900 dark:text-white font-bold text-lg">
                                        {user.role === 'admin' ? '∞' : user.credits}
                                    </td>
                                    <td className="p-4">
                                        {user.role !== 'admin' && (
                                            <div className="flex gap-2">
                                                <button onClick={() => handleAddCredits(user.id, 1)} className="px-3 py-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 rounded text-sm font-medium">+1</button>
                                                <button onClick={() => handleAddCredits(user.id, 5)} className="px-3 py-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 rounded text-sm font-medium">+5</button>
                                                <button onClick={() => handleAddCredits(user.id, 10)} className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-sm font-medium border border-red-200">+10</button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

        </div>
    </div>
  );
};

export default AdminDashboard;
