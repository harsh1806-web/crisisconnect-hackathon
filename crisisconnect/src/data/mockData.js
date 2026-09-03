export const INITIAL_CRISIS_INFO = {
  title: "CrisisConnect Rapid Response Network",
  status: "Surveillance Active",
  updatedAt: "Live",
  affectedArea: "Active Coverage Sectors",
  summary:
    "Emergency Operations Center (EOC) and Rapid Response Volunteer Squads active 24/7.",
  stats: {
    activeRequests: 0,
    pendingVerification: 0,
    verifiedActive: 0,
    ngosDeployed: 0,
    rescuesCompleted: 0,
    sheltersOpen: 0,
  },
  emergencyContacts: [
    { name: "Emergency Police & Rescue", number: "112", icon: "ShieldAlert" },
    { name: "Disaster Management Cell", number: "1077", icon: "PhoneCall" },
    { name: "Ambulance & Trauma Care", number: "108", icon: "Ambulance" },
    { name: "Fire & Flood Control", number: "101", icon: "Flame" },
  ],
};

export const REGISTERED_NGOS = [
  {
    id: "ngo-1",
    name: "National Disaster Response Force (NDRF)",
    type: "Official Government Rescue",
    specialty: "High-Water Boat Rescue & Heavy Evacuation",
    leader: "Commander R. K. Verma",
    phone: "+91 11 2436 3260",
    activeUnits: 8,
    status: "Available",
  },
  {
    id: "ngo-2",
    name: "Red Cross Disaster Relief Corps",
    type: "Humanitarian NGO",
    specialty: "Emergency First Aid, Blood & Medical Supplies",
    leader: "Dr. Ananya Sen",
    phone: "+91 11 2371 6441",
    activeUnits: 14,
    status: "Available",
  },
];

export const INITIAL_NGO_DONATIONS = {
  totalFundsRaised: 0,
  totalFundsDeployed: 0,
  supplies: [],
  recentDonations: [],
};

export const INITIAL_CITIZEN_VOLUNTEER_TASKS = [];

export const INITIAL_BROADCASTS = [];

export const INITIAL_SHELTERS = [];

export const INITIAL_REQUESTS = [];

export const DEMO_PROFILES = {
  citizen: null,
  ngo: null,
  authority: null,
};
