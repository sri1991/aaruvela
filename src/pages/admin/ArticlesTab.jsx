import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { Button, Input } from '../../components/ui';
import { toast } from 'react-hot-toast';
import { CheckCircle, XCircle, Loader2, Plus, Newspaper, ExternalLink, UploadCloud } from 'lucide-react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../features/auth/AuthContext';

const CATEGORY_BADGES = {
    ARTICLE:  'bg-amber-100 text-amber-700 border-amber-200',
    CIRCULAR: 'bg-blue-100 text-blue-700 border-blue-200',
    MAGAZINE: 'bg-purple-100 text-purple-700 border-purple-200',
};

const ArticlesTab = () => {
    const { user } = useAuth();
    const [pending, setPending] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [rejectModal, setRejectModal] = useState(null); // article being rejected
    const [rejectNote, setRejectNote] = useState('');
    const [publishForm, setPublishForm] = useState({ title: '', summary: '', category: 'ARTICLE' });
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
            setPublishForm({ title: '', summary: '', category: 'ARTICLE' });
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
                                            <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${CATEGORY_BADGES[article.category] || CATEGORY_BADGES.ARTICLE}`}>
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
                    <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <Motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl">
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
                                        <option value="ARTICLE">Article</option>
                                        <option value="CIRCULAR">Circular</option>
                                        <option value="MAGAZINE">Magazine</option>
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
                        </Motion.div>
                    </Motion.div>
                )}
            </AnimatePresence>

            {/* Reject with Note Modal */}
            <AnimatePresence>
                {rejectModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <Motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-8">
                            <h3 className="text-lg font-black text-gray-900 mb-1">Reject Article</h3>
                            <p className="text-xs text-gray-500 mb-4">"{rejectModal.title}"</p>
                            <textarea rows={3} value={rejectNote} onChange={e => setRejectNote(e.target.value)}
                                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-red-300 resize-none mb-4"
                                placeholder="Reason for rejection (optional)..." />
                            <div className="flex gap-3">
                                <Button variant="outline" className="flex-1 h-11 rounded-xl" onClick={() => setRejectModal(null)}>Cancel</Button>
                                <Button className="flex-1 h-11 rounded-xl bg-red-600 hover:bg-red-700 border-none" onClick={handleReject} isLoading={actionLoading === rejectModal.id}>Reject</Button>
                            </div>
                        </Motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

export default ArticlesTab;
