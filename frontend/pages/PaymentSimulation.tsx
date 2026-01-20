import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { paymentService } from '../services/payment';
import { db } from '../services/db';

interface PaymentSimulationProps {
    user: User;
    navigate: (page: string, params?: any) => void;
    method: 'CMI' | 'PAYPAL';
    groupId: string;
}

export const PaymentSimulation: React.FC<PaymentSimulationProps> = ({ user, navigate, method, groupId }) => {
    const [step, setStep] = useState<'LOADING' | 'FORM' | 'PROCESSING' | 'SUCCESS' | 'ERROR'>('LOADING');
    const paypalContainerRef = useRef<HTMLDivElement>(null);

    // États du formulaire CMI
    const [formData, setFormData] = useState({
        cardName: user.name.toUpperCase(),
        cardNumber: '',
        expiry: '',
        cvv: ''
    });

    useEffect(() => {
        // Simule le chargement sécurisé de la passerelle
        const timer = setTimeout(() => setStep('FORM'), 800);
        return () => clearTimeout(timer);
    }, []);

    // Initialisation du bouton PayPal
    useEffect(() => {
        // On ne lance la logique que si on est à l'étape FORM et méthode PAYPAL
        if (step === 'FORM' && method === 'PAYPAL') {

            // Fonction pour initialiser le bouton
            const initializePayPalButton = () => {
                // Vérification de sécurité : si le conteneur ou l'objet window.paypal n'existe pas encore
                if (!paypalContainerRef.current || !(window as any).paypal) {
                    console.log("⏳ En attente du SDK PayPal...");
                    return false;
                }

                console.log("✅ SDK PayPal détecté, initialisation du bouton...");

                // Nettoyage préventif
                paypalContainerRef.current.innerHTML = '';

                try {
                    (window as any).paypal.Buttons({
                        style: {
                            layout: 'vertical',
                            color: 'blue',
                            shape: 'rect',
                            label: 'pay'
                        },

                        // 1. DÉTECTION DU CLIC (Debug)
                        onClick: (data: any, actions: any) => {
                            console.log("🖱️ BOUTON PAYPAL CLIQUÉ", data);
                            // Ici tu peux bloquer le clic si un formulaire n'est pas valide (resolve/reject)
                            return actions.resolve();
                        },

                        // 2. CRÉATION DE LA COMMANDE
                        createOrder: (data: any, actions: any) => {
                            console.log("📦 CRÉATION DE LA COMMANDE...");
                            return actions.order.create({
                                purchase_units: [{
                                    description: `Cotisation Daretna - Groupe ${groupId}`,
                                    amount: {
                                        value: '100.00' // USD par défaut en Sandbox
                                    }
                                }]
                            });
                        },

                        // 3. SUCCÈS (CAPTURE)
                        onApprove: async (data: any, actions: any) => {
                            console.log("🎉 PAIEMENT APPROUVÉ PAR L'UTILISATEUR");
                            setStep('PROCESSING');
                            try {
                                const order = await actions.order.capture();
                                console.log('✅ Capture réussie (Réponse PayPal):', order);

                                // Enregistrement en base de données
                                await db.recordPayment(groupId, user.id);

                                setStep('SUCCESS');
                                setTimeout(() => {
                                    navigate('group-detail', { groupId });
                                }, 2500);
                            } catch (error) {
                                console.error("❌ Erreur lors de la capture:", error);
                                setStep('ERROR');
                            }
                        },

                        // 4. GESTION DES ERREURS
                        onError: (err: any) => {
                            console.error("🚨 ERREUR PAYPAL WIDGET:", err);
                            // Affiche souvent "Popup closed by user" ou des erreurs de config
                            setStep('ERROR');
                        }
                    }).render(paypalContainerRef.current);
                    return true;
                } catch (e) {
                    console.error("❌ Erreur au rendu du bouton:", e);
                    return false;
                }
            };

            // Tentative immédiate
            if (!initializePayPalButton()) {
                // Si échec (SDK pas encore chargé), on réessaye toutes les 500ms pendant 5 secondes max
                const intervalId = setInterval(() => {
                    if (initializePayPalButton()) {
                        clearInterval(intervalId);
                    }
                }, 500);

                // Nettoyage de l'intervalle au démontage
                return () => clearInterval(intervalId);
            }
        }
    }, [step, method, groupId, user.id, navigate]);

    // Gestion de la saisie CMI
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        let formattedValue = value;

        if (name === 'cardNumber') {
            formattedValue = value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().slice(0, 19);
        } else if (name === 'expiry') {
            formattedValue = value.replace(/\D/g, '').replace(/(.{2})/, '$1/').slice(0, 5);
        } else if (name === 'cvv') {
            formattedValue = value.replace(/\D/g, '').slice(0, 4);
        }

        setFormData(prev => ({ ...prev, [name]: formattedValue }));
    };

    // Soumission CMI
    const handleConfirmCMI = async (e: React.FormEvent) => {
        e.preventDefault();
        setStep('PROCESSING');

        try {
            await new Promise(r => setTimeout(r, 2000));
            const result = await paymentService.simulateCMI(groupId, user);

            if (result.success) {
                setStep('SUCCESS');
                setTimeout(() => {
                    navigate('group-detail', { groupId });
                }, 2000);
            } else {
                setStep('ERROR');
            }
        } catch (err) {
            setStep('ERROR');
        }
    };

    return (
        <div className="min-h-[calc(100vh-64px)] bg-slate-50 flex items-center justify-center p-4 font-sans">
            <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden border border-slate-200 relative">

                {/* En-tête de la passerelle */}
                <div className={`px-6 py-4 text-white flex justify-between items-center ${method === 'CMI' ? 'bg-[#0f172a]' : 'bg-[#0070BA]'}`}>
                    <div className="flex items-center space-x-2">
                        {method === 'CMI' ? (
                            <span className="font-bold text-lg tracking-wide">💳 CMI <span className="font-light opacity-80">Paiement</span></span>
                        ) : (
                            <span className="font-bold text-lg italic">PayPal</span>
                        )}
                    </div>
                    <div className="flex items-center space-x-1 text-xs bg-black/20 px-2 py-1 rounded">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                        <span>Sécurisé</span>
                    </div>
                </div>

                {/* Corps du formulaire */}
                <div className="p-8">
                    {step === 'LOADING' && (
                        <div className="text-center py-12">
                            <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-slate-500 font-medium">Connexion à la passerelle...</p>
                        </div>
                    )}

                    {step === 'FORM' && (
                        <div className="animate-fade-in">
                            {/* Résumé Commande */}
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 mb-8 flex justify-between items-center">
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-bold">Bénéficiaire</p>
                                    <p className="text-navy-900 font-bold">Daretna.ma</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-500 uppercase font-bold">Montant</p>
                                    <p className="text-daretPink font-bold text-lg">CONFIDENTIEL</p>
                                </div>
                            </div>

                            {method === 'CMI' ? (
                                /* FORMULAIRE CARTE BANCAIRE (Réaliste) */
                                <form onSubmit={handleConfirmCMI} className="space-y-6">

                                    {/* 3D CREDIT CARD VISUAL */}
                                    <div className="relative w-full h-48 bg-gradient-to-br from-indigo-900 to-blue-800 rounded-2xl shadow-xl overflow-hidden text-white p-6 transform transition hover:scale-105 duration-300">
                                        <div className="absolute top-0 right-0 p-4 opacity-20">
                                            <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" /></svg>
                                        </div>
                                        <div className="flex justify-between items-start mb-8">
                                            <div className="text-xs opacity-70 tracking-widest">CMI</div>
                                            <div className="font-bold italic text-lg tracking-wider">VISA</div>
                                        </div>
                                        <div className="mb-4">
                                            <div className="text-2xl font-mono tracking-widest drop-shadow-md">
                                                {formData.cardNumber || '•••• •••• •••• ••••'}
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <div className="text-[9px] opacity-70 uppercase tracking-wider mb-0.5">Titulaire</div>
                                                <div className="font-medium tracking-wide uppercase text-sm drop-shadow-sm truncate w-40">
                                                    {formData.cardName || 'NOM PRENOM'}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-[9px] opacity-70 uppercase tracking-wider mb-0.5">Expire</div>
                                                <div className="font-mono text-sm tracking-wide">
                                                    {formData.expiry || 'MM/AA'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* INPUTS */}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Numéro de carte</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    name="cardNumber"
                                                    value={formData.cardNumber}
                                                    onChange={handleChange}
                                                    maxLength={19}
                                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition font-mono tracking-wider placeholder-slate-300 bg-slate-50 focus:bg-white"
                                                    placeholder="0000 0000 0000 0000"
                                                    required
                                                />
                                                <span className="absolute right-4 top-3.5 text-slate-400">💳</span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Titulaire de la carte</label>
                                            <input
                                                type="text"
                                                name="cardName"
                                                value={formData.cardName}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition uppercase placeholder-slate-300 bg-slate-50 focus:bg-white"
                                                placeholder="NOM PRÉNOM"
                                                required
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Expiration</label>
                                                <input
                                                    type="text"
                                                    name="expiry"
                                                    value={formData.expiry}
                                                    onChange={handleChange}
                                                    placeholder="MM/AA"
                                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-center bg-slate-50 focus:bg-white"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">CVV / CVC</label>
                                                <input
                                                    type="password"
                                                    name="cvv"
                                                    value={formData.cvv}
                                                    onChange={handleChange}
                                                    placeholder="•••"
                                                    maxLength={4}
                                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-center tracking-widest bg-slate-50 focus:bg-white"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions CMI */}
                                    <div className="pt-4 flex flex-col gap-3">
                                        <button
                                            type="submit"
                                            className="w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5 flex items-center justify-center bg-gradient-to-r from-navy-900 via-blue-900 to-navy-900"
                                        >
                                            Payer {formData.cardNumber ? 'Maintenant' : ''}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => navigate('group-detail', { groupId })}
                                            className="w-full py-3 text-slate-500 font-medium hover:text-slate-800 transition text-sm"
                                        >
                                            Annuler
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                /* INTEGRATION PAYPAL SDK */
                                <div className="space-y-6 text-center">
                                    <div className="mb-4">
                                        <p className="text-sm text-slate-500 mb-4">
                                            Vous allez être redirigé vers PayPal pour finaliser votre transaction de manière sécurisée.
                                        </p>
                                    </div>

                                    {/* Le conteneur où le bouton PayPal va s'injecter */}
                                    <div id="paypal-button-container" ref={paypalContainerRef} className="min-h-[150px]"></div>

                                    <button
                                        type="button"
                                        onClick={() => navigate('group-detail', { groupId })}
                                        className="w-full py-3 text-slate-500 font-medium hover:text-slate-800 transition text-sm underline"
                                    >
                                        Annuler la transaction
                                    </button>

                                    <p className="text-xs text-slate-400 mt-2">
                                        (Mode Débug activé : regardez la Console F12)
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 'PROCESSING' && (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 border-4 border-slate-100 border-t-green-500 rounded-full animate-spin mx-auto mb-6"></div>
                            <h3 className="text-xl font-bold text-navy-900 mb-2">Traitement en cours...</h3>
                            <p className="text-slate-500">Veuillez ne pas fermer cette fenêtre.</p>
                            {method === 'PAYPAL' && <p className="text-xs text-blue-500 mt-2">Confirmation auprès de PayPal...</p>}
                        </div>
                    )}

                    {step === 'SUCCESS' && (
                        <div className="text-center py-8 animate-bounce-short">
                            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-inner">
                                ✓
                            </div>
                            <h3 className="text-2xl font-bold text-navy-900 mb-2">Paiement Réussi !</h3>
                            <p className="text-slate-500 mb-6">Votre cotisation a été enregistrée avec succès.</p>
                            <div className="bg-slate-50 rounded-lg p-4 text-xs text-slate-400 border border-slate-100">
                                ID Transaction: #{Math.random().toString(36).substr(2, 9).toUpperCase()}
                            </div>
                        </div>
                    )}

                    {step === 'ERROR' && (
                        <div className="text-center py-8">
                            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
                                ✕
                            </div>
                            <h3 className="text-xl font-bold text-navy-900 mb-2">Transaction Refusée</h3>
                            <p className="text-slate-500 mb-6">Le paiement a été annulé ou rejeté.</p>
                            <p className="text-xs text-red-400 mb-4">Voir console F12 pour les détails.</p>
                            <button onClick={() => setStep('FORM')} className="text-blue-600 font-bold underline hover:text-blue-800">Réessayer</button>
                        </div>
                    )}
                </div>

                {/* Footer Sécurisé */}
                <div className="bg-slate-50 p-4 text-center border-t border-slate-100 flex justify-center items-center space-x-4">
                    <span className="text-[10px] text-slate-400">🔒 Chiffrage SSL 256-bit</span>
                    <span className="text-slate-300">|</span>
                    <span className="text-[10px] text-slate-400">© 2025 Daretna Payments</span>
                </div>
            </div>
        </div>
    );
};