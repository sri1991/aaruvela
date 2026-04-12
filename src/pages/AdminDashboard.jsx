import { useEffect, useState } from 'react';
import api from '../lib/api';
import { Button, Input } from '../components/ui';
import { toast } from 'react-hot-toast';
import { Heart, CheckCircle, XCircle, Loader2, ShieldCheck, Plus, UserPlus, Newspaper, ExternalLink, UploadCloud, TrendingUp, TrendingDown, Wallet, IndianRupee } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../features/auth/AuthContext';

// ─── Membership Requests Tab ──────────────────────────────────────────────────

const MembershipTab = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newMember, setNewMember] = useState({
        phone: '', full_name: '', role: 'NORMAL', zonal_committee: '', regional_committee: ''
    });

    useEffect(() => { fetchRequests(); }, []);

    const fetchRequests = async () => {
        try {
            const response = await api.get('/admin/pending-requests');
            setRequests(response.data);
        } catch {
            toast.error('Failed to fetch requests');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (userId, action) => {
        setActionLoading(userId);
        try {
            const response = await api.post('/admin/approve-request', {
                user_id: userId, action, admin_notes: 'Approved via dashboard'
            });
            toast.success(response.data.message);
            if (selectedRequest?.user_id === userId) setSelectedRequest(null);
            fetchRequests();
        } catch (error) {
            const detail = error.response?.data?.detail;
            toast.error(Array.isArray(detail) ? detail.map(d => d.msg).join(', ') : (detail || `Failed to ${action.toLowerCase()} request`));
        } finally {
            setActionLoading(null);
        }
    };

    const handleAddMember = async (e) => {
        e.preventDefault();
        setActionLoading('adding');
        try {
            const response = await api.post('/admin/create-member', newMember);
            toast.success(response.data.message);
            setShowAddModal(false);
            setNewMember({ phone: '', full_name: '', role: 'NORMAL', zonal_committee: '', regional_committee: '' });
        } catch (error) {
            const detail = error.response?.data?.detail;
            toast.error(Array.isArray(detail) ? detail.map(d => d.msg).join(', ') : (detail || 'Failed to add member'));
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[var(--color-primary)] h-8 w-8" /></div>;

    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
                    <ShieldCheck className="text-green-600 h-5 w-5" />
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pending</p>
                        <p className="text-xl font-black text-gray-900">{requests.length}</p>
                    </div>
                </div>
                <Button onClick={() => setShowAddModal(true)} className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 px-5 rounded-2xl h-11 shadow-sm">
                    <Plus size={16} className="mr-2" /> Quick Add
                </Button>
            </div>

            <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Member</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Type</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Details</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {requests.length === 0 ? (
                                <tr><td colSpan="4" className="px-6 py-12 text-center text-gray-400">No pending membership requests.</td></tr>
                            ) : requests.map((req) => (
                                <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-[var(--color-primary-light)]/20 flex items-center justify-center text-[var(--color-primary)] font-bold">
                                                {req.users.identifier[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900">{req.users.identifier}</p>
                                                <p className="text-xs text-gray-500">{req.users.phone || 'No phone'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold uppercase tracking-wider">{req.requested_role}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-xs space-y-1">
                                            <p><span className="text-gray-400 font-medium">Applied:</span> {new Date(req.created_at).toLocaleDateString()}</p>
                                            <p className="mt-2 text-[var(--color-primary)] font-bold cursor-pointer hover:underline" onClick={() => setSelectedRequest(req)}>
                                                View Full Application →
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button size="sm" variant="outline" className="h-9 w-9 p-0 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200" onClick={() => handleAction(req.user_id, 'REJECT')} disabled={actionLoading === req.user_id}>
                                                <XCircle size={18} />
                                            </Button>
                                            <Button size="sm" className="h-9 px-4 rounded-lg bg-green-600 hover:bg-green-700 border-none flex items-center gap-2" onClick={() => handleAction(req.user_id, 'APPROVE')} isLoading={actionLoading === req.user_id}>
                                                <CheckCircle size={18} /> Approve
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Application Details Modal */}
            <AnimatePresence>
                {selectedRequest && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl border border-gray-100">
                            <div className="p-8 overflow-y-auto max-h-[90vh]">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h2 className="text-2xl font-black text-gray-900">{selectedRequest.users.full_name || 'Membership Application'}</h2>
                                        <p className="text-sm text-gray-500">{selectedRequest.users.phone || selectedRequest.users.identifier} • {selectedRequest.requested_role} Request</p>
                                    </div>
                                    <button onClick={() => setSelectedRequest(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                        <XCircle className="text-gray-400" />
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--color-primary)]">Personal Information</h3>
                                        <div className="space-y-2">
                                            <DetailItem label="Applicant Name" value={selectedRequest.application_data.full_name} />
                                            <DetailItem label="Father/Guardian" value={selectedRequest.application_data.father_guardian_name} />
                                            <DetailItem label="Age" value={selectedRequest.application_data.age} />
                                            <DetailItem label="DOB" value={selectedRequest.application_data.dob} />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--color-primary)]">Contact & Status</h3>
                                        <div className="space-y-2">
                                            <DetailItem label="Cell No" value={selectedRequest.application_data.cell_no} />
                                            <DetailItem label="Email" value={selectedRequest.application_data.email} />
                                            <DetailItem label="Occupation" value={selectedRequest.application_data.occupation} />
                                            <DetailItem label="Zone" value={selectedRequest.application_data.zonal_committee} />
                                            <DetailItem label="Region" value={selectedRequest.application_data.regional_committee} />
                                        </div>
                                    </div>
                                    <div className="md:col-span-2 space-y-4 pt-4 border-t border-gray-50">
                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-green-600">Verification</h3>
                                        <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
                                            <DetailItem label="Payment Proof (UTR/Link)" value={selectedRequest.application_data.payment_proof_url} color="text-green-700 font-bold" />
                                        </div>
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Address</label>
                                        <p className="text-sm font-medium text-gray-900 bg-gray-50 p-4 rounded-2xl border border-gray-100">{selectedRequest.application_data.address || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="flex gap-3 mt-10">
                                    <Button variant="outline" className="flex-1 rounded-2xl h-14 border-red-100 text-red-600 hover:bg-red-50 hover:border-red-200" onClick={() => handleAction(selectedRequest.user_id, 'REJECT')} disabled={actionLoading}>Reject Application</Button>
                                    <Button className="flex-1 rounded-2xl h-14 bg-green-600 hover:bg-green-700 shadow-xl shadow-green-200" onClick={() => handleAction(selectedRequest.user_id, 'APPROVE')} isLoading={actionLoading === selectedRequest.user_id}>Approve & Activate</Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Quick Add Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl">
                            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gray-900 rounded-xl text-white"><UserPlus size={20} /></div>
                                    <h2 className="text-xl font-black text-gray-900">Add New Member</h2>
                                </div>
                                <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-900 transition-colors"><XCircle size={24} /></button>
                            </div>
                            <form onSubmit={handleAddMember} className="p-8 space-y-4">
                                <Input label="Full Name" required value={newMember.full_name} onChange={(e) => setNewMember({ ...newMember, full_name: e.target.value })} />
                                <Input label="Phone Number" required value={newMember.phone} onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })} placeholder="e.g. 9876543210" />
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Membership Type</label>
                                        <select className="w-full h-12 rounded-2xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-900 focus-visible:outline-none focus:border-[var(--color-primary)] outline-none" value={newMember.role} onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}>
                                            <option value="PERMANENT">Permanent</option>
                                            <option value="NORMAL">Normal</option>
                                            <option value="ASSOCIATED">Associated</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Zone</label>
                                        <select className="w-full h-12 rounded-2xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-900 focus-visible:outline-none focus:border-[var(--color-primary)] outline-none" value={newMember.zonal_committee} onChange={(e) => setNewMember({ ...newMember, zonal_committee: e.target.value })}>
                                            <option value="">Select Zone</option>
                                            {['Uttar Andhra', 'Rayalaseema', 'Dakshina Kosta Andhra', 'Madhya Kosta'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Region</label>
                                    <select className="w-full h-12 rounded-2xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-900 focus-visible:outline-none focus:border-[var(--color-primary)] outline-none" value={newMember.regional_committee} onChange={(e) => setNewMember({ ...newMember, regional_committee: e.target.value })}>
                                        <option value="">Select Region</option>
                                        {['Andhra', 'Telangana', 'Tamil Nadu', 'Karnataka', 'Rest of India'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                                <Button type="submit" disabled={actionLoading === 'adding'} className="w-full h-14 bg-gray-900 hover:bg-black text-white rounded-2xl mt-4 shadow-xl shadow-gray-200">
                                    {actionLoading === 'adding' ? <Loader2 className="animate-spin" /> : 'Create Active Membership'}
                                </Button>
                                <p className="text-[10px] text-center text-gray-400 font-bold uppercase tracking-widest">Default PIN: 1234</p>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

// ─── Articles Tab ─────────────────────────────────────────────────────────────

const ArticlesTab = () => {
    const { user } = useAuth();
    const [pending, setPending] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [rejectModal, setRejectModal] = useState(null); // article being rejected
    const [rejectNote, setRejectNote] = useState('');
    const [publishForm, setPublishForm] = useState({ title: '', summary: '', category: 'NEWS' });
    const [pdfFile, setPdfFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => { fetchPending(); }, []);

    const fetchPending = async () => {
        try {
            const res = await api.get('/articles/pending');
            setPending(res.data);
        } catch {
            toast.error('Failed to fetch pending articles');
        } finally {
            setLoading(false);
        }
    };

    const handlePdfSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.type !== 'application/pdf') { toast.error('Only PDF files are allowed'); return; }
        if (file.size > 10 * 1024 * 1024) { toast.error('File too large (max 10 MB)'); return; }
        setPdfFile(file);
    };

    const uploadPdf = async (file, userId) => {
        const path = `submissions/${userId}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
        const { error } = await supabase.storage.from('articles').upload(path, file, { contentType: 'application/pdf' });
        if (error) throw new Error(error.message);
        const { data } = supabase.storage.from('articles').getPublicUrl(path);
        return { pdf_url: data.publicUrl, pdf_path: path };
    };

    const handlePublish = async (e) => {
        e.preventDefault();
        if (!pdfFile) { toast.error('Please select a PDF'); return; }
        setUploading(true);
        try {
            const { pdf_url, pdf_path } = await uploadPdf(pdfFile, user.id);
            await api.post('/articles/publish', { ...publishForm, pdf_url, pdf_path });
            toast.success('Article published!');
            setShowPublishModal(false);
            setPublishForm({ title: '', summary: '', category: 'NEWS' });
            setPdfFile(null);
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to publish');
        } finally {
            setUploading(false);
        }
    };

    const handleApprove = async (articleId) => {
        setActionLoading(articleId);
        try {
            await api.post(`/articles/${articleId}/review`, { action: 'APPROVE' });
            toast.success('Article approved and published!');
            fetchPending();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to approve');
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async () => {
        if (!rejectModal) return;
        setActionLoading(rejectModal.id);
        try {
            await api.post(`/articles/${rejectModal.id}/review`, { action: 'REJECT', admin_notes: rejectNote });
            toast.success('Article rejected.');
            setRejectModal(null);
            setRejectNote('');
            fetchPending();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to reject');
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[var(--color-primary)] h-8 w-8" /></div>;

    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
                    <Newspaper className="text-amber-500 h-5 w-5" />
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pending Review</p>
                        <p className="text-xl font-black text-gray-900">{pending.length}</p>
                    </div>
                </div>
                <Button onClick={() => setShowPublishModal(true)} className="bg-gray-900 hover:bg-black text-white px-5 rounded-2xl h-11 shadow-lg">
                    <Plus size={16} className="mr-2" /> Publish Article
                </Button>
            </div>

            <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Article</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Submitted By</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Date</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {pending.length === 0 ? (
                                <tr><td colSpan="4" className="px-6 py-12 text-center text-gray-400">No pending article submissions.</td></tr>
                            ) : pending.map((article) => (
                                <tr key={article.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm">{article.title}</p>
                                            {article.summary && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{article.summary}</p>}
                                            <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${article.category === 'NEWS' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                                                {article.category}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {article.users?.full_name || '—'}
                                        {article.users?.member_id && <span className="block text-xs text-gray-400 font-mono">{article.users.member_id}</span>}
                                    </td>
                                    <td className="px-6 py-4 text-xs text-gray-500">
                                        {new Date(article.created_at).toLocaleDateString()}
                                        <a href={article.pdf_url} target="_blank" rel="noopener noreferrer" className="block mt-1 text-[var(--color-primary)] font-bold hover:underline flex items-center gap-1">
                                            View PDF <ExternalLink size={11} />
                                        </a>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button size="sm" variant="outline" className="h-9 w-9 p-0 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200" onClick={() => { setRejectModal(article); setRejectNote(''); }} disabled={actionLoading === article.id}>
                                                <XCircle size={18} />
                                            </Button>
                                            <Button size="sm" className="h-9 px-4 rounded-lg bg-green-600 hover:bg-green-700 border-none flex items-center gap-2" onClick={() => handleApprove(article.id)} isLoading={actionLoading === article.id}>
                                                <CheckCircle size={18} /> Approve
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Publish Article Modal */}
            <AnimatePresence>
                {showPublishModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl">
                            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gray-900 rounded-xl text-white"><Newspaper size={20} /></div>
                                    <h2 className="text-xl font-black text-gray-900">Publish Article</h2>
                                </div>
                                <button onClick={() => setShowPublishModal(false)} className="text-gray-400 hover:text-gray-900 transition-colors"><XCircle size={24} /></button>
                            </div>
                            <form onSubmit={handlePublish} className="p-8 space-y-4">
                                <Input label="Title" required value={publishForm.title} onChange={e => setPublishForm({ ...publishForm, title: e.target.value })} />
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Summary (optional)</label>
                                    <textarea rows={3} value={publishForm.summary} onChange={e => setPublishForm({ ...publishForm, summary: e.target.value })}
                                        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-[var(--color-primary)] resize-none" placeholder="Brief description..." />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Category</label>
                                    <select value={publishForm.category} onChange={e => setPublishForm({ ...publishForm, category: e.target.value })}
                                        className="w-full h-12 rounded-2xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-900 focus:outline-none focus:border-[var(--color-primary)] outline-none">
                                        <option value="NEWS">News</option>
                                        <option value="ARTICLE">Article</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">PDF File</label>
                                    <label className={`flex items-center gap-3 border-2 border-dashed rounded-2xl px-4 py-4 cursor-pointer transition-colors ${pdfFile ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-[var(--color-primary)]'}`}>
                                        <UploadCloud size={20} className={pdfFile ? 'text-green-500' : 'text-gray-400'} />
                                        <span className={`text-sm font-medium ${pdfFile ? 'text-green-700' : 'text-gray-500'}`}>
                                            {pdfFile ? pdfFile.name : 'Click to upload PDF (max 10 MB)'}
                                        </span>
                                        <input type="file" accept="application/pdf" className="hidden" onChange={handlePdfSelect} />
                                    </label>
                                </div>
                                <Button type="submit" disabled={uploading} className="w-full h-14 bg-gray-900 hover:bg-black text-white rounded-2xl mt-2 shadow-xl shadow-gray-200">
                                    {uploading ? <><Loader2 className="animate-spin mr-2" /> Uploading...</> : 'Publish Now'}
                                </Button>
                                <p className="text-[10px] text-center text-amber-600 font-bold">Article will be auto-deleted after 30 days.</p>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Reject with Note Modal */}
            <AnimatePresence>
                {rejectModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-8">
                            <h3 className="text-lg font-black text-gray-900 mb-1">Reject Article</h3>
                            <p className="text-xs text-gray-500 mb-4">"{rejectModal.title}"</p>
                            <textarea rows={3} value={rejectNote} onChange={e => setRejectNote(e.target.value)}
                                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-red-300 resize-none mb-4"
                                placeholder="Reason for rejection (optional)..." />
                            <div className="flex gap-3">
                                <Button variant="outline" className="flex-1 h-11 rounded-xl" onClick={() => setRejectModal(null)}>Cancel</Button>
                                <Button className="flex-1 h-11 rounded-xl bg-red-600 hover:bg-red-700 border-none" onClick={handleReject} isLoading={actionLoading === rejectModal.id}>Reject</Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

// ─── Accounts Tab ────────────────────────────────────────────────────────────

const INCOME_CATEGORIES  = ['MEMBERSHIP_FEE', 'DONATION', 'EVENT', 'GRANT', 'OTHER'];
const EXPENSE_CATEGORIES = ['EVENT', 'MAINTENANCE', 'PRINTING', 'TRAVEL', 'ADMIN', 'OTHER'];

const fmt = (n) => `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const AccountsTab = () => {
    const [summary, setSummary]         = useState({ total_income: 0, total_expense: 0, net_balance: 0 });
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading]         = useState(true);
    const [showModal, setShowModal]     = useState(false);
    const [form, setForm]               = useState({ type: 'INCOME', category: 'MEMBERSHIP_FEE', amount: '', description: '', transaction_date: '' });
    const [saving, setSaving]           = useState(false);

    const fetchAll = async () => {
        try {
            const [sumRes, txRes] = await Promise.all([
                api.get('/accounts/summary'),
                api.get('/accounts/transactions'),
            ]);
            setSummary(sumRes.data);
            setTransactions(txRes.data);
        } catch {
            toast.error('Failed to load accounts');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAll(); }, []);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0) {
            toast.error('Enter a valid amount'); return;
        }
        setSaving(true);
        try {
            await api.post('/accounts/transactions', {
                type:             form.type,
                category:         form.category,
                amount:           parseFloat(form.amount),
                description:      form.description || null,
                transaction_date: form.transaction_date || null,
            });
            toast.success('Transaction recorded');
            setShowModal(false);
            setForm({ type: 'INCOME', category: 'MEMBERSHIP_FEE', amount: '', description: '', transaction_date: '' });
            fetchAll();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const categories = form.type === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[var(--color-primary)] h-8 w-8" /></div>;

    return (
        <>
            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                    <div className="p-3 bg-green-50 rounded-xl"><TrendingUp size={22} className="text-green-600" /></div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Income</p>
                        <p className="text-xl font-black text-green-600">{fmt(summary.total_income)}</p>
                    </div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                    <div className="p-3 bg-red-50 rounded-xl"><TrendingDown size={22} className="text-red-500" /></div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Expenses</p>
                        <p className="text-xl font-black text-red-500">{fmt(summary.total_expense)}</p>
                    </div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                    <div className="p-3 bg-amber-50 rounded-xl"><Wallet size={22} className="text-amber-500" /></div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Net Balance</p>
                        <p className={`text-xl font-black ${summary.net_balance >= 0 ? 'text-gray-900' : 'text-red-500'}`}>
                            {fmt(summary.net_balance)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Table header */}
            <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold text-gray-500">{transactions.length} transaction{transactions.length !== 1 ? 's' : ''}</p>
                <div className="flex gap-2">
                    <Button onClick={async () => {
                        try {
                            const res = await api.post('/accounts/backfill');
                            toast.success(res.data.message);
                            fetchAll();
                        } catch { toast.error('Backfill failed'); }
                    }} className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 rounded-2xl h-10 text-xs shadow-sm">
                        Backfill Existing Members
                    </Button>
                    <Button onClick={() => setShowModal(true)} className="bg-gray-900 hover:bg-black text-white px-5 rounded-2xl h-10 text-xs shadow-lg">
                        <Plus size={15} className="mr-1.5" /> Add Transaction
                    </Button>
                </div>
            </div>

            {/* Ledger table */}
            <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Date</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Type</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Category</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Description / Member</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {transactions.length === 0 ? (
                                <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-400">No transactions yet.</td></tr>
                            ) : transactions.map(tx => (
                                <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">{fmtDate(tx.transaction_date)}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase ${tx.type === 'INCOME' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                                            {tx.type === 'INCOME' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                            {tx.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-gray-600 font-medium">{tx.category.replace(/_/g, ' ')}</td>
                                    <td className="px-6 py-4 text-sm">
                                        <p className="text-gray-700">{tx.description || '—'}</p>
                                        {tx.member?.full_name && (
                                            <p className="text-xs text-gray-400 mt-0.5">{tx.member.full_name} · {tx.member.member_id}</p>
                                        )}
                                    </td>
                                    <td className={`px-6 py-4 text-right font-black text-sm ${tx.type === 'INCOME' ? 'text-green-600' : 'text-red-500'}`}>
                                        {tx.type === 'INCOME' ? '+' : '−'}{fmt(tx.amount)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Transaction Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                            className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gray-900 rounded-xl text-white"><IndianRupee size={18} /></div>
                                    <h2 className="text-lg font-black text-gray-900">Add Transaction</h2>
                                </div>
                                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-900"><XCircle size={22} /></button>
                            </div>
                            <form onSubmit={handleAdd} className="p-6 space-y-4">
                                {/* Income / Expense toggle */}
                                <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl">
                                    {['INCOME', 'EXPENSE'].map(t => (
                                        <button key={t} type="button"
                                            onClick={() => setForm({ ...form, type: t, category: t === 'INCOME' ? 'MEMBERSHIP_FEE' : 'EVENT' })}
                                            className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-colors ${form.type === t ? (t === 'INCOME' ? 'bg-green-600 text-white' : 'bg-red-500 text-white') : 'text-gray-500'}`}>
                                            {t === 'INCOME' ? '↑ Income' : '↓ Expense'}
                                        </button>
                                    ))}
                                </div>

                                {/* Category */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Category</label>
                                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                                        className="w-full h-12 rounded-2xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-900 focus:outline-none focus:border-[var(--color-primary)] outline-none">
                                        {categories.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
                                    </select>
                                </div>

                                {/* Amount */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Amount (₹)</label>
                                    <input type="number" min="1" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                                        placeholder="0.00" required
                                        className="w-full h-12 rounded-2xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-900 focus:outline-none focus:border-[var(--color-primary)]" />
                                </div>

                                {/* Description */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Description (optional)</label>
                                    <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                                        placeholder="e.g. Ugadi celebration expenses"
                                        className="w-full h-12 rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 focus:outline-none focus:border-[var(--color-primary)]" />
                                </div>

                                {/* Date */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Date (leave blank for today)</label>
                                    <input type="date" value={form.transaction_date} onChange={e => setForm({ ...form, transaction_date: e.target.value })}
                                        className="w-full h-12 rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 focus:outline-none focus:border-[var(--color-primary)]" />
                                </div>

                                <Button type="submit" disabled={saving} className="w-full h-13 rounded-2xl bg-gray-900 hover:bg-black text-white font-black mt-2">
                                    {saving ? <Loader2 className="animate-spin" /> : 'Save Transaction'}
                                </Button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

// ─── Matrimony Tab ────────────────────────────────────────────────────────────

const MatrimonyTab = () => {
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    const fetchPending = async () => {
        try {
            const res = await api.get('/admin/matrimony-pending');
            setProfiles(res.data);
        } catch {
            toast.error('Failed to fetch matrimony profiles');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPending(); }, []);

    const handleAction = async (profileId, action) => {
        setActionLoading(profileId);
        try {
            await api.post('/admin/matrimony-approve', { profile_id: profileId, action });
            toast.success(`Profile ${action.toLowerCase()} successfully`);
            fetchPending();
        } catch (err) {
            toast.error('Failed to process action');
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[var(--color-primary)] h-8 w-8" /></div>;

    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
                    <Heart className="text-rose-500 h-5 w-5" />
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pending Verification</p>
                        <p className="text-xl font-black text-gray-900">{profiles.length}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Profile</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Parishat ID</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Payment Ref</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {profiles.length === 0 ? (
                                <tr><td colSpan="4" className="px-6 py-12 text-center text-gray-400">No pending matrimony profiles.</td></tr>
                            ) : profiles.map((p) => (
                                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div>
                                                <p className="font-bold text-gray-900">{p.full_name}</p>
                                                <p className="text-xs text-gray-500">{p.gender} • {p.age || 'N/A'} yrs</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-bold text-gray-700">{p.parishat_id || 'N/A'}</td>
                                    <td className="px-6 py-4 text-sm font-mono text-blue-600 font-bold">{p.payment_reference || 'N/A'}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button size="sm" variant="outline" className="h-9 px-4 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-gray-600" onClick={() => handleAction(p.id, 'REJECT')} disabled={actionLoading === p.id}>Reject</Button>
                                            <Button size="sm" className="h-9 px-4 rounded-lg bg-green-600 hover:bg-green-700 border-none flex items-center gap-2" onClick={() => handleAction(p.id, 'APPROVE')} isLoading={actionLoading === p.id}><CheckCircle size={16} /> Verify</Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};


// ─── Renewals Tab ────────────────────────────────────────────────────────────

const RenewalsTab = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    const fetchRequests = async () => {
        try {
            const res = await api.get('/admin/renewal-requests');
            setRequests(res.data);
        } catch { toast.error('Failed to fetch renewal requests'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchRequests(); }, []);

    const handleRenew = async (userId, requestId) => {
        setActionLoading(userId);
        try {
            await api.post('/admin/renew-membership', { user_id: userId, request_id: requestId });
            toast.success('Membership renewed for 1 year');
            fetchRequests();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to renew');
        } finally { setActionLoading(null); }
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[var(--color-primary)] h-8 w-8" /></div>;

    return (
        <div>
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
                    <CheckCircle className="text-amber-500 h-5 w-5" />
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pending Renewals</p>
                        <p className="text-xl font-black text-gray-900">{requests.length}</p>
                    </div>
                </div>
            </div>
            <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Member</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Role</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Expiry</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Payment Ref</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {requests.length === 0 ? (
                                <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-400">No pending renewal requests.</td></tr>
                            ) : requests.map((req) => {
                                const exp = req.users?.membership_expires_at ? new Date(req.users.membership_expires_at) : null;
                                const expired = exp && exp < new Date();
                                return (
                                    <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-gray-900">{req.users?.full_name || req.users?.identifier}</p>
                                            <p className="text-xs text-gray-500">{req.users?.member_id} · {req.users?.phone}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold uppercase tracking-wider">{req.users?.role}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {exp ? (
                                                <span className={`text-xs font-bold ${expired ? 'text-red-600' : 'text-amber-600'}`}>
                                                    {expired ? 'Expired' : 'Expiring'} {exp.toLocaleDateString('en-IN')}
                                                </span>
                                            ) : <span className="text-xs text-gray-400">—</span>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-mono text-gray-700">{req.payment_reference || req.admin_notes || '—'}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleRenew(req.users?.id, req.id)}
                                                disabled={actionLoading === req.users?.id}
                                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold transition-colors disabled:opacity-50"
                                            >
                                                {actionLoading === req.users?.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                                                Renew 1 Year
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// ─── Main AdminDashboard ──────────────────────────────────────────────────────

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('membership');

    const tabs = [
        { id: 'membership', label: 'Membership Requests' },
        { id: 'renewals',   label: 'Renewals' },
        { id: 'articles',   label: 'News & Articles' },
        { id: 'accounts',   label: 'Accounts' },
        { id: 'matrimony',  label: 'Matrimony Profiles' },
    ];

    return (
        <div className="bg-gray-50 min-h-screen py-8 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900">Admin Dashboard</h1>
                        <p className="text-gray-500">Manage members and content</p>
                    </div>
                    <Button onClick={() => navigate('/admin/onboard')} className="bg-gray-900 hover:bg-black text-white px-6 rounded-2xl h-14 shadow-lg shadow-gray-200">
                        <UserPlus size={18} className="mr-2" /> Onboard Members
                    </Button>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-1 bg-white rounded-2xl p-1 border border-gray-100 shadow-sm mb-8 flex-wrap">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-colors ${activeTab === tab.id ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-900'}`}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {activeTab === 'membership' && <MembershipTab />}
                {activeTab === 'renewals'   && <RenewalsTab />}
                {activeTab === 'articles'   && <ArticlesTab />}
                {activeTab === 'accounts'   && <AccountsTab />}
                {activeTab === 'matrimony'  && <MatrimonyTab />}
            </div>
        </div>
    );
};

const DetailItem = ({ label, value, color = "text-gray-900" }) => (
    <div className="flex justify-between items-center text-sm">
        <span className="text-[10px] font-black uppercase tracking-[0.1em] text-gray-600">{label}</span>
        <span className={`font-bold ${color}`}>{value || 'N/A'}</span>
    </div>
);

export default AdminDashboard;
