import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import MemberCard from '../components/MemberCard';
import { Button, Input } from '../components/ui';
import { Download, Heart, Users, ShieldCheck, LogOut, ChevronRight, Bell, Camera, UploadCloud, Loader2, X, User, MapPin, Briefcase, Mail, Info, Newspaper, FileText, AlertTriangle, RefreshCw } from 'lucide-react';
import { toJpeg } from 'html-to-image';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import api from '../lib/api';

const MemberDashboard = () => {
    const { user, signOut, refreshUser } = useAuth();
    const navigate = useNavigate();
    const cardRef = useRef(null);
    const [isEditing, setIsEditing] = React.useState(false);
    const [isChangingPin, setIsChangingPin] = React.useState(false);
    const [renewalStatus, setRenewalStatus] = React.useState(null);
    const [showRenewalForm, setShowRenewalForm] = React.useState(false);
    const [renewalRef, setRenewalRef] = React.useState('');
    const [submittingRenewal, setSubmittingRenewal] = React.useState(false);
    const [isSubmittingArticle, setIsSubmittingArticle] = React.useState(false);
    const [articleForm, setArticleForm] = React.useState({ title: '', summary: '', category: 'ARTICLE' });
    const [articlePdfFile, setArticlePdfFile] = React.useState(null);
    const [articleUploading, setArticleUploading] = React.useState(false);
    const [pinForm, setPinForm] = React.useState({ newPin: '', confirmPin: '' });
    const [uploading, setUploading] = React.useState(false);
    const [editForm, setEditForm] = React.useState({
        full_name: '',
        father_guardian_name: '',
        gotram: '',
        dob: '',
        email: '',
        address: '',
        occupation: '',
        zonal_committee: '',
        regional_committee: '',
        photo_url: ''
    });

    React.useEffect(() => {
        const PERPETUAL = ['PERMANENT', 'HEAD'];
        if (user && !PERPETUAL.includes(user.role)) {
            api.get('/members/renewal-status').then(res => setRenewalStatus(res.data)).catch(() => {});
        }
    }, [user]);

    const handleSubmitRenewal = async () => {
        if (!renewalRef.trim()) { toast.error('Enter your UPI transaction reference'); return; }
        setSubmittingRenewal(true);
        try {
            const res = await api.post('/members/request-renewal', { payment_reference: renewalRef });
            toast.success(res.data.message);
            setShowRenewalForm(false);
            setRenewalRef('');
            api.get('/members/renewal-status').then(res => setRenewalStatus(res.data)).catch(() => {});
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to submit renewal');
        } finally {
            setSubmittingRenewal(false);
        }
    };

    React.useEffect(() => {
        if (user) {
            setEditForm({
                full_name: user.full_name || '',
                father_guardian_name: user.father_guardian_name || '',
                gotram: user.gotram || '',
                dob: user.dob || '',
                email: user.email || '',
                address: user.address || '',
                occupation: user.occupation || '',
                zonal_committee: user.zonal_committee || '',
                regional_committee: user.regional_committee || '',
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
            // Convert empty strings to null for optional fields
            ['father_guardian_name', 'gotram', 'dob', 'email', 'address', 'occupation',
             'zonal_committee', 'regional_committee', 'photo_url'].forEach(f => {
                if (submitData[f] === '') submitData[f] = null;
            });

            await api.put('/auth/me', submitData);
            await refreshUser(); // Fetch fresh data
            toast.success('Profile updated successfully!', { id: loadToast });
            setIsEditing(false);
        } catch (error) {
            console.error('Update error:', error);
            toast.error('Failed to update profile', { id: loadToast });
        }
    };

    const handleChangePin = async () => {
        if (!pinForm.newPin || pinForm.newPin.length !== 4 || !/^\d{4}$/.test(pinForm.newPin)) {
            toast.error('PIN must be exactly 4 digits.');
            return;
        }
        if (pinForm.newPin !== pinForm.confirmPin) {
            toast.error('PINs do not match.');
            return;
        }
        const loadToast = toast.loading('Updating PIN...');
        try {
            await api.post('/auth/set-pin', { pin: pinForm.newPin });
            toast.success('PIN updated successfully!', { id: loadToast });
            setIsChangingPin(false);
            setPinForm({ newPin: '', confirmPin: '' });
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to update PIN', { id: loadToast });
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

    const handleArticlePdfSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.type !== 'application/pdf') { toast.error('Only PDF files are allowed'); return; }
        if (file.size > 10 * 1024 * 1024) { toast.error('File too large (max 10 MB)'); return; }
        setArticlePdfFile(file);
    };

    const handleArticleSubmit = async (e) => {
        e.preventDefault();
        if (!articlePdfFile) { toast.error('Please select a PDF'); return; }
        setArticleUploading(true);
        try {
            const path = `submissions/${user.id}/${Date.now()}_${articlePdfFile.name.replace(/\s+/g, '_')}`;
            const { error } = await supabase.storage.from('articles').upload(path, articlePdfFile, { contentType: 'application/pdf' });
            if (error) throw error;
            const { data } = supabase.storage.from('articles').getPublicUrl(path);
            await api.post('/articles/submit', { ...articleForm, pdf_url: data.publicUrl, pdf_path: path });
            toast.success('Article submitted for review!');
            setIsSubmittingArticle(false);
            setArticleForm({ title: '', summary: '', category: 'ARTICLE' });
            setArticlePdfFile(null);
        } catch (err) {
            toast.error(err.response?.data?.detail || err.message || 'Submission failed');
        } finally {
            setArticleUploading(false);
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

            {/* Membership Expiry Banner */}
            {renewalStatus && (() => {
                const exp = renewalStatus.membership_expires_at ? new Date(renewalStatus.membership_expires_at) : null;
                const now = new Date();
                const daysLeft = exp ? Math.ceil((exp - now) / (1000 * 60 * 60 * 24)) : null;
                const expired = daysLeft !== null && daysLeft <= 0;
                const expiringSoon = daysLeft !== null && daysLeft > 0 && daysLeft <= 30;
                if (!expired && !expiringSoon) return null;
                return (
                    <div className={`border-b px-4 py-3 ${expired ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
                        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <AlertTriangle size={16} className={expired ? 'text-red-600 shrink-0' : 'text-amber-600 shrink-0'} />
                                <span className={`text-sm font-bold ${expired ? 'text-red-800' : 'text-amber-800'}`}>
                                    {expired
                                        ? 'Your membership has expired. Renew to continue access.'
                                        : `Membership expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'} — ${exp.toLocaleDateString('en-IN')}`}
                                </span>
                                {renewalStatus.pending_renewal && (
                                    <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Renewal Pending Admin Approval</span>
                                )}
                            </div>
                            {!renewalStatus.pending_renewal && (
                                <button
                                    onClick={() => setShowRenewalForm(true)}
                                    className={`flex items-center gap-1.5 text-xs font-black px-4 py-2 rounded-xl transition-colors shrink-0 ${expired ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-amber-600 text-white hover:bg-amber-700'}`}
                                >
                                    <RefreshCw size={13} /> Renew Now
                                </button>
                            )}
                        </div>
                    </div>
                );
            })()}

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
                            {/* Download ID Card — hidden temporarily */}
                        </section>

                        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-sm font-black text-gray-900">Personal Details</h3>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setIsChangingPin(true)}
                                        className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-700 hover:underline"
                                    >
                                        Change PIN
                                    </button>
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="text-[10px] font-black uppercase tracking-widest text-[var(--color-primary)] hover:underline"
                                    >
                                        Edit Profile
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <DetailRow label="Mobile" value={user.phone} />
                                <DetailRow label="Email" value={user.email} />
                                <DetailRow label="Father / Guardian" value={user.father_guardian_name} />
                                <DetailRow label="Gotram" value={user.gotram} />
                                <DetailRow label="Date of Birth" value={user.dob} />
                                <DetailRow label="Occupation" value={user.occupation} />
                                <DetailRow label="Zone" value={user.zonal_committee} />
                                <DetailRow label="Region" value={user.regional_committee} />
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
                            {/* Matrimony — Active */}
                            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                                <div className="flex items-start gap-5 mb-6">
                                    <div className="p-4 rounded-3xl bg-pink-50 shrink-0 group-hover:scale-110 transition-transform">
                                        <Heart size={24} className="text-pink-500" />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-black text-gray-900 mb-1">Matrimony Hub</h4>
                                        <p className="text-xs text-gray-500 leading-relaxed font-medium">Find your life partner within our trusted community network.</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                                    <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-pink-50 text-pink-600 rounded-full">Active</span>
                                    <button
                                        onClick={() => navigate('/matrimony')}
                                        className="flex items-center gap-1.5 text-xs font-bold text-white bg-gray-900 hover:bg-gray-700 px-4 py-2 rounded-xl transition-colors"
                                    >
                                        Open <ChevronRight size={13} />
                                    </button>
                                </div>
                            </div>
                            {/* Member Directory — Active */}
                            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                                <div className="flex items-start gap-5 mb-6">
                                    <div className="p-4 rounded-3xl bg-blue-50 shrink-0 group-hover:scale-110 transition-transform">
                                        <Users size={24} className="text-blue-500" />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-black text-gray-900 mb-1">Member Directory</h4>
                                        <p className="text-xs text-gray-500 leading-relaxed font-medium">Connect with fellow members across zones and regions.</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                                    <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-blue-50 text-blue-600 rounded-full">Active</span>
                                    <button
                                        onClick={() => navigate('/members')}
                                        className="flex items-center gap-1.5 text-xs font-bold text-white bg-gray-900 hover:bg-gray-700 px-4 py-2 rounded-xl transition-colors"
                                    >
                                        Open <ChevronRight size={13} />
                                    </button>
                                </div>
                            </div>
                            {/* News & Articles — Active */}
                            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden md:col-span-2">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-5">
                                        <div className="p-4 rounded-3xl bg-amber-50 shrink-0 group-hover:scale-110 transition-transform">
                                            <Newspaper size={24} className="text-amber-500" />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-black text-gray-900 mb-1">News & Articles</h4>
                                            <p className="text-xs text-gray-500 leading-relaxed font-medium">Read the latest community news and publications. Submit your own article for review.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                        <button
                                            onClick={() => setIsSubmittingArticle(true)}
                                            className="flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 px-4 py-2 rounded-xl transition-colors border border-amber-200"
                                        >
                                            <FileText size={13} /> Submit Article
                                        </button>
                                        <button
                                            onClick={() => navigate('/news')}
                                            className="flex items-center gap-1.5 text-xs font-bold text-white bg-gray-900 hover:bg-gray-700 px-4 py-2 rounded-xl transition-colors"
                                        >
                                            Read Now <ChevronRight size={13} />
                                        </button>
                                    </div>
                                </div>
                            </div>
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

            {/* Submit Article Modal */}
            {isSubmittingArticle && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex bg-gray-50 border-b border-gray-100 items-center justify-between p-6 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-900 rounded-xl text-white"><Newspaper size={18} /></div>
                                <h2 className="text-xl font-black text-gray-900">Submit Article</h2>
                            </div>
                            <button onClick={() => { setIsSubmittingArticle(false); setArticlePdfFile(null); }} className="text-gray-400 hover:text-gray-900 transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleArticleSubmit} className="p-6 space-y-4 overflow-y-auto">
                            <p className="text-xs text-gray-500">Your submission will be reviewed by the admin before publishing.</p>
                            <Input label="Title" required value={articleForm.title} onChange={e => setArticleForm({ ...articleForm, title: e.target.value })} />
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Summary (optional)</label>
                                <textarea rows={3} value={articleForm.summary} onChange={e => setArticleForm({ ...articleForm, summary: e.target.value })}
                                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-[var(--color-primary)] resize-none"
                                    placeholder="Brief description of your article..." />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Category</label>
                                <select value={articleForm.category} onChange={e => setArticleForm({ ...articleForm, category: e.target.value })}
                                    className="w-full h-12 rounded-2xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-900 focus:outline-none focus:border-[var(--color-primary)] outline-none">
                                    <option value="ARTICLE">Article</option>
                                    <option value="NEWS">News</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">PDF File</label>
                                <label className={`flex items-center gap-3 border-2 border-dashed rounded-2xl px-4 py-4 cursor-pointer transition-colors ${articlePdfFile ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-[var(--color-primary)]'}`}>
                                    <UploadCloud size={20} className={articlePdfFile ? 'text-green-500' : 'text-gray-400'} />
                                    <span className={`text-sm font-medium ${articlePdfFile ? 'text-green-700' : 'text-gray-500'}`}>
                                        {articlePdfFile ? articlePdfFile.name : 'Click to upload PDF (max 10 MB)'}
                                    </span>
                                    <input type="file" accept="application/pdf" className="hidden" onChange={handleArticlePdfSelect} />
                                </label>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <Button type="button" variant="outline" className="flex-1 h-12 rounded-xl border-2 border-gray-200 font-bold text-gray-600" onClick={() => { setIsSubmittingArticle(false); setArticlePdfFile(null); }}>Cancel</Button>
                                <Button type="submit" disabled={articleUploading} className="flex-1 h-12 rounded-xl font-black">
                                    {articleUploading ? <><Loader2 className="animate-spin mr-2" size={16} />Uploading...</> : 'Submit for Review'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Change PIN Modal */}
            {isChangingPin && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex bg-gray-50 border-b border-gray-100 items-center justify-between p-6">
                            <h2 className="text-xl font-black text-gray-900">Change PIN</h2>
                            <button onClick={() => { setIsChangingPin(false); setPinForm({ newPin: '', confirmPin: '' }); }} className="text-gray-400 hover:text-gray-900 transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-xs text-gray-500">Enter a new 4-digit PIN for your account.</p>
                            <Input
                                label="New PIN"
                                type="password"
                                inputMode="numeric"
                                maxLength={4}
                                value={pinForm.newPin}
                                onChange={(e) => setPinForm({ ...pinForm, newPin: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                                placeholder="4-digit PIN"
                            />
                            <Input
                                label="Confirm New PIN"
                                type="password"
                                inputMode="numeric"
                                maxLength={4}
                                value={pinForm.confirmPin}
                                onChange={(e) => setPinForm({ ...pinForm, confirmPin: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                                placeholder="Re-enter PIN"
                            />
                            <div className="pt-2 flex gap-3">
                                <Button onClick={() => { setIsChangingPin(false); setPinForm({ newPin: '', confirmPin: '' }); }} variant="outline" className="flex-1 h-12 rounded-xl border-2 border-gray-200 font-bold text-gray-600">Cancel</Button>
                                <Button onClick={handleChangePin} className="flex-1 h-12 rounded-xl font-black tracking-widest uppercase text-xs">Update PIN</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Profile Modal */}
            {isEditing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex bg-gray-50 border-b border-gray-100 items-center justify-between p-6 shrink-0">
                            <h2 className="text-xl font-black text-gray-900">Edit Profile</h2>
                            <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-gray-900 transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 space-y-5 overflow-y-auto">

                            {/* Photo Upload */}
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-[0.1em] text-gray-600 block mb-3">Profile Photo</label>
                                <div className="flex items-center gap-6">
                                    <div className="w-20 h-20 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 overflow-hidden flex items-center justify-center relative shadow-inner shrink-0">
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
                                        <input type="file" id="edit-photo-upload" accept="image/*" className="hidden" onChange={handleFileUpload} />
                                        <label htmlFor="edit-photo-upload" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 cursor-pointer hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-all shadow-sm active:scale-95">
                                            <UploadCloud size={16} />
                                            {editForm.photo_url ? 'Change Photo' : 'Upload New'}
                                        </label>
                                        <p className="text-[9px] text-gray-400 mt-2 font-medium uppercase tracking-widest">JPG, PNG, max 2MB.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Input label="Full Name" value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} icon={<User className="h-4 w-4" />} placeholder="Your full name" />
                                <Input label="Father / Guardian Name" value={editForm.father_guardian_name} onChange={(e) => setEditForm({ ...editForm, father_guardian_name: e.target.value })} icon={<User className="h-4 w-4" />} placeholder="Father or guardian name" />
                                <Input label="Gotram" value={editForm.gotram} onChange={(e) => setEditForm({ ...editForm, gotram: e.target.value })} icon={<Info className="h-4 w-4" />} placeholder="Gotram" />
                                <Input label="Date of Birth" type="date" value={editForm.dob} onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })} max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]} />
                                <Input label="Email" type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} icon={<Mail className="h-4 w-4" />} placeholder="Email address" />
                                <Input label="Occupation" value={editForm.occupation} onChange={(e) => setEditForm({ ...editForm, occupation: e.target.value })} icon={<Briefcase className="h-4 w-4" />} placeholder="Your profession" />
                                <div className="sm:col-span-2">
                                    <Input label="Address" value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} icon={<MapPin className="h-4 w-4" />} placeholder="Your full address" />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-[0.1em] text-gray-600 ml-1">Zone</label>
                                    <select className="w-full h-12 rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 font-medium focus:outline-none focus:border-[var(--color-primary)] transition-all" value={editForm.zonal_committee} onChange={(e) => setEditForm({ ...editForm, zonal_committee: e.target.value })}>
                                        <option value="">Select Zone</option>
                                        {['Uttar Andhra', 'Rayalaseema', 'Dakshina Kosta Andhra', 'Madhya Kosta'].map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-[0.1em] text-gray-600 ml-1">Region</label>
                                    <select className="w-full h-12 rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 font-medium focus:outline-none focus:border-[var(--color-primary)] transition-all" value={editForm.regional_committee} onChange={(e) => setEditForm({ ...editForm, regional_committee: e.target.value })}>
                                        <option value="">Select Region</option>
                                        {['Andhra', 'Telangana', 'Tamil Nadu', 'Karnataka', 'Rest of India'].map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="pt-2 flex gap-3 sticky bottom-0 bg-white pb-1">
                                <Button onClick={() => setIsEditing(false)} variant="outline" className="flex-1 h-12 rounded-xl border-2 border-gray-200 font-bold text-gray-600 hover:bg-gray-50">Cancel</Button>
                                <Button onClick={handleSaveProfile} className="flex-1 h-12 rounded-xl shadow-lg shadow-primary/20 font-black tracking-widest uppercase text-xs">Save Changes</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Renewal Form Modal */}
            {showRenewalForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 relative">
                        <button onClick={() => setShowRenewalForm(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 p-1 bg-gray-100 rounded-full">
                            <X size={18} />
                        </button>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 rounded-2xl bg-amber-50">
                                <RefreshCw size={20} className="text-amber-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-gray-900">Renew Membership</h3>
                                <p className="text-xs text-gray-500">Annual renewal — valid for 1 year</p>
                            </div>
                        </div>
                        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-5 text-sm text-amber-800 space-y-1">
                            <p className="font-bold">Pay annual renewal fee via UPI:</p>
                            <p className="font-mono text-xs">UPI ID: <span className="font-black">6000niyogi@sbi</span></p>
                            <p className="text-xs text-amber-600">After payment, enter the UTR / transaction reference below.</p>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Transaction UTR / Reference *</label>
                                <input
                                    type="text"
                                    value={renewalRef}
                                    onChange={e => setRenewalRef(e.target.value)}
                                    placeholder="e.g. UPI-12345678"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none text-sm"
                                />
                            </div>
                            <button
                                onClick={handleSubmitRenewal}
                                disabled={submittingRenewal || !renewalRef.trim()}
                                className="w-full py-3 rounded-xl bg-amber-600 text-white font-bold text-sm hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {submittingRenewal ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                                Submit Renewal Request
                            </button>
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
