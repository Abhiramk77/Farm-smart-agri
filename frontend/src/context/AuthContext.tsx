import React, { useState, createContext, useContext, useEffect } from 'react';
import { authService, User } from '../api/services';

type UserRole = 'buyer' | 'farmer' | 'admin' | null;
type FarmerCategory = 'agriculture' | 'aquaculture' | 'dairy' | 'poultry' | null;

interface AuthContextType {
  user: User | null;
  login: (data: any) => Promise<void>;
  signup: (data: any) => Promise<void>;
  logout: () => void;
  setPendingRole: (role: UserRole, category?: FarmerCategory) => void;
  pendingRole: {
    role: UserRole;
    category?: FarmerCategory;
  } | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: {children: React.ReactNode;}) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingRole, setPendingRoleState] = useState<{
    role: UserRole;
    category?: FarmerCategory;
  } | null>(null);

  useEffect(() => {
    // Attempt to load user profile if token exists
    const token = localStorage.getItem('auth_token');
    if (token) {
      authService.getProfile()
        .then(userData => setUser(userData))
        .catch(() => {
          localStorage.removeItem('auth_token');
          setUser(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (data: any) => {
    try {
      const response = await authService.login(data);
      localStorage.setItem('auth_token', response.token);
      setUser(response.user);
    } catch (error) {
      console.error("Login failed", error);
      throw error;
    }
  };

  const signup = async (data: any) => {
    try {
      const response = await authService.signup(data);
      localStorage.setItem('auth_token', response.token);
      setUser(response.user);
    } catch (error) {
      console.error("Signup failed", error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
  };

  const setPendingRole = (role: UserRole, category?: FarmerCategory) => {
    setPendingRoleState({
      role,
      category
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signup,
        logout,
        pendingRole,
        setPendingRole,
        isLoading
      }}>
      
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}