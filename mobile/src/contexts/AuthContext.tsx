import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/api';

interface User {
    id: string;
    name: string;
    email: string;
    role: 'ADMIN' | 'CLIENT';
}

interface AuthContextData {
    signed: boolean;
    user: User | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadStorageData() {
            const [storedUser, storedToken] = await Promise.all([
                AsyncStorage.getItem('user'),
                AsyncStorage.getItem('token'),
            ]);

            if (storedUser && storedToken) {
                // Validation could be added here
                setUser(JSON.parse(storedUser));
            }
            setLoading(false);
        }

        loadStorageData();
    }, []);

    async function signIn(email: string, password: string) {
        const response = await api.post('/auth/login', {
            email,
            password,
        });

        const { user, token } = response.data;

        await AsyncStorage.setItem('user', JSON.stringify(user));
        await AsyncStorage.setItem('token', token);

        setUser(user);
    }

    async function signOut() {
        await AsyncStorage.removeItem('user');
        await AsyncStorage.removeItem('token');
        setUser(null);
    }

    return (
        <AuthContext.Provider value={{ signed: !!user, user, loading, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
