import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { db } from '../services/db';
import { useToast } from '../contexts/ToastContext';

interface ProfileProps {
    user: User;
    navigate: (page: string) => void;
}

export const Profile: React.FC<ProfileProps> = ({ user, navigate }) => {
    const { showToast } = useToast();

    // Form State
    const [name, setName] = useState(user.name);
    const [phone, setPhone] = useState(user.phone);
    const [email, setEmail] = useState(user.email);
    const [password, setPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');

    // Stats State
    const [financials, setFinancials] = useState<any>(null);

    useEffect(() => {
        setFinancials(db.getFinancialSummary(user));
    }, [user]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await db.updateUser(user.id, { name, phone });
            showToast("Profil mis à jour avec succès !", "success");
            // Force reload or re-fetch user would be better in real app, here we rely on App.tsx to pass new user prop if it updated state, 
            // but simple way is to reload window or just notify.
            // In our simple App.tsx, we might need to trigger a reload.
            setTimeout(() => window.location.reload(), 1000);
        } catch (err: any) {
            showToast(err.message, "error");
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password || !newPassword) {
            showToast("Veuillez remplir tous les champs mot de passe.", "error");
            return;
        }
        try {
            await db.changePassword(user.id, password, newPassword);
            showToast("Mot de passe modifié !", "success");
            setPassword('');
            setNewPassword('');
        } catch (err: any) {
            showToast(err.message, "error");
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <button onClick={() => navigate('dashboard')} className="text-slate-500 hover:text-navy-900 mb-6 flex items-center">
                <span className="mr-1">←</span> Retour au Dashboard
            </button>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden transition-colors">
                {/* Header Cover */}
                <div className="h-32 bg-gradient-to-r from-navy-900 to-navy-800 relative">
                    <div className="absolute -bottom-12 left-8">
                        <div className="w-24 h-24 rounded-full bg-slate-200 border-4 border-white dark:border-slate-800 flex items-center justify-center text-4xl shadow-md">
                            {user.avatar ? <img src={user.avatar} className="w-full h-full rounded-full object-cover" /> : '👤'}
                        </div>
                    </div>
                </div>

                <div className="pt-16 pb-8 px-8">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-bold text-navy-900 dark:text-white flex items-center gap-2">
                                {user.name}
                                {user.role === UserRole.PREMIUM && <span className="px-2 py-0.5 rounded textxs bg-yellow-100 text-yellow-700 text-xs uppercase font-bold">Premium</span>}
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400">{user.email}</p>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-slate-400 uppercase font-bold tracking-wider">Score de Confiance</div>
                            <div className="text-3xl font-bold text-daretPink">850</div>
                        </div>
                    </div>

                    <hr className="my-8 border-slate-100 dark:border-slate-700" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Information Form */}
                        <div>
                            <h2 className="text-lg font-bold text-navy-900 dark:text-white mb-4">Informations Personnelles</h2>
                            <form onSubmit={handleUpdateProfile} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nom Complet</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-daretPink focus:border-daretPink"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Téléphone</label>
                                    <input
                                        type="text"
                                        value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-daretPink focus:border-daretPink"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Email (Non modifiable)</label>
                                    <input
                                        type="text"
                                        value={email}
                                        disabled
                                        className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed dark:bg-slate-900 dark:border-slate-800"
                                    />
                                </div>
                                <button type="submit" className="bg-navy-900 text-white px-6 py-2 rounded-lg font-bold hover:bg-navy-800 transition">
                                    Sauvegarder
                                </button>
                            </form>
                        </div>

                        {/* Trust & Verification Center */}
                        <div className="space-y-8">
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700">
                                <h2 className="text-lg font-bold text-navy-900 dark:text-white mb-4 flex items-center">
                                    🛡️ Centre de Vérification
                                    {user.verificationStatus === 'Verified' && <span className="ml-2 bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">Vérifié</span>}
                                </h2>

                                <div className="space-y-4">
                                    {/* Phone Verification */}
                                    <div className="flex justify-between items-center p-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                                        <div className="flex items-center">
                                            <span className="text-xl mr-3">📱</span>
                                            <div>
                                                <div className="text-sm font-bold text-slate-700 dark:text-slate-200">Téléphone</div>
                                                <div className="text-xs text-slate-400">{user.phone}</div>
                                            </div>
                                        </div>
                                        {user.verificationStatus === 'Verified' ? (
                                            <span className="text-green-500 font-bold text-lg">✓</span>
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    const code = prompt("Simulation SMS: Entrez le code 1234");
                                                    if (code === '1234') {
                                                        showToast("Téléphone vérifié avec succès !", "success");
                                                        // Update user mock
                                                    } else {
                                                        showToast("Code incorrect.", "error");
                                                    }
                                                }}
                                                className="text-xs bg-blue-100 text-blue-600 px-3 py-1 rounded font-bold hover:bg-blue-200"
                                            >
                                                Vérifier
                                            </button>
                                        )}
                                    </div>

                                    {/* ID Verification (CIN) - Premium Only */}
                                    <div className="flex justify-between items-center p-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700">
                                        <div className="flex items-center">
                                            <span className="text-xl mr-3">🪪</span>
                                            <div>
                                                <div className="text-sm font-bold text-slate-700 dark:text-slate-200">Identité (CIN)</div>
                                                <div className="text-xs text-slate-400">Pour badge "Vérifié"</div>
                                            </div>
                                        </div>
                                        {user.role === UserRole.PREMIUM ? (
                                            <button className="text-xs bg-navy-900 text-white px-3 py-1 rounded font-bold hover:bg-navy-800">
                                                Scanner CIN
                                            </button>
                                        ) : (
                                            <span className="text-xs text-slate-400 italic">🔒 Premium</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <h2 className="text-lg font-bold text-navy-900 dark:text-white mb-4">Sécurité</h2>
                                <form onSubmit={handleChangePassword} className="space-y-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Mot de passe actuel</label>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nouveau mot de passe</label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={e => setNewPassword(e.target.value)}
                                            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                                        />
                                    </div>
                                    <button type="submit" className="text-daretPink hover:text-pink-700 text-sm font-bold">
                                        Changer le mot de passe
                                    </button>
                                </form>
                            </div>

                            {/* Loyalty Card (Gamification) */}
                            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <span className="text-8xl">🏆</span>
                                </div>
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h3 className="text-lg font-bold opacity-90">Programme de Fidélité</h3>
                                            <p className="text-xs opacity-70">Gagnez des points à chaque paiement !</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-3xl font-black">{user.points || 0}</div>
                                            <div className="text-[10px] uppercase tracking-widest opacity-80">DaretPoints</div>
                                        </div>
                                    </div>

                                    <div className="mb-2 flex justify-between text-sm font-medium">
                                        <span>Niveau actuel: <span className="font-bold text-yellow-300">{user.level || 'Bronze'}</span></span>
                                        <span>Prochain: {user.level === 'Bronze' ? 'Argent (200 pts)' : user.level === 'Argent' ? 'Or (500 pts)' : 'Diamant (1000 pts)'}</span>
                                    </div>
                                    <div className="w-full bg-black/20 rounded-full h-3 mb-4 backdrop-blur-sm border border-white/10">
                                        <div 
                                            className="bg-gradient-to-r from-yellow-400 to-yellow-200 h-3 rounded-full shadow-[0_0_10px_rgba(253,224,71,0.5)] transition-all duration-1000" 
                                            style={{ width: `${Math.min(((user.points || 0) / (user.level === 'Bronze' ? 200 : user.level === 'Argent' ? 500 : 1000)) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                    
                                    <button 
                                        onClick={() => {
                                            db.addPoints(user.id, 50);
                                            showToast("🎉 +50 Points ajoutés (Simulation) !", "success");
                                            setTimeout(() => window.location.reload(), 1000);
                                        }}
                                        className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold py-2 rounded-lg transition backdrop-blur-md"
                                    >
                                        Simuler un gain de points (+50)
                                    </button>
                                </div>
                            </div>

                            {/* Trust Score Breakdown */}
                            <div>
                                <h2 className="text-lg font-bold text-navy-900 dark:text-white mb-4">Détails Score de Confiance</h2>
                                <div className="space-y-3">
                                    <div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-slate-500">Paiements à temps</span>
                                            <span className="font-bold text-green-600">98%</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-2">
                                            <div className="bg-green-500 h-2 rounded-full" style={{ width: '98%' }}></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-slate-500">Ancienneté</span>
                                            <span className="font-bold text-blue-600">12 mois</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-2">
                                            <div className="bg-blue-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-slate-500">Engagement</span>
                                            <span className="font-bold text-purple-600">Top 10%</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-2">
                                            <div className="bg-purple-500 h-2 rounded-full" style={{ width: '90%' }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h2 className="text-lg font-bold text-navy-900 dark:text-white mb-4">Mes Badges</h2>
                                <div className="flex flex-wrap gap-2">
                                    {user.badges?.map(badge => (
                                        <span key={badge} className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold border border-yellow-200">
                                            🏅 {badge}
                                        </span>
                                    ))}
                                    {(!user.badges || user.badges.length === 0) && <span className="text-slate-400 text-sm italic">Aucun badge pour le moment.</span>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
