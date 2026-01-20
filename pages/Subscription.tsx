import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { paymentService } from '../services/payment';
import { db } from '../services/db';

interface SubscriptionProps {
  user: User;
  navigate: (page: string) => void;
}

export const Subscription: React.FC<SubscriptionProps> = ({ user, navigate }) => {
  const [processing, setProcessing] = useState(false);
  const [method, setMethod] = useState<'PAYPAL' | null>(null);

  // Pour le paiement PayPal (si on veut garder la simulation rapide)
  const handlePayPalSubscribe = async () => {
    setMethod('PAYPAL');
    setProcessing(true);

    const result = await paymentService.simulateSubscriptionPayment('PAYPAL', user);

    setProcessing(false);
    setMethod(null);

    if (result.success) {
      alert("Félicitations ! Vous êtes maintenant membre Premium via PayPal.");
      window.location.reload();
    } else {
      alert(result.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <button onClick={() => navigate('dashboard')} className="text-slate-500 hover:text-navy-900 mb-6 flex items-center">
        ← Retour
      </button>

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        <div className="bg-navy-900 p-8 text-center text-white">
          <h1 className="text-3xl font-bold mb-2">Devenez Premium</h1>
          <p className="opacity-80">Débloquez tout le potentiel de Daretna</p>
        </div>

        <div className="p-8 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-2xl font-bold text-navy-900 mb-4">Avantages Premium</h2>
            <ul className="space-y-4">
              <li className="flex items-center text-slate-700">
                <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-3 font-bold">✓</span>
                Groupes Illimités (vs 1 max)
              </li>
              <li className="flex items-center text-slate-700">
                <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-3 font-bold">✓</span>
                Badge "Groupe Vérifié" ✅
              </li>
              <li className="flex items-center text-slate-700">
                <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-3 font-bold">✓</span>
                Historique Illimité & Export Excel/PDF
              </li>
              <li className="flex items-center text-slate-700">
                <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-3 font-bold">✓</span>
                Support Prioritaire (WhatsApp Dédié)
              </li>
            </ul>
          </div>

          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
            <div className="text-center mb-6">
              <span className="text-sm text-slate-500 uppercase tracking-wide">Abonnement Mensuel</span>
              <div className="text-5xl font-bold text-daretPink mt-2">9 <span className="text-2xl text-slate-600">MAD</span></div>
              <span className="text-xs text-slate-400">/ mois, sans engagement</span>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => navigate('premium-payment')} // Redirection vers la nouvelle page Card
                className="w-full bg-navy-900 hover:bg-navy-800 text-white py-3 rounded-lg font-bold transition shadow-lg flex items-center justify-center"
              >
                Payer par Carte Bancaire
              </button>
              <button
                onClick={handlePayPalSubscribe}
                disabled={processing}
                className={`w-full py-3 rounded-lg font-bold transition shadow-lg flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed ${processing ? 'bg-[#005ea6]' : 'bg-[#0070BA] hover:bg-[#005ea6]'} text-white`}
              >
                {processing ? (
                  <span className="flex items-center"><div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin mr-2"></div> Traitement...</span>
                ) : 'Payer par PayPal'}
              </button>
            </div>
            <p className="text-center text-xs text-slate-400 mt-4">Paiement 100% sécurisé via CMI / PayPal</p>
          </div>
        </div>
      </div>
    </div>
  );
};