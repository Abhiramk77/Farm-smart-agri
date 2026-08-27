import { apiClient } from './client';
import { auth, db } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, getDocs, query, where, deleteDoc, onSnapshot } from 'firebase/firestore';
import { MOCK_CONTRACTS } from '../data/mockData';


export interface User {
  id: string;
  name: string;
  role: 'buyer' | 'farmer' | null;
  category?: 'agriculture' | 'aquaculture' | 'dairy' | 'poultry' | null;
  email?: string;
  mobile?: string;
  state?: string;
  city?: string;
}

export interface Contract {
  id: string;
  buyerId?: string;
  buyerName: string;
  buyerRating: number;
  category: string;
  product: string;
  productImage: string;
  quantity: string;
  quality: string;
  price: string;
  totalPrice: string;
  timeline: string;
  deliveryLocation: string;
  distance: string;
  transportIncluded: boolean;
  status: 'pending' | 'active' | 'completed' | 'rejected';
  progress?: 'planting' | 'growing' | 'harvesting' | 'ready' | 'delivered';
  createdAt: string;
  farmerId?: string;
}

function formatRupeeString(val?: string): string {
  if (!val) return val || '';
  return val.replace(/\$/g, '₹');
}

export function sanitizeContract(c: Contract): Contract {
  if (!c) return c;
  return {
    ...c,
    price: formatRupeeString(c.price),
    totalPrice: formatRupeeString(c.totalPrice),
  };
}

// ─── Helper: persist profile in localStorage for quick reads ─────────────
function saveProfileToLocal(user: User) {
  localStorage.setItem('mock_user_id', user.id);
  localStorage.setItem('mock_role', user.role || 'buyer');
  localStorage.setItem('mock_user_name', user.name);
  if (user.category) localStorage.setItem('mock_category', user.category);
  if (user.email) localStorage.setItem('mock_user_email', user.email);
  if (user.mobile) localStorage.setItem('mock_user_mobile', user.mobile);
  if (user.state) localStorage.setItem('mock_user_state', user.state);
  if (user.city) localStorage.setItem('mock_user_city', user.city);
}

// ─── Helper: map Firebase auth error codes to user-friendly messages ─────
function mapFirebaseError(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Please login instead.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password must contain at least 6 characters.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password.';
    case 'auth/too-many-requests':
      return 'Too many failed login attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    default:
      return `Authentication failed. (${code}). Please try again.`;
  }
}

