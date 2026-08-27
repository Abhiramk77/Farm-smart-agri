import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase configuration for farm-connect-d3d13
const firebaseConfig = {
  apiKey: "AIzaSyAwUQZKRiJ-WalR4BdMSB-_dloGHnv9XMc",
  authDomain: "farm-connect-d3d13.firebaseapp.com",
  projectId: "farm-connect-d3d13",
  storageBucket: "farm-connect-d3d13.firebasestorage.app",
  messagingSenderId: "1024913563475",
  appId: "1:1024913563475:web:8afb579b52e357f9170ba6",
  measurementId: "G-W4ZQVLQXYS"
};

// Initialize Firebase App (prevents re-initialization error during hot reloads)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Safe Analytics initialization (only in browser environments supporting it)
export let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export default app;
