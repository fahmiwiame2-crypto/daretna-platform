import { GoogleGenerativeAI } from "@google/generative-ai";
import { User, AiTrustScore, DaretGroup, Membership } from "../types";

const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY || '';
if (!apiKey) {
  console.warn("⚠️ [DaretBot] Clé VITE_GEMINI_API_KEY non détectée. Assurez-vous d'avoir redémarré le serveur après avoir créé .env.local");
} else {
  console.log("✅ [DaretBot] Clé API détectée (" + apiKey.substring(0, 4) + "...)");
}

// ============================================
// TYPES POUR L'IA AVANCÉE
// ============================================

export interface FraudAlert {
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  type: 'PAYMENT_PATTERN' | 'BEHAVIOR_ANOMALY' | 'IDENTITY_MISMATCH' | 'VELOCITY_CHECK';
  message: string;
  confidence: number; // 0-100
  recommendation: string;
}

export interface PaymentPrediction {
  userId: string;
  userName: string;
  willPayOnTime: boolean;
  confidence: number; // 0-100
  predictedDelayDays?: number;
  riskFactors: string[];
}

export interface GroupHealthScore {
  score: number; // 0-100
  status: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL';
  predictions: {
    successProbability: number;
    estimatedCompletionRate: number;
    potentialIssues: string[];
  };
  recommendations: string[];
}

// ============================================
// SERVICE IA AVANCÉ
// ============================================

