import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { Button } from '../../components/ui';
import { toast } from 'react-hot-toast';
import { Video, CheckCircle, XCircle, Loader2, Trash2, HardDrive, Clock } from 'lucide-react';
import { motion as Motion, AnimatePresence } from 'framer-motion';

const STORAGE_BUDGET_BYTES = 1024 * 1024 * 1024; // Supabase free tier

const fmtBytes = (b) => {
    if (!b) return '0 MB';
    const mb = b / (1024 * 1024);
    return mb >= 1024 ? `${(mb / 1024).toFixed(2)} GB` : `${mb.toFixed(1)} MB`;
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const daysLeft = (expires) => {
    if (!expires) return null;
    const diff = Math.ceil((new Date(expires) - new Date()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
};

const VideosTab = () => {
    const [pending, setPending] = useState([]);
    const [published, setPublished] = useState([]);
    const [totalBytes, setTotalBytes] = useState(0);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [rejectModal, setRejectModal] = useState(null);
    const [rejectNote, setRejectNote] = useState('');

    const fetchAll = async () => {
        try {
            const [pendingRes, publishedRes] = await Promise.all([
                api.get('/videos/pending'),
                api.get('/videos/published'),
            ]);
            setPending(pendingRes.data);
            setPublished(publishedRes.data.videos);
            setTotalBytes(publishedRes.data.total_bytes || 0);
        } catch {
            toast.error('Failed to load videos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAll(); }, []);

    const handleApprove = async (videoId) => {
        setActionLoading(videoId);
        try {
            const res = await api.post(`/videos/${videoId}/review`, { action: 'APPROVE' });
            toast.success(res.data.message);
            fetchAll();
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
            await api.post(`/videos/${rejectModal.id}/review`, { action: 'REJECT', admin_notes: rejectNote });
            toast.success('Video rejected and its file deleted.');
            setRejectModal(null);
            setRejectNote('');
            fetchAll();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to reject');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (video) => {
        if (!window.confirm(`Take down "${video.title}"? The file will be deleted.`)) return;
        setActionLoading(video.id);
        try {
            await api.delete(`/videos/${video.id}`);
            toast.success('Video removed');
            fetchAll();
        } catch {
            toast.error('Failed to remove video');
        } finally {
            setActionLoading(null);
        }
    };

    const handleCleanup = async () => {
        setActionLoading('cleanup');
        try {
            const res = await api.post('/videos/cleanup');
            toast.success(res.data.message);
            fetchAll();
        } catch {
            toast.error('Cleanup failed');
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[var(--color-primary)] h-8 w-8" /></div>;

    const usedPct = Math.min(100, Math.round((totalBytes / STORAGE_BUDGET_BYTES) * 100));

    return (
        <>
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                    <div className="p-3 bg-blue-50 rounded-xl"><Video size={20} className="text-blue-600" /></div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Awaiting review</p>
                        <p className="text-xl font-black text-gray-900">{pending.length}</p>
                    </div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                    <div className="p-3 bg-green-50 rounded-xl"><CheckCircle size={20} className="text-green-600" /></div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Live now</p>
                        <p className="text-xl font-black text-gray-900">{published.length}</p>
                    </div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <HardDrive size={16} className={usedPct > 75 ? 'text-red-500' : 'text-gray-400'} />
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Video storage</p>
                    </div>
                    <p className={`text-sm font-black ${usedPct > 75 ? 'text-red-600' : 'text-gray-900'}`}>
                        {fmtBytes(totalBytes)} <span className="text-gray-400 font-bold">of 1 GB</span>
                    </p>
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden mt-2">
                        <div className={`h-full ${usedPct > 75 ? 'bg-red-500' : 'bg-[var(--color-primary)]'}`} style={{ width: `${usedPct}%` }} />
                    </div>
                </div>
            </div>

            <div className="flex justify-end mb-4">
                <Button onClick={handleCleanup} isLoading={actionLoading === 'cleanup'}
                    className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 rounded-2xl h-10 text-xs shadow-sm">
                    Clean up expired & rejected
                </Button>
            </div>

            {/* Pending queue */}
            <h3 className="text-sm font-black text-gray-900 mb-3">Pending review</h3>
            {pending.length === 0 ? (
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm px-6 py-10 text-center text-gray-400 mb-8">
                    No videos awaiting review.
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
                    {pending.map(video => (
                        <div key={video.id} className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
                            <video
                                src={video.video_url}
                                poster={video.thumbnail_url || undefined}
                                controls
                                preload="metadata"
                                className="w-full aspect-video bg-black"
                            />
                            <div className="p-5">
                                <p className="font-black text-gray-900 text-sm">{video.title}</p>
                                {video.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{video.description}</p>}
                                <div className="flex items-center gap-3 mt-3 text-[11px] text-gray-400 font-medium">
                                    <span>{video.users?.full_name || '—'}</span>
                                    {video.users?.member_id && <span className="font-mono">{video.users.member_id}</span>}
                                    <span>{fmtBytes(video.size_bytes)}</span>
                                    {video.duration_secs ? <span>{video.duration_secs}s</span> : null}
                                </div>
                                <div className="flex items-center gap-2 mt-4">
                                    <Button variant="outline" className="flex-1 h-11 rounded-xl border-red-100 text-red-600 hover:bg-red-50 hover:border-red-200"
                                        onClick={() => { setRejectModal(video); setRejectNote(''); }} disabled={actionLoading === video.id}>
                                        <XCircle size={16} className="mr-2" /> Reject
                                    </Button>
                                    <Button className="flex-1 h-11 rounded-xl bg-green-600 hover:bg-green-700 border-none"
                                        onClick={() => handleApprove(video.id)} isLoading={actionLoading === video.id}>
                                        <CheckCircle size={16} className="mr-2" /> Approve
                                    </Button>
                                </div>
                                <p className="text-[10px] text-center text-gray-400 mt-2">Approved videos stay live for 7 days, then delete themselves.</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Live videos */}
            <h3 className="text-sm font-black text-gray-900 mb-3">Live now</h3>
            <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Video</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Member</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Published</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Expires</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {published.length === 0 ? (
                                <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-400">No videos are live right now.</td></tr>
                            ) : published.map(video => {
                                const left = daysLeft(video.expires_at);
                                return (
                                    <tr key={video.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {video.thumbnail_url ? (
                                                    <img src={video.thumbnail_url} alt="" className="w-16 h-10 object-cover rounded-lg border border-gray-100 shrink-0" />
                                                ) : (
                                                    <div className="w-16 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                                                        <Video size={14} className="text-gray-300" />
                                                    </div>
                                                )}
                                                <div className="min-w-0">
                                                    <p className="font-bold text-gray-900 text-sm line-clamp-1">{video.title}</p>
                                                    <p className="text-[11px] text-gray-400">{fmtBytes(video.size_bytes)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {video.users?.full_name || '—'}
                                            {video.users?.member_id && <span className="block text-xs text-gray-400 font-mono">{video.users.member_id}</span>}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-500">{fmtDate(video.published_at)}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 text-xs font-bold ${left <= 2 ? 'text-amber-600' : 'text-gray-500'}`}>
                                                <Clock size={12} /> {left}d left
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button size="sm" variant="outline" className="h-9 w-9 p-0 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                                                title="Take down" onClick={() => handleDelete(video)} disabled={actionLoading === video.id}>
                                                <Trash2 size={15} />
                                            </Button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Reject modal */}
            <AnimatePresence>
                {rejectModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <Motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-8">
                            <h3 className="text-lg font-black text-gray-900 mb-1">Reject Video</h3>
                            <p className="text-xs text-gray-500 mb-4">"{rejectModal.title}"</p>
                            <textarea rows={3} value={rejectNote} onChange={e => setRejectNote(e.target.value)}
                                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-red-300 resize-none mb-2"
                                placeholder="Reason the member will see (optional)..." />
                            <p className="text-[10px] text-amber-600 font-bold mb-4">The uploaded file is deleted immediately on rejection.</p>
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

export default VideosTab;
