import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { uploadAdminAsset } from '../../lib/upload';
import { Button } from '../../components/ui';
import { toast } from 'react-hot-toast';
import { FileText, Loader2, UploadCloud, ExternalLink, MessageSquare } from 'lucide-react';

const MAX_PDF_BYTES = 10 * 1024 * 1024;

const SiteContentTab = () => {
    const [notice, setNotice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [file, setFile] = useState(null);
    const [progress, setProgress] = useState(0);
    const [saving, setSaving] = useState(false);

    const fetchNotice = async () => {
        try {
            const res = await api.get('/site/settings/chairman_notice');
            setNotice(res.data.value);
        } catch {
            setNotice(null); // 404 just means nothing has been uploaded yet
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchNotice(); }, []);

    const handleSelect = (e) => {
        const selected = e.target.files[0];
        if (!selected) return;
        if (selected.type !== 'application/pdf') { toast.error('Only PDF files are allowed'); return; }
        if (selected.size > MAX_PDF_BYTES) { toast.error('File too large (max 10 MB)'); return; }
        setFile(selected);
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) { toast.error('Please choose a PDF'); return; }
        setSaving(true);
        setProgress(0);
        try {
            const { url, path } = await uploadAdminAsset('chairman', file, setProgress);
            await api.put('/site/chairman-notice', {
                pdf_url: url,
                pdf_path: path,
                file_name: file.name,
            });
            toast.success("Chairman's notice updated");
            setFile(null);
            fetchNotice();
        } catch (err) {
            toast.error(err.response?.data?.detail || err.message || 'Failed to update notice');
        } finally {
            setSaving(false);
            setProgress(0);
        }
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[var(--color-primary)] h-8 w-8" /></div>;

    return (
        <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden max-w-2xl">
            <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                <div className="p-2 bg-gray-900 rounded-xl text-white"><MessageSquare size={18} /></div>
                <div>
                    <h2 className="text-lg font-black text-gray-900">Chairman's Notice</h2>
                    <p className="text-xs text-gray-500">Shown on the Administration page under "Chairman Message".</p>
                </div>
            </div>

            <div className="p-8 space-y-6">
                {/* Current file */}
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Currently live</p>
                    {notice ? (
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                                <FileText size={20} className="text-[var(--color-primary)] shrink-0" />
                                <div className="min-w-0">
                                    <p className="font-bold text-gray-900 text-sm truncate">{notice.file_name}</p>
                                    <p className="text-xs text-gray-500">
                                        Updated {new Date(notice.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                            <a href={notice.pdf_url} target="_blank" rel="noopener noreferrer"
                                className="shrink-0 inline-flex items-center gap-1.5 text-xs font-bold text-[var(--color-primary)] hover:underline">
                                View <ExternalLink size={12} />
                            </a>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">
                            No notice uploaded yet — the site is showing the original pamphlet bundled with the app.
                        </p>
                    )}
                </div>

                {/* Replace */}
                <form onSubmit={handleUpload} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Replace with a new PDF</label>
                        <label className={`flex items-center gap-3 border-2 border-dashed rounded-2xl px-4 py-4 cursor-pointer transition-colors ${file ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-[var(--color-primary)]'}`}>
                            <UploadCloud size={20} className={file ? 'text-green-500' : 'text-gray-400'} />
                            <span className={`text-sm font-medium ${file ? 'text-green-700' : 'text-gray-500'}`}>
                                {file ? file.name : 'Click to choose a PDF (max 10 MB)'}
                            </span>
                            <input type="file" accept="application/pdf" className="hidden" onChange={handleSelect} />
                        </label>
                    </div>

                    {saving && (
                        <div className="space-y-1">
                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-[var(--color-primary)] transition-all duration-200" style={{ width: `${progress}%` }} />
                            </div>
                            <p className="text-[10px] font-bold text-gray-400 text-right">{progress}%</p>
                        </div>
                    )}

                    <Button type="submit" disabled={saving || !file} className="w-full h-13 rounded-2xl bg-gray-900 hover:bg-black text-white font-black">
                        {saving ? <><Loader2 className="animate-spin mr-2" size={16} /> Uploading...</> : 'Publish Notice'}
                    </Button>
                    <p className="text-[10px] text-center text-gray-400">
                        The previous PDF is deleted automatically. Members see the new file immediately.
                    </p>
                </form>
            </div>
        </div>
    );
};

export default SiteContentTab;
