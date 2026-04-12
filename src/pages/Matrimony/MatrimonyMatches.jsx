import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { useAuth } from '../../features/auth/AuthContext';
import { Heart, Search, Loader2, MapPin, Briefcase, Star, User, Info, X, Mail, Phone, Calendar } from 'lucide-react';

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

    const formatTime = (isoTime) => {
        if (!isoTime) return '—';
        return isoTime.slice(0, 5); // 14:30
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl relative mt-10 mb-10">
                {/* Header */}
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
                        {/* Profile header */}
                        <div className="flex flex-col md:flex-row items-center gap-6 mb-8 text-center md:text-left">
                            <div className="flex gap-2 shrink-0">
                                {(profile.photos?.length > 0 ? profile.photos : profile.photo_url ? [profile.photo_url] : []).map((url, i) => (
                                    <div key={i} className={`rounded-2xl bg-blue-50 border-2 border-blue-100 overflow-hidden flex items-center justify-center shadow-inner ${i === 0 ? 'w-28 h-28' : 'w-16 h-16'}`}>
                                        <img src={url} alt={`${profile.full_name} ${i + 1}`} className="w-full h-full object-cover" />
                                    </div>
                                ))}
                                {(profile.photos?.length === 0 && !profile.photo_url) && (
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
                                        PID: {profile.parishat_id}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Astrology Section */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b pb-2">Astrological Details</h4>
                                <div className="space-y-3 bg-gray-50 rounded-xl p-4 border border-gray-100">
                                    <div className="flex items-center gap-3 text-sm">
                                        <Calendar size={16} className="text-blue-500 shrink-0" />
                                        <span className="text-gray-700 font-medium">DOB: {profile.dob} <span className="text-gray-400 font-normal">({formatTime(profile.tob)})</span></span>
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
                                    {profile.raasi && (
                                        <div className="flex items-center gap-3 text-sm">
                                            <Star size={16} className="text-blue-500 shrink-0" />
                                            <span className="text-gray-700 font-medium">Raasi: <span className="font-bold">{profile.raasi}</span></span>
                                        </div>
                                    )}
                                    {profile.dosha && (
                                        <div className="flex items-center gap-3 text-sm">
                                            <Info size={16} className="text-blue-500 shrink-0" />
                                            <span className="text-gray-700 font-medium">Dosha: {profile.dosha}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Family & Profession */}
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
                                    {(profile.brothers !== null && profile.brothers !== undefined) || (profile.sisters !== null && profile.sisters !== undefined) ? (
                                        <div className="flex items-center gap-3 text-sm">
                                            <User size={16} className="text-blue-500 shrink-0" />
                                            <span className="text-gray-700">
                                                {profile.brothers !== null && profile.brothers !== undefined ? `${profile.brothers}B` : ''}
                                                {(profile.brothers !== null && profile.brothers !== undefined) && (profile.sisters !== null && profile.sisters !== undefined) ? ' / ' : ''}
                                                {profile.sisters !== null && profile.sisters !== undefined ? `${profile.sisters}S` : ''}
                                                <span className="text-gray-400 text-xs ml-1">siblings</span>
                                            </span>
                                        </div>
                                    ) : null}
                                    {profile.willing_to_relocate !== null && profile.willing_to_relocate !== undefined && (
                                        <div className="flex items-center gap-3 text-sm">
                                            <MapPin size={16} className="text-blue-500 shrink-0" />
                                            <span className="text-gray-700">Relocate: <span className="font-bold">{profile.willing_to_relocate ? 'Yes' : 'No'}</span></span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Text Fields */}
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

                        {/* Contact Info Footer */}
                        <div className="mt-8 pt-6 border-t border-gray-100 flex flex-wrap gap-4 items-center justify-between">
                            <div className="flex gap-4">
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

                    </div>
                ) : null}
            </div>
        </div>
    );
};


// NID-/PID- prefixed member IDs → 6000N community; AID- → Brahmin community
const getCommunity = (parishat_id) => {
    if (!parishat_id) return '6000N';
    const bare = parishat_id.replace(/^TST-/, '');
    return bare.startsWith('AID-') ? 'BRAHMIN' : '6000N';
};

const TABS = [
    { key: '6000N',   label: '6000N Community' },
    { key: 'BRAHMIN', label: 'Brahmin Community' },
];

const MatrimonyMatches = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [tab, setTab] = useState('6000N');
    const [viewingProfileId, setViewingProfileId] = useState(null);

    useEffect(() => {
        api.get('/matrimony/matches')
            .then(res => setMatches(res.data))
            .catch(err => {
                if (err.response?.status === 403) {
                    navigate('/matrimony');
                }
            })
            .finally(() => setLoading(false));
    }, [navigate]);

    const tabMatches = matches.filter(m => getCommunity(m.parishat_id) === tab);

    const filtered = tabMatches.filter(m => {
        const query = search.toLowerCase();
        return (m.full_name?.toLowerCase().includes(query) || m.gotram?.toLowerCase().includes(query));
    });

    return (
        <div className="min-h-screen bg-blue-50/30 py-8 px-4">
            <div className="container mx-auto max-w-5xl">
                {/* Header */}
                <div className="flex flex-col gap-4 mb-6 bg-white p-6 rounded-3xl shadow-sm border border-blue-100">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-black text-blue-900 flex items-center gap-2">
                                <Heart size={24} className="text-blue-500" /> Matrimony Matches
                            </h1>
                            <p className="text-blue-500 text-sm mt-1 font-medium">
                                {loading ? 'Finding matches...' : `${filtered.length} profile${filtered.length !== 1 ? 's' : ''} in this community`}
                            </p>
                        </div>

                        <div className="relative w-full md:w-64">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search name or gotram..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 rounded-full border border-gray-200 bg-white text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                            />
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
                                        active
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : 'bg-gray-100 text-gray-500 hover:bg-blue-50 hover:text-blue-700'
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
                {loading ? (
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
                                            <div className="w-full h-full flex items-center justify-center text-blue-300 bg-blue-50">
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
                                    className="w-full py-2.5 rounded-xl bg-gray-900 text-white text-xs font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                                >
                                    View Full Profile
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {viewingProfileId && (
                <MatchProfileModal
                    profileId={viewingProfileId}
                    onClose={() => setViewingProfileId(null)}
                />
            )}
        </div>
    );
};

export default MatrimonyMatches;
