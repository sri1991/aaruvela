import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import api from '../../lib/api';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchUserProfile = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            console.log('DEBUG: fetchUserProfile checking token:', !!token);

            if (!token) {
                setUser(null);
                setLoading(false);
                return null;
            }

            // Using the 'api' instance which already has the interceptor for the token
            const response = await api.get('/auth/me');
            console.log('DEBUG: fetchUserProfile success:', response.data.identifier);
            setUser(response.data);
            return response.data;
        } catch (error) {
            console.error('DEBUG: fetchUserProfile error:', error);
            setUser(null);
            if (error.response?.status === 401) {
                localStorage.removeItem('auth_token');
            }
            return null;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        console.log('DEBUG: AuthProvider initial check');
        fetchUserProfile();

        const handleStorageChange = (e) => {
            if (e.key === 'auth_token') {
                console.log('DEBUG: auth_token storage change detected');
                fetchUserProfile();
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const signOut = async () => {
        console.log('DEBUG: Signing out');
        localStorage.removeItem('auth_token');
        setUser(null);
        await supabase.auth.signOut();
    };

    const verifyPin = async (identifier, pin) => {
        console.log('DEBUG: verifyPin called for:', identifier);
        const response = await api.post('/auth/verify-pin', {
            identifier,
            pin,
        });

        if (response.data.access_token) {
            console.log('DEBUG: received token, setting to localStorage');
            localStorage.setItem('auth_token', response.data.access_token);
            await fetchUserProfile();
        }

        return response.data;
    };

    const value = {
        user,
        loading,
        refreshUser: fetchUserProfile,
        signOut,
        verifyPin,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
