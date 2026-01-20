
import { db } from './services/db';
import { User, UserRole, Periodicity } from './types';

async function testGroupCreation() {
  console.log('Starting test...');

  // 1. Create a mock user
  const user: User = {
    id: 'test_user_1',
    name: 'Test User',
    email: 'test@example.com',
    password: 'password',
    phone: '1234567890',
    role: UserRole.FREE,
    paymentHistory: { onTime: 0, late: 0, totalAmount: 0 },
    badges: []
  };

  // 2. Create a group
  console.log('Creating group...');
  try {
    const group = await db.createGroup({
      name: 'Test Group',
      amountPerPerson: 1000,
      periodicity: Periodicity.MONTHLY,
      startDate: '2024-01-01'
    }, user);
    console.log('Group created:', group);

    // 3. Fetch groups for user
    console.log('Fetching groups...');
    const allGroups = db.getGroups();
    const myGroups = allGroups.filter(g => g.members.some(m => m.userId === user.id));

    console.log('All Groups Count:', allGroups.length);
    console.log('My Groups:', myGroups);

    if (myGroups.find(g => g.id === group.id)) {
      console.log('SUCCESS: Group found in user dashboard list.');
    } else {
      console.error('FAILURE: Group NOT found in user dashboard list.');
      // Debugging
      const createdGroup = allGroups.find(g => g.id === group.id);
      if (createdGroup) {
          console.log('Created group members:', createdGroup.members);
          console.log('User ID:', user.id);
      }
    }

  } catch (error) {
    console.error('Error creating group:', error);
  }
}

testGroupCreation();
