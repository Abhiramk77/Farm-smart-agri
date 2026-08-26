import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase configuration for smart-agri-1112a
const firebaseConfig = {
  apiKey: "AIzaSyAwSRwfvUuKysA33YkuIFIckN0HiR2g_4k",
  authDomain: "smart-agri-1112a.firebaseapp.com",
  projectId: "smart-agri-1112a",
  storageBucket: "smart-agri-1112a.firebasestorage.app",
  messagingSenderId: "64549952068",
  appId: "1:64549952068:web:e3d3db330ccdb098167a11",
  measurementId: "G-N8RNGENPY1"
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
