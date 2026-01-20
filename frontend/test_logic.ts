
import { db } from './services/db.ts';
import { User, UserRole, Periodicity } from './types.ts';

// Mock LocalStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

async function runTest() {
  console.log('--- Starting Group Creation Test ---');

  // 1. Setup User
  const user: User = {
    id: 'test_uid_123',
    name: 'Test User',
    email: 'test@test.com',
    role: UserRole.PREMIUM, // Premium to avoid limits
    phone: '0600000000'
  };
  
  // Simulate login/storage
  localStorage.setItem('daret_current_user', JSON.stringify(user));

  // 2. Create Group
  console.log('Creating group...');
  try {
    const newGroup = await db.createGroup({
      name: 'My New Group',
      amountPerPerson: 1000,
      periodicity: Periodicity.MONTHLY,
      startDate: '2025-01-01'
    }, user);
    console.log('Group created with ID:', newGroup.id);

    // 3. Verify in Storage
    const storedGroupsStr = localStorage.getItem('daret_groups');
    console.log('Storage content length:', storedGroupsStr?.length);
    
    // 4. Retrieve via db.getGroups
    const allGroups = db.getGroups();
    console.log('Total groups:', allGroups.length);
    
    // 5. Filter for User (Dashboard logic)
    const myGroups = allGroups.filter(g => g.members.some(m => m.userId === user.id));
    console.log('My groups count:', myGroups.length);
    
    if (myGroups.length > 0 && myGroups.find(g => g.id === newGroup.id)) {
      console.log('SUCCESS: Group found in dashboard list.');
    } else {
      console.log('FAILURE: Group NOT found.');
      console.log('All Groups:', JSON.stringify(allGroups, null, 2));
    }

  } catch (e) {
    console.error('Error:', e);
  }
}

runTest();