export const authService = {
  getSavedAccounts: () => {
    try {
      return JSON.parse(localStorage.getItem('saved_accounts') || '[]');
    } catch {
      return [];
    }
  },

  findUserInRegistry: (_query: string, _role?: string) => {
    // With Firebase Auth, we no longer do local registry lookups during typing.
    return null;
  },

  // ─── SIGNUP: Firebase createUserWithEmailAndPassword ────────────────────
  signup: async (data: any) => {
    const email = (data.email || '').trim();
    const password = data.password || '';
    const role = data.role || 'farmer';

    if (!email || !password) {
      throw new Error('Email and password are required.');
    }

    try {
      // 1. Create the Firebase Auth account
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = credential.user;

      // 2. Set display name on Firebase Auth profile
      await updateProfile(firebaseUser, { displayName: data.name || '' });

      // 3. Store extended user profile in Firestore
      const userProfile = {
        id: firebaseUser.uid,
        name: data.name || '',
        email: email.toLowerCase(),
        mobile: data.mobile || '',
        role: role,
        category: role === 'farmer' ? (data.category || 'agriculture') : null,
        state: data.state || '',
        city: data.city || '',
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'users', firebaseUser.uid), userProfile);

      // 4. CRITICAL: Sign out immediately — registration must NOT auto-login!
      await signOut(auth);

      return {
        success: true,
        message: 'Your Smart Agri Connect account has been created successfully.',
        user: userProfile,
      };
    } catch (error: any) {
      const code = error?.code || '';
      throw new Error(mapFirebaseError(code));
    }
  },

  // ─── LOGIN: Firebase signInWithEmailAndPassword ─────────────────────────
  login: async (data: any) => {
    const email = (data.email || '').trim();
    const password = data.password || '';
    const role = data.role || 'farmer';

    if (!email || !password) {
      throw new Error('Email and password are required.');
    }

    try {
      // 1. Authenticate with Firebase
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = credential.user;
      const token = await firebaseUser.getIdToken();

      // 2. Fetch extended profile from Firestore
      let userProfile: User;
      const profileDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

      if (profileDoc.exists()) {
        const profileData = profileDoc.data();
        userProfile = {
          id: firebaseUser.uid,
          name: profileData.name || firebaseUser.displayName || '',
          email: profileData.email || firebaseUser.email || '',
          role: data.role || profileData.role || 'farmer',
          category: role === 'farmer'
            ? (data.category || profileData.category || 'agriculture')
            : null,
          mobile: profileData.mobile || '',
          state: profileData.state || '',
          city: profileData.city || '',
        };

        // Update role/category in Firestore if changed during login
        if (data.role && data.role !== profileData.role) {
          await setDoc(doc(db, 'users', firebaseUser.uid), {
            ...profileData,
            role: data.role,
            category: role === 'farmer' ? (data.category || profileData.category) : null,
          }, { merge: true });
        }
      } else {
        // Profile doc doesn't exist yet — create one
        userProfile = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || email.split('@')[0],
          email: firebaseUser.email || email,
          role: role,
          category: role === 'farmer' ? (data.category || 'agriculture') : null,
          mobile: data.mobile || '',
          state: data.state || '',
          city: data.city || '',
        };
        await setDoc(doc(db, 'users', firebaseUser.uid), {
          ...userProfile,
          createdAt: new Date().toISOString(),
        });
      }

      // 3. Persist to localStorage for quick access by rest of app
      localStorage.setItem('auth_token', token);
      saveProfileToLocal(userProfile);

      return { user: userProfile, token };
    } catch (error: any) {
      const code = error?.code || '';
      throw new Error(mapFirebaseError(code));
    }
  },

  // ─── LOGOUT: Firebase signOut ──────────────────────────────────────────
  logout: async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error('Firebase signOut error', e);
    }
  },

  // ─── FORGOT PASSWORD: Firebase sendPasswordResetEmail ──────────────────
  forgotPassword: async (email: string) => {
    if (!email.trim()) throw new Error('Please enter your email address.');
    try {
      await sendPasswordResetEmail(auth, email.trim());
      return { success: true, message: `Password reset instructions have been sent to ${email.trim()}` };
    } catch (error: any) {
      const code = error?.code || '';
      if (code === 'auth/user-not-found') {
        // Don't reveal if email exists — show generic success
        return { success: true, message: `If an account exists for ${email.trim()}, a reset email has been sent.` };
      }
      throw new Error(mapFirebaseError(code));
    }
  },

  // ─── GET PROFILE: from Firestore or localStorage fallback ──────────────
  getProfile: async (): Promise<User> => {
    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
      const profileDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (profileDoc.exists()) {
        const data = profileDoc.data();
        return {
          id: firebaseUser.uid,
          name: data.name || firebaseUser.displayName || 'User',
          role: (data.role as any) || 'farmer',
          category: (data.category as any) || null,
          email: data.email || firebaseUser.email || '',
          mobile: data.mobile || '',
          state: data.state || '',
          city: data.city || '',
        };
      }
    }
    // Fallback to localStorage
    const userId = localStorage.getItem('mock_user_id') || '';
    return {
      id: userId,
      name: localStorage.getItem('mock_user_name') || 'User',
      role: (localStorage.getItem('mock_role') as any) || 'buyer',
      category: (localStorage.getItem('mock_category') as any) || null,
      email: localStorage.getItem('mock_user_email') || '',
      mobile: localStorage.getItem('mock_user_mobile') || '',
      state: localStorage.getItem('mock_user_state') || '',
      city: localStorage.getItem('mock_user_city') || '',
    };
  },
};

async function seedFirestoreIfEmpty() {
  // Auto-seeding disabled to ensure only user-created data is displayed
}

