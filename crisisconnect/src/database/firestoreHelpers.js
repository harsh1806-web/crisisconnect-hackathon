// Client-Side Firestore CRUD Helper for CrisisConnect (Firebase Web SDK v10/v11)

import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  arrayUnion, 
  serverTimestamp, 
  query, 
  where, 
  onSnapshot 
} from "firebase/firestore";

// 1. Initialize Firebase Config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Helper function to generate tracking token
function generateEmergencyToken() {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `CC-${num}`;
}

/**
 * 2. Save New Emergency Request
 */
export async function createEmergencyRequest(userId, data) {
  const token = generateEmergencyToken();
  const emergencyRef = collection(db, "emergencies");

  const newDoc = {
    token,
    userId,
    description: data.description,
    language: data.language || "en",
    category: data.category,
    severity: data.severity,
    priority: data.priority || "P2",
    assignedAuthority: data.assignedAuthority || "",
    location: {
      latitude: data.location.latitude,
      longitude: data.location.longitude,
      address: data.location.address || ""
    },
    status: "Submitted",
    statusHistory: [
      {
        status: "Submitted",
        updatedAt: new Date().toISOString(),
        updatedBy: userId
      }
    ],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  const docRef = await addDoc(emergencyRef, newDoc);
  console.log("Emergency created with ID:", docRef.id, "Token:", token);
  return { id: docRef.id, token };
}

/**
 * 3. Update Emergency Status (Authority/Admin action)
 */
export async function updateEmergencyStatus(emergencyId, newStatus, updatedBy) {
  const emergencyRef = doc(db, "emergencies", emergencyId);

  await updateDoc(emergencyRef, {
    status: newStatus,
    updatedAt: serverTimestamp(),
    statusHistory: arrayUnion({
      status: newStatus,
      updatedAt: new Date().toISOString(),
      updatedBy: updatedBy
    })
  });

  console.log(`Emergency ${emergencyId} status updated to: ${newStatus}`);
}

/**
 * 4. Subscribe to Real-Time Updates for a User's Emergencies
 */
export function subscribeToUserEmergencies(userId, callback) {
  const q = query(
    collection(db, "emergencies"), 
    where("userId", "==", userId)
  );

  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(list);
  });
}
