export const sampleRequests = [
  {
    id: "emg_001",
    token: "CC-982410",
    userId: "usr_citizen_01",
    userName: "Jane Doe",
    description: "Multi-vehicle collision on 4th Street. Engine smoke visible and passengers trapped.",
    language: "en",
    category: "Accident",
    severity: "Critical",
    priority: "P1",
    assignedAuthority: "auth_ems_sf",
    assignedAuthorityName: "SF General EMS",
    location: { latitude: 37.7833, longitude: -122.4067, address: "4th St & Howard St, San Francisco, CA" },
    status: "Dispatched",
    statusHistory: [
      { status: "Submitted", updatedAt: "2026-09-03T14:20:00Z", updatedBy: "usr_citizen_01" },
      { status: "Acknowledged", updatedAt: "2026-09-03T14:21:15Z", updatedBy: "auth_ems_sf" },
      { status: "Dispatched", updatedAt: "2026-09-03T14:22:30Z", updatedBy: "auth_ems_sf" }
    ],
    createdAt: "2026-09-03T14:20:00Z",
    updatedAt: "2026-09-03T14:22:30Z"
  },
  {
    id: "emg_002",
    token: "CC-415902",
    userId: "usr_citizen_01",
    userName: "Jane Doe",
    description: "Residential kitchen fire spreading towards roof electrical wiring.",
    language: "en",
    category: "Fire",
    severity: "High",
    priority: "P1",
    assignedAuthority: "auth_fire_sf",
    assignedAuthorityName: "SF Fire Department",
    location: { latitude: 37.7602, longitude: -122.4215, address: "128 Mission St, San Francisco, CA" },
    status: "In Progress",
    statusHistory: [
      { status: "Submitted", updatedAt: "2026-09-03T13:00:00Z", updatedBy: "usr_citizen_01" },
      { status: "Dispatched", updatedAt: "2026-09-03T13:05:00Z", updatedBy": "auth_fire_sf" },
      { status: "In Progress", updatedAt: "2026-09-03T13:18:00Z", updatedBy": "auth_fire_sf" }
    ],
    createdAt: "2026-09-03T13:00:00Z",
    updatedAt: "2026-09-03T13:18:00Z"
  },
  {
    id: "emg_003",
    token: "CC-773124",
    userId: "usr_volunteer_01",
    userName: "Alex Rivera",
    description: "Flash flooding blocking elderly home access ramp on lower alleyway.",
    language: "es",
    category: "Flood",
    severity: "Medium",
    priority: "P2",
    assignedAuthority: "auth_disaster_sf",
    assignedAuthorityName: "Bay Area Disaster Taskforce",
    location: { latitude: 37.7510, longitude: -122.4180, address: "Mission & 22nd St, San Francisco, CA" },
    status: "Submitted",
    statusHistory: [
      { status: "Submitted", updatedAt: "2026-09-03T15:10:00Z", updatedBy: "usr_volunteer_01" }
    ],
    createdAt: "2026-09-03T15:10:00Z",
    updatedAt: "2026-09-03T15:10:00Z"
  },
  {
    id: "emg_004",
    token: "CC-112089",
    userId: "usr_citizen_01",
    userName: "Jane Doe",
    description: "Elderly pedestrian fainting spell on sidewalk; conscious but disoriented.",
    language: "en",
    category: "Medical",
    severity: "Medium",
    priority: "P3",
    assignedAuthority: "auth_ems_sf",
    assignedAuthorityName: "SF General EMS",
    location: { latitude: 37.7891, longitude: -122.4014, address: "Geary St & Stockton St, San Francisco, CA" },
    status: "Resolved",
    statusHistory: [
      { status: "Submitted", updatedAt: "2026-09-02T09:15:00Z", updatedBy: "usr_citizen_01" },
      { status: "Dispatched", updatedAt: "2026-09-02T09:20:00Z", updatedBy": "auth_ems_sf" },
      { status: "Resolved", updatedAt: "2026-09-02T09:55:00Z", updatedBy": "auth_ems_sf" }
    ],
    createdAt: "2026-09-02T09:15:00Z",
    updatedAt: "2026-09-02T09:55:00Z"
  },
  {
    id: "emg_005",
    token: "CC-339801",
    userId: "usr_volunteer_01",
    userName: "Alex Rivera",
    description: "Fallen power line across bike lane following high wind gusts.",
    language: "en",
    category: "Hazard",
    severity: "Low",
    priority: "P4",
    assignedAuthority: "auth_fire_sf",
    assignedAuthorityName: "SF Fire Department",
    location: { latitude: 37.7690, longitude: -122.4480, address: "Fell St & Panhandle, San Francisco, CA" },
    status: "Acknowledged",
    statusHistory: [
      { status: "Submitted", updatedAt: "2026-09-03T16:00:00Z", updatedBy: "usr_volunteer_01" },
      { status: "Acknowledged", updatedAt: "2026-09-03T16:05:00Z", updatedBy": "auth_fire_sf" }
    ],
    createdAt: "2026-09-03T16:00:00Z",
    updatedAt: "2026-09-03T16:05:00Z"
  }
];
