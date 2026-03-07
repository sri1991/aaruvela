import { useEffect, useState } from 'react';
import api from '../lib/api';
import { User, MapPin, Award, Loader2, Search, Phone } from 'lucide-react';

const roleColors = {
    PERMANENT: { badge: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
    NORMAL:    { badge: 'bg-blue-100 text-blue-700 border-blue-200',   dot: 'bg-blue-500' },
    ASSOCIATED:{ badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
    HEAD:      { badge: 'bg-purple-100 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
};

const MemberTile = ({ member }) => {
    const theme = roleColors[member.role] || roleColors.NORMAL;
    const initials = member.full_name
        ? member.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
        : '?';

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col items-center gap-3 hover:shadow-md transition-shadow">
            <div className="w-16 h-16 rounded-full bg-gray-100 border-2 border-gray-200 overflow-hidden flex items-center justify-center">
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
                    <p className="text-xs text-gray-500 flex items-center gap-1.5">
                        <Phone size={11} className="text-amber-500 shrink-0" />
                        {member.phone}
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

const Members = () => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterRole, setFilterRole] = useState('ALL');

    useEffect(() => {
        api.get('/members/active')
            .then(res => setMembers(res.data))
            .catch(() => setMembers([]))
            .finally(() => setLoading(false));
    }, []);

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
                            <MemberTile key={member.id} member={member} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Members;
