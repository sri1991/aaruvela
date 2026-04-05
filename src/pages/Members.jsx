import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../features/auth/AuthContext';
import { User, MapPin, Award, Loader2, Search, Phone, X, Briefcase, Calendar, Star, LogIn, Lock } from 'lucide-react';
import { toast } from 'react-hot-toast';

const roleColors = {
    PERMANENT: { badge: 'bg-amber-100 text-amber-700 border-amber-200' },
    NORMAL:    { badge: 'bg-blue-100 text-blue-700 border-blue-200' },
    ASSOCIATED:{ badge: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    HEAD:      { badge: 'bg-purple-100 text-purple-700 border-purple-200' },
};

const redactPhone = (phone) => {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, '');
    return '••••••' + digits.slice(-4);
};

const MemberTile = ({ member, onClick, isActiveMember }) => {
    const theme = roleColors[member.role] || roleColors.NORMAL;
    const initials = member.full_name
        ? member.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
        : '?';

    return (
        <div
            onClick={() => onClick(member)}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col items-center gap-3 hover:shadow-md hover:border-amber-200 transition-all cursor-pointer group"
        >
            <div className="w-16 h-16 rounded-full bg-gray-100 border-2 border-gray-200 group-hover:border-amber-300 overflow-hidden flex items-center justify-center transition-colors">
                {member.photo_url ? (
                    <img src={member.photo_url} alt={member.full_name} className="w-full h-full object-cover" />
                ) : (
                    <span className="text-xl font-black text-gray-400">{initials}</span>
                )}
            </div>

            <div className="text-center">
                <p className="font-bold text-gray-900 text-sm leading-tight">{member.full_name || 'N/A'}</p>
                <p className="text-xs text-gray-400 font-mono mt-0.5">{member.member_id || '—'}</p>
            </div>

            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${theme.badge}`}>
                {member.role}
            </span>

            <div className="w-full space-y-1 pt-2 border-t border-gray-50">
                {member.phone && (
                    <p className="text-xs flex items-center gap-1.5">
                        <Phone size={11} className="text-amber-500 shrink-0" />
                        {isActiveMember ? (
                            <span className="text-gray-500">{member.phone}</span>
                        ) : (
                            <span className="text-gray-300 tracking-widest font-mono">{redactPhone(member.phone)}</span>
                        )}
                    </p>
                )}
                {member.zonal_committee && (
                    <p className="text-xs text-gray-500 flex items-center gap-1.5">
                        <MapPin size={11} className="text-amber-500 shrink-0" />
                        {member.zonal_committee}
                    </p>
                )}
                {member.regional_committee && (
                    <p className="text-xs text-gray-500 flex items-center gap-1.5">
                        <Award size={11} className="text-amber-500 shrink-0" />
                        {member.regional_committee}
                    </p>
                )}
            </div>
        </div>
    );
};

const LoginPromptModal = ({ onClose }) => {
    const navigate = useNavigate();
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8 text-center relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    <X size={20} />
                </button>
                <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <LogIn size={28} className="text-amber-500" />
                </div>
                <h2 className="text-xl font-black text-gray-900 mb-2">Members Only</h2>
                <p className="text-gray-500 text-sm mb-6">
                    View detailed member profiles by logging in as an active member.
                </p>
                <button
                    onClick={() => navigate('/auth')}
                    className="w-full bg-[var(--color-primary)] text-white py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
                >
                    Login / Sign Up
                </button>
            </div>
        </div>
    );
};

const MemberProfileModal = ({ memberId, onClose }) => {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [resetting, setResetting] = useState(false);

    const handleResetPin = async () => {
        if (!window.confirm("Are you sure you want to reset this user's PIN to default?")) return;
        setResetting(true);
        try {
            const res = await api.post('/admin/reset-pin', { user_id: memberId });
            toast.success(res.data.message);
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to reset PIN');
        } finally {
            setResetting(false);
        }
    };

    useEffect(() => {
        api.get(`/members/profile/${memberId}`)
            .then(res => setProfile(res.data))
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, [memberId]);

    const theme = profile ? (roleColors[profile.role] || roleColors.NORMAL) : roleColors.NORMAL;
    const initials = profile?.full_name
        ? profile.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
        : '?';

    const formatDate = (iso) => {
        if (!iso) return null;
        return new Date(iso).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                {/* Top bar */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h3 className="font-black text-gray-800 text-sm uppercase tracking-wider">Member Profile</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-16">
                        <Loader2 className="animate-spin text-[var(--color-primary)] h-7 w-7" />
                    </div>
                ) : error ? (
                    <p className="text-center text-gray-400 py-16 text-sm">Could not load profile.</p>
                ) : profile ? (
                    <div className="p-6">
                        {/* Profile header */}
                        <div className="flex items-center gap-5 mb-6">
                            <div className="w-20 h-20 rounded-2xl bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center shrink-0">
                                {profile.photo_url ? (
                                    <img src={profile.photo_url} alt={profile.full_name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-2xl font-black text-gray-400">{initials}</span>
                                )}
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-lg font-black text-gray-900 leading-tight">{profile.full_name}</h2>
                                <p className="text-xs font-mono text-gray-400 mt-0.5">{profile.member_id}</p>
                                <span className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${theme.badge}`}>
                                    {profile.role}
                                </span>
                            </div>
                        </div>

                        {/* Details */}
                        <div className="space-y-3 bg-gray-50 rounded-xl p-4">
                            {profile.phone && (
                                <div className="flex items-center gap-3 text-sm">
                                    <Phone size={14} className="text-amber-500 shrink-0" />
                                    <span className="text-gray-700">{profile.phone}</span>
                                </div>
                            )}
                            {(profile.zonal_committee || profile.regional_committee) && (
                                <div className="flex items-center gap-3 text-sm">
                                    <MapPin size={14} className="text-amber-500 shrink-0" />
                                    <span className="text-gray-700">
                                        {[profile.zonal_committee, profile.regional_committee].filter(Boolean).join(' · ')}
                                    </span>
                                </div>
                            )}
                            {profile.gotram && (
                                <div className="flex items-center gap-3 text-sm">
                                    <Star size={14} className="text-amber-500 shrink-0" />
                                    <span className="text-gray-700">Gotram: {profile.gotram}</span>
                                </div>
                            )}
                            {profile.occupation && (
                                <div className="flex items-center gap-3 text-sm">
                                    <Briefcase size={14} className="text-amber-500 shrink-0" />
                                    <span className="text-gray-700">{profile.occupation}</span>
                                </div>
                            )}
                            {profile.joined_at && (
                                <div className="flex items-center gap-3 text-sm">
                                    <Calendar size={14} className="text-amber-500 shrink-0" />
                                    <span className="text-gray-700">Member since {formatDate(profile.joined_at)}</span>
                                </div>
                            )}
                        </div>

                        {/* Admin Actions */}
                        {user?.role === 'HEAD' && (
                            <div className="mt-6 pt-5 border-t border-gray-100 flex justify-end">
                                <button
                                    onClick={handleResetPin}
                                    disabled={resetting}
                                    className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                                >
                                    {resetting ? <Loader2 size={12} className="animate-spin" /> : <Lock size={12} />}
                                    Reset PIN to Default
                                </button>
                            </div>
                        )}
                    </div>
                ) : null}
            </div>
        </div>
    );
};

