import React, { useRef } from 'react';
import { useAuth } from '../features/auth/AuthContext';
import MemberCard from '../components/MemberCard';
import { Button, Input } from '../components/ui';
import { Download, Heart, Users, ShieldCheck, LogOut, ChevronRight, Settings, Bell, Camera, UploadCloud, Loader2, X } from 'lucide-react';
import { toJpeg } from 'html-to-image';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import api from '../lib/api';

const MemberDashboard = () => {
    const { user, signOut, refreshUser } = useAuth();
    const cardRef = useRef(null);
    const [isEditing, setIsEditing] = React.useState(false);
    const [uploading, setUploading] = React.useState(false);
    const [editForm, setEditForm] = React.useState({
        address: '',
        occupation: '',
        photo_url: ''
    });

    React.useEffect(() => {
        if (user) {
            setEditForm({
                address: user.address || '',
                occupation: user.occupation || '',
                photo_url: user.photo_url || ''
            });
        }
    }, [user, isEditing]);

    const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
            toast.error('Only JPG, PNG or WebP images are allowed');
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            toast.error('File size must be less than 2MB');
            return;
        }

        setUploading(true);
        try {
            const ext = file.type.split('/')[1];
            const filePath = `photo/${crypto.randomUUID()}.${ext}`;

            // Delete old photo from storage if one exists
            if (editForm.photo_url) {
                const oldPath = editForm.photo_url.split('/membership/')[1];
                if (oldPath) {
                    await supabase.storage.from('membership').remove([oldPath]);
                }
            }

            const { error: uploadError } = await supabase.storage
                .from('membership')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('membership')
                .getPublicUrl(filePath);

            setEditForm(prev => ({ ...prev, photo_url: publicUrl }));
            toast.success('Photo uploaded successfully');
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleSaveProfile = async () => {
        const loadToast = toast.loading('Saving profile...');
        try {
            const submitData = { ...editForm };
            // Convert empty strings to null to avoid sending empty updates if not needed
            if (submitData.address === '') submitData.address = null;
            if (submitData.occupation === '') submitData.occupation = null;
            if (submitData.photo_url === '') submitData.photo_url = null;

            await api.put('/auth/me', submitData);
            await refreshUser(); // Fetch fresh data
            toast.success('Profile updated successfully!', { id: loadToast });
            setIsEditing(false);
        } catch (error) {
            console.error('Update error:', error);
            toast.error('Failed to update profile', { id: loadToast });
        }
    };

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
                            <div className="overflow-x-auto -mx-4 px-4 pb-2">
                                <div ref={cardRef} className="w-fit mx-auto">
                                    <MemberCard user={user} />
                                </div>
                            </div>
                            <div className="flex justify-center">
                                <Button
                                    onClick={downloadCard}
                                    className="mt-6 rounded-2xl h-11 px-6 bg-gray-900 hover:bg-black text-white shadow-lg shadow-gray-200 text-xs font-black uppercase tracking-widest"
                                >
                                    <Download size={14} className="mr-2" />
                                    Download ID Card
                                </Button>
                            </div>
                        </section>

                        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-sm font-black text-gray-900">Personal Details</h3>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="text-[10px] font-black uppercase tracking-widest text-[var(--color-primary)] hover:underline"
                                >
                                    Edit Profile
                                </button>
                            </div>
                            <div className="space-y-4">
                                <DetailRow label="Mobile" value={user.phone} />
                                <DetailRow label="Email" value={user.email} />
                                <DetailRow label="Joined" value={new Date(user.created_at).toLocaleDateString()} />
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Features & Services */}
                    <div className="lg:col-span-7 space-y-8">
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

            {/* Edit Profile Modal */}
            {isEditing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex bg-gray-50 border-b border-gray-100 items-center justify-between p-6">
                            <h2 className="text-xl font-black text-gray-900">Edit Profile</h2>
                            <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-gray-900 transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">

                            {/* Photo Upload Section */}
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-[0.1em] text-gray-600 block mb-3">Profile Photo</label>
                                <div className="flex items-center gap-6">
                                    <div className="w-20 h-20 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 overflow-hidden flex items-center justify-center relative shadow-inner">
                                        {editForm.photo_url ? (
                                            <img src={editForm.photo_url} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <Camera className="w-6 h-6 text-gray-300" />
                                        )}
                                        {uploading && (
                                            <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                                <Loader2 className="w-5 h-5 animate-spin text-[var(--color-primary)]" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <input
                                            type="file"
                                            id="edit-photo-upload"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleFileUpload}
                                        />
                                        <label
                                            htmlFor="edit-photo-upload"
                                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 cursor-pointer hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-all shadow-sm active:scale-95"
                                        >
                                            <UploadCloud size={16} />
                                            {editForm.photo_url ? 'Change Photo' : 'Upload New'}
                                        </label>
                                        <p className="text-[9px] text-gray-400 mt-2 font-medium uppercase tracking-widest">JPG, PNG, max 2MB.</p>
                                    </div>
                                </div>
                            </div>

                            <Input
                                label="Address"
                                value={editForm.address}
                                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                                placeholder="Your full address"
                            />

                            <Input
                                label="Occupation"
                                value={editForm.occupation}
                                onChange={(e) => setEditForm({ ...editForm, occupation: e.target.value })}
                                placeholder="Your profession"
                            />

                            <div className="pt-4 flex gap-3">
                                <Button onClick={() => setIsEditing(false)} variant="outline" className="flex-1 h-12 rounded-xl border-2 border-gray-200 font-bold text-gray-600 hover:bg-gray-50">Cancel</Button>
                                <Button onClick={handleSaveProfile} className="flex-1 h-12 rounded-xl shadow-lg shadow-primary/20 font-black tracking-widest uppercase text-xs">Save Changes</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
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
