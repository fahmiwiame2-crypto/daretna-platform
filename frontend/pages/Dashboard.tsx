import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Users,
  Calendar,
  Star,
  ArrowUpRight,
  Plus,
  Bell,
  ChevronRight,
  Wallet,
  Award,
  Zap
} from 'lucide-react';
import { User, UserRole, DaretGroup, AiTrustScore, Notification, FinancialSummary } from '../types';
import { db } from '../services/db';
import { aiService } from '../services/geminiService';
import confetti from 'canvas-confetti';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { TiltCard } from '../components/TiltCard';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface DashboardProps {
  user: User;
  navigate: (page: string, params?: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, navigate }) => {
  const [groups, setGroups] = useState<DaretGroup[]>([]);
  const [suggestedGroups, setSuggestedGroups] = useState<DaretGroup[]>([]);
  const [trustScore, setTrustScore] = useState<AiTrustScore | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [financials, setFinancials] = useState<FinancialSummary | null>(null);
  const [loadingScore, setLoadingScore] = useState(true);
  const [showAllGroups, setShowAllGroups] = useState(false);

  const { showToast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    const allGroups = db.getGroups();
    const myGroups = allGroups.filter(g => g.members.some(m => m.userId === user.id));
    setGroups(myGroups);

    setNotifications(db.getNotifications(user.id));
    setFinancials(db.getFinancialSummary(user));

    const receiverGroup = myGroups.find(g =>
      g.status === 'Actif' &&
      g.members.find(m => m.tourPosition === g.currentTurnIndex + 1)?.userId === user.id
    );

    if (receiverGroup) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      showToast(`🎉 C'est votre tour dans "${receiverGroup.name}" !`, 'success');
    }

    const runAI = async () => {
      const score = await aiService.calculateTrustScore(user);
      setTrustScore(score);
      setLoadingScore(false);

      const candidates = allGroups.filter(g => !g.members.some(m => m.userId === user.id));
      const suggestions = await aiService.suggestGroups(user, candidates);
      setSuggestedGroups(suggestions);
    };
    runAI();
  }, [user, showToast]);

  const activeGroupsCount = groups.filter(g => g.status !== 'Terminé').length;
  const canCreate = user.role === UserRole.PREMIUM || activeGroupsCount < 5;

  const scrollToGroups = () => {
    const element = document.getElementById('my-groups-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  // Mock data for charts
  const contributionData = [
    { month: 'Jan', amount: 2000 },
    { month: 'Fév', amount: 3000 },
    { month: 'Mar', amount: 2500 },
    { month: 'Avr', amount: 4000 },
    { month: 'Mai', amount: 3500 },
    { month: 'Juin', amount: 5000 },
  ];

  const groupDistribution = [
    { name: 'Actifs', value: groups.filter(g => g.status === 'Actif').length, color: '#10b981' },
    { name: 'En attente', value: groups.filter(g => g.status === 'En attente').length, color: '#f59e0b' },
    { name: 'Terminés', value: groups.filter(g => g.status === 'Terminé').length, color: '#64748b' },
  ].filter(item => item.value > 0);

  const upcomingPayments = groups
    .filter(g => g.status === 'Actif')
    .map(g => ({
      group: g.name,
      amount: g.amountPerPerson,
      daysLeft: Math.floor(Math.random() * 30) + 1,
    }))
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 3);

  // Variances pour les listes (Staggered)
  const listVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const listItemVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: { x: 0, opacity: 1 }
  };

  const getPersonaTitle = (score: number) => {
    if (score >= 90) return { title: "Le Sage de l'Épargne 🏆", color: "text-amber-500" };
    if (score >= 80) return { title: "Le Gardien de la Médina 🛡️", color: "text-blue-500" };
    if (score >= 70) return { title: "L'Artisan de Confiance 🛠️", color: "text-green-500" };
    if (score >= 60) return { title: "Le Voyageur Prudent 🧭", color: "text-slate-500" };
    return { title: "L'Apprenti de la Daret 🌱", color: "text-rose-500" };
  };

  const persona = getPersonaTitle(trustScore);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12"
    >

      {/* HEADER SECTION */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-navy-900 dark:text-white mb-1 tracking-tight">
            {t('common.welcome')}, {user.name} <span className="text-daretPink animate-pulse">👋</span>
          </h1>
          <p className={`text-lg font-black uppercase tracking-widest ${persona.color} mb-3`}>
            {persona.title}
          </p>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
            Prêt pour vos objectifs d'épargne aujourd'hui ?
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('chat-ia')}
            className="flex items-center gap-2 px-5 py-3 glass-card text-navy-900 dark:text-white font-bold hover:shadow-2xl transition-all transform hover:-translate-y-1"
          >
            <Zap className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            DaretBot
          </button>
          <button
            onClick={() => navigate('create-group')}
            className="flex items-center gap-2 px-6 py-3 bg-daretPink hover:bg-pink-600 text-white rounded-2xl font-bold shadow-lg shadow-daretPink/20 hover:shadow-daretPink/40 transition-all transform hover:-translate-y-1"
          >
            <Plus className="w-5 h-5" />
            Nouveau Groupe
          </button>
        </div>
      </motion.div>

      {/* TOP STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">

        {/* Total Contributed Card */}
        <TiltCard className="h-full">
          <motion.div variants={itemVariants} className="bg-navy-900 dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group h-full">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500"></div>
            <div className="relative z-10 text-white">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Total Épargné</p>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl font-black tracking-tighter">{financials?.totalContributed.toLocaleString() || 0}</span>
                <span className="text-slate-500 font-bold">MAD</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-green-400 font-bold">
                <ArrowUpRight className="w-3 h-3" />
                <span>+12.5% vs mois dernier</span>
              </div>
            </div>
          </motion.div>
        </TiltCard>

        {/* Active Groups Summary Card */}
        <TiltCard className="h-full">
          <motion.div 
            variants={itemVariants} 
            onClick={scrollToGroups}
            className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-xl h-full border border-slate-100 dark:border-slate-700 relative overflow-hidden group cursor-pointer hover:bg-slate-50 transition-colors"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-daretPink/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500"></div>
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-all duration-300">
              <Users className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />
            </div>
            <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Mes Groupes</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-navy-900 dark:text-white tracking-tighter">{activeGroupsCount}</span>
              <span className="text-slate-400 font-bold text-sm">actifs</span>
            </div>
          </motion.div>
        </TiltCard>

        {/* Next Payment Card */}
        <TiltCard className="h-full">
          <motion.div variants={itemVariants} className="glass-card p-8 rounded-[2.5rem] hover:shadow-2xl transition-all group cursor-default h-full">
            <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/20 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-orange-500 transition-all duration-300">
              <Calendar className="w-6 h-6 text-orange-600 group-hover:text-white transition-colors" />
            </div>
            <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Prochain Paiement</p>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-4xl font-black text-navy-900 dark:text-white tracking-tighter">{financials?.nextPaymentAmount || 0}</span>
              <span className="text-slate-400 font-bold">MAD</span>
            </div>
            <p className="text-xs text-orange-600 dark:text-orange-400 font-bold">Le {new Date(financials?.nextPaymentDate || '').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</p>
          </motion.div>
        </TiltCard>

        {/* Trust Score Card - Circular Visualization */}
        <TiltCard className="h-full">
          <motion.div variants={itemVariants} className="bg-gradient-to-br from-indigo-900 to-navy-900 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group flex flex-col items-center justify-center h-full">
            <div className="relative w-28 h-28">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="56" cy="56" r="50"
                  fill="transparent"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="8"
                />
                <motion.circle
                  cx="56" cy="56" r="50"
                  fill="transparent"
                  stroke="#E91E63"
                  strokeWidth="8"
                  strokeDasharray="314"
                  initial={{ strokeDashoffset: 314 }}
                  animate={{ strokeDashoffset: 314 - (314 * (trustScore?.score || 0)) / 100 }}
                  transition={{ duration: 2, ease: "easeOut" }}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                <span className="text-3xl font-black tracking-tighter">{loadingScore ? '...' : trustScore?.score}</span>
                <span className="text-[8px] font-bold uppercase opacity-60">Confiance</span>
              </div>
            </div>
            <div className="mt-4 px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase text-pink-400 tracking-widest backdrop-blur-sm">
              {loadingScore ? 'Analyse...' : (trustScore?.level || 'Moyen')}
            </div>
          </motion.div>
        </TiltCard>

      </div>

      {/* COACH AI / INSIGHT SECTION */}
      <motion.div
        variants={itemVariants}
        className="mb-10 p-1 bg-gradient-to-r from-daretPink/20 via-purple-500/20 to-indigo-500/20 rounded-[2.5rem]"
      >
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.4rem] flex flex-col md:flex-row items-center gap-8">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-daretPink to-purple-600 flex items-center justify-center text-3xl shadow-xl shadow-daretPink/20 animate-bounce-slow">
              🤖
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-4 border-white dark:border-slate-800 rounded-full"></div>
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-xl font-black text-navy-900 dark:text-white mb-2 uppercase tracking-tight">Conseil Pro-actif du Coach IA</h3>
            <p className="text-slate-600 dark:text-slate-400 italic font-medium leading-relaxed">
              "{trustScore?.score && trustScore.score > 80 ?
                "Votre score de confiance exceptionnel vous permet d'accéder aux groupes Premium avec des montants d'épargne plus élevés. Profil idéal !" :
                "Continuez vos paiements réguliers pour augmenter votre score. Un score de 85 vous débloquera l'insigne 'Investisseur'."}"
            </p>
          </div>
          <button
            onClick={() => navigate('chat-ia')}
            className="px-8 py-3 bg-navy-900 text-white rounded-2xl font-bold hover:bg-black transition-all shadow-xl whitespace-nowrap"
          >
            Parler au Bot
          </button>
        </div>
      </motion.div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">

        {/* Main Area Chart */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-2 glass-card p-8 rounded-[2.5rem]"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-navy-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-daretPink" />
              Impact d'Épargne
            </h3>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500">6 Mois</span>
            </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={contributionData} margin={{ left: -10, bottom: -10 }}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E91E63" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#E91E63" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }}
                  dy={10}
                />
                <YAxis hide />
                <Tooltip
                  cursor={{ stroke: '#E91E63', strokeWidth: 2, strokeDasharray: '5 5' }}
                  contentStyle={{
                    borderRadius: '16px',
                    border: 'none',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    padding: '12px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#E91E63"
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="url(#colorAmount)"
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Group Composition Chart */}
        <motion.div
          variants={itemVariants}
          className="glass-card p-8 rounded-[2.5rem] flex flex-col"
        >
          <div className="mb-8">
            <h3 className="text-xl font-black text-navy-900 dark:text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              Répartition
            </h3>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Status de vos tontines</p>
          </div>

          <div className="flex-grow flex items-center justify-center">
            {groupDistribution.length > 0 ? (
              <div className="relative w-full h-full max-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={groupDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={8}
                      dataKey="value"
                    >
                      {groupDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xs font-black text-slate-400 uppercase">Total</span>
                  <span className="text-3xl font-black text-navy-900 dark:text-white leading-none">{groups.length}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 opacity-30">
                <p className="text-xs font-bold uppercase tracking-widest">Pas de données</p>
              </div>
            )}
          </div>

          <div className="mt-8 space-y-3">
            {groupDistribution.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{item.name}</span>
                </div>
                <span className="text-sm font-black text-navy-900 dark:text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* LOWER SECTION: LISTS & ACTIVITIES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

        {/* RECENT GROUPS SECTION */}
        <motion.div id="my-groups-section" variants={itemVariants} className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black text-navy-900 dark:text-white tracking-tight">Mes Groupes</h3>
            <div className="flex gap-3">
              {groups.length > 3 && (
                <button
                  onClick={() => setShowAllGroups(!showAllGroups)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-2"
                >
                  {showAllGroups ? 'Voir moins' : 'Voir tout'}
                </button>
              )}
              <button
                onClick={() => navigate('create-group')}
                className="px-4 py-2 bg-daretPink/10 text-daretPink rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-daretPink hover:text-white transition-all flex items-center gap-2"
              >
                <Plus className="w-3 h-3" />
                Nouveau
              </button>
            </div>
          </div>

          <div className="grid gap-4">
            {groups.length > 0 ? (showAllGroups ? groups : groups.slice(0, 3)).map((group) => (
              <div
                key={group.id}
                onClick={() => navigate('group-detail', { groupId: group.id })}
                className="p-6 glass-card rounded-[2rem] hover:shadow-2xl transition-all cursor-pointer flex items-center gap-5 group border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm transition-transform group-hover:scale-110 ${group.status === 'Actif' ? 'bg-green-50 text-green-600' :
                  group.status === 'En attente' ? 'bg-orange-50 text-orange-600' : 'bg-slate-100 text-slate-400'
                  }`}>
                  {group.name.charAt(0)}
                </div>
                <div className="flex-grow">
                  <h4 className="font-black text-navy-900 dark:text-white leading-tight mb-1">{group.name}</h4>
                  <div className="flex items-center gap-3 text-xs font-bold text-slate-400">
                    <span>{group.amountPerPerson} MAD</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    <span>{group.members.length} membres</span>
                  </div>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${group.status === 'Actif' ? 'bg-green-100 text-green-700 dark:bg-green-900/30' :
                  'bg-slate-100 text-slate-500 dark:bg-slate-700'
                  }`}>
                  {group.status}
                </div>
              </div>
            )) : (
              <div className="p-12 text-center glass-card rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-700">
                <Users className="w-10 h-10 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400 text-sm font-bold">Aucun groupe pour le moment</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* FEED & GAMIFICATION */}
        <motion.div variants={itemVariants} className="flex flex-col gap-6">
          <h3 className="text-2xl font-black text-navy-900 dark:text-white tracking-tight">Activités & Social</h3>

          <div className="glass-card p-8 rounded-[2.5rem]">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-yellow-400 flex items-center justify-center text-white shadow-lg shadow-yellow-400/20">
                <Award className="w-6 h-6" />
              </div>
              <h4 className="font-black text-navy-900 dark:text-white uppercase tracking-tighter">Leaderboard du mois</h4>
            </div>

            <motion.div
              variants={listVariants}
              initial="hidden"
              animate="visible"
              className="space-y-4"
            >
              {[
                { name: 'Sara I.', score: 98, role: 'Top Contributor', icon: '🥇' },
                { name: 'Amine T.', score: 95, role: 'Ponctuel', icon: '🥈' },
                { name: 'Karim B.', score: 87, role: 'Membre Fidèle', icon: '🥉' },
              ].map((user, i) => (
                <motion.div key={i} variants={listItemVariants} className="flex items-center gap-4 group">
                  <div className="text-2xl w-8 text-center">{user.icon}</div>
                  <div className="flex-grow">
                    <h5 className="text-sm font-black text-navy-900 dark:text-white">{user.name}</h5>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{user.role}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-daretPink">{user.score}</div>
                    <div className="text-[10px] text-slate-400 font-bold">score</div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <div className="mt-10 p-5 bg-gradient-to-r from-navy-900 to-indigo-900 rounded-3xl text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-1">Votre Avantage</p>
                  <h5 className="font-black text-lg leading-tight">Gagnez 50 MAD</h5>
                  <p className="text-[10px] text-white/60">Pour chaque parrainage</p>
                </div>
                <button className="px-4 py-2 bg-white text-navy-900 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition shadow-lg">Partager</button>
              </div>
            </div>
          </div>

          {/* Recent Notifications Mini Feed */}
          <div className="px-6 space-y-4">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Bell className="w-3 h-3" />
              Notifications récentes
            </h4>
            <motion.div
              variants={listVariants}
              initial="hidden"
              animate="visible"
              className="space-y-4"
            >
              {notifications.slice(0, 2).map((notif, i) => (
                <motion.div key={i} variants={listItemVariants} className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${notif.type === 'PAYMENT' ? 'bg-green-500' : 'bg-daretPink'}`}></div>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed">{notif.message}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>

      </div>

      <style>{`
        .animate-bounce-slow {
          animation: bounce 3s infinite;
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(-5%) rotate(0deg); }
          50% { transform: translateY(0) rotate(5deg); }
        }
      `}</style>
    </motion.div>
  );
};