const Members = () => {
    const { user } = useAuth();
    const isActiveMember = user?.status === 'ACTIVE';
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterRole, setFilterRole] = useState('ALL');
    const [selectedMemberId, setSelectedMemberId] = useState(null);
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);

    useEffect(() => {
        api.get('/members/active')
            .then(res => setMembers(res.data))
            .catch(() => setMembers([]))
            .finally(() => setLoading(false));
    }, []);

    const handleMemberClick = (member) => {
        if (isActiveMember) {
            setSelectedMemberId(member.id);
        } else {
            setShowLoginPrompt(true);
        }
    };

    const roles = ['ALL', 'PERMANENT', 'NORMAL'];

    const filtered = members.filter(m => {
        if (m.role === 'ASSOCIATED') return false;
        const matchesSearch =
            !search ||
            m.full_name?.toLowerCase().includes(search.toLowerCase()) ||
            m.member_id?.toLowerCase().includes(search.toLowerCase());
        const matchesRole = filterRole === 'ALL' || m.role === filterRole;
        return matchesSearch && matchesRole;
    });

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="container mx-auto max-w-5xl">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-black text-gray-900">Active Members</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        {loading ? '...' : `${members.filter(m => m.role !== 'ASSOCIATED').length} active member${members.filter(m => m.role !== 'ASSOCIATED').length !== 1 ? 's' : ''}`}
                    </p>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <div className="relative flex-1">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name or member ID..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-[var(--color-primary)]"
                        />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {roles.map(role => (
                            <button
                                key={role}
                                onClick={() => setFilterRole(role)}
                                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
                                    filterRole === role
                                        ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                {role}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Non-member notice */}
                {!isActiveMember && (
                    <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 text-sm text-amber-700">
                        <Lock size={14} className="shrink-0" />
                        <span>Login as an active member to view full contact details and member profiles.</span>
                    </div>
                )}

                {/* Grid */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="animate-spin text-[var(--color-primary)] h-8 w-8" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20 text-gray-400">
                        <User size={40} className="mx-auto mb-3 opacity-30" />
                        <p className="font-medium">No members found</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {filtered.map(member => (
                            <MemberTile
                                key={member.id}
                                member={member}
                                onClick={handleMemberClick}
                                isActiveMember={isActiveMember}
                            />
                        ))}
                    </div>
                )}
            </div>

            {selectedMemberId && (
                <MemberProfileModal
                    memberId={selectedMemberId}
                    onClose={() => setSelectedMemberId(null)}
                />
            )}

            {showLoginPrompt && (
                <LoginPromptModal onClose={() => setShowLoginPrompt(false)} />
            )}
        </div>
    );
};

export default Members;
