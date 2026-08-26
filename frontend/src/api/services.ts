import { apiClient } from './client';
import { auth, db } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

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

export const contractService = {
  getContracts: async (status?: string) => {
    const query = status ? `?status=${status}` : '';
    const res = await apiClient.get<Contract[]>(`/contracts${query}`);
    return (res || []).map(sanitizeContract);
  },
  getMarketplace: async () => {
    const res = await apiClient.get<Contract[]>('/contracts/marketplace');
    return (res || []).map(sanitizeContract);
  },
  getContractById: async (id: string) => {
    const userId = localStorage.getItem('mock_user_id') || 'unknown';
    const acceptedIds: string[] = JSON.parse(localStorage.getItem(`accepted_contracts_${userId}`) || '[]');
    const cachedContracts: any[] = JSON.parse(localStorage.getItem(`cached_contracts_${userId}`) || '[]');

    let contract: Contract | null = null;

    try {
      const res = await apiClient.get<Contract>(`/contracts/${id}`);
      if (res && res.id) contract = sanitizeContract(res);
    } catch (e) {
      console.warn('Backend API getContractById failed, attempting local storage lookup', e);
    }

    if (!contract) {
      const customPending = JSON.parse(localStorage.getItem('custom_pending_contracts') || '[]');
      const matchPending = customPending.find((c: any) => c && c.id === id);
      if (matchPending) contract = sanitizeContract(matchPending);
    }

    if (!contract) {
      const buyerContracts = JSON.parse(localStorage.getItem(`buyer_contracts_${userId}`) || '[]');
      const matchBuyer = buyerContracts.find((c: any) => c && c.id === id);
      if (matchBuyer) contract = sanitizeContract(matchBuyer);
    }

    if (!contract) {
      const matchCached = cachedContracts.find((c: any) => c && c.id === id);
      if (matchCached) contract = sanitizeContract(matchCached);
    }

    if (!contract) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('buyer_contracts_') || key.startsWith('cached_contracts_') || key.startsWith('accepted_contracts_'))) {
          try {
            const list = JSON.parse(localStorage.getItem(key) || '[]');
            if (Array.isArray(list)) {
              const found = list.find((c: any) => c && c.id === id);
              if (found) {
                contract = sanitizeContract(found);
                break;
              }
            }
          } catch (e) {
            // ignore
          }
        }
      }
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
  createContract: async (contractData: Partial<Contract>) => {
    const res = await apiClient.post<Contract>('/contracts', contractData);
    return sanitizeContract(res);
  },
  acceptContract: async (id: string) => {
    const userId = localStorage.getItem('mock_user_id') || 'unknown';

    // Add ID to accepted_contracts_${userId}
    const idsKey = `accepted_contracts_${userId}`;
    const existingIds: string[] = JSON.parse(localStorage.getItem(idsKey) || '[]');
    if (!existingIds.includes(id)) {
      localStorage.setItem(idsKey, JSON.stringify([...existingIds, id]));
    }

    try {
      const res = await apiClient.post<Contract>(`/contracts/${id}/accept`, {});
      if (res) {
        const activeRes = { ...res, status: 'active' as const, progress: 'planting' as const };
        const cacheKey = `cached_contracts_${userId}`;
        const cached: any[] = JSON.parse(localStorage.getItem(cacheKey) || '[]');
        if (!cached.some((c) => c.id === id)) {
          localStorage.setItem(cacheKey, JSON.stringify([...cached, activeRes]));
        }
        return sanitizeContract(activeRes);
      }
    } catch (e) {
      console.warn('Backend acceptContract failed, using local status update', e);
    }

    const customPending = JSON.parse(localStorage.getItem('custom_pending_contracts') || '[]');
    const target = customPending.find((c: any) => c.id === id);
    const updatedPending = customPending.filter((c: any) => c.id !== id);
    localStorage.setItem('custom_pending_contracts', JSON.stringify(updatedPending));

    const activeContract = sanitizeContract({
      ...(target || {}),
      id,
      status: 'active',
      progress: 'planting',
    } as any);

    const cacheKey = `cached_contracts_${userId}`;
    const cached: any[] = JSON.parse(localStorage.getItem(cacheKey) || '[]');
    if (!cached.some((c) => c.id === id)) {
      localStorage.setItem(cacheKey, JSON.stringify([...cached, activeContract]));
    }

    return activeContract;
  },
  rejectContract: async (id: string) => {
    try {
      const res = await apiClient.post<Contract>(`/contracts/${id}/reject`, {});
      if (res) return sanitizeContract(res);
    } catch (e) {
      console.warn('Backend rejectContract failed, using local status update', e);
    }

    const customPending = JSON.parse(localStorage.getItem('custom_pending_contracts') || '[]');
    const updatedPending = customPending.filter((c: any) => c.id !== id);
    localStorage.setItem('custom_pending_contracts', JSON.stringify(updatedPending));

    return sanitizeContract({
      id,
      status: 'rejected',
    } as any);
  },
  updateProgress: async (id: string, progress: string) => {
    let updatedContract: Contract | null = null;
    try {
      const res = await apiClient.put<Contract>(`/contracts/${id}/progress`, {
        progress,
      });
      if (res && res.id) updatedContract = sanitizeContract(res);
    } catch (e) {
      console.warn('Backend updateProgress failed, updating local storage state', e);
    }

    const userId = localStorage.getItem('mock_user_id') || 'unknown';
    const cacheKey = `cached_contracts_${userId}`;
    const cached: Contract[] = JSON.parse(localStorage.getItem(cacheKey) || '[]');
    const foundIndex = cached.findIndex((c) => c && c.id === id);
    if (foundIndex !== -1) {
      cached[foundIndex] = {
        ...cached[foundIndex],
        progress: progress as any,
        status: progress === 'delivered' ? 'completed' : cached[foundIndex].status || 'active',
      };
      localStorage.setItem(cacheKey, JSON.stringify(cached));
      if (!updatedContract) updatedContract = sanitizeContract(cached[foundIndex]);
    }

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('buyer_contracts_') || key.startsWith('cached_contracts_') || key.startsWith('accepted_contracts_'))) {
        try {
          const list = JSON.parse(localStorage.getItem(key) || '[]');
          if (Array.isArray(list)) {
            let modified = false;
            const updatedList = list.map((c: any) => {
              if (c && c.id === id) {
                modified = true;
                const newC = {
                  ...c,
                  progress,
                  status: progress === 'delivered' ? 'completed' : c.status || 'active',
                };
                if (!updatedContract) updatedContract = sanitizeContract(newC);
                return newC;
              }
              return c;
            });
            if (modified) {
              localStorage.setItem(key, JSON.stringify(updatedList));
            }
          }
        } catch (e) {
          // ignore
        }
      }
    }

    if (!updatedContract) {
      updatedContract = sanitizeContract({
        id,
        progress: progress as any,
        status: progress === 'delivered' ? 'completed' : 'active',
      } as any);
    }

    return updatedContract;
  },
  updateContractProgress: async (id: string, progress: string) => {
    return contractService.updateProgress(id, progress);
  },
  deleteContract: async (id: string) => {
    try {
      // Best effort backend delete
      await apiClient.delete(`/contracts/${id}`);
    } catch (e) {
      console.warn('Backend API deleteContract failed, falling back to local storage deletion', e);
    }

    // Remove from all local storage lists
    const keysToCheck = ['custom_pending_contracts', 'farmer_listings'];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('buyer_contracts_') || key.startsWith('cached_contracts_') || key.startsWith('accepted_contracts_'))) {
        keysToCheck.push(key);
      }
    }

    keysToCheck.forEach(key => {
      try {
        const itemStr = localStorage.getItem(key);
        if (itemStr) {
          const list = JSON.parse(itemStr);
          if (Array.isArray(list)) {
            const originalLength = list.length;
            let updatedList;
            if (key.startsWith('accepted_contracts_')) {
              // It's an array of string IDs
              updatedList = list.filter(item => item !== id);
            } else {
              // It's an array of objects
              updatedList = list.filter(c => c && c.id !== id);
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
};

