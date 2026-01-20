import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Command, Users, Layout, User, LogOut, Moon, Sun, X } from 'lucide-react';

interface CommandPaletteProps {
    navigate: (page: string) => void;
    onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ navigate, onClose }) => {
    const [query, setQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);

    const items = [
        { id: 'dashboard', title: 'Tableau de bord', icon: <Layout className="w-4 h-4" />, action: () => navigate('dashboard') },
        { id: 'profile', title: 'Mon Profil', icon: <User className="w-4 h-4" />, action: () => navigate('profile') },
        { id: 'groups', title: 'Nouveau Groupe', icon: <Users className="w-4 h-4" />, action: () => navigate('create-group') },
        { id: 'chat', title: 'DaretBot IA', icon: <Command className="w-4 h-4" />, action: () => navigate('chat-ia') },
        {
            id: 'theme', title: 'Changer le Thème', icon: <Moon className="w-4 h-4" />, action: () => {
                document.documentElement.classList.toggle('dark');
                onClose();
            }
        },
    ];

    const filteredItems = items.filter(item =>
        item.title.toLowerCase().includes(query.toLowerCase())
    );

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
        if (e.key === 'ArrowDown') setActiveIndex(prev => (prev + 1) % filteredItems.length);
        if (e.key === 'ArrowUp') setActiveIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
        if (e.key === 'Enter') {
            filteredItems[activeIndex]?.action();
            onClose();
        }
    }, [activeIndex, filteredItems, onClose]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[10000] flex items-start justify-center pt-[15vh] px-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-navy-900/60 backdrop-blur-sm"
                />

                {/* Palette */}
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: -20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: -20 }}
                    className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-white/20 dark:border-slate-800"
                >
                    <div className="p-4 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800">
                        <Search className="w-5 h-5 text-slate-400" />
                        <input
                            autoFocus
                            placeholder="Rechercher une action... (Dashboard, Profil, Thème...)"
                            className="flex-1 bg-transparent border-none outline-none text-navy-900 dark:text-white font-medium placeholder:text-slate-400"
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                setActiveIndex(0);
                            }}
                        />
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                            <span className="text-[10px] font-black text-slate-400">ESC</span>
                        </div>
                    </div>

                    <div className="max-h-[350px] overflow-y-auto p-2">
                        {filteredItems.length > 0 ? filteredItems.map((item, idx) => (
                            <div
                                key={item.id}
                                onMouseEnter={() => setActiveIndex(idx)}
                                onClick={() => {
                                    item.action();
                                    onClose();
                                }}
                                className={`flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer transition-all ${idx === activeIndex
                                        ? 'bg-daretPink text-white shadow-lg shadow-daretPink/20'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                    }`}
                            >
                                <div className={idx === activeIndex ? 'text-white' : 'text-slate-400'}>
                                    {item.icon}
                                </div>
                                <span className="font-bold">{item.title}</span>
                                {idx === activeIndex && (
                                    <span className="ml-auto text-[10px] font-black uppercase tracking-widest opacity-60">Entrée</span>
                                )}
                            </div>
                        )) : (
                            <div className="p-8 text-center text-slate-400 font-bold">
                                Aucun résultat trouvé...
                            </div>
                        )}
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <span className="flex items-center gap-1"><Command className="w-3 h-3" /> Navigation</span>
                            <span className="flex items-center gap-1">↵ Sélection</span>
                        </div>
                        <img src="https://flagcdn.com/w20/ma.png" alt="MA" className="w-4 h-auto opacity-50" />
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
