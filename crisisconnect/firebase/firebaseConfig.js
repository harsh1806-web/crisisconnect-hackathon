import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// Replace these environment variables or credentials with your Firebase Project values
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDemoKeyCrisisConnect2026",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "crisisconnect-app.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "crisisconnect-app",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "crisisconnect-app.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "982410339801",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:982410339801:web:a1b2c3d4e5f6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
