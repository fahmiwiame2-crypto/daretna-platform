import React, { useState } from 'react';
import {
    Sun,
    Moon,
    Bell,
    LogOut,
    User as UserIcon,
    Sparkles,
    LayoutDashboard,
    Gem,
    Globe,
    ChevronDown
} from 'lucide-react';
import { User, UserRole } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { NotificationCenter } from './NotificationCenter';

interface NavbarProps {
    user: User | null;
    onLogout: () => void;
    currentPage: string;
    navigate: (page: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout, navigate, currentPage }) => {
    const { theme, toggleTheme } = useTheme();
    const { language, setLanguage, t } = useLanguage();
    const [showNotifications, setShowNotifications] = useState(false);

    const handleLogoClick = () => {
        if (user) {
            navigate('dashboard');
        } else {
            navigate('landing');
        }
    };

    const handleFeaturesClick = () => {
        if (currentPage !== 'landing') {
            navigate('landing');
            setTimeout(() => {
                const element = document.getElementById('features');
                if (element) element.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        } else {
            const element = document.getElementById('features');
            if (element) element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <>
            <nav className="sticky top-0 z-50 glass-nav transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-20 items-center">
                        {/* Logo */}
                        <div className="flex items-center cursor-pointer group" onClick={handleLogoClick}>
                            <div className="w-10 h-10 bg-daretPink rounded-xl flex items-center justify-center mr-3 shadow-lg shadow-daretPink/20 transform group-hover:rotate-6 transition-transform">
                                <span className="text-white font-black text-xl">D</span>
                            </div>
                            <span className="text-2xl font-black text-navy-900 dark:text-white tracking-tighter transition">
                                Daretna<span className="text-daretPink">.ma</span>
                            </span>
                        </div>

                        {/* DESKTOP NAVIGATION */}
                        <div className="hidden md:flex items-center gap-8">
                            {user ? (
                                <>
                                    <div className="flex items-center gap-6 pr-6 border-r border-slate-200 dark:border-slate-800">
                                        <button
                                            onClick={() => navigate('dashboard')}
                                            className={`flex items-center gap-2 text-sm font-bold uppercase tracking-widest transition-colors ${currentPage === 'dashboard' ? 'text-daretPink' : 'text-slate-500 hover:text-navy-900 dark:text-slate-400 dark:hover:text-white'
                                                }`}
                                        >
                                            <LayoutDashboard className="w-4 h-4" />
                                            {t('nav.dashboard')}
                                        </button>
                                        <button
                                            onClick={() => navigate('chat-ia')}
                                            className={`flex items-center gap-2 text-sm font-bold uppercase tracking-widest transition-colors ${currentPage === 'chat-ia' ? 'text-daretPink' : 'text-slate-500 hover:text-navy-900 dark:text-slate-400 dark:hover:text-white'
                                                }`}
                                        >
                                            <Sparkles className="w-4 h-4" />
                                            DaretBot
                                        </button>
                                        <button
                                            onClick={() => navigate('subscription')}
                                            className={`flex items-center gap-2 text-sm font-bold uppercase tracking-widest transition-colors ${currentPage === 'subscription' ? 'text-daretPink' : 'text-slate-500 hover:text-navy-900 dark:text-slate-400 dark:hover:text-white'
                                                }`}
                                        >
                                            <Gem className="w-4 h-4" />
                                            Offres
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        {/* Notifications */}
                                        <button
                                            onClick={() => setShowNotifications(true)}
                                            className="relative p-2.5 text-slate-500 hover:text-navy-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                                        >
                                            <Bell className="w-5 h-5" />
                                            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-daretPink rounded-full border-2 border-white dark:border-slate-900"></span>
                                        </button>

                                        {/* Theme Toggle */}
                                        <button
                                            onClick={toggleTheme}
                                            className="p-2.5 text-slate-500 hover:text-navy-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                                        >
                                            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                                        </button>

                                        {/* Language Switcher */}
                                        <button
                                            onClick={() => {
                                                if (language === 'fr') setLanguage('ar');
                                                else if (language === 'ar') setLanguage('darija');
                                                else setLanguage('fr');
                                            }}
                                            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                        >
                                            <Globe className="w-4 h-4 text-slate-400" />
                                            <span className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">
                                                {language === 'fr' ? 'FR' : language === 'ar' ? 'AR' : 'DAR'}
                                            </span>
                                        </button>

                                        {/* Profile */}
                                        <div className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-800">
                                            <button
                                                onClick={() => navigate('profile')}
                                                className="flex flex-col items-end group"
                                            >
                                                <span className="text-sm font-black text-navy-900 dark:text-white group-hover:text-daretPink transition-colors">{user.name}</span>
                                                {user.role === UserRole.PREMIUM && (
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-yellow-500">Premium</span>
                                                )}
                                            </button>
                                            <div
                                                onClick={() => navigate('profile')}
                                                className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 cursor-pointer hover:bg-daretPink hover:text-white transition-all transform hover:scale-105"
                                            >
                                                <UserIcon className="w-6 h-6" />
                                            </div>
                                            <button
                                                onClick={onLogout}
                                                className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                                                title="Déconnexion"
                                            >
                                                <LogOut className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex items-center gap-8">
                                        <button onClick={() => navigate('landing')} className="text-sm font-bold uppercase tracking-widest text-slate-500 hover:text-navy-900 dark:text-slate-400 dark:hover:text-white transition-colors">Accueil</button>
                                        <button onClick={handleFeaturesClick} className="text-sm font-bold uppercase tracking-widest text-slate-500 hover:text-navy-900 dark:text-slate-400 dark:hover:text-white transition-colors">Fonctionnalités</button>
                                        <button onClick={toggleTheme} className="p-2.5 text-slate-500 hover:text-navy-900 dark:text-slate-400 dark:hover:text-white transition-all">
                                            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-4 ml-6">
                                        <button
                                            onClick={() => navigate('login')}
                                            className="text-sm font-bold uppercase tracking-widest text-navy-900 dark:text-white hover:text-daretPink transition-colors px-4"
                                        >
                                            {t('nav.login')}
                                        </button>
                                        <button
                                            onClick={() => navigate('register')}
                                            className="bg-navy-900 dark:bg-daretPink hover:bg-navy-800 dark:hover:bg-pink-600 text-white px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest transition-all shadow-lg hover:shadow-daretPink/20 transform hover:-translate-y-0.5"
                                        >
                                            S'inscrire
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* MOBILE TOP ACTIONS (Visible only on mobile) */}
                        <div className="md:hidden flex items-center gap-2">
                            <button
                                onClick={toggleTheme}
                                className="p-2 text-slate-500 dark:text-slate-400"
                            >
                                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                            </button>
                            <button
                                onClick={() => {
                                    if (language === 'fr') setLanguage('ar');
                                    else if (language === 'ar') setLanguage('darija');
                                    else setLanguage('fr');
                                }}
                                className="text-[10px] font-black border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5"
                            >
                                {language.toUpperCase()}
                            </button>
                            {user && (
                                <button
                                    onClick={() => setShowNotifications(true)}
                                    className="p-2 text-slate-500 relative"
                                >
                                    <Bell className="w-5 h-5" />
                                    <span className="absolute top-2 right-2 w-2 h-2 bg-daretPink rounded-full"></span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </nav>
            {showNotifications && user && (
                <NotificationCenter userId={user.id} onClose={() => setShowNotifications(false)} />
            )}
        </>
    );
};