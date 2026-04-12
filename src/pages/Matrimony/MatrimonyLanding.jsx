import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import {
    Heart, Search, FileText, ArrowRight, ShieldCheck, AlertTriangle,
    RefreshCw, Loader2, MapPin, Briefcase, Star, User, X, Mail, Phone, Calendar, Info,
} from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'react-hot-toast';

// ── Community helpers ─────────────────────────────────────────────────────────
const getCommunity = (parishat_id) => {
    if (!parishat_id) return '6000N';
    const bare = parishat_id.replace(/^TST-/, '');
    return bare.startsWith('AID-') ? 'BRAHMIN' : '6000N';
};

const TABS = [
    { key: '6000N',   label: '6000N Community' },
    { key: 'BRAHMIN', label: 'Brahmin Community' },
];

// ── Match profile modal ───────────────────────────────────────────────────────
const MatchProfileModal = ({ profileId, onClose }) => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        api.get(`/matrimony/profile/${profileId}`)
            .then(res => setProfile(res.data))
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, [profileId]);

    const fmtTime = (t) => t ? t.slice(0, 5) : '—';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl relative mt-10 mb-10">
                <div className="flex items-center justify-between px-6 py-4 border-b border-blue-100 bg-blue-50/50 rounded-t-3xl text-blue-900">
                    <h3 className="font-black text-sm uppercase tracking-wider flex items-center gap-2">
                        <Heart size={16} className="text-blue-500" /> Complete Profile
                    </h3>
                    <button onClick={onClose} className="text-blue-400 hover:text-blue-700 transition-colors p-1 bg-white rounded-full shadow-sm">
                        <X size={18} />
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-24">
                        <Loader2 className="animate-spin text-blue-500 h-8 w-8" />
                    </div>
                ) : error ? (
                    <p className="text-center text-blue-400 py-16 text-sm">Failed to load profile details.</p>
                ) : profile ? (
                    <div className="p-6 md:p-8">
                        <div className="flex flex-col md:flex-row items-center gap-6 mb-8 text-center md:text-left">
                            <div className="flex gap-2 shrink-0">
                                {(profile.photos?.length > 0 ? profile.photos : profile.photo_url ? [profile.photo_url] : []).map((url, i) => (
                                    <div key={i} className={`rounded-2xl bg-blue-50 border-2 border-blue-100 overflow-hidden flex items-center justify-center shadow-inner ${i === 0 ? 'w-28 h-28' : 'w-16 h-16'}`}>
                                        <img src={url} alt={`${profile.full_name} ${i + 1}`} className="w-full h-full object-cover" />
                                    </div>
                                ))}
                                {(!profile.photos?.length && !profile.photo_url) && (
                                    <div className="w-28 h-28 rounded-2xl bg-blue-50 border-2 border-blue-100 flex items-center justify-center">
                                        <User size={40} className="text-blue-200" />
                                    </div>
                                )}
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-2xl font-black text-gray-900 leading-tight mb-1">{profile.full_name}</h2>
                                <p className="text-sm font-bold text-blue-600 mb-2">
                                    {profile.age ? `${profile.age} yrs` : 'Age N/A'} • {profile.gender}
                                    {profile.current_city && <span className="text-gray-400 font-normal"> • {profile.current_city}</span>}
                                </p>
                                {profile.parishat_id && (
                                    <span className="inline-block px-3 py-1 rounded-full text-xs font-black bg-gray-100 text-gray-600 border border-gray-200">
                                        ID: {profile.parishat_id}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b pb-2">Astrological Details</h4>
                                <div className="space-y-3 bg-gray-50 rounded-xl p-4 border border-gray-100">
                                    <div className="flex items-center gap-3 text-sm">
                                        <Calendar size={16} className="text-blue-500 shrink-0" />
                                        <span className="text-gray-700 font-medium">DOB: {profile.dob} <span className="text-gray-400 font-normal">({fmtTime(profile.tob)})</span></span>
                                    </div>
                                    {profile.place_of_birth && (
                                        <div className="flex items-center gap-3 text-sm">
                                            <MapPin size={16} className="text-blue-500 shrink-0" />
                                            <span className="text-gray-700 font-medium">Birth Place: {profile.place_of_birth}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-3 text-sm">
                                        <Star size={16} className="text-blue-500 shrink-0" />
                                        <span className="text-gray-700 font-medium">Gotram: <span className="font-bold">{profile.gotram || '—'}</span></span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <Info size={16} className="text-blue-500 shrink-0" />
                                        <span className="text-gray-700 font-medium">Star & Pada: {profile.star_with_pada || '—'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b pb-2">Family & Career</h4>
                                <div className="space-y-3 bg-gray-50 rounded-xl p-4 border border-gray-100">
                                    <div className="flex items-start gap-3 text-sm">
                                        <User size={16} className="text-blue-500 shrink-0 mt-0.5" />
                                        <span className="text-gray-700"><span className="text-gray-400 text-xs block mb-0.5">Father/Guardian</span>{profile.father_guardian_name || '—'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <Briefcase size={16} className="text-blue-500 shrink-0" />
                                        <span className="text-gray-700 font-medium">{profile.occupation || '—'} <span className="text-gray-400">({profile.annual_income || 'Income N/A'})</span></span>
                                    </div>
                                    {((profile.brothers != null) || (profile.sisters != null)) && (
                                        <div className="flex items-center gap-3 text-sm">
                                            <User size={16} className="text-blue-500 shrink-0" />
                                            <span className="text-gray-700">
                                                {profile.brothers != null ? `${profile.brothers}B` : ''}
                                                {profile.brothers != null && profile.sisters != null ? ' / ' : ''}
                                                {profile.sisters != null ? `${profile.sisters}S` : ''}
                                                <span className="text-gray-400 text-xs ml-1">siblings</span>
                                            </span>
                                        </div>
                                    )}
                                    {profile.willing_to_relocate != null && (
                                        <div className="flex items-center gap-3 text-sm">
                                            <MapPin size={16} className="text-blue-500 shrink-0" />
                                            <span className="text-gray-700">Relocate: <span className="font-bold">{profile.willing_to_relocate ? 'Yes' : 'No'}</span></span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 space-y-4">
                            {profile.particulars && (
                                <div>
                                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Particulars / Description</h4>
                                    <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-xl border border-gray-100 leading-relaxed">{profile.particulars}</p>
                                </div>
                            )}
                            {profile.requirement && (
                                <div>
                                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Partner Requirements</h4>
                                    <p className="text-sm text-gray-700 bg-amber-50 p-4 rounded-xl border border-amber-100 leading-relaxed text-amber-900">{profile.requirement}</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-100 flex flex-wrap gap-4">
                            {profile.contact_no && (
                                <a href={`tel:${profile.contact_no}`} className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-100 transition-colors">
                                    <Phone size={14} /> {profile.contact_no}
                                </a>
                            )}
                            {profile.email && (
                                <a href={`mailto:${profile.email}`} className="flex items-center gap-2 bg-gray-50 text-gray-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-100 transition-colors">
                                    <Mail size={14} /> Email
                                </a>
                            )}
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

// ── Main component ────────────────────────────────────────────────────────────
const MatrimonyLanding = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Profile state
    const [profile, setProfile] = useState(null);
    const [profileLoading, setProfileLoading] = useState(true);
    const [renewRef, setRenewRef] = useState('');
    const [renewing, setRenewing] = useState(false);
    const [showRenewBox, setShowRenewBox] = useState(false);

    // Matches state (only loaded when user has access)
    const [matches, setMatches] = useState([]);
    const [matchesLoading, setMatchesLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [tab, setTab] = useState('6000N');
    const [viewingProfileId, setViewingProfileId] = useState(null);

    // Load own profile
    useEffect(() => {
        if (user?.status === 'ACTIVE') {
            api.get('/matrimony/me')
                .then(res => setProfile(res.data || null))
                .catch(() => setProfile(null))
                .finally(() => setProfileLoading(false));
        } else {
            setProfileLoading(false);
        }
    }, [user]);

    const isExpired = () => {
        if (!profile?.subscription_expires_at) return false;
        return new Date(profile.subscription_expires_at) < new Date();
    };

    const daysLeft = () => {
        if (!profile?.subscription_expires_at) return null;
        return Math.max(0, Math.ceil((new Date(profile.subscription_expires_at) - new Date()) / 86400000));
    };

    const hasAccess = profile?.payment_status === 'VERIFIED' && profile?.status === 'ACTIVE' && !isExpired();

    // Load matches once we know user has access
    useEffect(() => {
        if (!profileLoading && hasAccess) {
            setMatchesLoading(true);
            api.get('/matrimony/matches')
                .then(res => setMatches(res.data || []))
                .catch(() => setMatches([]))
                .finally(() => setMatchesLoading(false));
        }
    }, [profileLoading, hasAccess]);

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

    // ── Matches view (user has paid access) ──────────────────────────────────
    if (!profileLoading && hasAccess) {
        const tabMatches = matches.filter(m => getCommunity(m.parishat_id) === tab);
        const filtered = tabMatches.filter(m => {
            const q = search.toLowerCase();
            return m.full_name?.toLowerCase().includes(q) || m.gotram?.toLowerCase().includes(q);
        });

        return (
            <div className="min-h-screen bg-blue-50/30 py-8 px-4">
                <div className="container mx-auto max-w-5xl">
                    {/* Header card */}
                    <div className="flex flex-col gap-4 mb-6 bg-white p-6 rounded-3xl shadow-sm border border-blue-100">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-black text-blue-900 flex items-center gap-2">
                                    <Heart size={24} className="text-blue-500" /> Matrimony Matches
                                </h1>
                                <p className="text-blue-500 text-sm mt-1 font-medium">
                                    {matchesLoading ? 'Finding matches…' : `${filtered.length} profile${filtered.length !== 1 ? 's' : ''} in this community`}
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                {/* Days left pill */}
                                {daysLeft() != null && daysLeft() <= 7 && (
                                    <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full flex items-center gap-1">
                                        <AlertTriangle size={12} /> {daysLeft()}d left
                                    </span>
                                )}
                                <button
                                    onClick={() => navigate('/matrimony/register')}
                                    className="text-xs font-bold text-blue-600 hover:text-blue-800 underline underline-offset-2"
                                >
                                    Edit My Profile
                                </button>
                                <div className="relative">
                                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search name or gotram…"
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        className="pl-9 pr-4 py-2.5 rounded-full border border-gray-200 bg-white text-sm w-56 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Community tabs */}
                        <div className="flex gap-2 border-t border-gray-100 pt-4">
                            {TABS.map(t => {
                                const count = matches.filter(m => getCommunity(m.parishat_id) === t.key).length;
                                const active = tab === t.key;
                                return (
                                    <button
                                        key={t.key}
                                        onClick={() => { setTab(t.key); setSearch(''); }}
                                        className={`px-5 py-2 rounded-full text-sm font-bold transition-colors flex items-center gap-2 ${
                                            active ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-blue-50 hover:text-blue-700'
                                        }`}
                                    >
                                        {t.label}
                                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-black ${active ? 'bg-white/20 text-white' : 'bg-white text-gray-500'}`}>
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Grid */}
                    {matchesLoading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="animate-spin text-blue-500 h-8 w-8" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="bg-white rounded-3xl p-16 text-center border border-blue-100">
                            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search size={24} className="text-blue-300" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">No matches found</h3>
                            <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                                {search ? 'No profiles match your search in this community.' : 'No verified profiles in this community yet. Check back soon!'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filtered.map(match => (
                                <div key={match.id} className="bg-white rounded-3xl p-5 shadow-sm border border-blue-100 hover:shadow-md hover:border-blue-300 transition-all group flex flex-col">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-16 h-16 rounded-2xl bg-blue-50 overflow-hidden shrink-0 border border-blue-100 group-hover:border-blue-300 transition-colors">
                                            {match.photo_url ? (
                                                <img src={match.photo_url} alt={match.full_name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-blue-300">
                                                    <User size={24} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-gray-900 text-base truncate">{match.full_name}</h3>
                                            <p className="text-xs font-bold text-blue-500 uppercase tracking-widest mt-0.5">{match.age ? `${match.age} yrs` : 'Age N/A'}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2 mb-6 flex-1">
                                        <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                                            <Star size={12} className="text-blue-400" /> Gotram: <span className="font-bold text-gray-800">{match.gotram || '—'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                                            <Briefcase size={12} className="text-blue-400" /> {match.occupation || 'N/A'}
                                        </div>
                                        {match.current_city && (
                                            <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                                                <MapPin size={12} className="text-blue-400" /> {match.current_city}
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => setViewingProfileId(match.id)}
                                        className="w-full py-2.5 rounded-xl bg-gray-900 text-white text-xs font-bold hover:bg-gray-800 transition-colors"
                                    >
                                        View Full Profile
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {viewingProfileId && (
                    <MatchProfileModal profileId={viewingProfileId} onClose={() => setViewingProfileId(null)} />
                )}
            </div>
        );
    }

    // ── Marketing landing (no access yet) ────────────────────────────────────
    const handleActionClick = () => {
        if (!user) { navigate('/auth', { state: { returnTo: '/matrimony' } }); return; }
        if (user.status !== 'ACTIVE') {
            alert('This feature is strictly available for Active Members only. Please complete your membership process.');
            return;
        }
        if (!profile) { navigate('/matrimony/register'); return; }
        if (profile.payment_status !== 'VERIFIED') {
            toast.error('Your profile is pending admin approval.');
            return;
        }
        // expired subscription — scroll to renewal widget
        setShowRenewBox(true);
    };

    return (
        <div className="flex flex-col min-h-screen bg-blue-50/30">
            {/* Hero */}
            <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 text-white py-16 px-4 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
                <div className="container mx-auto max-w-4xl text-center relative z-10">
                    <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-white/20">
                        <Heart size={32} fill="currentColor" className="text-blue-200" />
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tight leading-tight">
                        6000N Matrimony Services
                    </h1>
                    <p className="text-blue-100 text-lg md:text-xl font-medium max-w-2xl mx-auto opacity-90 leading-relaxed mb-8">
                        A dedicated, secure platform exclusively for Aaruvela Niyogi Brahmana active members to find the perfect match.
                    </p>

                    <button
                        onClick={handleActionClick}
                        disabled={profileLoading}
                        className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-8 py-3.5 rounded-full font-bold text-lg hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2 mx-auto disabled:opacity-60"
                    >
                        {profileLoading ? 'Checking status…'
                            : !user ? 'Login to Access'
                            : !profile ? 'Register a Profile'
                            : profile.payment_status !== 'VERIFIED' ? 'Pending Admin Approval'
                            : 'Renew Subscription'}
                        {!profileLoading && <ArrowRight size={20} />}
                    </button>

                    {/* Subscription banners */}
                    {profile && !profileLoading && (
                        <div className="mt-4 mx-auto max-w-sm">
                            {isExpired() ? (
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
                                            <button onClick={handleRenew} disabled={renewing} className="bg-white text-red-700 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50">
                                                {renewing ? '…' : 'Submit'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : daysLeft() != null && daysLeft() <= 7 ? (
                                <div className="bg-amber-500/20 border border-amber-400/30 rounded-2xl px-5 py-3 text-sm text-amber-100">
                                    <div className="flex items-center gap-2 font-semibold"><AlertTriangle size={14} /> {daysLeft()} day{daysLeft() !== 1 ? 's' : ''} left</div>
                                    <p className="text-xs opacity-80 mt-0.5">Renew early to avoid interruption.</p>
                                </div>
                            ) : null}
                        </div>
                    )}

                    {!user && <p className="text-xs text-blue-300 mt-4 opacity-70">Available exclusively for fully approved Active Members</p>}
                </div>
            </div>

            {/* Features */}
            <div className="container mx-auto max-w-6xl px-4 py-16">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        { icon: <ShieldCheck size={28} />, title: '100% Verified Profiles', desc: 'Every profile is tied to an Active Parishat Member. You can trust the authenticity and intention of every match you view.' },
                        { icon: <FileText size={28} />, title: 'Comprehensive Details', desc: 'View deeply detailed bio-data including Gotram, Nakshatram, Occupation, and family requirements upfront.' },
                        { icon: <Search size={28} />, title: 'Private Browsing', desc: 'Our system intelligently shows relevant gender profiles in a secure environment, protecting your family\'s privacy.' },
                    ].map(f => (
                        <div key={f.title} className="bg-white p-8 rounded-3xl shadow-sm border border-blue-100 text-center flex flex-col items-center">
                            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-5 text-blue-500">{f.icon}</div>
                            <h3 className="text-xl font-black text-gray-900 mb-3">{f.title}</h3>
                            <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* How it works */}
            <div className="bg-white py-16 border-t border-blue-50">
                <div className="container mx-auto max-w-4xl px-4 text-center">
                    <h2 className="text-2xl font-black text-gray-900 mb-10">How It Works</h2>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-2">
                        {[
                            { n: 1, title: 'Login', sub: 'As an Active Member' },
                            { n: 2, title: 'Register', sub: 'Submit bio-data form' },
                            { n: 3, title: 'Pay & Verify', sub: 'Provide payment proof' },
                            { n: 4, title: 'Browse', sub: 'View opposite gender profiles' },
                        ].map((s, i, arr) => (
                            <React.Fragment key={s.n}>
                                <div className="flex-1 text-center px-4">
                                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold">{s.n}</div>
                                    <h4 className="font-bold text-sm text-gray-900">{s.title}</h4>
                                    <p className="text-xs text-gray-500 mt-1">{s.sub}</p>
                                </div>
                                {i < arr.length - 1 && <div className="hidden sm:block flex-1 border-t-2 border-dashed border-gray-200" />}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MatrimonyLanding;
