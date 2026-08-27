import React, { useState, createContext, useContext, useEffect } from 'react';
import { authService, User } from '../api/services';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

type UserRole = 'buyer' | 'farmer' | null;
type FarmerCategory = 'agriculture' | 'aquaculture' | 'dairy' | 'poultry' | null;

interface AuthContextType {
  user: User | null;
  login: (data: any) => Promise<void>;
  signup: (data: any) => Promise<any>;
  logout: () => void;
  switchRole: (newRole: 'buyer' | 'farmer') => void;
  setPendingRole: (role: UserRole, category?: FarmerCategory) => void;
  pendingRole: {
    role: UserRole;
    category?: FarmerCategory;
  } | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingRole, setPendingRoleState] = useState<{
    role: UserRole;
    category?: FarmerCategory;
  } | null>(null);

  // Listen to Firebase Auth state changes for session persistence
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await authService.getProfile();
          setUser(profile);
        } catch {
          setUser(null);
        }
      } else {
        // Firebase says no user is signed in
        setUser(null);
        localStorage.removeItem('auth_token');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (data: any) => {
    try {
      const response = await authService.login(data);
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('mock_role', response.user.role || 'farmer');
      localStorage.setItem('mock_user_id', response.user.id);
      localStorage.setItem('mock_user_name', response.user.name);
      if (response.user.email) {
        localStorage.setItem('mock_user_email', response.user.email);
      }
      if (response.user.category) {
        localStorage.setItem('mock_category', response.user.category);
      }
      setUser(response.user);
    } catch (error) {
      console.error('Login failed', error);
      throw error;
    }
  };

  const signup = async (data: any) => {
    try {
      const response = await authService.signup(data);
      // DO NOT set auth_token or user state here!
      // Registration creates the Firebase account but signs out immediately.
      // The user must log in manually.
      return response;
    } catch (error) {
      console.error('Signup failed', error);
      throw error;
    }
  };

  const logout = () => {
    // Sign out from Firebase Auth
    authService.logout();
    // Clear all local state
    localStorage.removeItem('auth_token');
    localStorage.removeItem('mock_role');
    localStorage.removeItem('mock_user_id');
    localStorage.removeItem('mock_user_name');
    localStorage.removeItem('mock_category');
    localStorage.removeItem('mock_user_email');
    localStorage.removeItem('mock_user_mobile');
    localStorage.removeItem('mock_user_state');
    localStorage.removeItem('mock_user_city');
    setUser(null);
    setPendingRoleState(null);
  };

  const switchRole = (newRole: 'buyer' | 'farmer') => {
    localStorage.setItem('mock_role', newRole);
    setPendingRoleState({ role: newRole });
    if (user) {
      const updatedUser: User = { ...user, role: newRole };
      setUser(updatedUser);
    }
  };

  const setPendingRole = (role: UserRole, category?: FarmerCategory) => {
    setPendingRoleState({
      role,
      category,
    });
    if (role) {
      localStorage.setItem('mock_role', role);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signup,
        logout,
        switchRole,
        pendingRole,
        setPendingRole,
        isLoading,
      }}
    >
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