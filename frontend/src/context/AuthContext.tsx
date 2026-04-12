import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../api/services';

export type UserRole = 'owner' | 'manager' | 'employee';

export interface User {
 id: number;
 name: string;
 email: string;
 role: UserRole;
 is_admin: boolean;
 tenant_id: number | null;
 status: string;
 tenant?: {
 id: number;
 company_name: string;
 subscription_plan: string;
 [key: string]: any;
 };
 two_factor_confirmed_at?: string | null;
 email_verified_at?: string | null;
 language?: string;
 [key: string]: any;
}

const ROLE_LEVEL: Record<UserRole, number> = {
 employee: 1,
 manager: 2,
 owner: 3,
};

interface AuthContextType {
 user: User | null;
 isLoading: boolean;
 login: (data: any) => Promise<any>;
 register: (data: any) => Promise<void>;
 logout: () => Promise<void>;
 onboard: (data: any) => Promise<void>;
 refreshUser: () => Promise<void>;
 isOwner: boolean;
 isManager: boolean;
 isEmployee: boolean;
 hasMinRole: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
 const [user, setUser] = useState<User | null>(null);
 const [isLoading, setIsLoading] = useState(true);

 const refreshUser = async () => {
 try {
 // Token is automatically sent via HttpOnly cookie
 // No need to manually read from localStorage
 const userData = await authService.me();
 setUser(userData);
 } catch (error) {
 console.error('Failed to fetch user', error);
 // Token might be expired or invalid
 // Axios interceptor will handle 401 and redirect to login
 setUser(null);
 } finally {
 setIsLoading(false);
 }
 };

 useEffect(() => {
 refreshUser();
 }, []);

 const login = async (data: any) => {
 const response = await authService.login(data);
 if (response.two_factor) {
 return response;
 }
 await refreshUser();
 return { success: true };
 };

 const register = async (data: any) => {
 await authService.register(data);
 await refreshUser();
 };

 const logout = async () => {
 try {
 // Call logout endpoint to revoke tokens on server
 // Cookies will be cleared by server response
 await authService.logout();
 } catch (err) {
 console.error('Logout error', err);
 } finally {
 // Clear local user state
 // Cookies are automatically cleared by server
 setUser(null);
 }
 };

 const onboard = async (data: any) => {
 await authService.onboarding(data);
 await refreshUser();
 };

 const isOwner = user?.role === 'owner';
 const isManager = user?.role === 'manager';
 const isEmployee = user?.role === 'employee';

 const hasMinRole = (role: UserRole): boolean => {
 if (!user) return false;
 return (ROLE_LEVEL[user.role] ?? 0) >= (ROLE_LEVEL[role] ?? 99);
 };

 return (
 <AuthContext.Provider value={{
 user, isLoading, login, register, logout, onboard, refreshUser,
 isOwner, isManager, isEmployee, hasMinRole
 }}>
 {children}
 </AuthContext.Provider>
 );
};

export const useAuth = () => {
 const context = useContext(AuthContext);
 if (context === undefined) {
 throw new Error('useAuth must be used within an AuthProvider');
 }
 return context;
};
