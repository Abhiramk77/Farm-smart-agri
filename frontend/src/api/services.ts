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
  login: (data: any) => 
    apiClient.post<{ user: User, token: string }>('/auth/login', data),
  signup: (data: any) =>
    apiClient.post<{ user: User, token: string }>('/auth/signup', data),
  getProfile: () => 
    apiClient.get<User>('/auth/me')
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
