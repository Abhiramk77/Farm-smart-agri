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

export const authService = {
  login: async (data: any) => {
    if (data.role) localStorage.setItem('mock_role', data.role);
    const mockUser: User = {
      id: 'mock-user-123',
      name: data.name || (data.email ? data.email.split('@')[0] : 'Mock User'),
      role: data.role || (localStorage.getItem('mock_role') as any) || 'buyer'
    };
    return { user: mockUser, token: 'mock-token-123' };
  },
  signup: async (data: any) => {
    if (data.role) localStorage.setItem('mock_role', data.role);
    if (data.category) localStorage.setItem('mock_category', data.category);
    
    const mockUser: User = {
      id: 'mock-user-123',
      name: data.name || 'Mock User',
      role: data.role || 'buyer',
      category: data.category
    };
    return { user: mockUser, token: 'mock-token-123' };
  },
  getProfile: async () => {
    const mockUser: User = {
      id: 'mock-user-123',
      name: 'Mock User',
      role: (localStorage.getItem('mock_role') as any) || 'buyer',
      category: (localStorage.getItem('mock_category') as any) || null
    };
    return mockUser;
  }
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
