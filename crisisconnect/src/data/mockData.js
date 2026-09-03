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

export const INITIAL_CITIZEN_VOLUNTEER_TASKS = [
  {
    id: "task-vol-1",
    title: "Drinking Water & Dry Rations Distribution",
    sector: "RELIEF AID",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
    description: "Help unload emergency trucks and distribute 500+ bottled water crates & food ration packets to displaced families.",
    location: "Community Center Relief Hub, Sector 3",
    timeRequired: "2 - 3 Hours",
    volunteersNeeded: 12,
    volunteersSignedUp: 8,
    coordinator: "Red Cross Disaster Relief Corps",
    coordinatorPhone: "+91 98201 12345",
    userRegistered: false,
    requirements: "Able to lift 10kg crates • High ground relief camp",
  },
  {
    id: "task-vol-2",
    title: "Emergency Medical Camp & First Aid Assistant",
    sector: "HEALTHCARE",
    badgeColor: "bg-rose-100 text-rose-800 border-rose-200",
    description: "Assist attending doctors with registering incoming injured citizens, distributing ORS/glucose, and organizing basic supplies.",
    location: "Emergency Medical Camp, Gate 2",
    timeRequired: "4 Hours",
    volunteersNeeded: 8,
    volunteersSignedUp: 5,
    coordinator: "Hospital / CMO Response Unit",
    coordinatorPhone: "108",
    userRegistered: false,
    requirements: "Basic first aid awareness • Mask & gloves provided",
  },
  {
    id: "task-vol-3",
    title: "Elderly & Vulnerable Resident Evacuation Escort",
    sector: "RESCUE",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
    description: "Guide elderly and mobility-impaired residents from waterlogged ground floors to designated high-ground assembly points.",
    location: "Sector 7 High School Assembly Point",
    timeRequired: "3 Hours",
    volunteersNeeded: 10,
    volunteersSignedUp: 7,
    coordinator: "NDRF & USAR Volunteer Wing",
    coordinatorPhone: "1077",
    userRegistered: false,
    requirements: "Patience and physical mobility • Rain boots advised",
  },
  {
    id: "task-vol-4",
    title: "Solar Backup Power Bank & ICE Hotline Desk",
    sector: "COMMUNICATIONS",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
    description: "Operate emergency mobile charging stations and help citizens reach emergency contacts (ICE) and locate missing family.",
    location: "Municipal Ward Office, Ground Floor",
    timeRequired: "2 Hours",
    volunteersNeeded: 6,
    volunteersSignedUp: 4,
    coordinator: "Civil Defense Telecommunications",
    coordinatorPhone: "112",
    userRegistered: false,
    requirements: "Good communication skills • Basic phone operating skills",
  },
];

export const INITIAL_BROADCASTS = [
  {
    id: "bc-1",
    title: "Civil Defense Advisory: Sector 4 Flash Flood & Evacuation Routes",
    message: "Disaster Management Authority advises staying on high ground. Avoid low-lying underpasses. NDRF boat squads active in Sector 4.",
    timestamp: "Live Advisory",
    urgency: "critical",
    authority: "State Emergency Operations Center (EOC)",
  },
];

export const INITIAL_SHELTERS = [
  {
    id: "sh-1",
    name: "Central High School Relief Shelter",
    address: "Plot 14, Main Avenue (High Ground)",
    capacity: 250,
    occupied: 140,
    contact: "+91 98201 54321",
    facilities: ["Food Rations", "Clean Water", "Medical Tent", "Generator Power"],
    lat: 19.0820,
    lng: 72.8820,
  },
  {
    id: "sh-2",
    name: "Municipal Indoor Stadium Camp",
    address: "Near Metro Pillar 42, Civil Lines",
    capacity: 500,
    occupied: 310,
    contact: "+91 98201 87654",
    facilities: ["Sleeping Mats", "Doctor on Duty", "Dry Rations", "Sanitation"],
    lat: 19.0710,
    lng: 72.8710,
  },
  {
    id: "sh-3",
    name: "St. Jude Community Hall & Clinic",
    address: "Hill Road Sector 9",
    capacity: 180,
    occupied: 65,
    contact: "+91 98201 99887",
    facilities: ["Emergency First Aid", "Baby Care Rations", "Clean Water"],
    lat: 19.0910,
    lng: 72.8890,
  },
];

export const INITIAL_REQUESTS = [];

export const DEMO_PROFILES = {
  citizen: null,
  ngo: null,
  authority: null,
};
