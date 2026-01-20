import React, { useEffect, useState, useRef } from 'react';
import { User, DaretGroup, Membership, GroupStatus, GroupMessage, GroupRole, VoteSession } from '../types';
import { db } from '../services/db';
import { aiService } from '../services/geminiService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useToast } from '../contexts/ToastContext';
import { motion } from 'framer-motion';
import { Roadmap } from '../components/Roadmap';

interface GroupDetailProps {
  user: User;
  groupId: string;
  navigate: (page: string, params?: any) => void;
}

export const GroupDetail: React.FC<GroupDetailProps> = ({ user, groupId, navigate }) => {
  const { showToast } = useToast();
  const [group, setGroup] = useState<DaretGroup | null>(null);
  const [membersDetails, setMembersDetails] = useState<(Membership & { name: string, email: string })[]>([]);
  const [loading, setLoading] = useState(true);

  // Tabs State
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'CHAT' | 'ADMIN'>('OVERVIEW');

  // Chat State
  const [chatMessages, setChatMessages] = useState<GroupMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Admin AI State
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [optimizing, setOptimizing] = useState(false);

  // Invite State
  const [inviteInput, setInviteInput] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');

  // Voting State
  const [votes, setVotes] = useState<VoteSession[]>([]);
  const [newVoteQuestion, setNewVoteQuestion] = useState('');
  const [newVoteOption1, setNewVoteOption1] = useState('Oui');
  const [newVoteOption2, setNewVoteOption2] = useState('Non');

  const loadData = () => {
    const groups = db.getGroups();
    const g = groups.find(x => x.id === groupId);
    if (!g) {
      navigate('dashboard');
      return;
    }
    setGroup(g);

    // Hydrate members
    const allUsers = db.getUsers();
    const details = g.members
      .map(m => {
        const u = allUsers.find(user => user.id === m.userId);
        return { ...m, name: u?.name || 'Inconnu', email: u?.email || '' };
      })
      .sort((a, b) => (a.tourPosition || 999) - (b.tourPosition || 999));

    setMembersDetails(details);

    // Load Chat
    const msgs = db.getGroupMessages(groupId);
    setChatMessages(msgs);

    // Load Votes
    const groupVotes = db.getGroupVotes(groupId);
    setVotes(groupVotes);

    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // Simulate real-time chat poll
    const interval = setInterval(() => {
      const msgs = db.getGroupMessages(groupId);
      setChatMessages(msgs);
    }, 3000);
    return () => clearInterval(interval);
  }, [groupId]);

  useEffect(() => {
    if (activeTab === 'CHAT') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

  // Draw State
  const [selectedDrawMode, setSelectedDrawMode] = useState<'RANDOM' | 'MANUAL' | 'WEIGHTED'>('RANDOM');
  const [showSimulatedOrder, setShowSimulatedOrder] = useState(false);

  const handleStartDaret = async () => {
    if (!group) return;
    if (confirm(`Voulez-vous lancer la Daret avec le mode : ${selectedDrawMode === 'RANDOM' ? 'Aléatoire' : selectedDrawMode === 'WEIGHTED' ? 'Pondéré/IA' : 'Manuel'} ?`)) {
      // If Manual, we would pass the order array. For now keeping it simple.
      await db.startDaret(group.id, selectedDrawMode);
      loadData();
      setActiveTab('OVERVIEW');
      showToast("Daret lancée avec succès !", "success");
    }
  };

  // ... (handleDownloadContract, etc. same as before)

  // Transparency Block (Rendered in Header)    
  const TransparencyBadge = () => group && group.status === 'Actif' && group.drawSeed ? (
    <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-500 flex flex-col md:flex-row gap-2 justify-between items-center opacity-80">
      <div className="flex items-center gap-2">
        <span>🎲 Tirage: {group.drawMode === 'RANDOM' ? 'Aléatoire' : group.drawMode === 'WEIGHTED' ? 'Pondéré' : 'Manuel'}</span>
        <span className="h-3 w-px bg-slate-300"></span>
        <span>Seed: {group.drawSeed}</span>
        <span className="h-3 w-px bg-slate-300"></span>
        <span>Date: {new Date(group.drawDate || '').toLocaleDateString()}</span>
      </div>
      <div className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100 uppercase font-bold tracking-wider">
        Vérifié sur Blockchain (Simulé)
      </div>
    </div>
  ) : null;


  const handleDownloadContract = () => {
    if (!group) return;

    const doc = new jsPDF();

    // Header
    doc.setFontSize(22);
    doc.setTextColor(40, 58, 140); // Navy 900
    doc.text("CONTRAT DARETNA.MA", 105, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Groupe: ${group.name}`, 20, 40);
    doc.text(`Montant par personne: ${group.amountPerPerson} MAD`, 20, 50);
    doc.text(`Total du cycle: ${group.amountPerPerson * membersDetails.length} MAD`, 20, 60);
    doc.text(`Date de création: ${group.startDate}`, 20, 70);

    // Table
    const tableColumn = ["Tour", "Membre", "Email", "Statut"];
    const tableRows = membersDetails.map(member => [
      member.tourPosition || '-',
      member.name,
      member.email,
      member.hasPaidCurrentPeriod ? "Payé" : "En attente"
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 80,
      theme: 'grid',
      headStyles: { fillColor: [255, 0, 128] }, // daretPink approx
      styles: { fontSize: 10 },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });

    // Signature Area
    const finalY = (doc as any).lastAutoTable.finalY || 150;
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text("Signature du responsable:", 20, finalY + 30);
    doc.line(20, finalY + 45, 80, finalY + 45);

    doc.text("Généré par Daretna.ma - La Tontine Digitale de Confiance", 105, 280, { align: 'center' });

    doc.save(`Contrat_${group.name.replace(/\s+/g, '_')}.pdf`);
  };

  const handlePaymentClick = (method: 'CMI' | 'PAYPAL') => {
    if (!group) return;
    navigate('payment-simulation', { method, groupId: group.id });
  };

  const handleJoin = async () => {
    if (!group) return;
    try {
      await db.joinGroup(group.id, user);
      loadData();
    } catch (e: any) {
      alert(e.message);
    }
  }

  // Chat Function
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !group) return;
    await db.sendGroupMessage(group.id, user, chatInput);
    setChatInput('');
    const msgs = db.getGroupMessages(groupId);
    setChatMessages(msgs);
  };

  // Admin AI Functions
  const runRiskAnalysis = async () => {
    if (!group) return;
    setAiAnalysis('Analyse en cours par Gemini...');
    const allUsers = db.getUsers();
    const groupUsers = group.members.map(m => allUsers.find(u => u.id === m.userId)).filter(u => u !== undefined) as User[];
    const analysis = await aiService.analyzeGroupRisk(group, groupUsers);
    setAiAnalysis(analysis);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError('');
    setInviteSuccess('');

    if (!inviteInput.trim()) {
      showToast("Veuillez saisir un email ou un téléphone.", "error");
      return;
    }

    try {
      await db.inviteMember(group!.id, inviteInput.trim());
      showToast(`Membre "${inviteInput}" ajouté avec succès !`, "success");
      setInviteInput('');
      loadData();
    } catch (err: any) {
      setInviteError(err.message);
      showToast(err.message, "error");
    }
  };

  const runAiOptimization = async () => {
    if (!group) return;
    setOptimizing(true);
    const allUsers = db.getUsers();
    const groupUsers = group.members.map(m => allUsers.find(u => u.id === m.userId)).filter(u => u !== undefined) as User[];
    const optimizedOrderIds = await aiService.optimizeTurnOrder(groupUsers);

    // Apply mock update - using WEIGHTED mode for AI optimization
    await db.startDaret(group.id, 'WEIGHTED');
    loadData();
    setOptimizing(false);
  };

  const handleCreateVote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!group || !newVoteQuestion.trim()) return;
    
    try {
      await db.createVote(group.id, user.id, newVoteQuestion, [newVoteOption1, newVoteOption2]);
      showToast("Vote créé avec succès !", "success");
      setNewVoteQuestion('');
      setNewVoteOption1('Oui');
      setNewVoteOption2('Non');
      loadData();
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleCastVote = async (voteId: string, optionId: string) => {
    try {
      await db.castVote(voteId, user.id, optionId);
      showToast("Vote enregistré !", "success");
      loadData();
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  if (loading || !group) return <div className="p-10 text-center">Chargement...</div>;

  const isAdmin = group.adminId === user.id;
  const myMemberInfo = group.members.find(m => m.userId === user.id);
  const isMyTurnToPay = group.status === GroupStatus.ACTIVE && myMemberInfo && myMemberInfo.paymentStatus !== 'CONFIRMED' && myMemberInfo.paymentStatus !== 'SUBMITTED';
  const receiver = membersDetails.find(m => m.tourPosition === group.currentTurnIndex + 1);

  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!group || !e.target.files?.[0]) return;
    try {
      // Mock File Upload (Convert to Base64)
      const reader = new FileReader();
      reader.onloadend = async () => {
        await db.submitPayment(group.id, user.id, reader.result as string);
        showToast("Preuve envoyée ! En attente de validation.", "success");
        loadData();
      };
      reader.readAsDataURL(e.target.files[0]);
    } catch (err) {
      showToast("Erreur lors de l'envoi", "error");
    }
  };

  const handleConfirmPayment = async (memberId: string) => {
    if (!group) return;
    if (confirm("Confirmer la réception du paiement ?")) {
      await db.confirmPayment(group.id, memberId);
      showToast("Paiement validé !", "success");
      loadData();
    }
  };

  const handleSendReminders = async () => {
    if (!group) return;
    const res = await db.sendReminders(group.id);
    showToast(res, "success");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-10">
      <button onClick={() => navigate('dashboard')} className="text-slate-500 hover:text-navy-900 mb-6 flex items-center">
        <span className="mr-1">←</span> Retour
      </button>

      {/* Header Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 md:p-8 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-navy-900 dark:text-white mb-2">{group.name}</h1>
            <div className="flex space-x-3">
              <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full text-xs md:text-sm font-medium">
                {group.periodicity}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs md:text-sm font-medium ${group.status === 'Actif' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                {group.status}
              </span>
              {/* Verified Badge for Premium Admins (Simulated Check) */}
              <span className="ml-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs md:text-sm font-bold flex items-center">
                ✅ Vérifié
              </span>
            </div>
            {/* Transparency Badge if Active */}
            <TransparencyBadge />
          </div>
          <div className="mt-4 md:mt-0 text-right">
            <p className="text-slate-500 dark:text-slate-400 text-sm">Montant total / tour</p>
            <p className="text-2xl md:text-3xl font-bold text-daretPink">{group.amountPerPerson * membersDetails.length} MAD</p>
            <p className="text-slate-400 text-xs">({group.amountPerPerson} MAD / pers)</p>
          </div>
        </div>

        {/* PROGRESS ROADMAP (Visual Transformation Phase 3) */}
        {group.status === GroupStatus.ACTIVE && (
          <div className="mt-10 mb-6 bg-slate-50/50 dark:bg-slate-800/20 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-700/50">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h3 className="text-xl font-black text-navy-900 dark:text-white italic tracking-tighter">
                  La Route du Succès <span className="text-daretPink">IA</span>
                </h3>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  Cycle de solidarité • Tour {group.currentTurnIndex + 1}
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-navy-900 dark:text-white">
                  {Math.round(((group.currentTurnIndex + 1) / membersDetails.length) * 100)}%
                </span>
                <div className="text-[9px] font-black text-slate-400 uppercase">Complété</div>
              </div>
            </div>

            <Roadmap
              currentTurn={group.currentTurnIndex}
              members={membersDetails.map((m, i) => ({
                userId: m.userId,
                name: m.name.split(' ')[0], // Only first name for clarity
                isPaid: m.paymentStatus === 'CONFIRMED',
                isCurrent: i === group.currentTurnIndex,
                position: i + 1
              }))}
            />
          </div>
        )}

        {/* Global Actions */}
        <div className="mt-6 flex flex-wrap gap-3">
          {!myMemberInfo && group.status === GroupStatus.PENDING && (
            <button
              onClick={handleJoin}
              className="bg-daretPink text-white px-6 py-2 rounded-lg hover:bg-pink-600 transition shadow font-bold"
            >
              Rejoindre ce groupe
            </button>
          )}
          <button
            onClick={handleDownloadContract}
            className="border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 transition text-sm font-medium flex items-center"
          >
            <span>📜</span> <span className="ml-2">PDF</span>
          </button>
          <button
            onClick={() => {
              alert("Simulé : Export Excel généré (transactions.xlsx)");
            }}
            className="border border-green-200 bg-green-50 text-green-700 px-4 py-2 rounded-lg hover:bg-green-100 transition text-sm font-medium flex items-center"
          >
            <span>📊</span> <span className="ml-2">Excel</span>
          </button>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`px-6 py-3 font-medium text-sm transition border-b-2 whitespace-nowrap ${activeTab === 'OVERVIEW' ? 'border-daretPink text-daretPink' : 'border-transparent text-slate-500 hover:text-navy-900 dark:text-slate-400 dark:hover:text-white'}`}
        >
          Vue d'ensemble
        </button>
        <button
          onClick={() => setActiveTab('CHAT')}
          className={`px-6 py-3 font-medium text-sm transition border-b-2 whitespace-nowrap flex items-center ${activeTab === 'CHAT' ? 'border-daretPink text-daretPink' : 'border-transparent text-slate-500 hover:text-navy-900 dark:text-slate-400 dark:hover:text-white'}`}
        >
          <span className="mr-2">💬</span> Discussion
          {chatMessages.length > 0 && <span className="ml-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded-full text-xs">{chatMessages.length}</span>}
        </button>
        <button
          onClick={() => setActiveTab('VOTES')}
          className={`px-6 py-3 font-medium text-sm transition border-b-2 whitespace-nowrap flex items-center ${activeTab === 'VOTES' ? 'border-daretPink text-daretPink' : 'border-transparent text-slate-500 hover:text-navy-900 dark:text-slate-400 dark:hover:text-white'}`}
        >
          <span className="mr-2">🗳️</span> Décisions
          {votes.length > 0 && <span className="ml-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded-full text-xs">{votes.length}</span>}
        </button>
        {isAdmin && (
          <button
            onClick={() => setActiveTab('ADMIN')}
            className={`px-6 py-3 font-medium text-sm transition border-b-2 whitespace-nowrap flex items-center ${activeTab === 'ADMIN' ? 'border-daretPink text-daretPink' : 'border-transparent text-slate-500 hover:text-navy-900 dark:text-slate-400 dark:hover:text-white'}`}
          >
            <span className="mr-2">🤖</span> IA & Admin
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* === TAB: OVERVIEW === */}
        {activeTab === 'OVERVIEW' && (
          <>
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
                  <h3 className="font-bold text-navy-900 dark:text-white">Participants & Tours</h3>
                </div>

                {/* ADMIN INVITE SECTION */}
                {isAdmin && group.status === GroupStatus.PENDING && (
                  <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 border-b border-blue-100 dark:border-blue-800">
                    <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        placeholder="Email ou Téléphone du membre..."
                        className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:outline-none focus:border-daretPink text-black dark:text-white placeholder-slate-400"
                        value={inviteInput}
                        onChange={e => setInviteInput(e.target.value)}
                      />
                      <button type="submit" className="bg-navy-900 dark:bg-daretPink text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-navy-800 dark:hover:bg-pink-600 transition">
                        + Ajouter
                      </button>
                    </form>
                    {inviteError && <p className="text-red-500 text-xs mt-2 font-medium">{inviteError}</p>}
                    {inviteSuccess && <p className="text-green-600 text-xs mt-2 font-medium">{inviteSuccess}</p>}
                  </div>
                )}
                {isAdmin && group.status !== GroupStatus.PENDING && (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border-b border-yellow-100 dark:border-yellow-900/30 text-yellow-800 dark:text-yellow-400 text-sm italic">
                    🚫 L'ajout de membres est désactivé car le groupe a déjà démarré.
                  </div>
                )}
                
                {/* Desktop View (Table) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-slate-500 dark:text-slate-400 text-sm border-b border-slate-100 dark:border-slate-700">
                        <th className="px-6 py-3 font-medium">Ordre</th>
                        <th className="px-6 py-3 font-medium">Membre</th>
                        <th className="px-6 py-3 font-medium">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                      {membersDetails.map((member) => (
                        <tr key={member.userId} className={member.tourPosition === group.currentTurnIndex + 1 ? "bg-blue-50/50 dark:bg-blue-900/20" : ""}>
                          <td className="px-6 py-4 font-mono text-slate-500 dark:text-slate-400">
                            {member.tourPosition ? <span className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-sm text-navy-900 dark:text-white">{member.tourPosition}</span> : '-'}
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-navy-900 dark:text-white flex items-center gap-2">
                              {member.name}
                              {member.role === GroupRole.ADMIN && <span className="text-[10px] bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded uppercase font-bold">Admin</span>}
                              {member.role === GroupRole.CO_ADMIN && <span className="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded uppercase font-bold">Co-Admin</span>}
                            </div>
                            <div className="text-xs text-slate-400">{member.email}</div>
                          </td>
                          <td className="px-6 py-4">
                            {member.isBlocked ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
                                🚫 Bloqué
                              </span>
                            ) : group.status === GroupStatus.ACTIVE ? (
                              member.paymentStatus === 'CONFIRMED' ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                                  ✅ Payé
                                </span>
                              ) : member.paymentStatus === 'SUBMITTED' ? (
                                <div className="flex flex-col gap-1">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 animate-pulse">
                                    ⏳ Validation Requise
                                  </span>
                                  {isAdmin && (
                                    <div className="flex gap-1 mt-1">
                                      <button
                                        onClick={() => {
                                          const w = window.open();
                                          w?.document.write('<img src="' + member.paymentProofUrl + '"/>');
                                        }}
                                        className="text-[10px] text-blue-600 dark:text-blue-400 underline"
                                      >
                                        Voir Preuve
                                      </button>
                                      <button
                                        onClick={() => handleConfirmPayment(member.userId)}
                                        className="text-[10px] bg-green-600 text-white px-2 py-0.5 rounded"
                                      >
                                        Valider
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                                    {member.paymentStatus === 'LATE' ? 'Retard' : 'Non Payé'}
                                  </span>
                                  {isAdmin && (
                                    <button onClick={handleSendReminders} className="text-[10px] text-slate-400 hover:text-navy-900 dark:hover:text-white border border-slate-200 dark:border-slate-600 px-1 rounded">
                                      🔔 Relancer
                                    </button>
                                  )}
                                </div>
                              )
                            ) : (
                              <span className="text-slate-400 text-sm italic">En attente</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View (Cards) */}
                <div className="md:hidden flex flex-col divide-y divide-slate-100 dark:divide-slate-700">
                  {membersDetails.map((member) => (
                    <div key={member.userId} className={`p-4 ${member.tourPosition === group.currentTurnIndex + 1 ? "bg-blue-50/50 dark:bg-blue-900/20" : ""}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-sm text-navy-900 dark:text-white">
                            {member.tourPosition || '-'}
                          </span>
                          <div>
                            <div className="font-bold text-navy-900 dark:text-white text-sm flex items-center gap-2">
                              {member.name}
                              {member.role === GroupRole.ADMIN && <span className="text-[9px] bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-1 py-0.5 rounded font-bold">ADM</span>}
                            </div>
                            <div className="text-[10px] text-slate-400">{member.email}</div>
                          </div>
                        </div>
                        {/* Status Badge */}
                        {member.isBlocked ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">Bloqué</span>
                        ) : group.status === GroupStatus.ACTIVE ? (
                          member.paymentStatus === 'CONFIRMED' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">Payé</span>
                          ) : member.paymentStatus === 'SUBMITTED' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300">En attente</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400">Non Payé</span>
                          )
                        ) : (
                          <span className="text-slate-400 text-[10px] italic">Attente</span>
                        )}
                      </div>
                      
                      {/* Mobile Actions */}
                      {isAdmin && group.status === GroupStatus.ACTIVE && member.paymentStatus === 'SUBMITTED' && (
                        <div className="flex gap-2 mt-2 ml-11">
                           <button
                              onClick={() => {
                                const w = window.open();
                                w?.document.write('<img src="' + member.paymentProofUrl + '"/>');
                              }}
                              className="text-[10px] bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded font-medium"
                            >
                              Voir Preuve
                            </button>
                            <button
                              onClick={() => handleConfirmPayment(member.userId)}
                              className="text-[10px] bg-green-600 text-white px-3 py-1.5 rounded font-bold"
                            >
                              Valider
                            </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Launch Box for Admin */}
              {isAdmin && group.status === GroupStatus.PENDING && (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow border border-slate-200 dark:border-slate-700">
                  <h3 className="font-bold text-navy-900 dark:text-white mb-2">Lancement</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Lancez la Daret une fois tous les membres inscrits. L'ordre sera aléatoire par défaut.</p>
                  <button
                    onClick={() => handleStartDaret()}
                    className="w-full bg-navy-900 dark:bg-daretPink text-white px-4 py-3 rounded-lg hover:bg-navy-800 dark:hover:bg-pink-600 transition shadow font-bold"
                  >
                    Lancer maintenant (Aléatoire)
                  </button>
                  <p className="text-[10px] text-center mt-2 text-slate-400">Pour un ordre optimisé par IA, allez dans l'onglet "IA & Admin"</p>
                </div>
              )}

              {group.status === GroupStatus.ACTIVE && receiver && (
                <div className="bg-gradient-to-br from-navy-900 to-navy-800 dark:from-slate-800 dark:to-slate-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 12h-2v-2h2v2zm0-4h-2V6h2v4z" /></svg>
                  </div>
                  <h3 className="text-sm opacity-80 uppercase tracking-wide mb-2">Bénéficiaire ce mois</h3>
                  <div className="text-2xl font-bold mb-1">{receiver.name}</div>
                  <div className="text-3xl font-mono text-daretPink mt-4">{group.amountPerPerson * membersDetails.length} MAD</div>
                  <p className="text-xs opacity-60 mt-2">Virement prévu le 05 du mois.</p>
                </div>
              )}

              {isMyTurnToPay ? (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-daretPink/30 ring-4 ring-daretPink/5 dark:ring-daretPink/10">
                  <h3 className="font-bold text-navy-900 dark:text-white mb-4">À vous de payer !</h3>
                  <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">Montant dû : <span className="font-bold text-black dark:text-white">{group.amountPerPerson} MAD</span></p>

                  <div className="space-y-3">
                    <button
                      onClick={() => handlePaymentClick('CMI')}
                      className="w-full bg-navy-900 dark:bg-daretPink hover:bg-navy-800 dark:hover:bg-pink-600 text-white py-3 rounded-lg font-medium transition flex items-center justify-center shadow-sm"
                    >
                      💳 Payer par CMI
                    </button>

                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProofUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <button
                        className="w-full border-2 border-dashed border-daretPink text-daretPink py-3 rounded-lg font-medium transition flex items-center justify-center hover:bg-pink-50 dark:hover:bg-slate-700"
                      >
                        📸 Uploader Preuve (Virement/Cash)
                      </button>
                    </div>
                  </div>
                </div>

              ) : group.status === GroupStatus.ACTIVE && myMemberInfo?.paymentStatus === 'SUBMITTED' ? (
                <div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-2xl border border-orange-100 dark:border-orange-800 text-center">
                  <div className="text-4xl mb-2">⏳</div>
                  <h3 className="font-bold text-orange-800 dark:text-orange-300">Vérification en cours</h3>
                  <p className="text-orange-600 dark:text-orange-400 text-sm mt-1">Le responsable vérifie votre preuve de paiement.</p>
                </div>
              ) : group.status === GroupStatus.ACTIVE && myMemberInfo?.paymentStatus === 'CONFIRMED' ? (
                <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-2xl border border-green-100 dark:border-green-800 text-center">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-3 text-xl">✓</div>
                  <h3 className="font-bold text-green-800 dark:text-green-300">Tout est en ordre</h3>
                  <p className="text-green-600 dark:text-green-400 text-sm mt-1">Vous avez payé pour cette période.</p>
                </div>
              ) : null}
            </div>
          </>
        )}

        {/* === TAB: CHAT === */}
        {activeTab === 'CHAT' && (
          <div className="lg:col-span-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col h-[600px]">
            {/* Chat Header */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700 font-bold text-navy-900 dark:text-white flex justify-between">
              <span>Discussion de groupe</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-normal self-center">{membersDetails.length} membres</span>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#efeae2] dark:bg-[#0b141a]">
              {chatMessages.length === 0 && (
                <div className="text-center text-slate-400 my-10 text-sm">Démarrez la conversation !</div>
              )}
              {chatMessages.map(msg => (
                <div key={msg.id} className={`flex flex-col ${msg.isSystem ? 'items-center' : (msg.userId === user.id ? 'items-end' : 'items-start')}`}>
                  {msg.isSystem ? (
                    <div className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 text-xs px-3 py-1 rounded-full my-2 font-medium border border-indigo-100 dark:border-indigo-800 shadow-sm">
                      {msg.text}
                    </div>
                  ) : (
                    <div className={`max-w-[80%] ${msg.userId === user.id ? 'bg-[#d9fdd3] dark:bg-[#005c4b] rounded-tr-none' : 'bg-white dark:bg-slate-700 rounded-tl-none'} rounded-lg px-4 py-2 shadow-sm`}>
                      {msg.userId !== user.id && <div className="text-[10px] font-bold text-orange-600 dark:text-orange-400 mb-0.5">{msg.userName}</div>}

                      {msg.type === 'AUDIO' ? (
                        <div className="flex items-center space-x-2 min-w-[150px] py-1">
                          <button className="w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-600 rounded-full text-slate-600 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-500">▶</button>
                          <div className="flex-1 h-1 bg-slate-300 dark:bg-slate-500 rounded-full overflow-hidden">
                            <div className="w-1/3 h-full bg-slate-500 dark:bg-slate-300"></div>
                          </div>
                          <span className="text-xs text-slate-500 dark:text-slate-300">0:15</span>
                        </div>
                      ) : msg.type === 'IMAGE' ? (
                        <div className="py-1">
                          <img src={msg.mediaUrl || msg.text} alt="Shared" className="rounded-lg max-h-48 border border-slate-100 dark:border-slate-600" />
                        </div>
                      ) : (
                        <div className="text-sm text-slate-800 dark:text-slate-100 whitespace-pre-wrap">{msg.text}</div>
                      )}

                      <div className="text-[9px] text-slate-400 dark:text-slate-300 text-right mt-1 opacity-70">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div ref={chatBottomRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={sendMessage} className="p-3 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center gap-2">
              {/* Image Upload Button */}
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && group) {
                      const reader = new FileReader();
                      reader.onloadend = async () => {
                        await db.sendGroupMessage(group.id, user, "📸 Image envoyée", 'IMAGE', reader.result as string);
                        setChatMessages(db.getGroupMessages(group.id));
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <button type="button" className="w-10 h-10 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full flex items-center justify-center transition">
                  📷
                </button>
              </div>

              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Écrivez un message..."
                className="flex-grow px-4 py-3 rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-black dark:text-white focus:outline-none focus:border-daretPink focus:ring-1 focus:ring-daretPink transition"
              />

              {chatInput.trim() ? (
                <button type="submit" className="w-12 h-12 bg-daretPink hover:bg-pink-600 text-white rounded-full flex items-center justify-center transition shadow-md">
                  <svg className="w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg>
                </button>
              ) : (
                /* Voice Record Button Simulation */
                <button
                  type="button"
                  onClick={async () => {
                    if (group) {
                      showToast("🎤 Enregistrement... (Simulation)", "info");
                      setTimeout(async () => {
                        await db.sendGroupMessage(group.id, user, "🎤 Message Vocal", 'AUDIO');
                        setChatMessages(db.getGroupMessages(group.id));
                        showToast("Message vocal envoyé !", "success");
                      }, 1500);
                    }
                  }}
                  className="w-12 h-12 bg-slate-200 dark:bg-slate-700 hover:bg-red-500 hover:text-white text-slate-500 rounded-full flex items-center justify-center transition"
                >
                  🎤
                </button>
              )}
            </form>
          </div>
        )}

        {/* === TAB: VOTES === */}
        {activeTab === 'VOTES' && (
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* New Vote Form */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
              <h3 className="font-bold text-navy-900 dark:text-white mb-4 flex items-center">
                <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 p-2 rounded-lg mr-2">➕</span>
                Proposer un vote
              </h3>
              <form onSubmit={handleCreateVote} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Question</label>
                  <input
                    type="text"
                    required
                    value={newVoteQuestion}
                    onChange={(e) => setNewVoteQuestion(e.target.value)}
                    placeholder="Ex: Exclure Ahmed pour impayés ?"
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-black dark:text-white focus:border-daretPink focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Option 1</label>
                    <input
                      type="text"
                      required
                      value={newVoteOption1}
                      onChange={(e) => setNewVoteOption1(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-black dark:text-white focus:border-daretPink focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Option 2</label>
                    <input
                      type="text"
                      required
                      value={newVoteOption2}
                      onChange={(e) => setNewVoteOption2(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-black dark:text-white focus:border-daretPink focus:outline-none"
                    />
                  </div>
                </div>
                <button type="submit" className="w-full bg-navy-900 dark:bg-daretPink text-white font-bold py-3 rounded-lg hover:bg-navy-800 dark:hover:bg-pink-600 transition">
                  Lancer le vote
                </button>
              </form>
            </div>

            {/* Active Votes List */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
              <h3 className="font-bold text-navy-900 dark:text-white mb-4 flex items-center">
                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 p-2 rounded-lg mr-2">🗳️</span>
                Votes en cours
              </h3>
              
              {votes.length === 0 ? (
                <div className="text-center text-slate-400 py-10">
                  Aucun vote actif pour le moment.
                </div>
              ) : (
                <div className="space-y-6">
                  {votes.map(vote => {
                    const totalVotes = vote.options.reduce((acc, curr) => acc + curr.count, 0);
                    const hasVoted = vote.voters.includes(user.id);
                    
                    return (
                      <div key={vote.id} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-bold text-navy-900 dark:text-white">{vote.question}</h4>
                          {hasVoted && <span className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded font-bold">Voté</span>}
                        </div>
                        
                        <div className="space-y-3">
                          {vote.options.map(option => {
                            const percent = totalVotes > 0 ? Math.round((option.count / totalVotes) * 100) : 0;
                            return (
                              <div key={option.id}>
                                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300 mb-1">
                                  <span>{option.label}</span>
                                  <span className="font-bold">{percent}% ({option.count})</span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 relative overflow-hidden">
                                  <div className="bg-daretPink h-full rounded-full transition-all duration-500" style={{ width: `${percent}%` }}></div>
                                </div>
                                {!hasVoted && (
                                  <button
                                    onClick={() => handleCastVote(vote.id, option.id)}
                                    className="mt-1 text-[10px] text-daretPink font-bold hover:underline"
                                  >
                                    Voter pour {option.label}
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between text-[10px] text-slate-400">
                          <span>Créé le {new Date(vote.createdAt).toLocaleDateString()}</span>
                          <span>{totalVotes} participants</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* === TAB: ADMIN IA === */}
        {activeTab === 'ADMIN' && (
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* AI Risk Analysis */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3 text-xl">🛡️</div>
                <h3 className="font-bold text-navy-900 dark:text-white">Analyse de Risque IA</h3>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">L'IA analyse l'historique de paiement des membres pour détecter les risques potentiels.</p>

              {aiAnalysis ? (
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700 text-sm whitespace-pre-line mb-4 animate-fade-in text-slate-700 dark:text-slate-300">
                  {aiAnalysis}
                </div>
              ) : null}

              <button
                onClick={runRiskAnalysis}
                className="w-full border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-bold py-3 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition"
              >
                Lancer l'audit de risque
              </button>
            </div>

            {/* Smart Invites & Co-Admin */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mr-3 text-xl">🔗</div>
                <h3 className="font-bold text-navy-900 dark:text-white">Gestion Avancée</h3>
              </div>

              <div className="space-y-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Lien d'invitation (Expire 24h)</label>
                  <div className="flex mt-1">
                    <input disabled value="daretna.ma/join/xyz-123-secure" className="flex-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-l px-3 py-1 text-sm text-slate-500 dark:text-slate-300" />
                    <button onClick={() => showToast("Lien copié !", "success")} className="bg-navy-900 dark:bg-daretPink text-white px-3 rounded-r text-sm font-bold hover:bg-navy-800 dark:hover:bg-pink-600">Copier</button>
                  </div>
                </div>

                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800">
                  <label className="text-xs font-bold text-red-500 dark:text-red-400 uppercase">Limite Intelligente (Smart Block)</label>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm text-red-800 dark:text-red-300">Bloquer si 2 impayés</span>
                    <div className="w-10 h-5 bg-red-200 dark:bg-red-800 rounded-full relative cursor-pointer">
                      <div className="absolute right-1 top-1 w-3 h-3 bg-red-600 dark:bg-red-400 rounded-full shadow-sm"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Optimization */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" /></svg>
              </div>
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-daretPink/10 flex items-center justify-center mr-3 text-xl">⚡</div>
                <h3 className="font-bold text-navy-900 dark:text-white">Optimisation des Tours</h3>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                L'IA placera les membres les plus "Risqués" à la fin du cycle (pour qu'ils cotisent avant de recevoir) et les "Fiables" au début.
              </p>

              {group.status === GroupStatus.ACTIVE ? (
                <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 p-3 rounded-lg text-sm text-center font-medium">
                  La Daret est déjà active.
                </div>
              ) : (
                <button
                  onClick={runAiOptimization}
                  disabled={optimizing}
                  className="w-full bg-navy-900 dark:bg-daretPink text-white font-bold py-3 rounded-lg hover:bg-navy-800 dark:hover:bg-pink-600 transition flex items-center justify-center"
                >
                  {optimizing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                      Optimisation & Lancement...
                    </>
                  ) : "Optimiser & Lancer la Daret"}
                </button>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
};