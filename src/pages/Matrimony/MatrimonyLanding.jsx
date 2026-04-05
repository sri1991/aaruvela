import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { Heart, Search, FileText, ArrowRight, ShieldCheck, AlertTriangle, RefreshCw } from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'react-hot-toast';

const MatrimonyLanding = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [renewRef, setRenewRef] = useState('');
    const [renewing, setRenewing] = useState(false);
    const [showRenewBox, setShowRenewBox] = useState(false);

    useEffect(() => {
        if (user && user.status === 'ACTIVE') {
            api.get('/matrimony/me')
                .then(res => setProfile(res.data || null))
                .catch(() => setProfile(null))
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [user]);

    const isSubscriptionExpired = () => {
        if (!profile?.subscription_expires_at) return false;
        return new Date(profile.subscription_expires_at) < new Date();
    };

    const daysLeft = () => {
        if (!profile?.subscription_expires_at) return null;
        const diff = new Date(profile.subscription_expires_at) - new Date();
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    };

    const handleRenew = async () => {
        if (!renewRef.trim()) { toast.error('Please enter your payment reference'); return; }
        setRenewing(true);
        try {
            await api.post('/matrimony/renew', { payment_reference: renewRef });
            toast.success('Renewal submitted! Pending admin approval.');
            setShowRenewBox(false);
            setRenewRef('');
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to submit renewal');
        } finally {
            setRenewing(false);
        }
    };

    const handleActionClick = () => {
        if (!user) {
            navigate('/auth', { state: { returnTo: '/matrimony' } });
            return;
        }
        if (user.status !== 'ACTIVE') {
            alert('This feature is strictly available for Active Members only. Please complete your membership process.');
            return;
        }
        if (!profile) {
            navigate('/matrimony/register');
            return;
        }
        if (profile.payment_status !== 'VERIFIED') {
            toast.error('Your profile is pending admin approval. You will be able to view matches once verified.');
            return;
        }
        if (isSubscriptionExpired()) {
            toast.error('Your monthly subscription has expired. Please renew to view matches.');
            return;
        }
        navigate('/matrimony/matches');
    };

    return (
        <div className="flex flex-col min-h-screen bg-rose-50/30">
            {/* Header / Hero */}
            <div className="bg-gradient-to-br from-rose-900 via-rose-800 to-rose-950 text-white py-16 px-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
                
                <div className="container mx-auto max-w-4xl text-center relative z-10">
                    <div className="w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-1 ring-white/20">
                        <Heart size={32} fill="currentColor" className="text-rose-200" />
                    </div>
                    
                    <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tight leading-tight">
                        6000N Matrimony Services
                    </h1>
                    <p className="text-rose-100 text-lg md:text-xl font-medium max-w-2xl mx-auto opacity-90 leading-relaxed mb-8">
                        A dedicated, secure platform exclusively for Aaruvela Niyogi Brahmana active members to find the perfect match for their loved ones.
                    </p>

                    <button
                        onClick={handleActionClick}
                        className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-8 py-3.5 rounded-full font-bold text-lg hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2 mx-auto"
                        disabled={loading}
                    >
                        {loading ? 'Checking status...'
                            : !profile ? 'Register a Profile'
                            : profile.payment_status !== 'VERIFIED' ? 'Pending Admin Approval'
                            : 'View Matches Database'}
                        {!loading && <ArrowRight size={20} />}
                    </button>

                    {/* Subscription status banner */}
                    {profile && !loading && (
                        <div className="mt-4 mx-auto max-w-sm">
                            {isSubscriptionExpired() ? (
                                <div className="bg-red-500/20 border border-red-400/30 rounded-2xl px-5 py-3 text-sm text-red-100">
                                    <div className="flex items-center gap-2 font-bold mb-1"><AlertTriangle size={14} /> Subscription Expired</div>
                                    <p className="text-xs opacity-80 mb-2">Pay ₹10 to renew for another month.</p>
                                    {!showRenewBox ? (
                                        <button onClick={() => setShowRenewBox(true)} className="flex items-center gap-1 bg-white text-red-700 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
                                            <RefreshCw size={12} /> Renew Subscription
                                        </button>
                                    ) : (
                                        <div className="flex gap-2 mt-1">
                                            <input value={renewRef} onChange={e => setRenewRef(e.target.value)} placeholder="UTR / Payment Reference" className="flex-1 px-3 py-1.5 rounded-lg text-xs text-gray-800 outline-none border border-red-200" />
                                            <button onClick={handleRenew} disabled={renewing} className="bg-white text-red-700 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50">
                                                {renewing ? '...' : 'Submit'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : profile.subscription_expires_at && daysLeft() <= 7 ? (
                                <div className="bg-amber-500/20 border border-amber-400/30 rounded-2xl px-5 py-3 text-sm text-amber-100">
                                    <div className="flex items-center gap-2 font-semibold"><AlertTriangle size={14} /> {daysLeft()} day{daysLeft() !== 1 ? 's' : ''} left in subscription</div>
                                    <p className="text-xs opacity-80 mt-0.5">Renew early to avoid interruption.</p>
                                </div>
                            ) : null}
                        </div>
                    )}

                    {!user && (
                        <p className="text-xs text-rose-300 mt-4 opacity-70">
                            Available exclusively for fully approved Active Members
                        </p>
                    )}
                </div>
            </div>

            {/* Features */}
            <div className="container mx-auto max-w-6xl px-4 py-16">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-rose-100 text-center flex flex-col items-center">
                        <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center mb-5 text-rose-500">
                            <ShieldCheck size={28} />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 mb-3">100% Verified Profiles</h3>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            Every profile is tied to an Active Parishat Member. You can trust the authenticity and intention of every match you view.
                        </p>
                    </div>
                    
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-rose-100 text-center flex flex-col items-center">
                        <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center mb-5 text-rose-500">
                            <FileText size={28} />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 mb-3">Comprehensive Details</h3>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            View deeply detailed bio-data including Gotram, Nakshatram, Occupation, and family requirements upfront.
                        </p>
                    </div>
                    
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-rose-100 text-center flex flex-col items-center">
                        <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center mb-5 text-rose-500">
                            <Search size={28} />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 mb-3">Private Browsing</h3>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            Our system intelligently shows relevant gender profiles in a secure environment, protecting your family's privacy.
                        </p>
                    </div>
                </div>
            </div>

            {/* How it works */}
            <div className="bg-white py-16 border-t border-rose-50">
                <div className="container mx-auto max-w-4xl px-4 text-center">
                    <h2 className="text-2xl font-black text-gray-900 mb-10">How It Works</h2>
                    
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-2">
                        <div className="flex-1 text-center px-4">
                            <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold">1</div>
                            <h4 className="font-bold text-sm text-gray-900">Login</h4>
                            <p className="text-xs text-gray-500 mt-1">As an Active Member</p>
                        </div>
                        <div className="hidden sm:block flex-1 border-t-2 border-dashed border-gray-200"></div>
                        <div className="flex-1 text-center px-4">
                            <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold">2</div>
                            <h4 className="font-bold text-sm text-gray-900">Register</h4>
                            <p className="text-xs text-gray-500 mt-1">Submit bio-data form</p>
                        </div>
                        <div className="hidden sm:block flex-1 border-t-2 border-dashed border-gray-200"></div>
                        <div className="flex-1 text-center px-4">
                            <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold">3</div>
                            <h4 className="font-bold text-sm text-gray-900">Pay & Verify</h4>
                            <p className="text-xs text-gray-500 mt-1">Provide payment proof</p>
                        </div>
                        <div className="hidden sm:block flex-1 border-t-2 border-dashed border-gray-200"></div>
                        <div className="flex-1 text-center px-4">
                            <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold">4</div>
                            <h4 className="font-bold text-sm text-gray-900">Connect</h4>
                            <p className="text-xs text-gray-500 mt-1">Browse opposite gender</p>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default MatrimonyLanding;
