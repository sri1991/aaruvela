import React from 'react';
import { ShieldCheck, MapPin, Award, User, Download } from 'lucide-react';

const MemberCard = ({ user }) => {
    if (!user) return null;

    const roleColors = {
        'PERMANENT': 'from-amber-600 to-amber-400',
        'NORMAL': 'from-blue-600 to-blue-400',
        'ASSOCIATED': 'from-teal-600 to-teal-400',
        'HEAD': 'from-purple-600 to-purple-400'
    };

    const gradient = roleColors[user.role] || 'from-gray-600 to-gray-400';

    return (
        <div className="relative w-full max-w-sm mx-auto group">
            {/* Background Glow */}
            <div className={`absolute -inset-2 bg-gradient-to-r ${gradient} rounded-[2.5rem] blur-xl opacity-20 group-hover:opacity-40 transition duration-1000`}></div>

            {/* Main Card */}
            <div className="relative bg-white rounded-[2rem] overflow-hidden shadow-2xl border border-gray-100">
                {/* Header Strip */}
                <div className={`h-24 bg-gradient-to-br ${gradient} p-6 relative overflow-hidden`}>
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <ShieldCheck size={120} className="rotate-12" />
                    </div>
                    <div className="relative flex justify-between items-start">
                        <div>
                            <h3 className="text-white font-black text-lg tracking-tight">PARISHAT</h3>
                            <p className="text-white/80 text-[10px] font-bold uppercase tracking-widest">Official Member ID</p>
                        </div>
                        <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/30">
                            <span className="text-white text-[10px] font-black uppercase tracking-widest">{user.role}</span>
                        </div>
                    </div>
                </div>

                {/* Profile Section */}
                <div className="px-8 pb-8 -mt-10">
                    <div className="flex flex-col items-center">
                        <div className="w-24 h-24 rounded-3xl bg-white p-1 shadow-xl border border-gray-100 mb-4">
                            <div className="w-full h-full rounded-2xl bg-gray-50 overflow-hidden flex items-center justify-center text-gray-200">
                                {user.photo_url ? (
                                    <img src={user.photo_url} alt={user.full_name} className="w-full h-full object-cover" />
                                ) : (
                                    <User size={40} />
                                )}
                            </div>
                        </div>

                        <h2 className="text-xl font-black text-gray-900 text-center">{user.full_name}</h2>
                        <div className="mt-1 inline-flex items-center gap-1.5 px-3 py-1 bg-gray-50 rounded-full border border-gray-100">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Member ID</span>
                            <span className={`text-[10px] font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r ${gradient}`}>{user.member_id || 'PENDING'}</span>
                        </div>

                        {/* Details Grid */}
                        <div className="w-full mt-8 grid grid-cols-2 gap-4 border-t border-gray-50 pt-6">
                            <div className="space-y-1">
                                <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block">Zonal Committee</span>
                                <div className="flex items-center gap-1.5 text-gray-700">
                                    <MapPin size={10} className="text-gray-400" />
                                    <span className="text-xs font-bold truncate">{user.zonal_committee || 'N/A'}</span>
                                </div>
                            </div>
                            <div className="space-y-1 text-right">
                                <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block">Regional Office</span>
                                <div className="flex items-center gap-1.5 text-gray-700 justify-end">
                                    <span className="text-xs font-bold truncate">{user.regional_committee || 'N/A'}</span>
                                    <Award size={10} className="text-gray-400" />
                                </div>
                            </div>
                        </div>

                        {/* QR / Barcode Placeholder */}
                        <div className="w-full mt-6 bg-gray-50 h-1 rounded-full overflow-hidden">
                            <div className={`h-full bg-gradient-to-r ${gradient} opacity-20`}></div>
                        </div>
                    </div>
                </div>

                {/* Footer Strip */}
                <div className="bg-gray-50 px-8 py-3 flex justify-between items-center border-t border-gray-100">
                    <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">Verified by Parishat Govt.</span>
                    <ShieldCheck size={14} className="text-gray-300" />
                </div>
            </div>
        </div>
    );
};

export default MemberCard;