export const advancedAI = {

  // ============================================
  // 0. UTILS
  // ============================================

  cleanMarkdownForSpeech: (text: string): string => {
    return text
      .replace(/\*\*/g, '') // Bold
      .replace(/\*/g, '')  // Italic
      .replace(/#/g, '')   // Headers
      .replace(/`{1,3}.*?`{1,3}/gs, '') // Code blocks
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Links
      .replace(/- /g, '')  // Lists
      .replace(/\n\n/g, '. ') // Newlines to pauses
      .replace(/\n/g, ' ')
      .trim();
  },

  // ============================================
  // 1. DÉTECTION DE FRAUDE
  // ============================================

  detectFraud: async (user: User, group: DaretGroup, membership: Membership): Promise<FraudAlert[]> => {
    const alerts: FraudAlert[] = [];

    // Check 1: Nouveau membre avec montant élevé
    const isNewUser = !user.paymentHistory || user.paymentHistory.totalAmount === 0;
    if (isNewUser && group.amountPerPerson > 5000) {
      alerts.push({
        severity: 'MEDIUM',
        type: 'BEHAVIOR_ANOMALY',
        message: `Nouveau membre "${user.name}" rejoint un groupe à montant élevé (${group.amountPerPerson} MAD)`,
        confidence: 75,
        recommendation: 'Demander une vérification d\'identité (KYC) avant le premier paiement'
      });
    }

    // Check 2: Historique de retards
    const latePayments = user.paymentHistory?.late || 0;
    const totalPayments = (user.paymentHistory?.onTime || 0) + latePayments;
    if (totalPayments > 0 && latePayments / totalPayments > 0.5) {
      alerts.push({
        severity: 'HIGH',
        type: 'PAYMENT_PATTERN',
        message: `Historique de retards important : ${latePayments}/${totalPayments} paiements en retard`,
        confidence: 90,
        recommendation: 'Placer ce membre en fin de cycle et activer les rappels SMS'
      });
    }

    // Check 3: Velocity Check - Trop de groupes rejoints rapidement
    // (Simulé - en production, vérifier les timestamps)
    const recentJoins = 3; // Mock
    if (recentJoins > 5) {
      alerts.push({
        severity: 'CRITICAL',
        type: 'VELOCITY_CHECK',
        message: `Activité suspecte : ${recentJoins} groupes rejoints en moins de 24h`,
        confidence: 95,
        recommendation: 'Bloquer temporairement et demander vérification manuelle'
      });
    }

    // Check 4: Montant inhabituel par rapport à l'historique
    const avgHistorical = user.paymentHistory?.totalAmount
      ? user.paymentHistory.totalAmount / totalPayments
      : 0;

    if (avgHistorical > 0 && group.amountPerPerson > avgHistorical * 3) {
      alerts.push({
        severity: 'MEDIUM',
        type: 'BEHAVIOR_ANOMALY',
        message: `Montant inhabituel : ${group.amountPerPerson} MAD vs moyenne historique ${Math.round(avgHistorical)} MAD`,
        confidence: 70,
        recommendation: 'Surveiller les premiers paiements de ce membre'
      });
    }

    return alerts;
  },

  // ============================================
  // 2. PRÉDICTIONS DE PAIEMENT
  // ============================================

  predictPayments: async (group: DaretGroup, members: User[]): Promise<PaymentPrediction[]> => {
    const predictions: PaymentPrediction[] = [];

    for (const member of members) {
      const history = member.paymentHistory || { onTime: 0, late: 0, totalAmount: 0 };
      const totalPayments = history.onTime + history.late;

      // Facteurs de risque
      const riskFactors: string[] = [];
      let riskScore = 0;

      // Facteur 1: Historique de retards
      if (totalPayments > 0) {
        const lateRate = history.late / totalPayments;
        if (lateRate > 0.3) {
          riskFactors.push(`Taux de retard élevé: ${Math.round(lateRate * 100)}%`);
          riskScore += 40;
        }
      } else {
        riskFactors.push('Aucun historique de paiement');
        riskScore += 30;
      }

      // Facteur 2: Montant vs capacité
      const avgPaid = totalPayments > 0 ? history.totalAmount / totalPayments : 0;
      if (avgPaid > 0 && group.amountPerPerson > avgPaid * 2) {
        riskFactors.push('Montant supérieur à la capacité habituelle');
        riskScore += 25;
      }

      // Facteur 3: Profil incomplet
      if (!member.phone || !member.email) {
        riskFactors.push('Profil incomplet');
        riskScore += 15;
      }

      // Calcul de la probabilité
      const willPayOnTime = riskScore < 50;
      const confidence = Math.min(95, 50 + (totalPayments * 5)); // Plus d'historique = plus de confiance

      predictions.push({
        userId: member.id,
        userName: member.name,
        willPayOnTime,
        confidence,
        predictedDelayDays: willPayOnTime ? undefined : Math.floor(riskScore / 10),
        riskFactors
      });
    }

    return predictions.sort((a, b) => a.confidence - b.confidence);
  },

  // ============================================
  // 3. SANTÉ DU GROUPE
  // ============================================

  analyzeGroupHealth: async (group: DaretGroup, members: User[]): Promise<GroupHealthScore> => {
    const memberScores = await Promise.all(
      members.map(m => aiService.calculateTrustScore(m))
    );

    const avgScore = memberScores.reduce((sum, s) => sum + s.score, 0) / (memberScores.length || 1);
    const lowScoreCount = memberScores.filter(s => s.score < 50).length;
    const newMemberCount = members.filter(m => !m.paymentHistory || m.paymentHistory.totalAmount === 0).length;

    // Calcul du score de santé amélioré
    let healthScore = avgScore;

    // Pénalités et Bonus
    if (lowScoreCount > members.length * 0.3) healthScore -= 20;
    if (newMemberCount > members.length * 0.5) healthScore -= 15;
    if (group.amountPerPerson > 10000) healthScore -= 10;
    if (group.members.length >= 10) healthScore += 5; // Groupes plus larges = plus de résilience

    healthScore = Math.max(0, Math.min(100, healthScore));

    // Déterminer le statut
    let status: GroupHealthScore['status'];
    if (healthScore >= 80) status = 'EXCELLENT';
    else if (healthScore >= 60) status = 'GOOD';
    else if (healthScore >= 40) status = 'FAIR';
    else if (healthScore >= 20) status = 'POOR';
    else status = 'CRITICAL';

    // Prédictions
    const successProbability = Math.min(98, healthScore + 5);
    const estimatedCompletionRate = Math.max(0, healthScore);

    const potentialIssues: string[] = [];
    if (lowScoreCount > 0) potentialIssues.push(`${lowScoreCount} membre(s) avec un profil à risque`);
    if (newMemberCount > members.length * 0.5) potentialIssues.push('Forte proportion de nouveaux membres');
    if (group.amountPerPerson > 10000) potentialIssues.push('Engagements financiers élevés');

    // Recommandations stratégiques
    const recommendations: string[] = [];
    if (healthScore < 60) {
      recommendations.push('🛡️ Renforcer les rappels automatiques 3 jours avant l\'échéance');
      recommendations.push('📊 Demander un justificatif de revenu pour les nouveaux membres');
    }
    if (lowScoreCount > 0) {
      recommendations.push('⚖️ Placer les membres les plus fiables dans les premiers tours');
    }
    recommendations.push('✨ Utiliser le tirage au sort certifié Daretna pour plus de transparence');

    return {
      score: Math.round(healthScore),
      status,
      predictions: {
        successProbability: Math.round(successProbability),
        estimatedCompletionRate: Math.round(estimatedCompletionRate),
        potentialIssues
      },
      recommendations
    };
  },

  // ============================================
  // 4. CHATBOT IA AMÉLIORÉ
  // ============================================

  createAdvancedChatbot: (user: User): any => {
    if (!apiKey) return null;

    try {
      const ai = new GoogleGenerativeAI(apiKey);
      return ai; // Return the client, we'll handle the session in the component
    } catch (e) {
      console.error("Error initializing Gemini:", e);
      return null;
    }
  },

  // Helper to send message (handle different SDK versions)
  sendMessage: async (aiClient: any, message: string): Promise<string> => {
    try {
      // Logic for @google/genai SDK
      const model = aiClient.getGenerativeModel({
        model: 'gemini-flash-latest',
        systemInstruction: `Tu es DaretBot, l'assistant IA expert de Daretna.ma, la plateforme leader de tontine digitale au Maroc. 
        Tes caractéristiques :
        1. Tu es un expert en finance personnelle et en gestion de budget.
        2. Tu maîtrises parfaitement la tradition marocaine de la "Daret" (Tontine).
        3. Tu réponds dans un mélange de Français et de Darija (si l'utilisateur l'utilise) de manière chaleureuse, professionnelle et sécurisante.
        4. Tes conseils sont toujours basés sur la prudence financière.
        5. Tu aides les utilisateurs à comprendre leur "Trust Score" et comment l'améliorer par la ponctualité.`
      });

      const result = await model.generateContent(message);
      const response = await result.response;
      return response.text() || "Désolé, je n'ai pas pu générer de réponse.";
    } catch (e: any) {
      console.error("🚨 [Gemini API Error]:", e);

      const errorMessage = e?.message || '';
      if (errorMessage.includes("API_KEY_INVALID")) {
        return "Erreur : Votre clé API semble invalide. Vérifiez-la dans .env.local";
      }
      if (errorMessage.includes("QUOTA_EXCEEDED")) {
        return "Erreur : Quota API dépassé. Veuillez réessayer plus tard.";
      }
      if (errorMessage.includes("SAFETY")) {
        return "Désolé, cette question a été bloquée par les filtres de sécurité.";
      }

      return `Désolé, j'ai rencontré une erreur technique (${errorMessage.substring(0, 50)}...). Vérifiez votre connexion et votre clé API.`;
    }
  },

  // ============================================
  // 5. RECOMMANDATIONS INTELLIGENTES
  // ============================================

  getSmartRecommendations: async (user: User): Promise<{
    optimalAmount: number;
    optimalPeriodicity: 'Mois' | 'Semaine';
    suggestedGroupSize: number;
    reasoning: string;
  }> => {
    const history = user.paymentHistory || { onTime: 0, late: 0, totalAmount: 0 };
    const totalPayments = history.onTime + history.late || 1;
    const avgAmount = history.totalAmount / totalPayments;

    // Calcul du montant optimal
    let optimalAmount = 1000; // Default
    if (avgAmount > 0) {
      optimalAmount = Math.round(avgAmount * 1.1); // 10% de plus que la moyenne
    }

    // Ajustement selon le score
    const score = await aiService.calculateTrustScore(user);
    if (score.score < 50) {
      optimalAmount = Math.min(optimalAmount, 2000); // Limiter pour les profils risqués
    }

    // Périodicité optimale
    const optimalPeriodicity: 'Mois' | 'Semaine' = optimalAmount < 500 ? 'Semaine' : 'Mois';

    // Taille de groupe suggérée
    let suggestedGroupSize = 6; // Default
    if (score.score >= 80) suggestedGroupSize = 10; // Profils fiables peuvent gérer plus
    else if (score.score < 50) suggestedGroupSize = 4; // Profils risqués = petits groupes

    const reasoning = `Basé sur votre historique (${totalPayments} paiements, moyenne ${Math.round(avgAmount)} MAD) et votre score de confiance (${score.score}/100), nous recommandons:
- Montant: ${optimalAmount} MAD (adapté à votre capacité)
- Périodicité: ${optimalPeriodicity} (optimale pour ce montant)
- Taille: ${suggestedGroupSize} membres (équilibre entre diversité et gestion)`;

    return {
      optimalAmount,
      optimalPeriodicity,
      suggestedGroupSize,
      reasoning
    };
  },

  // ============================================
  // 6. MÉDIATION DE CONFLITS
  // ============================================

  mediateConflict: async (
    conflictType: 'PAYMENT_DISPUTE' | 'TURN_ORDER' | 'MEMBER_BEHAVIOR' | 'OTHER',
    description: string,
    parties: { name: string; claim: string }[]
  ): Promise<{
    analysis: string;
    suggestedResolution: string;
    steps: string[];
  }> => {
    // Simulation d'analyse IA
    let analysis = '';
    let suggestedResolution = '';
    let steps: string[] = [];

    switch (conflictType) {
      case 'PAYMENT_DISPUTE':
        analysis = 'Conflit de paiement détecté. Les preuves de paiement sont essentielles pour résoudre ce type de litige.';
        suggestedResolution = 'Demander à toutes les parties de fournir des preuves de paiement (reçus, captures d\'écran de virement).';
        steps = [
          '1. Collecter toutes les preuves de paiement',
          '2. Vérifier les dates et montants',
          '3. Consulter l\'historique bancaire si nécessaire',
          '4. Décision finale par l\'admin après vérification',
          '5. Documenter la résolution dans le chat du groupe'
        ];
        break;

      case 'TURN_ORDER':
        analysis = 'Désaccord sur l\'ordre des tours. La transparence du tirage est cruciale.';
        suggestedResolution = 'Rappeler que le tirage a été effectué de manière transparente avec un seed vérifiable. Proposer un re-tirage si fraude avérée.';
        steps = [
          '1. Montrer le certificat de tirage (seed + date)',
          '2. Expliquer la méthode utilisée (aléatoire/pondéré/manuel)',
          '3. Si contestation légitime, proposer un vote pour re-tirage',
          '4. Documenter la décision du groupe',
          '5. Appliquer la nouvelle configuration si votée'
        ];
        break;

      default:
        analysis = 'Conflit nécessitant une médiation humaine.';
        suggestedResolution = 'Organiser une réunion (virtuelle ou physique) avec toutes les parties.';
        steps = [
          '1. Écouter chaque partie séparément',
          '2. Identifier les points de désaccord',
          '3. Proposer des solutions équitables',
          '4. Voter si nécessaire',
          '5. Documenter l\'accord final'
        ];
    }

    return { analysis, suggestedResolution, steps };
  }
};

// ============================================
// SERVICE IA ORIGINAL (Maintenu pour compatibilité)
// ============================================

export const aiService = {
  calculateTrustScore: async (user: User): Promise<AiTrustScore> => {
    // Fallback logic shared between both cases
    const getFallbackScore = (u: User) => {
      const history = u.paymentHistory || { onTime: 0, late: 0, totalAmount: 0 };
      const profileComplete = !!(u.email && u.phone);

      let score = 50;
      score += (history.onTime * 10);
      score -= (history.late * 5);
      if (profileComplete) score += 5;

      score = Math.max(0, Math.min(100, score));

      const badge = aiService.getTrustBadgeDetails(score);

      return {
        score,
        level: badge.label as 'Fiable' | 'Moyen' | 'Risqué',
        explanation: "Calcul basé sur votre historique de paiement.",
        suggestedGroupAmount: Math.min(10000, score * 100)
      };
    };

    if (!apiKey) {
      return getFallbackScore(user);
    }

    try {
      // For stability and cost control in dev, we use fallback by default
      // but keep the structure for real AI calls
      return getFallbackScore(user);
    } catch (error) {
      return getFallbackScore(user);
    }
  },

  getTrustBadgeDetails: (score: number) => {
    if (score >= 80) {
      return { color: 'bg-green-100 text-green-800', label: 'Fiable', icon: 'shield-check' };
    } else if (score >= 50) {
      return { color: 'bg-orange-100 text-orange-800', label: 'Moyen', icon: 'shield' };
    } else {
      return { color: 'bg-red-100 text-red-800', label: 'Risqué', icon: 'alert-triangle' };
    }
  },

  suggestGroups: async (user: User, availableGroups: DaretGroup[]): Promise<DaretGroup[]> => {
    try {
      const history = user.paymentHistory || { onTime: 1, late: 0, totalAmount: 1000 };
      const totalPayments = history.onTime + history.late || 1;
      const avgAmount = history.totalAmount / totalPayments;

      const min = avgAmount * 0.5;
      const max = avgAmount * 1.5;

      return availableGroups.filter(g =>
        g.amountPerPerson >= min &&
        g.amountPerPerson <= max &&
        g.status === 'En attente'
      ).slice(0, 3);
    } catch (e) {
      console.error("AI Suggest Error", e);
      return [];
    }
  },

  createCoachChat: (user: User): any => {
    return advancedAI.createAdvancedChatbot(user);
  },

  sendMessage: async (aiClient: any, message: string): Promise<string> => {
    return advancedAI.sendMessage(aiClient, message);
  },

  analyzeGroupRisk: async (group: DaretGroup, members: User[]): Promise<string> => {
    const health = await advancedAI.analyzeGroupHealth(group, members);

    return `## Analyse de Risque : ${health.status}

**Score de Santé**: ${health.score}/100

**Probabilité de Succès**: ${health.predictions.successProbability}%

**Problèmes Potentiels**:
${health.predictions.potentialIssues.map(issue => `- ${issue}`).join('\n')}

**Recommandations**:
${health.recommendations.join('\n')}`;
  },

  optimizeTurnOrder: async (members: User[]): Promise<string[]> => {
    const scoredMembers = await Promise.all(members.map(async m => {
      const score = await aiService.calculateTrustScore(m);
      return { id: m.id, score: score.score };
    }));

    scoredMembers.sort((a, b) => b.score - a.score);
    return scoredMembers.map(m => m.id);
  }
};