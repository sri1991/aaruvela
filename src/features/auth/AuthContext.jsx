import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [supabaseUser, setSupabaseUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check active sessions
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSupabaseUser(session?.user ?? null);
            if (session?.user) {
                fetchUserProfile();
            } else {
                setLoading(false);
            }
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSupabaseUser(session?.user ?? null);
            if (session?.user) {
                fetchUserProfile();
            } else {
                setUser(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchUserProfile = async () => {
        try {
            const session = await supabase.auth.getSession();
            const token = session.data.session?.access_token;

            if (!token) {
                setLoading(false);
                return;
            }

            const response = await axios.get(`${API_URL}/auth/me`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            setUser(response.data);
        } catch (error) {
            console.error('Error fetching user profile:', error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const signUp = async (email, password) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) throw error;

        // Create user record in our database
        if (data.user) {
            const { error: dbError } = await supabase
                .from('users')
                .insert({
                    id: data.user.id,
                    identifier: email,
                    status: 'PENDING',
                });

            if (dbError) {
                console.error('Error creating user record:', dbError);
            }
        }
    };

    const signIn = async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;
    };

    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        setUser(null);
        setSupabaseUser(null);
    };

    const setPin = async (pin) => {
        const session = await supabase.auth.getSession();
        const token = session.data.session?.access_token;

        if (!token) {
            throw new Error('Not authenticated');
        }

        await axios.post(
            `${API_URL}/auth/set-pin`,
            { pin },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );
    };

    const verifyPin = async (identifier, pin) => {
        const response = await axios.post(`${API_URL}/auth/verify-pin`, {
            identifier,
            pin,
        });

        return response.data;
    };

    const value = {
        user,
        supabaseUser,
        loading,
        signUp,
        signIn,
        signOut,
        setPin,
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
