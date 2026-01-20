export enum UserRole {
  FREE = 'FREE',
  PREMIUM = 'PREMIUM'
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  password?: string; // stored for mock auth
  // Mock history for AI scoring
  paymentHistory?: {
    onTime: number;
    late: number;
    totalAmount: number;
  };
  badges?: string[]; // Gamification
  points?: number;   // Loyalty Points
  level?: 'Bronze' | 'Argent' | 'Or' | 'Diamant';
  avatar?: string;
  verificationStatus?: 'Unverified' | 'Pending' | 'Verified';
  trustScoreDetail?: {
    identity: number; // 20%
    history: number; // 50%
    social: number; // 30%
  };
}

export enum GroupStatus {
  PENDING = 'En attente',
  ACTIVE = 'Actif',
  COMPLETED = 'Terminé'
}

export enum Periodicity {
  MONTHLY = 'Mois',
  WEEKLY = 'Semaine'
}

export enum GroupRole {
  ADMIN = 'Responsable',
  CO_ADMIN = 'Co-Responsable',
  MEMBER = 'Membre'
}

export interface Membership {
  userId: string;
  groupId: string;
  role: GroupRole;
  tourPosition: number | null;
  paymentStatus: 'PENDING' | 'SUBMITTED' | 'CONFIRMED' | 'LATE';
  paymentProofUrl?: string; // For manual proof
  joinedAt: string;
  missedPayments?: number;
  isBlocked?: boolean;
}

export interface DaretGroup {
  id: string;
  name: string;
  amountPerPerson: number;
  periodicity: Periodicity;
  startDate: string;
  status: GroupStatus;
  adminId: string;
  inviteLink?: string; // New
  inviteLinkExpiresAt?: string; // New
  members: Membership[];
  currentTurnIndex: number;
  drawMode?: 'RANDOM' | 'MANUAL' | 'WEIGHTED';
  drawSeed?: string;
  drawDate?: string;
}

export type DrawMode = 'RANDOM' | 'MANUAL' | 'WEIGHTED';

export interface AiTrustScore {
  score: number;
  level: 'Fiable' | 'Moyen' | 'Risqué';
  explanation: string;
  suggestedGroupAmount: number;
}

// NOUVEAU: Type pour les notifications
export interface Notification {
  id: string;
  userId: string;
  type: 'PAYMENT' | 'ALERT' | 'INFO';
  message: string;
  date: string;
  read: boolean;
}

// NOUVEAU: Résumé financier pour le dashboard
export interface FinancialSummary {
  totalContributed: number;
  totalReceived: number;
  nextPaymentDate: string;
  nextPaymentAmount: number;
}

// NOUVEAU: Message de Chat de Groupe
export interface GroupMessage {
  id: string;
  groupId: string;
  userId: string; // 'system' pour les messages auto
  userName: string;
  text: string;
  timestamp: string;
  isSystem?: boolean;
  type?: 'TEXT' | 'AUDIO' | 'IMAGE';
  mediaUrl?: string; // base64 or url
}

// NOUVEAU: Système de Vote
export interface VoteOption {
  id: string;
  label: string;
  count: number;
}

export interface VoteSession {
  id: string;
  groupId: string;
  creatorId: string;
  question: string;
  options: VoteOption[];
  createdAt: string;
  expiresAt: string;
  status: 'OPEN' | 'CLOSED';
  voters: string[]; // List of userIds who voted
}