import React from 'react';
import { ShieldCheck, MapPin, Award, User, QrCode } from 'lucide-react';
import logoLeft from '../assets/logo-left-main.jpg';

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

    // Scale name font size based on length to prevent overflow
    const nameLen = user.full_name?.length || 0;
    const nameFontClass = nameLen > 30 ? 'text-[13px]' : nameLen > 20 ? 'text-[15px]' : 'text-[17px]';

    return (
        <div className="relative w-[480px] mx-auto">
            {/* Main Card Body */}
            <div className="relative w-full bg-white rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-200 flex flex-col">

                {/* Security Background Pattern */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{
                        backgroundImage: `radial-gradient(circle at 2px 2px, black 1px, transparent 0)`,
                        backgroundSize: '12px 12px'
                    }} />

                {/* Card Header */}
                <div className="bg-[#0F172A] px-5 py-3 flex items-center justify-between border-b-2 border-amber-500/50">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-white rounded-lg flex items-center justify-center shadow-inner overflow-hidden border border-gray-200 shrink-0">
                            <img src={logoLeft} alt="Logo" className="w-full h-full object-contain p-0.5" />
                        </div>
                        <div>
                            <h1 className="text-white font-black text-sm tracking-[0.2em] leading-tight">PARISHAT</h1>
                            <p className="text-amber-500 text-[8px] font-black tracking-[0.25em] uppercase">Official Identity Document</p>
                        </div>
                    </div>
                    <div className="text-right shrink-0">
                        <p className="text-white/40 text-[7px] font-black uppercase tracking-widest">Digital Registry</p>
                        <p className="text-white text-[9px] font-bold tracking-wider">{user.role} MEMBER</p>
                    </div>
                </div>

                {/* Card Content Area */}
                <div className="flex p-4 gap-5">

                    {/* Left Side: Photo & ID */}
                    <div className="flex flex-col items-center gap-2 shrink-0">
                        <div className="w-[110px] h-[130px] bg-gray-50 rounded-xl border-2 border-gray-100 shadow-md overflow-hidden flex items-center justify-center">
                            {user.photo_url ? (
                                <img src={user.photo_url} alt={user.full_name} className="w-full h-full object-cover" />
                            ) : (
                                <User className="text-gray-300" size={52} />
                            )}
                        </div>
                        <div className="text-center">
                            <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest block">Member ID</span>
                            <span className="text-[13px] font-black text-[#0F172A] tracking-tight">{user.member_id || 'PENDING'}</span>
                        </div>
                    </div>

                    {/* Right Side: Details */}
                    <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
                        {/* Name */}
                        <div className="border-b border-gray-100 pb-2 mb-2">
                            <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest block mb-0.5">Full Name</span>
                            <h2 className={`${nameFontClass} font-black text-[#0F172A] leading-snug`}>
                                {user.full_name?.toUpperCase()}
                            </h2>
                        </div>

                        {/* Zone & Region */}
                        <div className="grid grid-cols-2 gap-x-3 gap-y-2 mb-2">
                            <div>
                                <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest block">Zone</span>
                                <p className="text-[10px] font-bold text-gray-800 flex items-center gap-1 mt-0.5">
                                    <MapPin size={9} className="text-amber-500 shrink-0" />
                                    <span className="truncate">{user.zonal_committee || 'N/A'}</span>
                                </p>
                            </div>
                            <div>
                                <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest block">Region</span>
                                <p className="text-[10px] font-bold text-gray-800 flex items-center gap-1 mt-0.5">
                                    <Award size={9} className="text-amber-500 shrink-0" />
                                    <span className="truncate">{user.regional_committee || 'N/A'}</span>
                                </p>
                            </div>
                        </div>

                        {/* Status + Signature + QR */}
                        <div className="flex items-end justify-between">
                            <div>
                                <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest block mb-1">Authorized Status</span>
                                <div className="flex items-center gap-1.5">
                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[8px] font-black rounded-full border border-green-200 uppercase">Verified</span>
                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[7px] font-black rounded-full border border-gray-200 uppercase">Active since 2026</span>
                                </div>
                            </div>
                            <div className="flex items-end gap-3">
                                <div className="text-right">
                                    <span className="text-[7px] font-black text-gray-400 uppercase tracking-[0.15em] block">Signature of Authority</span>
                                    <span className="text-[10px] font-serif italic text-[#0F172A] opacity-50 block mt-1">Parishat Head</span>
                                </div>
                                <div className="w-12 h-12 bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-center p-1 opacity-70 shrink-0">
                                    <QrCode size={34} className="text-gray-400" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-5 py-1.5 border-t border-gray-100 flex justify-between items-center">
                    <p className="text-[6px] text-gray-400 font-bold uppercase tracking-[0.08em] truncate pr-4">
                        This card is an official property of the Parishat Registry. If found, please return to any Zonal Office.
                    </p>
                    <div className="flex items-center gap-1 shrink-0">
                        <ShieldCheck size={9} className="text-amber-500" />
                        <span className="text-[7px] font-black text-gray-900 uppercase whitespace-nowrap">Secure Document</span>
                    </div>
                </div>
            </div>

            {/* PVC Chip Effect */}
            <div className="absolute top-[3.8rem] right-5 w-7 h-5 bg-gradient-to-br from-amber-300 to-amber-500 rounded-sm opacity-20 border border-amber-600/30"></div>
        </div>
    );
};

export default MemberCard;
