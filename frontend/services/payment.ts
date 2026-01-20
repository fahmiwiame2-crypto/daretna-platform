import { User } from '../types';
import { db } from './db';

export const paymentService = {
  // Existing methods for Group Payments
  simulateCMI: async (groupId: string, user: User): Promise<{ success: boolean; message: string }> => {
    return new Promise((resolve) => {
      setTimeout(async () => {
        const success = Math.random() > 0.2; // 80% success chance
        if (success) {
          await db.recordPayment(groupId, user.id);
        }
        resolve({
          success,
          message: success ? 'Paiement CMI accepté.' : 'Échec de la transaction CMI.'
        });
      }, 2000);
    });
  },

  simulatePayPal: async (groupId: string, user: User): Promise<{ success: boolean; message: string }> => {
    return new Promise((resolve) => {
      setTimeout(async () => {
        const success = Math.random() > 0.1; // 90% success chance
        if (success) {
          await db.recordPayment(groupId, user.id);
        }
        resolve({
          success,
          message: success ? 'Paiement PayPal réussi.' : 'Erreur PayPal.'
        });
      }, 1500);
    });
  },

  // New Methods for Premium Subscription
  simulateSubscriptionPayment: async (method: 'CMI' | 'PAYPAL', user: User): Promise<{ success: boolean; message: string }> => {
    return new Promise((resolve) => {
      setTimeout(async () => {
        // High success rate for subscription demo
        const success = Math.random() > 0.1; 
        
        if (success) {
          await db.upgradeToPremium(user.id);
        }

        const methodLabel = method === 'CMI' ? 'Carte Bancaire (CMI)' : 'PayPal';
        resolve({
          success,
          message: success 
            ? `Abonnement Premium activé via ${methodLabel}.` 
            : `Échec du paiement ${methodLabel}. Veuillez réessayer.`
        });
      }, 2000);
    });
  },

  generateInvoice: (user: User, amount: number, method: string, groupName: string) => {
    const content = `
    FACTURE DARETNA.MA
    -------------------
    Date: ${new Date().toLocaleDateString()}
    Client: ${user.name} (${user.email})
    Objet: ${groupName}
    
    Montant Payé: ${amount} MAD
    Méthode: ${method}
    Statut: SUCCÈS
    
    Merci de votre confiance.
    L'équipe Daretna.
    `;
    
    // Create blob for "PDF"
    const blob = new Blob([content], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Facture_${Date.now()}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  sendSmsAlert: (phone: string, message: string) => {
    console.log(`[SMS SIMULATION] Envoi à ${phone}: "${message}"`);
  }
};