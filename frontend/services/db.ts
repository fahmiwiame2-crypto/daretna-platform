import { User, DaretGroup, Membership, UserRole, GroupRole, GroupStatus } from '../types';

class DB {
  private userKey = 'daret_current_user';
  private groupsKey = 'daret_groups';
  private usersKey = 'daret_users'; // To store all users if needed

  // --- Auth ---

  async sendOTP(phone: string): Promise<void> {
    // Simulation: toujours succès
    console.log(`[DB] OTP envoyé au ${phone}`);
    return Promise.resolve();
  }

  async register(data: { name: string; email: string; phone: string; password?: string }): Promise<User> {
    const newUser: User = {
      id: crypto.randomUUID(),
      name: data.name,
      email: data.email,
      phone: data.phone,
      password: data.password, // Stocké pour la démo
      role: UserRole.FREE,
      verificationStatus: 'Verified', // Auto-vérifié par OTP
      paymentHistory: { onTime: 0, late: 0, totalAmount: 0 }
    };

    this.login(newUser); // Auto login
    return newUser;
  }

  getCurrentUser(): User | null {
    const stored = localStorage.getItem(this.userKey);
    if (!stored) return null;

    // Always refresh from DB to get latest points/badges
    const basicUser = JSON.parse(stored);
    const users = this.getUsers();
    return users.find(u => u.id === basicUser.id) || null;
  }

  login(user: User) {
    localStorage.setItem(this.userKey, JSON.stringify(user));
    // Also update in users list
    this.updateUser(user);
  }

  logout() {
    localStorage.removeItem(this.userKey);
  }

  updateUser(user: User) {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index >= 0) {
      users[index] = user;
    } else {
      users.push(user);
    }
    localStorage.setItem(this.usersKey, JSON.stringify(users));
    
