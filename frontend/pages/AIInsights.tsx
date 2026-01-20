import React, { useState, useEffect } from 'react';
import { User, DaretGroup } from '../types';
import { advancedAI, FraudAlert, PaymentPrediction, GroupHealthScore } from '../services/geminiService';
import { db } from '../services/db';
import { motion } from 'framer-motion';

interface AIInsightsProps {
    user: User;
    navigate: (page: string) => void;
}

export const AIInsights: React.FC<AIInsightsProps> = ({ user, navigate }) => {
    const [activeTab, setActiveTab] = useState<'fraud' | 'predictions' | 'health' | 'recommendations'>('health');
    const [loading, setLoading] = useState(true);
    const [fraudAlerts, setFraudAlerts] = useState<FraudAlert[]>([]);
    const [predictions, setPredictions] = useState<PaymentPrediction[]>([]);
    const [groupHealth, setGroupHealth] = useState<GroupHealthScore | null>(null);
    const [recommendations, setRecommendations] = useState<any>(null);
    const [selectedGroup, setSelectedGroup] = useState<DaretGroup | null>(null);

    useEffect(() => {
        loadAIInsights();
    }, [user]);

    const loadAIInsights = async () => {
        setLoading(true);

        // Charger les groupes de l'utilisateur
        const allGroups = db.getGroups();
        const myGroups = allGroups.filter(g => g.members.some(m => m.userId === user.id));

        if (myGroups.length > 0) {
            const firstGroup = myGroups[0];
            setSelectedGroup(firstGroup);

            // Analyser le premier groupe
            await analyzeGroup(firstGroup);
        }

        // Charger les recommandations personnalisées
        const recs = await advancedAI.getSmartRecommendations(user);
        setRecommendations(recs);

        setLoading(false);
    };

    const analyzeGroup = async (group: DaretGroup) => {
        const allUsers = db.getUsers();
        const groupMembers = group.members
            .map(m => allUsers.find(u => u.id === m.userId))
            .filter(u => u !== undefined) as User[];

        // Détection de fraude
        const alerts: FraudAlert[] = [];
        for (const member of groupMembers) {
            const membership = group.members.find(m => m.userId === member.id)!;
            const memberAlerts = await advancedAI.detectFraud(member, group, membership);
            alerts.push(...memberAlerts);
        }
        setFraudAlerts(alerts);

        // Prédictions de paiement
        const preds = await advancedAI.predictPayments(group, groupMembers);
        setPredictions(preds);

        // Santé du groupe
        const health = await advancedAI.analyzeGroupHealth(group, groupMembers);
        setGroupHealth(health);
    };

    const getSeverityColor = (severity: FraudAlert['severity']) => {
        switch (severity) {
            case 'LOW': return 'bg-blue-50 border-blue-200 text-blue-800';
            case 'MEDIUM': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
            case 'HIGH': return 'bg-orange-50 border-orange-200 text-orange-800';
            case 'CRITICAL': return 'bg-red-50 border-red-200 text-red-800';
        }
    };

    const getHealthColor = (status: GroupHealthScore['status']) => {
        switch (status) {
            case 'EXCELLENT': return 'text-green-600';
            case 'GOOD': return 'text-blue-600';
            case 'FAIR': return 'text-yellow-600';
            case 'POOR': return 'text-orange-600';
            case 'CRITICAL': return 'text-red-600';
        }
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-10">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-daretPink"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
            {/* Header */}
            <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl md:text-5xl font-black text-navy-900 dark:text-white mb-3 tracking-tighter flex items-center gap-4">
                        <div className="w-12 h-12 bg-daretPink rounded-2xl flex items-center justify-center shadow-lg shadow-daretPink/20 animate-pulse">
                            <span className="text-2xl text-white">🤖</span>
                        </div>
                        Cœur Intelligence <span className="text-daretPink">Daretna</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">
                        Analyses prédictives en temps réel pour votre groupe : {selectedGroup?.name}
                    </p>
                </div>

                {/* Group Selector (Simplified for Bento) */}
                <div className="flex items-center gap-3 glass-card p-2 rounded-2xl">
                    <span className="text-xs font-black uppercase text-slate-400 ml-3">Changer de groupe</span>
                    <select
                        className="bg-transparent text-sm font-bold text-navy-900 dark:text-white border-none focus:ring-0 cursor-pointer"
                        onChange={(e) => {
                            const g = db.getGroups().find(x => x.id === e.target.value);
                            if (g) {
                                setSelectedGroup(g);
                                analyzeGroup(g);
                            }
                        }}
                        value={selectedGroup?.id}
                    >
                        {db.getGroups()
                            .filter(g => g.members.some(m => m.userId === user.id))
                            .map(g => <option key={g.id} value={g.id} className="text-black">{g.name}</option>)}
                    </select>
                </div>
            </div>

            {/* BENTO GRID LAYOUT */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">

                {/* 1. MAIN HEALTH CARD (Bento Large) */}
                {groupHealth && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="md:col-span-3 lg:col-span-2 glass-card p-8 rounded-[2.5rem] relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-daretPink/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
                            {/* Score Circle */}
                            <div className="relative w-40 h-40">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="80" cy="80" r="72" fill="transparent" stroke="rgba(233,30,99,0.05)" strokeWidth="12" />
                                    <motion.circle
                                        cx="80" cy="80" r="72" fill="transparent"
                                        stroke="#E91E63" strokeWidth="12" strokeDasharray="452"
                                        initial={{ strokeDashoffset: 452 }}
                                        animate={{ strokeDashoffset: 452 - (452 * groupHealth.score) / 100 }}
                                        transition={{ duration: 2, ease: "easeOut" }}
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-5xl font-black text-navy-900 dark:text-white tracking-tighter">{groupHealth.score}</span>
                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Santé / 100</span>
                                </div>
                            </div>

                            <div className="flex-1 text-center md:text-left">
                                <div className={`inline-block px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4 bg-green-100 text-green-700 dark:bg-green-900/40`}>
                                    Status : {groupHealth.status}
                                </div>
                                <h2 className="text-2xl font-black text-navy-900 dark:text-white mb-4 italic">Analyse de Fiabilité Collective</h2>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-white/50 dark:bg-slate-700/30 rounded-2xl border border-white/50">
                                        <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Succès Estimé</p>
                                        <p className="text-xl font-black text-green-600">{groupHealth.predictions.successProbability}%</p>
                                    </div>
                                    <div className="p-4 bg-white/50 dark:bg-slate-700/30 rounded-2xl border border-white/50">
                                        <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Complétion</p>
                                        <p className="text-xl font-black text-blue-600">{groupHealth.predictions.estimatedCompletionRate}%</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* 2. FRAUD / SECURITY CARD (Bento Vertical) */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="md:col-span-3 lg:col-span-2 glass-card p-8 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800"
                >
                    <h3 className="text-xl font-black text-navy-900 dark:text-white mb-6 uppercase tracking-tighter flex items-center gap-2">
                        🛡️ Sécurité & Vigilance
                    </h3>

                    {fraudAlerts.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-60 py-10">
                            <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center text-2xl mb-4">✓</div>
                            <p className="font-bold text-navy-900 dark:text-white">Aucun signal suspect détecté</p>
                            <p className="text-xs">L'historique des membres est impeccable.</p>
                        </div>
                    ) : (
                        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {fraudAlerts.map((alert, idx) => (
                                <div
                                    key={idx}
                                    className={`p-4 rounded-2xl border-l-4 ${alert.severity === 'CRITICAL' ? 'bg-red-50 border-red-500 text-red-900' :
                                        'bg-orange-50 border-orange-400 text-orange-900'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-[10px] font-black uppercase tracking-widest">{alert.type}</span>
                                        <span className="text-xs font-bold">{alert.confidence}% certitude</span>
                                    </div>
                                    <p className="text-sm font-bold leading-tight mb-2">{alert.message}</p>
                                    <p className="text-[10px] opacity-70">💡 {alert.recommendation}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>

                {/* 3. PREDICTIONS LIST (Bento Vertical / Wide) */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="md:col-span-3 lg:col-span-3 glass-card p-8 rounded-[3rem]"
                >
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-xl font-black text-navy-900 dark:text-white uppercase tracking-tighter flex items-center gap-2">
                            🔮 Algorithme de Paiement
                        </h3>
                        <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-3 py-1 rounded-full uppercase">Suivant : Tour {selectedGroup?.currentTurnIndex ? selectedGroup.currentTurnIndex + 2 : 1}</span>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {predictions.map((pred, idx) => (
                            <div
                                key={idx}
                                className="p-5 bg-white/40 dark:bg-slate-700/20 rounded-3xl border border-white/50 hover:bg-white/60 transition-colors"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-navy-900 dark:text-white">
                                        {pred.userName.charAt(0)}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-black text-navy-900 dark:text-white text-sm leading-none mb-1">{pred.userName}</h4>
                                        <p className="text-[10px] font-bold text-slate-400">Score Fiabilité: {pred.confidence}%</p>
                                    </div>
                                    <div className={`w-3 h-3 rounded-full ${pred.willPayOnTime ? 'bg-green-500 shadow-lg shadow-green-500/30' : 'bg-red-500 shadow-lg shadow-red-500/30 animate-pulse'}`}></div>
                                </div>

                                <div className="flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/30 p-2 rounded-xl">
                                    <span className="text-[10px] font-black text-slate-500 uppercase">Prédiction</span>
                                    <span className={`text-[10px] font-black uppercase ${pred.willPayOnTime ? 'text-green-600' : 'text-red-600'}`}>
                                        {pred.willPayOnTime ? 'À Temps ✅' : 'Risque Retard ⚠️'}
                                    </span>
                                </div>
                                {pred.predictedDelayDays && !pred.willPayOnTime && (
                                    <p className="text-[10px] text-red-500 font-bold mt-2 text-center">Retard estimé : ~{pred.predictedDelayDays}j</p>
                                )}
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* 4. SMART RECOMMENDATIONS (Bento Slim / Side) */}
                {recommendations && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="md:col-span-3 lg:col-span-1 bg-navy-900 dark:bg-slate-800 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute bottom-0 right-0 w-32 h-32 bg-daretPink/20 rounded-full blur-3xl"></div>
                        <h3 className="text-xl font-black mb-6 uppercase tracking-tighter flex items-center gap-2">
                            💡 IA Advice
                        </h3>

                        <div className="space-y-6 relative z-10">
                            <div>
                                <p className="text-[10px] font-black uppercase text-indigo-300 mb-2">Montant Optimal</p>
                                <p className="text-4xl font-black text-daretPink tracking-tighter">{recommendations.optimalAmount} <span className="text-sm">MAD</span></p>
                            </div>

                            <div className="pt-6 border-t border-white/10">
                                <p className="text-[10px] font-black uppercase text-indigo-300 mb-3">Conseil Stratégique</p>
                                <p className="text-xs font-medium italic leading-relaxed opacity-80">
                                    "{recommendations.reasoning.split('.')[0]}."
                                </p>
                            </div>

                            <button
                                onClick={() => navigate('chat-ia')}
                                className="w-full bg-white text-navy-900 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition shadow-xl"
                            >
                                Discuter ce plan
                            </button>
                        </div>
                    </motion.div>
                )}

            </div>

            {/* POTENTIAL ISSUES / ISSUES BOX */}
            {groupHealth?.predictions.potentialIssues.length && groupHealth.predictions.potentialIssues.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-10 p-8 glass-card border-none bg-orange-50/50 dark:bg-orange-900/10 rounded-[2.5rem]"
                >
                    <h4 className="text-lg font-black text-orange-800 dark:text-orange-400 mb-4 flex items-center gap-2 uppercase tracking-tight">
                        ⚡ Points de Vigilance Critique
                    </h4>
                    <div className="grid md:grid-cols-2 gap-4">
                        {groupHealth.predictions.potentialIssues.map((issue, idx) => (
                            <div key={idx} className="flex items-start gap-3 p-4 bg-white/70 dark:bg-slate-700/20 rounded-2xl">
                                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{issue}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
            `}</style>
        </div>
    );
};
