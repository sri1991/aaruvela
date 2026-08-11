import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { uploadAdminAsset } from '../../lib/upload';
import { Button, Input } from '../../components/ui';
import { toast } from 'react-hot-toast';
import { Megaphone, Loader2, Plus, XCircle, Pin, PinOff, Trash2, Pencil, UploadCloud } from 'lucide-react';
import { motion as Motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = ['GENERAL', 'EVENT', 'URGENT', 'MEETING'];
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

const EMPTY_FORM = {
    title: '', body: '', category: 'GENERAL', link_url: '',
    image_url: '', image_path: '', expires_at: '', status: 'PUBLISHED', pinned: false,
};

const statusStyles = {
    PUBLISHED: 'bg-green-50 text-green-700 border-green-200',
    DRAFT:     'bg-gray-100 text-gray-600 border-gray-200',
    ARCHIVED:  'bg-amber-50 text-amber-700 border-amber-200',
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

// datetime-local wants `YYYY-MM-DDTHH:mm` in local time
const toLocalInput = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const AnnouncementsTab = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [imageFile, setImageFile] = useState(null);
    const [saving, setSaving] = useState(false);

    const fetchAll = async () => {
        try {
            const res = await api.get('/announcements/all');
            setItems(res.data);
        } catch {
            toast.error('Failed to load announcements');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAll(); }, []);

    const openCreate = () => {
        setEditing(null);
        setForm(EMPTY_FORM);
        setImageFile(null);
        setShowModal(true);
    };

    const openEdit = (item) => {
        setEditing(item);
        setForm({
            title: item.title || '',
            body: item.body || '',
            category: item.category || 'GENERAL',
            link_url: item.link_url || '',
            image_url: item.image_url || '',
            image_path: item.image_path || '',
            expires_at: toLocalInput(item.expires_at),
            status: item.status || 'PUBLISHED',
            pinned: !!item.pinned,
        });
        setImageFile(null);
        setShowModal(true);
    };

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { toast.error('Use a JPG, PNG or WebP image'); return; }
        if (file.size > MAX_IMAGE_BYTES) { toast.error('Image too large (max 2 MB)'); return; }
        setImageFile(file);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            let { image_url, image_path } = form;
            if (imageFile) {
                const uploaded = await uploadAdminAsset('announcements', imageFile);
                image_url = uploaded.url;
                image_path = uploaded.path;
            }

            const payload = {
                title: form.title,
                body: form.body,
                category: form.category,
                link_url: form.link_url || null,
                image_url: image_url || null,
                image_path: image_path || null,
                pinned: form.pinned,
                status: form.status,
                expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
            };

            if (editing) {
                await api.put(`/announcements/${editing.id}`, payload);
                toast.success('Announcement updated');
            } else {
                await api.post('/announcements', payload);
                toast.success('Announcement created');
            }
            setShowModal(false);
            fetchAll();
        } catch (err) {
            toast.error(err.response?.data?.detail || err.message || 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const togglePin = async (item) => {
        setBusyId(item.id);
        try {
            await api.put(`/announcements/${item.id}`, { pinned: !item.pinned });
            fetchAll();
        } catch {
            toast.error('Failed to update');
        } finally {
            setBusyId(null);
        }
    };

    const handleDelete = async (item) => {
        if (!window.confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
        setBusyId(item.id);
        try {
            await api.delete(`/announcements/${item.id}`);
            toast.success('Announcement deleted');
            fetchAll();
        } catch {
            toast.error('Failed to delete');
        } finally {
            setBusyId(null);
        }
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[var(--color-primary)] h-8 w-8" /></div>;

    const liveCount = items.filter(i => i.status === 'PUBLISHED').length;

    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
                    <Megaphone className="text-[var(--color-primary)] h-5 w-5" />
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Published</p>
                        <p className="text-xl font-black text-gray-900">{liveCount}</p>
                    </div>
                </div>
                <Button onClick={openCreate} className="bg-gray-900 hover:bg-black text-white px-5 rounded-2xl h-11 shadow-lg">
                    <Plus size={16} className="mr-2" /> New Announcement
                </Button>
            </div>

            <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Announcement</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Expires</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {items.length === 0 ? (
                                <tr><td colSpan="4" className="px-6 py-12 text-center text-gray-400">No announcements yet.</td></tr>
                            ) : items.map(item => (
                                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-start gap-2">
                                            {item.pinned && <Pin size={13} className="text-[var(--color-primary)] mt-0.5 shrink-0" />}
                                            <div className="min-w-0">
                                                <p className="font-bold text-gray-900 text-sm">{item.title}</p>
                                                <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{item.body}</p>
                                                <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase bg-gray-50 text-gray-600 border-gray-200">
                                                    {item.category}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase ${statusStyles[item.status]}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-gray-500">{item.expires_at ? fmtDate(item.expires_at) : 'Never'}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button size="sm" variant="outline" className="h-9 w-9 p-0 rounded-lg" title={item.pinned ? 'Unpin' : 'Pin to top'}
                                                onClick={() => togglePin(item)} disabled={busyId === item.id}>
                                                {item.pinned ? <PinOff size={15} /> : <Pin size={15} />}
                                            </Button>
                                            <Button size="sm" variant="outline" className="h-9 w-9 p-0 rounded-lg" title="Edit"
                                                onClick={() => openEdit(item)} disabled={busyId === item.id}>
                                                <Pencil size={15} />
                                            </Button>
                                            <Button size="sm" variant="outline" className="h-9 w-9 p-0 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200" title="Delete"
                                                onClick={() => handleDelete(item)} disabled={busyId === item.id}>
                                                <Trash2 size={15} />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <AnimatePresence>
                {showModal && (
                    <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <Motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                            className="bg-white rounded-[2.5rem] w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gray-900 rounded-xl text-white"><Megaphone size={18} /></div>
                                    <h2 className="text-lg font-black text-gray-900">{editing ? 'Edit' : 'New'} Announcement</h2>
                                </div>
                                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-900"><XCircle size={22} /></button>
                            </div>

                            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
                                <Input label="Title" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Message</label>
                                    <textarea rows={5} required value={form.body} onChange={e => setForm({ ...form, body: e.target.value })}
                                        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-[var(--color-primary)] resize-none"
                                        placeholder="What do you want to tell the community?" />
                                    <p className="text-[10px] text-gray-400 ml-1">Line breaks are preserved. Plain text only.</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Category</label>
                                        <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                                            className="w-full h-12 rounded-2xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-900 focus:outline-none focus:border-[var(--color-primary)] outline-none">
                                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Status</label>
                                        <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                                            className="w-full h-12 rounded-2xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-900 focus:outline-none focus:border-[var(--color-primary)] outline-none">
                                            <option value="PUBLISHED">Published</option>
                                            <option value="DRAFT">Draft</option>
                                            <option value="ARCHIVED">Archived</option>
                                        </select>
                                    </div>
                                </div>

                                <Input label="Link (optional)" value={form.link_url} placeholder="https://..."
                                    onChange={e => setForm({ ...form, link_url: e.target.value })} />

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Expires on (optional)</label>
                                    <input type="datetime-local" value={form.expires_at} onChange={e => setForm({ ...form, expires_at: e.target.value })}
                                        className="w-full h-12 rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 focus:outline-none focus:border-[var(--color-primary)]" />
                                    <p className="text-[10px] text-gray-400 ml-1">Leave blank to keep it up until you archive it.</p>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Image (optional)</label>
                                    <label className={`flex items-center gap-3 border-2 border-dashed rounded-2xl px-4 py-3 cursor-pointer transition-colors ${imageFile || form.image_url ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-[var(--color-primary)]'}`}>
                                        <UploadCloud size={18} className={imageFile || form.image_url ? 'text-green-500' : 'text-gray-400'} />
                                        <span className={`text-sm font-medium truncate ${imageFile || form.image_url ? 'text-green-700' : 'text-gray-500'}`}>
                                            {imageFile ? imageFile.name : form.image_url ? 'Current image kept — click to replace' : 'Click to add an image (max 2 MB)'}
                                        </span>
                                        <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageSelect} />
                                    </label>
                                </div>

                                <label className="flex items-center gap-3 cursor-pointer pt-1">
                                    <input type="checkbox" checked={form.pinned} onChange={e => setForm({ ...form, pinned: e.target.checked })}
                                        className="w-4 h-4 accent-[var(--color-primary)]" />
                                    <span className="text-sm font-bold text-gray-700">Pin to the top</span>
                                </label>

                                <Button type="submit" disabled={saving} className="w-full h-13 rounded-2xl bg-gray-900 hover:bg-black text-white font-black mt-2">
                                    {saving ? <Loader2 className="animate-spin" /> : editing ? 'Save Changes' : 'Create Announcement'}
                                </Button>
                            </form>
                        </Motion.div>
                    </Motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default AnnouncementsTab;