    // If current user, update session too
    const current = this.getCurrentUser();
    if (current && current.id === user.id) {
      localStorage.setItem(this.userKey, JSON.stringify(user));
    }
  }

  addPoints(userId: string, amount: number): void {
    const users = this.getUsers();
    const user = users.find(u => u.id === userId);
    if (user) {
      user.points = (user.points || 0) + amount;
      
      // Level Up Logic
      if (user.points >= 1000) user.level = 'Diamant';
      else if (user.points >= 500) user.level = 'Or';
      else if (user.points >= 200) user.level = 'Argent';
      else user.level = 'Bronze';

      this.updateUser(user);
    }
  }

  getUsers(): User[] {
    const stored = localStorage.getItem(this.usersKey);
    return stored ? JSON.parse(stored) : [];
  }

  getUser(id: string): User | undefined {
    return this.getUsers().find(u => u.id === id);
  }

  // --- Groups ---

  getGroups(): DaretGroup[] {
    const stored = localStorage.getItem(this.groupsKey);
    return stored ? JSON.parse(stored) : [];
  }

  saveGroup(group: DaretGroup) {
    const groups = this.getGroups();
    const index = groups.findIndex(g => g.id === group.id);
    if (index >= 0) {
      groups[index] = group;
    } else {
      groups.push(group);
    }
    localStorage.setItem(this.groupsKey, JSON.stringify(groups));
  }

  async createGroup(data: Partial<DaretGroup>, creator: User): Promise<DaretGroup> {
    const newGroup: DaretGroup = {
      id: crypto.randomUUID(),
      name: data.name || 'Nouveau Groupe',
      amountPerPerson: data.amountPerPerson || 1000,
      periodicity: data.periodicity as any,
      startDate: data.startDate || new Date().toISOString(),
      status: GroupStatus.PENDING,
      adminId: creator.id,
      members: [],
      currentTurnIndex: 0,
      ...data
    } as DaretGroup;

    // Add creator as admin member
    const membership: Membership = {
      userId: creator.id,
      groupId: newGroup.id,
      role: GroupRole.ADMIN,
      tourPosition: 1,
      paymentStatus: 'PENDING',
      joinedAt: new Date().toISOString()
    };
    newGroup.members.push(membership);

    this.saveGroup(newGroup);
    return newGroup;
  }

  // --- Payments ---

  async recordPayment(groupId: string, userId: string): Promise<void> {
    const groups = this.getGroups();
    const group = groups.find(g => g.id === groupId);
    if (group) {
      const member = group.members.find(m => m.userId === userId);
      if (member) {
        member.paymentStatus = 'CONFIRMED';
        this.saveGroup(group);
        
        // Update user history
        const user = this.getUser(userId);
        if (user) {
          if (!user.paymentHistory) user.paymentHistory = { onTime: 0, late: 0, totalAmount: 0 };
          user.paymentHistory.onTime += 1;
          user.paymentHistory.totalAmount += group.amountPerPerson;
          this.updateUser(user);
        }
      }
    }
  }

  async upgradeToPremium(userId: string): Promise<void> {
    const user = this.getUser(userId);
    if (user) {
      user.role = UserRole.PREMIUM;
      this.updateUser(user);
    }
  }

  // --- Notifications ---
  getNotifications(userId: string): import('../types').Notification[] {
    // Mock notifications for now
    return [
      { id: '1', userId, type: 'INFO', message: 'Bienvenue sur Daretna !', date: new Date().toISOString(), read: false },
      { id: '2', userId, type: 'ALERT', message: 'Complétez votre profil pour augmenter votre score.', date: new Date().toISOString(), read: false }
    ];
  }

  // --- Financials ---
  getFinancialSummary(user: User): import('../types').FinancialSummary {
    const history = user.paymentHistory || { onTime: 0, late: 0, totalAmount: 0 };
    return {
      totalContributed: history.totalAmount,
      totalReceived: 0, // À calculer selon les tours passés
      nextPaymentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      nextPaymentAmount: 0 // À calculer selon les groupes actifs
    };
  }

  // --- Group Methods ---

  async joinGroup(groupId: string, user: User): Promise<void> {
    const groups = this.getGroups();
    const group = groups.find(g => g.id === groupId);
    if (!group) throw new Error("Groupe non trouvé");
    
    if (group.members.some(m => m.userId === user.id)) throw new Error("Vous êtes déjà membre");

    const membership: Membership = {
      userId: user.id,
      groupId: group.id,
      role: GroupRole.MEMBER,
      tourPosition: null, // Will be set on start
      paymentStatus: 'PENDING',
      joinedAt: new Date().toISOString()
    };
    group.members.push(membership);
    this.saveGroup(group);
  }

  getGroupMessages(groupId: string): import('../types').GroupMessage[] {
    const stored = localStorage.getItem(`daret_chat_${groupId}`);
    return stored ? JSON.parse(stored) : [];
  }

  async sendGroupMessage(groupId: string, user: User, text: string, type: 'TEXT' | 'AUDIO' | 'IMAGE' = 'TEXT', mediaUrl?: string): Promise<void> {
    const messages = this.getGroupMessages(groupId);
    const newMessage: import('../types').GroupMessage = {
      id: crypto.randomUUID(),
      groupId,
      userId: user.id,
      userName: user.name,
      text,
      timestamp: new Date().toISOString(),
      type,
      mediaUrl
    };
    messages.push(newMessage);
    localStorage.setItem(`daret_chat_${groupId}`, JSON.stringify(messages));
  }

  async inviteMember(groupId: string, emailOrPhone: string): Promise<void> {
    const groups = this.getGroups();
    const group = groups.find(g => g.id === groupId);
    if (!group) throw new Error("Groupe non trouvé");

    // Check if already member
    const users = this.getUsers();
    // Try to find user by email or phone
    const existingUser = users.find(u => u.email === emailOrPhone || u.phone === emailOrPhone);
    
    if (existingUser) {
        if (group.members.some(m => m.userId === existingUser.id)) {
            throw new Error("Cet utilisateur est déjà membre du groupe.");
        }
        
        // Add existing user directly
        const membership: Membership = {
            userId: existingUser.id,
            groupId: group.id,
            role: GroupRole.MEMBER,
            tourPosition: null,
            paymentStatus: 'PENDING',
            joinedAt: new Date().toISOString()
        };
        group.members.push(membership);
        this.saveGroup(group);
        return;
    } 

    // If user doesn't exist, create a temporary "invited" user
    const newUser: User = {
        id: crypto.randomUUID(),
        name: emailOrPhone.split('@')[0] || "Invité",
        email: emailOrPhone.includes('@') ? emailOrPhone : `invite-${Date.now()}@daretna.ma`,
        phone: !emailOrPhone.includes('@') ? emailOrPhone : "",
        role: UserRole.FREE,
        verificationStatus: 'Unverified',
        paymentHistory: { onTime: 0, late: 0, totalAmount: 0 }
    };
    
    // Add user to DB
    this.updateUser(newUser);

    // Add to group
    const membership: Membership = {
        userId: newUser.id,
        groupId: group.id,
        role: GroupRole.MEMBER,
        tourPosition: null,
        paymentStatus: 'PENDING',
        joinedAt: new Date().toISOString()
    };
    group.members.push(membership);
    this.saveGroup(group);
  }

  async startDaret(groupId: string, mode: 'RANDOM' | 'MANUAL' | 'WEIGHTED'): Promise<void> {
    const groups = this.getGroups();
    const group = groups.find(g => g.id === groupId);
    if (!group) throw new Error("Groupe non trouvé");

    group.status = GroupStatus.ACTIVE;
    group.drawMode = mode;
    group.drawDate = new Date().toISOString();
    group.drawSeed = crypto.randomUUID().substring(0, 8); // Simulation blockchain seed

    // Assign positions
    group.members.forEach((m, index) => {
      m.tourPosition = index + 1;
    });

    this.saveGroup(group);
  }

  async submitPayment(groupId: string, userId: string, proofUrl: string): Promise<void> {
    const groups = this.getGroups();
    const group = groups.find(g => g.id === groupId);
    if (!group) throw new Error("Groupe non trouvé");

    const member = group.members.find(m => m.userId === userId);
    if (member) {
      member.paymentStatus = 'SUBMITTED';
      member.paymentProofUrl = proofUrl;
      this.saveGroup(group);
    }
  }

  async confirmPayment(groupId: string, memberId: string): Promise<void> {
    return this.recordPayment(groupId, memberId);
  }

  async sendReminders(groupId: string): Promise<string> {
    return "Rappels envoyés aux membres en retard !";
  }

  // --- Voting ---
  
  private votesKey = 'daret_votes';

  getGroupVotes(groupId: string): import('../types').VoteSession[] {
    const stored = localStorage.getItem(this.votesKey);
    const allVotes: import('../types').VoteSession[] = stored ? JSON.parse(stored) : [];
    return allVotes.filter(v => v.groupId === groupId);
  }

  async createVote(groupId: string, creatorId: string, question: string, optionsLabels: string[]): Promise<import('../types').VoteSession> {
    const stored = localStorage.getItem(this.votesKey);
    const allVotes: import('../types').VoteSession[] = stored ? JSON.parse(stored) : [];

    const newVote: import('../types').VoteSession = {
      id: crypto.randomUUID(),
      groupId,
      creatorId,
      question,
      options: optionsLabels.map(label => ({ id: crypto.randomUUID(), label, count: 0 })),
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h default
      status: 'OPEN',
      voters: []
    };

    allVotes.push(newVote);
    localStorage.setItem(this.votesKey, JSON.stringify(allVotes));
    return newVote;
  }

  async castVote(voteId: string, userId: string, optionId: string): Promise<void> {
    const stored = localStorage.getItem(this.votesKey);
    const allVotes: import('../types').VoteSession[] = stored ? JSON.parse(stored) : [];
    const voteIndex = allVotes.findIndex(v => v.id === voteId);

    if (voteIndex === -1) throw new Error("Vote non trouvé");
    const vote = allVotes[voteIndex];

    if (vote.voters.includes(userId)) throw new Error("Vous avez déjà voté");
    if (vote.status === 'CLOSED') throw new Error("Le vote est clos");

    const option = vote.options.find(o => o.id === optionId);
    if (!option) throw new Error("Option invalide");

    option.count += 1;
    vote.voters.push(userId);
    
    allVotes[voteIndex] = vote;
    localStorage.setItem(this.votesKey, JSON.stringify(allVotes));
  }
}

export const db = new DB();
