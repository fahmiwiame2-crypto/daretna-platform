import React from 'react';
import { Home, Plus, User as UserIcon, LayoutGrid } from 'lucide-react';
import { motion } from 'framer-motion';

interface BottomNavProps {
    activePage: string;
    navigate: (page: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activePage, navigate }) => {
    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 py-3 px-8 flex justify-between items-center z-50 md:hidden shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
            <button
                onClick={() => navigate('dashboard')}
                className={`flex flex-col items-center gap-1 transition-colors ${activePage === 'dashboard' ? 'text-daretPink' : 'text-slate-400 dark:text-slate-500'}`}
            >
                <div className={`p-1 rounded-xl transition-colors ${activePage === 'dashboard' ? 'bg-daretPink/10' : ''}`}>
                    <Home className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">Accueil</span>
            </button>

            <button
                onClick={() => navigate('create-group')}
                className="flex flex-col items-center justify-center -mt-10"
            >
                <motion.div
                    whileTap={{ scale: 0.9 }}
                    className="bg-navy-900 dark:bg-daretPink text-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl shadow-daretPink/20 ring-4 ring-white dark:ring-slate-900"
                >
                    <Plus className="w-8 h-8" />
                </motion.div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-2">Créer</span>
            </button>

            <button
                onClick={() => navigate('profile')}
                className={`flex flex-col items-center gap-1 transition-colors ${activePage === 'profile' ? 'text-daretPink' : 'text-slate-400 dark:text-slate-500'}`}
            >
                <div className={`p-1 rounded-xl transition-colors ${activePage === 'profile' ? 'bg-daretPink/10' : ''}`}>
                    <UserIcon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">Profil</span>
            </button>
        </div>
    );
};
