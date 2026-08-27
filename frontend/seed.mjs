import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, getDocs } from "firebase/firestore";

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

const MOCK_USERS = [
  {
    id: "u1",
    name: "Ramesh Patel",
    email: "farmer@farming.com",
    mobile: "+91 98765 43210",
    role: "farmer",
    category: "agriculture",
    state: "Haryana",
    city: "Karnal",
    createdAt: new Date().toISOString()
  },
  {
    id: "u2",
    name: "Suresh Kumar",
    email: "suresh@dairyfarm.com",
    mobile: "+91 98123 45678",
    role: "farmer",
    category: "dairy",
    state: "Gujarat",
    city: "Anand",
    createdAt: new Date().toISOString()
  },
  {
    id: "u3",
    name: "AgriCorp Ltd",
    email: "buyer@farming.com",
    mobile: "+91 99887 76655",
    role: "buyer",
    state: "Delhi",
    city: "New Delhi",
    createdAt: new Date().toISOString()
  },
  {
    id: "u4",
    name: "FreshDairy Co",
    email: "fresh@dairy.com",
    mobile: "+91 91234 56789",
    role: "buyer",
    state: "Maharashtra",
    city: "Mumbai",
    createdAt: new Date().toISOString()
  }
];

const MOCK_CONTRACTS = [
  {
    id: "c1",
    buyerId: "u3",
    buyerName: "AgriCorp Ltd",
    buyerRating: 4.8,
    category: "agriculture",
    product: "Organic Wheat (HD-2967)",
    productImage: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&q=80&w=400",
    quantity: "50 Tons",
    quality: "Grade A Export Quality",
    price: "₹2,400/Quintal",
    totalPrice: "₹12,00,000",
    timeline: "3 Months (Harvesting in Nov)",
    deliveryLocation: "Karnal, Haryana",
    distance: "12 km away",
    transportIncluded: true,
    status: "pending",
    createdAt: new Date().toISOString()
  },
  {
    id: "c2",
    buyerId: "u4",
    buyerName: "FreshDairy Co",
    buyerRating: 4.9,
    category: "dairy",
    product: "Pure Cow Milk (A2 Quality)",
    productImage: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=400",
    quantity: "500 Liters/day",
    quality: "Fat > 4.5%, SNF > 8.5%",
    price: "₹55/Liter",
    totalPrice: "₹8,25,000 / month",
    timeline: "6 Months Daily Supply",
    deliveryLocation: "Anand, Gujarat",
    distance: "5 km away",
    transportIncluded: false,
    status: "active",
    farmerId: "u1",
    farmerName: "Ramesh Patel",
    progress: "growing",
    createdAt: new Date().toISOString()
  },
  {
    id: "c3",
    buyerId: "u5",
    buyerName: "AquaExports India",
    buyerRating: 4.7,
    category: "aquaculture",
    product: "Vannamei Shrimps",
    productImage: "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&q=80&w=400",
    quantity: "5 Tons",
    quality: "Count 30-40 per kg",
    price: "₹420/kg",
    totalPrice: "₹21,00,000",
    timeline: "45 Days",
    deliveryLocation: "Bhimavaram, Andhra Pradesh",
    distance: "25 km away",
    transportIncluded: true,
    status: "pending",
    createdAt: new Date().toISOString()
  },
  {
    id: "c4",
    buyerId: "u6",
    buyerName: "PoultryFeeds & Co",
    buyerRating: 4.6,
    category: "poultry",
    product: "Broiler Eggs (Farm Fresh)",
    productImage: "https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&q=80&w=400",
    quantity: "10,000 Tray",
    quality: "Weight > 55g per egg",
    price: "₹160/Tray",
    totalPrice: "₹16,00,000",
    timeline: "1 Month Weekly Supply",
    deliveryLocation: "Namakkal, Tamil Nadu",
    distance: "18 km away",
    transportIncluded: true,
    status: "pending",
    createdAt: new Date().toISOString()
  }
];

async function seed() {
  console.log("Seeding USERS and ORDERS collections to Firestore project farm-connect-d3d13...");

  // Seed Users
  for (const user of MOCK_USERS) {
    await setDoc(doc(db, "users", user.id), user);
    console.log(`Successfully written user ${user.id} (${user.name} - ${user.role}) to Firestore`);
  }

  // Seed Orders
  for (const item of MOCK_CONTRACTS) {
    await setDoc(doc(db, "orders", item.id), item);
    console.log(`Successfully written order ${item.id} (${item.product}) to Firestore`);
  }

  const usersSnap = await getDocs(collection(db, "users"));
  const ordersSnap = await getDocs(collection(db, "orders"));

  console.log(`Summary in Firestore farm-connect-d3d13:`);
  console.log(`- Total users: ${usersSnap.size}`);
  console.log(`- Total orders: ${ordersSnap.size}`);

  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding error:", err);
  process.exit(1);
});
