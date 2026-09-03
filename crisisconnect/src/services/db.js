const CITIZENS_STORAGE_KEY = 'crisisconnect_registered_citizens_db_v1';

// Initial seeds for the citizen database
const INITIAL_CITIZENS = [
  {
    id: 'usr-alex',
    name: 'Alex Taylor',
    phone: '+1-555-0145',
    email: 'alex.taylor@example.com',
    bloodGroup: 'O+',
    allergies: 'None Reported',
    emergencyContact: {
      name: 'Claire Taylor (Sister)',
      phone: '+1-555-0199',
    },
    address: 'Sector 4, Block 12, Riverview',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr-sarah',
    name: 'Sarah Jenkins',
    phone: '+1-555-0192',
    email: 'sarah.jenkins@example.com',
    bloodGroup: 'A+',
    allergies: 'Penicillin',
    emergencyContact: {
      name: 'Mark Jenkins',
      phone: '+1-555-0190',
    },
    address: '14 Lakeview Crescent, Sector 4',
    createdAt: new Date().toISOString(),
  },
];

/**
 * Citizen Database Service
 * Provides persistent database operations for citizen profiles
 */
export const citizenDB = {
  // Get all registered citizens from database
  getAll: () => {
    try {
      const data = localStorage.getItem(CITIZENS_STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      // Fallback
    }
    // Initialize with seeds
    localStorage.setItem(CITIZENS_STORAGE_KEY, JSON.stringify(INITIAL_CITIZENS));
    return INITIAL_CITIZENS;
  },

  // Register a new citizen in the database
  register: (citizenData) => {
    const all = citizenDB.getAll();

    // Check if phone already registered
    const existing = all.find(
      (c) => c.phone.trim().replace(/[\s()-]/g, '') === citizenData.phone.trim().replace(/[\s()-]/g, '')
    );

    if (existing) {
      // Update existing record
      const updated = all.map((c) =>
        c.id === existing.id ? { ...c, ...citizenData, updatedAt: new Date().toISOString() } : c
      );
      localStorage.setItem(CITIZENS_STORAGE_KEY, JSON.stringify(updated));
      return { success: true, citizen: { ...existing, ...citizenData }, isUpdate: true };
    }

    const newCitizen = {
      id: `cit-${Date.now()}`,
      name: citizenData.name.trim(),
      phone: citizenData.phone.trim(),
      email: citizenData.email?.trim() || '',
      bloodGroup: citizenData.bloodGroup || 'Unknown',
      allergies: citizenData.allergies?.trim() || 'None',
      emergencyContact: {
        name: citizenData.emergencyContactName?.trim() || 'Primary Contact',
        phone: citizenData.emergencyContactPhone?.trim() || '',
      },
      address: citizenData.address?.trim() || 'Disaster Relief Area',
      createdAt: new Date().toISOString(),
    };

    const updated = [newCitizen, ...all];
    localStorage.setItem(CITIZENS_STORAGE_KEY, JSON.stringify(updated));
    return { success: true, citizen: newCitizen, isUpdate: false };
  },

  // Authenticate / Find citizen by phone or name
  findByPhone: (phone) => {
    const all = citizenDB.getAll();
    const cleanSearch = phone.trim().replace(/[\s()-]/g, '');
    return all.find((c) => c.phone.replace(/[\s()-]/g, '') === cleanSearch);
  },

  // Find by ID
  findById: (id) => {
    const all = citizenDB.getAll();
    return all.find((c) => c.id === id);
  },
};
