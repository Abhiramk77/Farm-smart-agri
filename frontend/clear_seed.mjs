import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAwUQZKRiJ-WalR4BdMSB-_dloGHnv9XMc",
  authDomain: "farm-connect-d3d13.firebaseapp.com",
  projectId: "farm-connect-d3d13",
  storageBucket: "farm-connect-d3d13.firebasestorage.app",
  messagingSenderId: "1024913563475",
  appId: "1:1024913563475:web:8afb579b52e357f9170ba6",
  measurementId: "G-W4ZQVLQXYS"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function clearAllOrders() {
  console.log("Clearing ALL orders from Firestore orders collection...");
  const snap = await getDocs(collection(db, "orders"));
  for (const d of snap.docs) {
    await deleteDoc(doc(db, "orders", d.id));
    console.log(`Deleted order ${d.id}`);
  }
  const finalSnap = await getDocs(collection(db, "orders"));
  console.log(`Remaining orders in Firestore orders collection: ${finalSnap.size}`);
  process.exit(0);
}

clearAllOrders().catch((err) => {
  console.error("Clear error:", err);
  process.exit(1);
});