export const contractService = {
  getContracts: async (status?: string): Promise<Contract[]> => {
    try {
      const ordersRef = collection(db, 'orders');
      let q = query(ordersRef);
      if (status) {
        q = query(ordersRef, where('status', '==', status));
      }
      const snapshot = await getDocs(q);
      const firestoreContracts: Contract[] = [];
      snapshot.forEach((docSnap) => {
        firestoreContracts.push(sanitizeContract(docSnap.data() as Contract));
      });
      return firestoreContracts;
    } catch (e) {
      console.warn('Firestore getDocs failed:', e);
      return [];
    }
  },

  getMarketplace: async (): Promise<Contract[]> => {
    try {
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, where('status', '==', 'pending'));
      const snapshot = await getDocs(q);
      const list: Contract[] = [];
      snapshot.forEach((docSnap) => {
        list.push(sanitizeContract(docSnap.data() as Contract));
      });
      return list;
    } catch (e) {
      console.warn('Firestore getMarketplace failed:', e);
      return [];
    }
  },

  getContractById: async (id: string): Promise<Contract> => {
    try {
      const docRef = doc(db, 'orders', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return sanitizeContract(docSnap.data() as Contract);
      }
    } catch (e) {
      console.warn('Firestore getDoc failed for order ID:', id, e);
    }

    const userId = localStorage.getItem('mock_user_id') || 'unknown';
    const acceptedIds: string[] = JSON.parse(localStorage.getItem(`accepted_contracts_${userId}`) || '[]');
    const cachedContracts: any[] = JSON.parse(localStorage.getItem(`cached_contracts_${userId}`) || '[]');

    let contract: Contract | null = null;

    if (!contract) {
      const customPending = JSON.parse(localStorage.getItem('custom_pending_contracts') || '[]');
      const matchPending = customPending.find((c: any) => c && c.id === id);
      if (matchPending) contract = sanitizeContract(matchPending);
    }

    if (!contract) {
      const matchCached = cachedContracts.find((c: any) => c && c.id === id);
      if (matchCached) contract = sanitizeContract(matchCached);
    }

    if (!contract) {
      throw new Error('Contract details not found');
    }

    const isAccepted = acceptedIds.includes(id);
    const cachedItem = cachedContracts.find((c: any) => c && c.id === id);

    if (isAccepted || cachedItem) {
      return {
        ...contract,
        status: cachedItem?.status || 'active',
        progress: cachedItem?.progress || contract.progress || 'planting',
      };
    }

    return contract;
  },

  createContract: async (contractData: Partial<Contract>): Promise<Contract> => {
    const contractId = contractData.id || `c_${Date.now()}`;
    const cleanContract = sanitizeContract({
      id: contractId,
      status: 'pending',
      createdAt: new Date().toISOString(),
      ...contractData,
    } as Contract);

    // 1. Write to Firestore 'orders' collection
    try {
      await setDoc(doc(db, 'orders', contractId), cleanContract);
      console.log('Order created in Firestore orders collection:', contractId);
    } catch (e) {
      console.warn('Firestore setDoc failed for order creation:', e);
    }

    // 2. Best effort API call
    try {
      await apiClient.post<Contract>('/contracts', cleanContract);
    } catch (e) {}

    return cleanContract;
  },

  acceptContract: async (id: string, farmerId?: string, farmerName?: string): Promise<Contract> => {
    const userId = farmerId || localStorage.getItem('mock_user_id') || 'unknown';
    const userName = farmerName || localStorage.getItem('mock_user_name') || 'Farmer';

    const updateData = {
      status: 'active' as const,
      progress: 'planting' as const,
      farmerId: userId,
      farmerName: userName,
      updatedAt: new Date().toISOString(),
    };

    // 1. Update in Firestore
    try {
      const docRef = doc(db, 'orders', id);
      await setDoc(docRef, updateData, { merge: true });
      console.log('Firestore order accepted:', id);
    } catch (e) {
      console.warn('Firestore acceptContract failed:', e);
    }

    try {
      await apiClient.post<Contract>(`/contracts/${id}/accept`, {});
    } catch (e) {}

    const existing = await contractService.getContractById(id).catch(() => null);
    return sanitizeContract({
      ...(existing || {}),
      id,
      ...updateData,
    } as Contract);
  },

  rejectContract: async (id: string): Promise<Contract> => {
    const updateData = {
      status: 'rejected' as const,
      updatedAt: new Date().toISOString(),
    };

    try {
      const docRef = doc(db, 'orders', id);
      await setDoc(docRef, updateData, { merge: true });
      console.log('Firestore order rejected:', id);
    } catch (e) {
      console.warn('Firestore rejectContract failed:', e);
    }

    try {
      await apiClient.post<Contract>(`/contracts/${id}/reject`, {});
    } catch (e) {}

    const existing = await contractService.getContractById(id).catch(() => null);
    return sanitizeContract({
      ...(existing || {}),
      id,
      ...updateData,
    } as Contract);
  },

  updateProgress: async (id: string, progress: string): Promise<Contract> => {
    const status = progress === 'delivered' ? ('completed' as const) : ('active' as const);
    const updateData = {
      progress: progress as any,
      status,
      updatedAt: new Date().toISOString(),
    };

    try {
      const docRef = doc(db, 'orders', id);
      await setDoc(docRef, updateData, { merge: true });
      console.log('Firestore order progress updated:', id, progress);
    } catch (e) {
      console.warn('Firestore updateProgress failed:', e);
    }

    try {
      await apiClient.put<Contract>(`/contracts/${id}/progress`, { progress });
    } catch (e) {}

    const existing = await contractService.getContractById(id).catch(() => null);
    return sanitizeContract({
      ...(existing || {}),
      id,
      ...updateData,
    } as Contract);
  },

  updateContractProgress: async (id: string, progress: string) => {
    return contractService.updateProgress(id, progress);
  },

  deleteContract: async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, 'orders', id));
      console.log('Order deleted from Firestore orders collection:', id);
    } catch (e) {
      console.warn('Firestore deleteContract failed:', e);
    }

    try {
      await apiClient.delete(`/contracts/${id}`);
    } catch (e) {}

    // Cleanup local storage lists
    const keysToCheck = ['custom_pending_contracts', 'farmer_listings'];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('buyer_contracts_') || key.startsWith('cached_contracts_') || key.startsWith('accepted_contracts_'))) {
        keysToCheck.push(key);
      }
    }

    keysToCheck.forEach((key) => {
      try {
        const itemStr = localStorage.getItem(key);
        if (itemStr) {
          const list = JSON.parse(itemStr);
          if (Array.isArray(list)) {
            const originalLength = list.length;
            let updatedList;
            if (key.startsWith('accepted_contracts_')) {
              updatedList = list.filter((item) => item !== id);
            } else {
              updatedList = list.filter((c) => c && c.id !== id);
            }
            if (updatedList.length !== originalLength) {
              localStorage.setItem(key, JSON.stringify(updatedList));
            }
          }
        }
      } catch (e) {
        // ignore parse errors
      }
    });
  },

  subscribeUserOrders: (onUpdate: (orders: Contract[]) => void) => {
    try {
      const ordersRef = collection(db, 'orders');
      return onSnapshot(
        ordersRef,
        (snapshot) => {
          const firestoreContracts: Contract[] = [];
          snapshot.forEach((docSnap) => {
            firestoreContracts.push(sanitizeContract(docSnap.data() as Contract));
          });
          onUpdate(firestoreContracts);
        },
        (error) => {
          console.warn('Firestore onSnapshot listener notice:', error);
        }
      );
    } catch (e) {
      console.warn('Firestore subscription unavailable:', e);
      return () => {};
    }
  },

  sendMessage: async (msgData: {
    senderId: string;
    senderName: string;
    receiverId: string;
    receiverName: string;
    text: string;
    contractId?: string;
  }) => {
    const msgId = `msg_${Date.now()}`;
    const payload = {
      id: msgId,
      ...msgData,
      timestamp: new Date().toISOString(),
    };

    try {
      const msgRef = doc(db, 'messages', msgId);
      await setDoc(msgRef, payload);
      console.log('Message sent via Firestore:', msgId);
    } catch (e) {
      console.warn('Firestore sendMessage failed, saving locally:', e);
    }

    // Save locally for reliable offline sync
    const localKey = `messages_${msgData.receiverId}`;
    const existing = JSON.parse(localStorage.getItem(localKey) || '[]');
    localStorage.setItem(localKey, JSON.stringify([payload, ...existing]));

    const senderKey = `messages_${msgData.senderId}`;
    const senderExisting = JSON.parse(localStorage.getItem(senderKey) || '[]');
    localStorage.setItem(senderKey, JSON.stringify([payload, ...senderExisting]));

    return payload;
  },

  subscribeMessages: (userId: string, onUpdate: (messages: any[]) => void) => {
    try {
      const msgsRef = collection(db, 'messages');
      return onSnapshot(
        msgsRef,
        (snapshot) => {
          const userMsgs: any[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (data.senderId === userId || data.receiverId === userId || data.receiverName === userId) {
              userMsgs.push(data);
            }
          });
          onUpdate(userMsgs);
        },
        (error) => {
          console.warn('Firestore message listener notice:', error);
        }
      );
    } catch (e) {
      console.warn('Firestore message subscription unavailable:', e);
      return () => {};
    }
  },
};


