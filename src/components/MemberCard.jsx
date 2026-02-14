import React from 'react';
import { ShieldCheck, MapPin, Award, User, QrCode } from 'lucide-react';

const MemberCard = ({ user }) => {
    if (!user) return null;

    const roleThemes = {
        'PERMANENT': {
            gradient: 'from-[#0F172A] to-[#1E293B]',
            accent: 'bg-amber-500',
            text: 'text-amber-500',
            border: 'border-amber-500/30'
        },
        'NORMAL': {
            gradient: 'from-[#0F172A] to-[#1E293B]',
            accent: 'bg-blue-500',
            text: 'text-blue-500',
            border: 'border-blue-500/30'
        },
        'ASSOCIATED': {
            gradient: 'from-[#0F172A] to-[#1E293B]',
            accent: 'bg-emerald-500',
            text: 'text-emerald-500',
            border: 'border-emerald-500/30'
        },
        'HEAD': {
            gradient: 'from-[#1e1b4b] to-[#312e81]',
            accent: 'bg-purple-500',
            text: 'text-purple-500',
            border: 'border-purple-500/30'
        }
    };

    const theme = roleThemes[user.role] || roleThemes['NORMAL'];

    return (
        <div className="relative w-[450px] h-[280px] mx-auto group perspective-1000">
            {/* Main Card Body */}
            <div className="relative w-full h-full bg-white rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-200 flex flex-col">

                {/* Security Background Pattern (Guilloche effect) */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{
                        backgroundImage: `radial-gradient(circle at 2px 2px, black 1px, transparent 0)`,
                        backgroundSize: '12px 12px'
                    }}>
                </div>

                {/* Card Header - Official Style */}
                <div className="bg-[#0F172A] px-6 py-3 flex items-center justify-between border-b-2 border-amber-500/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-1 shadow-inner">
                            <ShieldCheck className="text-[#0F172A]" size={28} />
                        </div>
                        <div>
                            <h1 className="text-white font-black text-sm tracking-[0.2em] leading-tight">PARISHAT</h1>
                            <p className="text-amber-500 text-[8px] font-black tracking-[0.3em] uppercase">Official Identity Document</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-white/40 text-[7px] font-black uppercase tracking-widest">Digital Registry</p>
                        <p className="text-white text-[9px] font-bold tracking-wider">{user.role} MEMBER</p>
                    </div>
                </div>

                {/* Card Content Area */}
                <div className="flex flex-1 p-5 gap-6 relative">

                    {/* Left Side: Photo & ID */}
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-32 h-36 bg-gray-50 rounded-xl border-2 border-gray-100 p-1 shadow-md overflow-hidden flex items-center justify-center">
                            {user.photo_url ? (
                                <img src={user.photo_url} alt={user.full_name} className="w-full h-full object-cover rounded-lg" />
                            ) : (
                                <User className="text-gray-300" size={60} />
                            )}
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest">Member ID</span>
                            <span className="text-sm font-black text-[#0F172A] tracking-tighter">{user.member_id || 'PENDING'}</span>
                        </div>
                    </div>

                    {/* Right Side: Details */}
                    <div className="flex-1 space-y-4 py-1">
                        <div>
                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-0.5">Full Name</span>
                            <h2 className="text-xl font-black text-[#0F172A] leading-tight border-b border-gray-100 pb-1">{user.full_name?.toUpperCase()}</h2>
                        </div>

                        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                            <div>
                                <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest block">Zone</span>
                                <p className="text-[11px] font-bold text-gray-800 flex items-center gap-1">
                                    <MapPin size={10} className="text-amber-500" />
                                    {user.zonal_committee || 'N/A'}
                                </p>
                            </div>
                            <div>
                                <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest block">Region</span>
                                <p className="text-[11px] font-bold text-gray-800 flex items-center gap-1">
                                    <Award size={10} className="text-amber-500" />
                                    {user.regional_committee || 'N/A'}
                                </p>
                            </div>
                            <div className="col-span-2">
                                <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest block">Authorized Status</span>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[8px] font-black rounded-full border border-green-200 uppercase">Verified</span>
                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-[8px] font-black rounded-full border border-gray-200 uppercase tracking-tighter">Active since 2026</span>
                                </div>
                            </div>
                        </div>

                        {/* Aadhaar-style bottom strip for DOB or Phone */}
                        <div className="absolute bottom-4 right-5 flex items-center gap-4">
                            <div className="text-right">
                                <span className="text-[7px] font-black text-gray-400 uppercase tracking-[0.2em] block">Signature of Authority</span>
                                <div className="mt-1 h-6 flex items-end justify-end">
                                    <span className="text-[10px] font-serif italic text-[#0F172A] leading-none opacity-60">Parishat Head</span>
                                </div>
                            </div>
                            <div className="w-14 h-14 bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-center p-1.5 opacity-80">
                                <QrCode size={40} className="text-gray-400" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Micro-text (Official Disclaimer) */}
                <div className="bg-gray-50 px-6 py-2 border-t border-gray-100 flex justify-between items-center overflow-hidden">
                    <p className="text-[6px] text-gray-400 font-bold uppercase tracking-[0.1em] whitespace-nowrap">
                        This card is an official property of the Parishat Registry. If found, please return to any Zonal Office.
                    </p>
                    <div className="flex items-center gap-1 pl-4 bg-gray-50">
                        <ShieldCheck size={10} className="text-amber-500" />
                        <span className="text-[7px] font-black text-gray-900 uppercase">Secure Document</span>
                    </div>
                </div>
            </div>

            {/* Print Decoration (PVC Chip Effect) */}
            <div className="absolute top-[4.5rem] right-6 w-8 h-6 bg-gradient-to-br from-amber-300 to-amber-500 rounded-md opacity-20 border border-amber-600/30"></div>
        </div>
    );
};

export default MemberCard;
