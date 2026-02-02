import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Input } from '../components/ui';
import { Smartphone, Lock, User, ArrowRight } from 'lucide-react';
import api from '../lib/api';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const AuthPage = () => {
    const [mode, setMode] = useState('LOGIN');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Form states
    const [phone, setPhone] = useState('');
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [fullName, setFullName] = useState('');

    const handleRegister = async (e) => {
        e.preventDefault();

        // Validate PIN confirmation
        if (pin !== confirmPin) {
            toast.error('PINs do not match');
            return;
        }

        if (pin.length !== 4) {
            toast.error('PIN must be exactly 4 digits');
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/auth/register', {
                phone,
                pin,
                full_name: fullName,
            });
            localStorage.setItem('auth_token', response.data.access_token);
            toast.success('Registration successful! Welcome to the community!');
            navigate('/dashboard');
        } catch (error) {
            const detail = error.response?.data?.detail;
            const message = Array.isArray(detail)
                ? detail.map((err) => `${err.loc[err.loc.length - 1]}: ${err.msg}`).join(', ')
                : (typeof detail === 'string' ? detail : 'Registration failed');
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();

        if (pin.length !== 4) {
            toast.error('PIN must be exactly 4 digits');
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/auth/login', {
                phone,
                pin,
            });
            localStorage.setItem('auth_token', response.data.access_token);
            toast.success('Welcome back!');
            navigate('/dashboard');
        } catch (error) {
            const detail = error.response?.data?.detail;
            const message = Array.isArray(detail)
                ? detail.map((err) => `${err.loc[err.loc.length - 1]}: ${err.msg}`).join(', ')
                : (typeof detail === 'string' ? detail : 'Login failed');
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative flex min-h-[calc(100vh-120px)] items-center justify-center overflow-hidden bg-gray-50 p-4">
            {/* Background blobs using theme colors */}
            <div className="absolute -top-[10%] -left-[10%] h-[40%] w-[40%] rounded-full bg-[var(--color-primary)] opacity-10 blur-[120px]" />
            <div className="absolute -bottom-[10%] -right-[10%] h-[40%] w-[40%] rounded-full bg-[var(--color-secondary)] opacity-10 blur-[120px]" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="relative z-10 overflow-hidden rounded-[2rem] border border-gray-200 bg-white p-8 shadow-2xl">
                    <div className="mb-8 text-center text-left">
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 transition-all">
                            {mode === 'LOGIN' && 'Welcome Back'}
                            {mode === 'REGISTER' && 'Join Community'}
                        </h1>
                        <p className="mt-2 text-sm text-gray-500">
                            {mode === 'LOGIN' && 'Sign in with your phone and PIN'}
                            {mode === 'REGISTER' && 'Create an account to get started'}
                        </p>
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={mode}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <form onSubmit={mode === 'LOGIN' ? handleLogin : handleRegister} className="space-y-4">

                                <Input
                                    label="Mobile Number"
                                    placeholder="+91 98765-43210"
                                    icon={<Smartphone className="h-4 w-4" />}
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    required
                                />

                                {mode === 'REGISTER' && (
                                    <Input
                                        label="Full Name"
                                        placeholder="Enter your name"
                                        icon={<User className="h-4 w-4" />}
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        required
                                    />
                                )}

                                <Input
                                    label="4-Digit PIN"
                                    type="password"
                                    maxLength={4}
                                    placeholder="••••"
                                    icon={<Lock className="h-4 w-4" />}
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                                    className="text-center text-2xl tracking-[1em]"
                                    required
                                />

                                {mode === 'REGISTER' && (
                                    <Input
                                        label="Confirm PIN"
                                        type="password"
                                        maxLength={4}
                                        placeholder="••••"
                                        icon={<Lock className="h-4 w-4" />}
                                        value={confirmPin}
                                        onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                                        className="text-center text-2xl tracking-[1em]"
                                        required
                                    />
                                )}

                                <Button className="w-full" isLoading={loading}>
                                    {mode === 'LOGIN' ? 'Sign In' : 'Create Account'}
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>

                                <div className="mt-6 text-center text-sm">
                                    {mode === 'LOGIN' ? (
                                        <p className="text-gray-500">
                                            Don't have an account?{' '}
                                            <button
                                                type="button"
                                                onClick={() => setMode('REGISTER')}
                                                className="font-semibold text-[var(--color-primary)] hover:underline cursor-pointer"
                                            >
                                                Register here
                                            </button>
                                        </p>
                                    ) : (
                                        <p className="text-gray-500">
                                            Already have an account?{' '}
                                            <button
                                                type="button"
                                                onClick={() => setMode('LOGIN')}
                                                className="font-semibold text-[var(--color-primary)] hover:underline cursor-pointer"
                                            >
                                                Sign in here
                                            </button>
                                        </p>
                                    )}
                                </div>
                            </form>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};

export default AuthPage;
