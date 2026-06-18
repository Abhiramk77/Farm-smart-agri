import { apiClient } from './client';

export interface User {
  id: string;
  name: string;
  role: 'buyer' | 'farmer' | null;
  category?: 'agriculture' | 'aquaculture' | 'dairy' | 'poultry' | null;
}

export interface Contract {
  id: string;
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
  status: 'pending' | 'active' | 'completed';
  progress?: 'planting' | 'growing' | 'harvesting' | 'ready' | 'delivered';
  createdAt: string;
}

export interface ChatThread {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
}


// ─── Local user registry ────────────────────────────────────────────────────
// Maps email → { userId, name, role, category } so returning users always
// get back their same account data (accepted contracts, earnings) after logout.
function getRegistry(): Record<string, any> {
  try { return JSON.parse(localStorage.getItem('user_registry') || '{}'); }
  catch { return {}; }
}
function saveRegistry(reg: Record<string, any>) {
  localStorage.setItem('user_registry', JSON.stringify(reg));
}

// Helper: persist the active user profile
function saveProfile(user: User & { email?: string }) {
  localStorage.setItem('mock_user_id',   user.id);
  localStorage.setItem('mock_role',      user.role || 'buyer');
  localStorage.setItem('mock_user_name', user.name);
  if (user.category) localStorage.setItem('mock_category', user.category);
  if (user.email) localStorage.setItem('mock_user_email', user.email);
}

export const authService = {
  login: async (data: any) => {
    const email = (data.email || '').toLowerCase().trim();
    const registry = getRegistry();

    let profile = email ? registry[email] : null;

    if (profile) {
      // ✅ Returning user — restore their exact userId so all their data comes back
      saveProfile(profile);
      return { user: profile as User, token: `mock_token_${profile.id}` };
    }

    // First-time login with this email on this browser — reuse any existing session
    // or create a fresh one
    let userId = localStorage.getItem('mock_user_id');
    if (!userId) {
      userId = `u_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    }
    const mockUser: User = {
      id: userId,
      name: data.name || localStorage.getItem('mock_user_name') || (email ? email.split('@')[0] : 'User'),
      role: (data.role || localStorage.getItem('mock_role') || 'buyer') as any,
      category: (data.category || localStorage.getItem('mock_category') || null) as any,
    };
    // Register so next login restores this profile
    if (email) {
      registry[email] = { ...mockUser, email };
      saveRegistry(registry);
    }
    saveProfile({ ...mockUser, email });
    return { user: mockUser, token: `mock_token_${userId}` };
  },

  signup: async (data: any) => {
    const email = (data.email || '').toLowerCase().trim();
    const registry = getRegistry();

    // If this email is already registered, return that account (prevents duplicates)
    if (email && registry[email]) {
      const existing = registry[email] as User;
      saveProfile({ ...existing, email });
      return { user: existing, token: `mock_token_${existing.id}` };
    }

    // New account — generate a fresh unique ID
    const userId = `u_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const mockUser: User = {
      id: userId,
      name: data.name || 'New User',
      role: (data.role || 'buyer') as any,
      category: (data.category || null) as any,
    };
    // Register the email → userId mapping permanently
    if (email) {
      registry[email] = { ...mockUser, email };
      saveRegistry(registry);
    }
    saveProfile({ ...mockUser, email });
    return { user: mockUser, token: `mock_token_${userId}` };
  },

  getProfile: async () => {
    // Restore the full profile from localStorage on page refresh
    const userId = localStorage.getItem('mock_user_id') || 'mock-user-123';
    return {
      id: userId,
      name:     localStorage.getItem('mock_user_name') || 'User',
      role:     (localStorage.getItem('mock_role') as any)     || 'buyer',
      category: (localStorage.getItem('mock_category') as any) || null,
    } as User;
  },
};

export const contractService = {
  getContracts: (status?: string) => {
    const query = status ? `?status=${status}` : '';
    return apiClient.get<Contract[]>(`/contracts${query}`);
  },
  getMarketplace: () => 
    apiClient.get<Contract[]>('/contracts/marketplace'),
  getContractById: (id: string) => 
    apiClient.get<Contract>(`/contracts/${id}`),
  createContract: (data: any) => 
    apiClient.post<Contract>('/contracts', data),
  acceptContract: (id: string) => 
    apiClient.post<Contract>(`/contracts/${id}/accept`, {}),
  rejectContract: (id: string) => 
    apiClient.post<Contract>(`/contracts/${id}/reject`, {}),
  updateContractProgress: (id: string, progress: string) => 
    apiClient.put<Contract>(`/contracts/${id}/progress`, { progress }),
};

export const chatService = {
  getChats: () => apiClient.get<ChatThread[]>('/chats'),
};
