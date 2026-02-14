import React, { useRef } from 'react';
import { useAuth } from '../features/auth/AuthContext';
import MemberCard from '../components/MemberCard';
import { Button } from '../components/ui';
import { Download, Heart, Users, ShieldCheck, LogOut, ChevronRight, Settings, Bell } from 'lucide-react';
import { toJpeg } from 'html-to-image';
import { toast } from 'react-hot-toast';

const MemberDashboard = () => {
    const { user, signOut } = useAuth();
    const cardRef = useRef(null);

    const downloadCard = async () => {
        if (!cardRef.current) return;

        const loadToast = toast.loading('Generating your official ID card...');
        try {
            const dataUrl = await toJpeg(cardRef.current, { quality: 0.95, pixelRatio: 2 });
            const link = document.createElement('a');
            link.download = `Parishat-ID-${user.member_id || 'Member'}.jpg`;
            link.href = dataUrl;
            link.click();
            toast.success('ID Card downloaded successfully!', { id: loadToast });
        } catch (err) {
            console.error('Download error:', err);
            toast.error('Failed to generate ID card image', { id: loadToast });
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20">
            {/* Upper Header */}
            <div className="bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)] flex items-center justify-center text-white shadow-lg shadow-primary/20">
                            <ShieldCheck size={20} />
                        </div>
                        <div>
                            <h1 className="text-sm font-black text-gray-900 leading-none">PARISHAT</h1>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Member Hub</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="p-2 text-gray-400 hover:text-gray-900 transition-colors relative">
                            <Bell size={20} />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>
                        <button onClick={signOut} className="flex items-center gap-2 text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-2 rounded-xl transition-all">
                            <LogOut size={16} />
                            <span className="hidden sm:inline">Sign Out</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                    {/* Left Column: ID Card & Profile */}
                    <div className="lg:col-span-5 space-y-8">
                        <section>
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--color-primary)] mb-6 ml-1">Your Identity</h3>
                            <div ref={cardRef}>
                                <MemberCard user={user} />
                            </div>
                            <Button
                                onClick={downloadCard}
                                className="w-full mt-6 rounded-[1.5rem] h-14 bg-gray-900 hover:bg-black text-white shadow-xl shadow-gray-200"
                            >
                                <Download size={18} className="mr-2" />
                                Download Digital ID Card
                            </Button>
                        </section>

                        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-sm font-black text-gray-900">Personal Details</h3>
                                <button className="text-[10px] font-black uppercase tracking-widest text-[var(--color-primary)]">Edit Profile</button>
                            </div>
                            <div className="space-y-4">
                                <DetailRow label="Mobile" value={user.cell_no} />
                                <DetailRow label="Email" value={user.email} />
                                <DetailRow label="Office" value={user.regional_committee} />
                                <DetailRow label="Joined" value={new Date(user.created_at).toLocaleDateString()} />
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Features & Services */}
                    <div className="lg:col-span-12 xl:col-span-7 space-y-8">
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Services & Hubs</h2>
                            <p className="text-sm text-gray-500 font-medium mt-1">Exclusive access for active members.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FeatureCard
                                icon={<Heart className="text-pink-500" />}
                                title="Matrimony Hub"
                                description="Find your life partner within our trusted community network."
                                status="Coming Soon"
                                color="pink"
                            />
                            <FeatureCard
                                icon={<Users className="text-blue-500" />}
                                title="Member Directory"
                                description="Connect with fellow members across zones and regions."
                                status="Coming Soon"
                                color="blue"
                            />
                        </div>

                        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-amber-200">
                            <div className="absolute top-0 right-0 p-12 opacity-10">
                                <ShieldCheck size={160} />
                            </div>
                            <div className="relative z-10 max-w-sm">
                                <h3 className="text-xl font-bold mb-2 text-white">Need Support?</h3>
                                <p className="text-white/80 text-sm mb-6 leading-relaxed">Our support team is available to help with your membership or any services.</p>
                                <button className="bg-white text-amber-600 px-6 py-3 rounded-2xl text-sm font-black hover:bg-amber-50 transition-colors shadow-lg shadow-black/10">
                                    Contact Support
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const DetailRow = ({ label, value }) => (
    <div className="flex justify-between items-center py-1 border-b border-gray-50 last:border-0 pb-3 last:pb-0">
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</span>
        <span className="text-sm font-bold text-gray-900">{value || 'N/A'}</span>
    </div>
);

const FeatureCard = ({ icon, title, description, status, color }) => (
    <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
        <div className={`p-4 rounded-3xl bg-${color}-50 w-fit mb-6 group-hover:scale-110 transition-transform`}>
            {React.cloneElement(icon, { size: 24 })}
        </div>
        <h4 className="text-lg font-black text-gray-900 mb-2">{title}</h4>
        <p className="text-xs text-gray-500 leading-relaxed font-medium mb-6">{description}</p>
        <div className="flex items-center justify-between pt-6 border-t border-gray-50">
            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-${color}-50 text-${color}-600 rounded-full`}>
                {status}
            </span>
            <ChevronRight className="text-gray-300 group-hover:text-gray-600 transition-colors" size={16} />
        </div>
    </div>
);

export default MemberDashboard;
