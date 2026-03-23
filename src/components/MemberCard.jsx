import { ShieldCheck, Award, User, QrCode } from 'lucide-react';
import digitsign from '../assets/digitsign.jpeg';
import headerBanner from '../assets/header-banner-main.png';

const MemberCard = ({ user }) => {
    if (!user) return null;

    const nameLen = user.full_name?.length || 0;
    const nameFontClass = nameLen > 30 ? 'text-[13px]' : nameLen > 20 ? 'text-[15px]' : 'text-[18px]';

    const brandGreen = '#1a5c4a';

    return (
        <div className="relative w-[480px] mx-auto">
            {/* Main Card Body */}
            <div
                className="relative w-full rounded-2xl overflow-hidden flex flex-col"
                style={{
                    backgroundColor: '#f5f0e8',
                    boxShadow: '0 24px_60px rgba(0,0,0,0.18)',
                    border: `1.5px solid ${brandGreen}40`,
                }}
            >
                {/* Watermark */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
                    <img src={digitsign} alt="" className="w-72 object-contain select-none" style={{ opacity: 0.07, mixBlendMode: 'multiply' }} />
                </div>

                {/* Banner */}
                <div className="w-full overflow-hidden">
                    <img src={headerBanner} alt="Parishat Banner" className="w-full object-cover" />
                </div>

                {/* Thin gold accent line */}
                <div className="w-full h-[3px]" style={{ background: 'linear-gradient(90deg, #1a5c4a, #c9a227, #1a5c4a)' }} />

                {/* Card Content */}
                <div className="flex p-5 gap-5 relative z-10">

                    {/* Left: Photo + Member ID */}
                    <div className="flex flex-col items-center gap-2 shrink-0">
                        {/* Photo with green+gold border */}
                        <div
                            className="w-[108px] h-[128px] rounded-xl overflow-hidden flex items-center justify-center bg-gray-100"
                            style={{ border: `2.5px solid ${brandGreen}`, boxShadow: '0 0 0 1.5px #c9a22760, 0 4px 12px rgba(0,0,0,0.12)' }}
                        >
                            {user.photo_url ? (
                                <img src={user.photo_url} alt={user.full_name} className="w-full h-full object-cover" />
                            ) : (
                                <User className="text-gray-300" size={52} />
                            )}
                        </div>

                        {/* Member ID badge */}
                        <div
                            className="text-center px-3 py-1 rounded-lg w-full"
                            style={{ backgroundColor: brandGreen }}
                        >
                            <span className="text-[6px] font-black text-white/60 uppercase tracking-widest block">Member ID</span>
                            <span className="text-[13px] font-black text-white tracking-tight">{user.member_id || 'PENDING'}</span>
                        </div>
                    </div>

                    {/* Right: Details */}
                    <div className="flex-1 flex flex-col justify-between min-w-0">

                        {/* Name */}
                        <div className="pb-2 mb-2" style={{ borderBottom: `1px solid ${brandGreen}25` }}>
                            <span className="text-[7px] font-black uppercase tracking-widest block mb-0.5" style={{ color: brandGreen }}>Full Name</span>
                            <h2 className={`${nameFontClass} font-black leading-snug text-[#1a1a1a]`}>
                                {user.full_name?.toUpperCase()}
                            </h2>
                        </div>

                        {/* Region & DOB */}
                        <div className="grid grid-cols-2 gap-x-3 gap-y-2 mb-3">
                            <div>
                                <span className="text-[7px] font-black uppercase tracking-widest block mb-0.5" style={{ color: brandGreen }}>Region</span>
                                <p className="text-[10px] font-bold text-gray-800 flex items-center gap-1">
                                    <Award size={9} style={{ color: '#c9a227' }} className="shrink-0" />
                                    <span className="truncate">{user.regional_committee || 'N/A'}</span>
                                </p>
                            </div>
                            <div>
                                <span className="text-[7px] font-black uppercase tracking-widest block mb-0.5" style={{ color: brandGreen }}>Date of Birth</span>
                                <p className="text-[10px] font-bold text-gray-800">
                                    {user.dob
                                        ? new Date(user.dob).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                                        : 'N/A'}
                                </p>
                            </div>
                        </div>

                        {/* Bottom row: Status + Signature + QR */}
                        <div className="flex items-end justify-between gap-2">
                            {/* Status pills */}
                            <div>
                                <span className="text-[7px] font-black uppercase tracking-widest block mb-1" style={{ color: brandGreen }}>Status</span>
                                <div className="flex items-center gap-1">
                                    <span className="px-2 py-0.5 text-[7px] font-black rounded-full uppercase" style={{ backgroundColor: `${brandGreen}15`, color: brandGreen, border: `1px solid ${brandGreen}40` }}>
                                        ✓ Verified
                                    </span>
                                    <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[7px] font-black rounded-full border border-amber-200 uppercase">
                                        Active
                                    </span>
                                </div>
                            </div>

                            {/* Signature */}
                            <div className="text-center">
                                <img
                                    src={digitsign}
                                    alt="Signature"
                                    className="h-9 w-auto mx-auto object-contain"
                                    style={{ mixBlendMode: 'darken' }}
                                />
                                <span className="text-[6px] font-black uppercase tracking-widest block mt-0.5" style={{ color: brandGreen }}>President</span>
                            </div>

                            {/* QR */}
                            <div
                                className="w-12 h-12 rounded-lg flex items-center justify-center p-1 shrink-0"
                                style={{ backgroundColor: 'white', border: `1px solid ${brandGreen}30` }}
                            >
                                <QrCode size={34} style={{ color: brandGreen }} className="opacity-60" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div
                    className="px-5 py-1.5 flex justify-between items-center"
                    style={{ backgroundColor: brandGreen }}
                >
                    <p className="text-[6px] text-white/50 font-bold uppercase tracking-[0.08em] truncate pr-4">
                        Official property of Parishat Registry · Return to any Zonal Office if found
                    </p>
                    <div className="flex items-center gap-1 shrink-0">
                        <ShieldCheck size={9} className="text-amber-300" />
                        <span className="text-[7px] font-black text-white uppercase whitespace-nowrap">Secure</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MemberCard;
