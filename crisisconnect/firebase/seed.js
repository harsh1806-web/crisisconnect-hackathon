// CrisisConnect Firestore Data Seeding Script
// Supports both Firebase Admin SDK (serviceAccountKey.json) and Firebase JS SDK

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin SDK
// Make sure serviceAccountKey.json is placed in the same directory as this script
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error("ERROR: 'serviceAccountKey.json' not found!");
  console.log("Please download your Firebase Service Account key from:");
  console.log("Firebase Console -> Project Settings -> Service Accounts -> Generate New Private Key");
  console.log("Save it as 'serviceAccountKey.json' in this folder and rerun the script.\n");
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Sample Data Payload
const sampleData = {
  users: [
    {
      uid: "usr_citizen_01",
      name: "Jane Doe",
      email: "jane.doe@example.com",
      phone: "+1-555-0192",
      role: "user",
      language: "en",
      location: { latitude: 37.7749, longitude: -122.4194, address: "742 Market St, San Francisco, CA 94103" },
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      uid: "usr_volunteer_01",
      name: "Alex Rivera",
      email: "alex.rivera@example.com",
      phone: "+1-555-0847",
      role: "volunteer",
      language: "es",
      location: { latitude: 37.7695, longitude: -122.4467, address: "Haight St, San Francisco, CA 94117" },
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      uid: "usr_authority_01",
      name: "Captain Marcus Vance",
      email: "marcus.vance@sfpd.gov",
      phone: "+1-555-0101",
      role: "authority",
      language: "en",
      location: { latitude: 37.7750, longitude: -122.4183, address: "850 Bryant St, San Francisco, CA 94103" },
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    }
  ],
  authorities: [
    {
      authorityId: "auth_ems_sf",
      name: "SF General Medical Response Control",
      type: "Medical",
      contact: "+1-415-555-0100",
      serviceArea: "San Francisco Metro",
      location: { latitude: 37.7558, longitude: -122.4048 }
    },
    {
      authorityId: "auth_fire_sf",
      name: "San Francisco Fire Department Station 1",
      type: "Fire",
      contact: "+1-415-555-0119",
      serviceArea": "Downtown Sector",
      location: { latitude: 37.7813, longitude: -122.4022 }
    },
    {
      authorityId: "auth_disaster_sf",
      name: "Bay Area Disaster Relief Taskforce",
      type: "Disaster Response",
      contact: "+1-415-555-0911",
      serviceArea": "Greater Bay Area Region",
      location: { latitude: 37.7749, longitude: -122.4194 }
    }
  ],
  emergencies: [
    {
      token: "CC-982410",
      userId: "usr_citizen_01",
      description: "Multi-vehicle collision on 4th Street. Engine smoke visible.",
      language: "en",
      category: "Accident",
      severity: "Critical",
      priority: "P1",
      assignedAuthority: "auth_ems_sf",
      location: { latitude: 37.7833, longitude: -122.4067, address: "4th St & Howard St, San Francisco, CA" },
      status: "Dispatched",
      statusHistory: [
        { status: "Submitted", updatedAt: new Date().toISOString(), updatedBy: "usr_citizen_01" },
        { status: "Acknowledged", updatedAt: new Date().toISOString(), updatedBy: "auth_ems_sf" },
        { status: "Dispatched", updatedAt: new Date().toISOString(), updatedBy: "auth_ems_sf" }
      ],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      token: "CC-415902",
      userId: "usr_citizen_01",
      description: "Residential kitchen fire spreading towards roof electrical wiring.",
      language: "en",
      category: "Fire",
      severity: "High",
      priority: "P1",
      assignedAuthority: "auth_fire_sf",
      location: { latitude: 37.7602, longitude: -122.4215, address: "128 Mission St, San Francisco, CA" },
      status: "In Progress",
      statusHistory: [
        { status: "Submitted", updatedAt: new Date().toISOString(), updatedBy: "usr_citizen_01" },
        { status: "Dispatched", updatedAt: new Date().toISOString(), updatedBy: "auth_fire_sf" },
        { status: "In Progress", updatedAt: new Date().toISOString(), updatedBy: "auth_fire_sf" }
      ],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      token: "CC-773124",
      userId: "usr_volunteer_01",
      description: "Flash flooding blocking elderly home access ramp on lower alleyway.",
      language: "es",
      category: "Flood",
      severity: "Medium",
      priority: "P2",
      assignedAuthority: "auth_disaster_sf",
      location: { latitude: 37.7510, longitude: -122.4180, address: "Mission & 22nd St, San Francisco, CA" },
      status: "Submitted",
      statusHistory: [
        { status: "Submitted", updatedAt: new Date().toISOString(), updatedBy: "usr_volunteer_01" }
      ],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      token: "CC-112089",
      userId: "usr_citizen_01",
      description: "Elderly pedestrian fainting spell on sidewalk; conscious but disoriented.",
      language: "en",
      category: "Medical",
      severity: "Medium",
      priority: "P3",
      assignedAuthority: "auth_ems_sf",
      location: { latitude: 37.7891, longitude: -122.4014, address: "Geary St & Stockton St" },
      status: "Resolved",
      statusHistory: [
        { status: "Submitted", updatedAt: new Date().toISOString(), updatedBy: "usr_citizen_01" },
        { status: "Dispatched", updatedAt: new Date().toISOString(), updatedBy: "auth_ems_sf" },
        { status: "Resolved", updatedAt: new Date().toISOString(), updatedBy: "auth_ems_sf" }
      ],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      token: "CC-339801",
      userId: "usr_volunteer_01",
      description: "Fallen power line across bike lane following high wind gusts.",
      language: "en",
      category: "Hazard",
      severity: "Low",
      priority: "P4",
      assignedAuthority: "auth_fire_sf",
      location: { latitude: 37.7690, longitude: -122.4480, address: "Fell St & Panhandle" },
      status: "Acknowledged",
      statusHistory: [
        { status: "Submitted", updatedAt: new Date().toISOString(), updatedBy: "usr_volunteer_01" },
        { status: "Acknowledged", updatedAt: new Date().toISOString(), updatedBy: "auth_fire_sf" }
      ],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }
  ],
  volunteers: [
    {
      userId: "usr_volunteer_01",
      name: "Alex Rivera",
      skills: ["CPR Certified", "First Aid", "Search & Rescue"],
      availability: "Available",
      location: { latitude: 37.7695, longitude: -122.4467, address: "Haight St, San Francisco, CA" },
      verified: true
    },
    {
      userId: "usr_citizen_01",
      name: "Jane Doe",
      skills: ["Logistics", "Food Prep"],
      availability: "Available",
      location: { latitude: 37.7749, longitude: -122.4194, address: "Market St, San Francisco, CA" },
      verified: false
    },
    {
      userId: "usr_vol_03",
      name: "Dr. Sarah Chen",
      skills: ["Emergency Medicine", "Triage"],
      availability: "Busy",
      location: { latitude: 37.7850, longitude: -122.4090, address: "Polk St, San Francisco, CA" },
      verified: true
    }
  ],
  activities: [
    {
      title: "Post-Storm Community Cleanliness & Relief Drive",
      type: "Cleanliness",
      description: "Clearing storm debris and providing immediate neighborhood emergency assistance.",
      location: { latitude: 37.7510, longitude: -122.4180, address: "Mission District Park, San Francisco, CA" },
      date: "2026-09-10T09:00:00Z",
      organizer: "auth_disaster_sf",
      volunteersRequired: 25
    },
    {
      title: "Emergency Blood Donation Camp for Trauma Centers",
      type: "Blood Camp",
      description: "Replenishing local emergency blood reserves following critical urban surges.",
      location: { latitude: 37.7558, longitude: -122.4048, address: "SF General Auditorium, San Francisco, CA" },
      date: "2026-09-12T08:00:00Z",
      organizer: "auth_ems_sf",
      volunteersRequired: 15
    },
    {
      title: "Disaster Relief Warm Meal & Ration Distribution",
      type: "Food Distribution",
      description: "Distributing packaged meals and bottled water to displaced residents.",
      location: { latitude: 37.7800, longitude: -122.4100, address: "Civic Center Plaza, San Francisco, CA" },
      date: "2026-09-08T11:00:00Z",
      organizer: "auth_disaster_sf",
      volunteersRequired: 40
    }
  ],
  donations: [
    {
      donorId: "usr_citizen_01",
      causeId": "act_food_01",
      donationType": "Food",
      quantity": "50 Packaged Meals",
      status": "Pledged",
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      donorId: "usr_volunteer_01",
      causeId": "act_blood_01",
      donationType": "Blood",
      quantity": "1 Unit O-Positive",
      status": "Pledged",
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      donorId": "usr_citizen_01",
      causeId": "act_clean_01",
      donationType": "Money",
      quantity": "$250.00 USD",
      status": "Collected",
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    }
  ],
  notifications: [
    {
      userId: "usr_citizen_01",
      emergencyId": "emg_001",
      title": "Dispatch Alert",
      message": "EMS Response team assigned to your emergency request (CC-982410).",
      read: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      userId: "usr_citizen_01",
      emergencyId": "emg_001",
      title": "Responder En Route",
      message": "Unit #4 dispatched to 4th St & Howard St. ETA 4 minutes.",
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      userId: "usr_volunteer_01",
      emergencyId": "emg_003",
      title": "Volunteer Dispatch Request",
      message": "Assistance requested for Flood Relief nearby in Mission District.",
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    }
  ]
};

async function seedFirestore() {
  console.log("🚀 Starting Firestore Seeding for CrisisConnect...\n");

  for (const [collectionName, documents] of Object.entries(sampleData)) {
    console.log(`📦 Seeding collection '${collectionName}'...`);
    const collectionRef = db.collection(collectionName);

    for (const docData of documents) {
      let customDocId = null;
      if (docData.uid) customDocId = docData.uid;
      else if (docData.authorityId) customDocId = docData.authorityId;

      if (customDocId) {
        await collectionRef.doc(customDocId).set(docData, { merge: true });
        console.log(`  ✓ Added document ID: ${customDocId}`);
      } else {
        const addedDoc = await collectionRef.add(docData);
        console.log(`  ✓ Added auto-ID document: ${addedDoc.id}`);
      }
    }
  }

  console.log("\n✅ Firestore Seeding Completed Successfully!");
  process.exit(0);
}

seedFirestore().catch((err) => {
  console.error("❌ Error seeding Firestore:", err);
  process.exit(1);
});
