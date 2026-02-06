import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../api/services';

interface AuthContextType {
    user: any;
    isLoading: boolean;
    login: (data: any) => Promise<any>;
    register: (data: any) => Promise<void>;
    logout: () => Promise<void>;
    onboard: (data: any) => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshUser = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setUser(null);
            setIsLoading(false);
            return;
        }

        try {
            const userData = await authService.me();
            setUser(userData);
        } catch (error) {
            console.error('Failed to fetch user', error);
            localStorage.removeItem('token');
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
            await authService.logout();
        } catch (err) {
            console.error('Logout error', err);
        } finally {
            localStorage.removeItem('token');
            setUser(null);
        }
    };

    const onboard = async (data: any) => {
        await authService.onboarding(data);
        await refreshUser();
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, register, logout, onboard, refreshUser }}>
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
