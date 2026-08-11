import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Video, ChevronRight, UploadCloud, XCircle, Loader2, Clock, CheckCircle, X } from 'lucide-react';
import api from '../lib/api';
import { Button, Input } from './ui';
import { uploadToSignedUrl } from '../lib/upload';
import { captureVideoPoster } from '../lib/videoPoster';

const MAX_BYTES = 25 * 1024 * 1024;
const ALLOWED_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

const statusStyles = {
    PENDING:   { label: 'Awaiting review', className: 'bg-amber-50 text-amber-700 border-amber-200', Icon: Clock },
    PUBLISHED: { label: 'Live',            className: 'bg-green-50 text-green-700 border-green-200', Icon: CheckCircle },
    REJECTED:  { label: 'Not approved',    className: 'bg-red-50 text-red-600 border-red-200',       Icon: XCircle },
};

const daysLeft = (expires) => {
    if (!expires) return null;
    const diff = Math.ceil((new Date(expires) - new Date()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
};

/**
 * Dashboard card + modal letting an active member submit a video for review.
 * Self-contained so the member dashboard doesn't grow another block of state.
 */
const VideoSubmitCard = () => {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [submissions, setSubmissions] = useState([]);
    const [form, setForm] = useState({ title: '', description: '' });
    const [file, setFile] = useState(null);
    const [progress, setProgress] = useState(0);
    const [stage, setStage] = useState(null); // 'preparing' | 'uploading' | 'saving'

    const fetchSubmissions = () => {
        api.get('/videos/my-submissions')
            .then(res => setSubmissions(res.data || []))
            .catch(() => { /* non-critical */ });
    };

    useEffect(() => { fetchSubmissions(); }, []);

    const handleSelect = (e) => {
        const selected = e.target.files[0];
        if (!selected) return;
        if (!ALLOWED_TYPES.includes(selected.type)) {
            toast.error('Please choose an MP4, WebM or MOV video');
            return;
        }
        if (selected.size > MAX_BYTES) {
            toast.error('Video is too large (max 25 MB). Try a shorter clip or a lower recording quality.');
            return;
        }
        setFile(selected);
    };

    const reset = () => {
        setOpen(false);
        setForm({ title: '', description: '' });
        setFile(null);
        setProgress(0);
        setStage(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) { toast.error('Please choose a video'); return; }

        setStage('preparing');
        setProgress(0);
        try {
            // Quota and size are checked before a single byte is uploaded.
            const { data: targets } = await api.post('/videos/upload-url', {
                file_name: file.name,
                content_type: file.type,
                size_bytes: file.size,
            });

            const { blob: posterBlob, durationSecs } = await captureVideoPoster(file);

            setStage('uploading');
            await uploadToSignedUrl(targets.video, file, setProgress);

            let thumbnail_url = null;
            let thumbnail_path = null;
            if (posterBlob) {
                try {
                    await uploadToSignedUrl(targets.thumbnail, posterBlob);
                    thumbnail_url = targets.thumbnail.public_url;
                    thumbnail_path = targets.thumbnail.path;
                } catch {
                    // A missing poster is cosmetic; don't fail the submission over it.
                }
            }

            setStage('saving');
            await api.post('/videos/submit', {
                title: form.title,
                description: form.description || null,
                video_url: targets.video.public_url,
                video_path: targets.video.path,
                thumbnail_url,
                thumbnail_path,
                mime_type: file.type,
                size_bytes: file.size,
                duration_secs: durationSecs,
            });

            toast.success('Video submitted for review!');
            reset();
            fetchSubmissions();
        } catch (err) {
            toast.error(err.response?.data?.detail || err.message || 'Failed to submit video');
            setStage(null);
            setProgress(0);
        }
    };

    const busy = stage !== null;
    const busyLabel = stage === 'preparing' ? 'Preparing...' : stage === 'saving' ? 'Finishing...' : `Uploading ${progress}%`;

    return (
        <>
            {/* Dashboard card */}
            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden md:col-span-2">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-start gap-5">
                        <div className="p-4 rounded-3xl bg-blue-50 shrink-0 group-hover:scale-110 transition-transform">
                            <Video size={24} className="text-blue-500" />
                        </div>
                        <div>
                            <h4 className="text-lg font-black text-gray-900 mb-1">Community Videos</h4>
                            <p className="text-xs text-gray-500 leading-relaxed font-medium">
                                Share a short clip with the community. Approved videos stay live for 7 days.
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                        <button
                            onClick={() => setOpen(true)}
                            className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-colors border border-blue-200"
                        >
                            <UploadCloud size={13} /> Upload Video
                        </button>
                        <button
                            onClick={() => navigate('/videos')}
                            className="flex items-center gap-1.5 text-xs font-bold text-white bg-gray-900 hover:bg-gray-700 px-4 py-2 rounded-xl transition-colors"
                        >
                            Watch <ChevronRight size={13} />
                        </button>
                    </div>
                </div>

                {/* My submissions */}
                {submissions.length > 0 && (
                    <div className="mt-6 pt-5 border-t border-gray-50 space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">My submissions</p>
                        {submissions.slice(0, 4).map(sub => {
                            const style = statusStyles[sub.status] || statusStyles.PENDING;
                            const left = sub.status === 'PUBLISHED' ? daysLeft(sub.expires_at) : null;
                            return (
                                <div key={sub.id} className="flex items-center justify-between gap-3 text-xs">
                                    <div className="min-w-0">
                                        <p className="font-bold text-gray-800 truncate">{sub.title}</p>
                                        {sub.status === 'REJECTED' && sub.admin_notes && (
                                            <p className="text-[11px] text-red-500 truncate">{sub.admin_notes}</p>
                                        )}
                                    </div>
                                    <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-black uppercase ${style.className}`}>
                                        <style.Icon size={10} />
                                        {style.label}{left !== null ? ` · ${left}d` : ''}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Submit modal */}
            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-[2rem] w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-900 rounded-xl text-white"><Video size={18} /></div>
                                <h2 className="text-xl font-black text-gray-900">Upload a Video</h2>
                            </div>
                            <button onClick={reset} disabled={busy} className="text-gray-400 hover:text-gray-900 transition-colors disabled:opacity-40">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                            <Input label="Title" required maxLength={200} value={form.title}
                                onChange={e => setForm({ ...form, title: e.target.value })} />

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-[0.1em] text-gray-600 ml-1">Description (optional)</label>
                                <textarea rows={3} maxLength={1000} value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-[var(--color-primary)] resize-none"
                                    placeholder="What is this video about?" />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-[0.1em] text-gray-600 ml-1">Video file</label>
                                <label className={`flex items-center gap-3 border-2 border-dashed rounded-2xl px-4 py-4 cursor-pointer transition-colors ${file ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-[var(--color-primary)]'}`}>
                                    <UploadCloud size={20} className={file ? 'text-green-500' : 'text-gray-400'} />
                                    <span className={`text-sm font-medium truncate ${file ? 'text-green-700' : 'text-gray-500'}`}>
                                        {file ? `${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)` : 'Choose a video (max 25 MB)'}
                                    </span>
                                    <input type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden" onChange={handleSelect} disabled={busy} />
                                </label>
                                <p className="text-[10px] text-gray-400 ml-1 leading-relaxed">
                                    Short clips work best — around 2 minutes at 480p or 720p. MP4, WebM or MOV.
                                </p>
                            </div>

                            {busy && (
                                <div className="space-y-1">
                                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-[var(--color-primary)] transition-all duration-200"
                                            style={{ width: `${stage === 'uploading' ? progress : stage === 'saving' ? 100 : 5}%` }} />
                                    </div>
                                    <p className="text-[10px] font-bold text-gray-400 text-right">{busyLabel}</p>
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <Button type="button" variant="outline" disabled={busy}
                                    className="flex-1 h-12 rounded-xl border-2 border-gray-200 font-bold text-gray-600" onClick={reset}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={busy} className="flex-1 h-12 rounded-xl font-black">
                                    {busy ? <><Loader2 className="animate-spin mr-2" size={16} /> {busyLabel}</> : 'Submit for Review'}
                                </Button>
                            </div>

                            <p className="text-[10px] text-center text-gray-400">
                                An admin reviews every video. Approved videos are visible to members for 7 days, then deleted automatically.
                            </p>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default VideoSubmitCard;
