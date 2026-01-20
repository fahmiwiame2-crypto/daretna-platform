import React, { useState } from 'react';
import { User } from '../types';
import { paymentService } from '../services/payment';

interface Props {
  user: User;
  navigate: (page: string) => void;
}

export const PremiumPaymentCard: React.FC<Props> = ({ user, navigate }) => {
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState<'CMI' | 'PAYPAL'>('CMI');
  
  // Calcul de la date du mois prochain pour l'affichage
  const nextMonthDate = new Date();
  nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
  const dateStr = nextMonthDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  const handlePay = async () => {
    setLoading(true);
    // On simule le paiement via le service existant avec la méthode choisie
    const result = await paymentService.simulateSubscriptionPayment(method, user);
    setLoading(false);
    
    if (result.success) {
        alert(`Paiement ${method === 'PAYPAL' ? 'PayPal' : ''} réussi ! Bienvenue dans Daretna Premium.`);
        navigate('dashboard');
        // Force un rechargement pour mettre à jour le statut Premium dans l'App
        window.location.reload(); 
    } else {
        alert("Le paiement a échoué. Veuillez réessayer.");
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gray-50 font-sans text-slate-800 flex justify-center items-start pt-10 pb-20">
       <div className="max-w-5xl w-full grid md:grid-cols-12 gap-8 px-4">
          
          {/* COLONNE GAUCHE : RÉSUMÉ (DESIGN "CARD BOOTSTRAP") */}
          <div className="md:col-span-5 order-2 md:order-1">
             <h2 className="text-xl font-bold mb-4 text-gray-900">Résumé</h2>
             <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex justify-between items-start mb-1">
                    <div>
                        <h3 className="font-bold text-lg text-gray-900">Abonnement Premium</h3>
                        <p className="text-sm text-gray-500">Facturation mensuelle</p>
                    </div>
                    <div className="font-bold text-lg">9,00 MAD</div>
                </div>
                
                <hr className="my-5 border-gray-100" />
                
                <div className="space-y-3 text-sm text-gray-600">
                    <div className="flex justify-between items-center">
                        <span>Aujourd'hui</span>
                        <span className="font-bold text-gray-900">9,00 MAD</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span>À partir du {dateStr}</span>
                        <span>9,00 MAD / mois</span>
                    </div>
                </div>
                
                <hr className="my-5 border-gray-100" />
                
                <div className="flex justify-between items-center text-lg font-bold mb-6 text-gray-900">
                    <span>Total à payer</span>
                    <span>9,00 MAD</span>
                </div>
                
                <p className="text-[11px] text-gray-400 mb-6 leading-relaxed">
                    En validant, vous acceptez d'être facturé 9 MAD chaque mois jusqu'à annulation. 
                    Vous pouvez annuler à tout moment depuis votre compte.
                    <br/>Termes et conditions applicables.
                </p>

                <button 
                    onClick={handlePay}
                    disabled={loading}
                    className={`w-full font-bold py-3.5 rounded-full transition transform hover:scale-[1.02] active:scale-[0.98] flex justify-center items-center shadow-sm disabled:opacity-70 disabled:cursor-not-allowed ${method === 'PAYPAL' ? 'bg-[#0070BA] hover:bg-[#005ea6] text-white' : 'bg-[#1ed760] hover:bg-[#1fdf64] text-black'}`}
                >
                    {loading ? (
                        <div className="flex items-center">
                            <div className={`w-5 h-5 border-2 border-t-transparent rounded-full animate-spin mr-2 ${method === 'PAYPAL' ? 'border-white' : 'border-black/20 border-t-black'}`}></div>
                            Traitement...
                        </div>
                    ) : (method === 'PAYPAL' ? 'Payer avec PayPal' : 'Payer 9 MAD maintenant')}
                </button>
             </div>
             
             {/* Security Note under button for mobile mainly */}
             <div className="mt-4 text-center md:text-left">
                <button onClick={() => navigate('subscription')} className="text-sm text-gray-500 hover:text-black font-medium underline">
                    Changer d'offre
                </button>
             </div>
          </div>

          {/* COLONNE DROITE : FORMULAIRE (DESIGN "CLEAN") */}
          <div className="md:col-span-7 order-1 md:order-2">
             <h2 className="text-xl font-bold mb-4 text-gray-900">Méthode de paiement</h2>
             
             <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                
                {/* Sélecteur de Méthode */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <button 
                        onClick={() => setMethod('CMI')}
                        className={`flex items-center justify-center py-4 border rounded-xl transition-all duration-200 ${method === 'CMI' ? 'border-green-500 bg-green-50/50 text-green-900 font-bold ring-1 ring-green-500 shadow-sm' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-600'}`}
                    >
                        <span className="mr-2 text-xl">💳</span> Carte Bancaire
                    </button>
                    <button 
                        onClick={() => setMethod('PAYPAL')}
                        className={`flex items-center justify-center py-4 border rounded-xl transition-all duration-200 ${method === 'PAYPAL' ? 'border-[#0070BA] bg-blue-50/50 text-[#0070BA] font-bold ring-1 ring-[#0070BA] shadow-sm' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-600'}`}
                    >
                        <span className="mr-2 text-xl font-bold italic">P</span> PayPal
                    </button>
                </div>

                {method === 'CMI' ? (
                    /* FORMULAIRE CARTE BANCAIRE */
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* Header Form: Logos */}
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-50">
                            <div className="flex space-x-2">
                                <div className="h-8 w-12 bg-white border border-gray-200 rounded flex items-center justify-center p-1">
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-full" />
                                </div>
                                <div className="h-8 w-12 bg-white border border-gray-200 rounded flex items-center justify-center p-1">
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-full" />
                                </div>
                                <div className="h-8 w-12 bg-white border border-gray-200 rounded flex items-center justify-center text-[10px] font-bold text-blue-800">
                                    CMI
                                </div>
                            </div>
                            <div className="flex items-center text-gray-400 text-xs bg-gray-50 px-3 py-1 rounded-full">
                                <span className="mr-1">🔒</span> Paiement Sécurisé
                            </div>
                        </div>

                        {/* Form Fields */}
                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-2 tracking-wide">Numéro de carte</label>
                                <div className="relative group">
                                    <span className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-green-600 transition">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                        </svg>
                                    </span>
                                    <input 
                                        type="text"
                                        placeholder="0000 0000 0000 0000"
                                        maxLength={19}
                                        className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-green-500 transition placeholder-gray-300 text-gray-700 font-mono"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-2 tracking-wide">Date d'expiration</label>
                                    <input 
                                        type="text"
                                        placeholder="MM/AA"
                                        maxLength={5}
                                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-green-500 transition placeholder-gray-300 text-gray-700 text-center"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-2 tracking-wide flex items-center justify-between">
                                        Code de sécurité 
                                        <div className="group relative cursor-help">
                                            <span className="ml-1 text-gray-400 hover:text-gray-600">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </span>
                                            <span className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-32 bg-gray-800 text-white text-[10px] p-2 rounded z-10 text-center">
                                                Les 3 derniers chiffres au dos de votre carte.
                                            </span>
                                        </div>
                                    </label>
                                    <input 
                                        type="text"
                                        placeholder="CVC"
                                        maxLength={3}
                                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-green-500 transition placeholder-gray-300 text-gray-700 text-center tracking-widest"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* PAYPAL VIEW */
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 py-8 text-center">
                        <div className="w-20 h-20 bg-white border-4 border-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg text-4xl text-[#0070BA] font-bold italic relative">
                            P
                            <div className="absolute top-0 right-0 -mr-1 -mt-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px]">✓</div>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Connexion à PayPal</h3>
                        <p className="text-gray-500 text-sm max-w-sm mx-auto leading-relaxed mb-8">
                            En cliquant sur "Payer avec PayPal", une fenêtre sécurisée s'ouvrira pour vous permettre de valider votre abonnement de 9 MAD/mois.
                        </p>
                        <div className="bg-blue-50 text-[#0070BA] text-xs font-medium py-2 px-4 rounded-lg inline-block">
                            Protection des achats active
                        </div>
                    </div>
                )}
             </div>
          </div>

       </div>
    </div>
  );
}