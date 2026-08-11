import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { uploadAdminAsset } from '../../lib/upload';
import { Button, Input } from '../../components/ui';
import { toast } from 'react-hot-toast';
import { Megaphone, Loader2, Plus, XCircle, Trash2, Pencil, UploadCloud, MousePointerClick, Eye } from 'lucide-react';
import { motion as Motion, AnimatePresence } from 'framer-motion';

const PLACEMENTS = [
    { id: 'HOME_BANNER', label: 'Home banner' },
    { id: 'NEWS_LIST',   label: 'News page' },
    { id: 'MATRIMONY',   label: 'Matrimony page' },
    { id: 'FOOTER',      label: 'Footer' },
];
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

const EMPTY_FORM = {
    title: '', subtitle: '', target_url: '', placement: 'HOME_BANNER',
    advertiser_name: '', contact_info: '', payment_ref: '',
    image_url: '', image_path: '', sort_order: 0, active: true,
    starts_at: '', ends_at: '',
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const toLocalInput = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const isLive = (ad) => {
    if (!ad.active) return false;
    const now = new Date();
    if (ad.starts_at && new Date(ad.starts_at) > now) return false;
    if (ad.ends_at && new Date(ad.ends_at) <= now) return false;
    return true;
};

const AdsTab = () => {
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [imageFile, setImageFile] = useState(null);
    const [saving, setSaving] = useState(false);

    const fetchAll = async () => {
        try {
            const res = await api.get('/ads/all');
            setAds(res.data);
        } catch {
            toast.error('Failed to load ads');
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

    const openEdit = (ad) => {
        setEditing(ad);
        setForm({
            title: ad.title || '',
            subtitle: ad.subtitle || '',
            target_url: ad.target_url || '',
            placement: ad.placement || 'HOME_BANNER',
            advertiser_name: ad.advertiser_name || '',
            contact_info: ad.contact_info || '',
            payment_ref: ad.payment_ref || '',
            image_url: ad.image_url || '',
            image_path: ad.image_path || '',
            sort_order: ad.sort_order ?? 0,
            active: !!ad.active,
            starts_at: toLocalInput(ad.starts_at),
            ends_at: toLocalInput(ad.ends_at),
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
                const uploaded = await uploadAdminAsset('ads', imageFile);
                image_url = uploaded.url;
                image_path = uploaded.path;
            }

            const payload = {
                title: form.title,
                subtitle: form.subtitle || null,
                target_url: form.target_url || null,
                placement: form.placement,
                advertiser_name: form.advertiser_name || null,
                contact_info: form.contact_info || null,
                payment_ref: form.payment_ref || null,
                image_url: image_url || null,
                image_path: image_path || null,
                sort_order: Number(form.sort_order) || 0,
                active: form.active,
                starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
                ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
            };

            if (editing) {
                await api.put(`/ads/${editing.id}`, payload);
                toast.success('Ad updated');
            } else {
                await api.post('/ads', payload);
                toast.success('Ad created');
            }
            setShowModal(false);
            fetchAll();
        } catch (err) {
            toast.error(err.response?.data?.detail || err.message || 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const toggleActive = async (ad) => {
        setBusyId(ad.id);
        try {
            await api.put(`/ads/${ad.id}`, { active: !ad.active });
            fetchAll();
        } catch {
            toast.error('Failed to update');
        } finally {
            setBusyId(null);
        }
    };

    const handleDelete = async (ad) => {
        if (!window.confirm(`Delete the ad "${ad.title}"? This cannot be undone.`)) return;
        setBusyId(ad.id);
        try {
            await api.delete(`/ads/${ad.id}`);
            toast.success('Ad deleted');
            fetchAll();
        } catch {
            toast.error('Failed to delete');
        } finally {
            setBusyId(null);
        }
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[var(--color-primary)] h-8 w-8" /></div>;

    const liveCount = ads.filter(isLive).length;

    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
                    <Megaphone className="text-amber-500 h-5 w-5" />
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Live now</p>
                        <p className="text-xl font-black text-gray-900">{liveCount}</p>
                    </div>
                </div>
                <Button onClick={openCreate} className="bg-gray-900 hover:bg-black text-white px-5 rounded-2xl h-11 shadow-lg">
                    <Plus size={16} className="mr-2" /> New Ad
                </Button>
            </div>

            {liveCount === 0 && (
                <p className="text-xs text-gray-500 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 mb-4">
                    No ads are live, so the site is showing the default "Advertise with us" banner.
                </p>
            )}

            <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Ad</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Placement</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Runs</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Performance</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {ads.length === 0 ? (
                                <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-400">No ads yet.</td></tr>
                            ) : ads.map(ad => (
                                <tr key={ad.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {ad.image_url ? (
                                                <img src={ad.image_url} alt="" className="w-16 h-10 object-cover rounded-lg border border-gray-100 shrink-0" />
                                            ) : (
                                                <div className="w-16 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                                                    <Megaphone size={14} className="text-gray-300" />
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <p className="font-bold text-gray-900 text-sm">{ad.title}</p>
                                                <p className="text-xs text-gray-500 line-clamp-1">{ad.advertiser_name || ad.subtitle || '—'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-gray-600 font-medium">
                                        {PLACEMENTS.find(p => p.id === ad.placement)?.label || ad.placement}
                                    </td>
                                    <td className="px-6 py-4 text-xs text-gray-500">
                                        {fmtDate(ad.starts_at)} → {ad.ends_at ? fmtDate(ad.ends_at) : 'open'}
                                        <span className={`block mt-1 font-black uppercase text-[10px] ${isLive(ad) ? 'text-green-600' : 'text-gray-400'}`}>
                                            {isLive(ad) ? 'Live' : ad.active ? 'Scheduled / ended' : 'Paused'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-gray-600">
                                        <span className="inline-flex items-center gap-1 mr-3"><Eye size={12} className="text-gray-400" /> {ad.impressions ?? 0}</span>
                                        <span className="inline-flex items-center gap-1"><MousePointerClick size={12} className="text-gray-400" /> {ad.clicks ?? 0}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button size="sm" variant="outline" className="h-9 px-3 rounded-lg text-xs"
                                                onClick={() => toggleActive(ad)} disabled={busyId === ad.id}>
                                                {ad.active ? 'Pause' : 'Activate'}
                                            </Button>
                                            <Button size="sm" variant="outline" className="h-9 w-9 p-0 rounded-lg" title="Edit"
                                                onClick={() => openEdit(ad)} disabled={busyId === ad.id}>
                                                <Pencil size={15} />
                                            </Button>
                                            <Button size="sm" variant="outline" className="h-9 w-9 p-0 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200" title="Delete"
                                                onClick={() => handleDelete(ad)} disabled={busyId === ad.id}>
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
                                    <h2 className="text-lg font-black text-gray-900">{editing ? 'Edit' : 'New'} Ad</h2>
                                </div>
                                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-900"><XCircle size={22} /></button>
                            </div>

                            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
                                <Input label="Headline" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                                <Input label="Sub-text (optional)" value={form.subtitle} onChange={e => setForm({ ...form, subtitle: e.target.value })} />
                                <Input label="Click-through URL" value={form.target_url} placeholder="https://..."
                                    onChange={e => setForm({ ...form, target_url: e.target.value })} />

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Creative</label>
                                    <label className={`flex items-center gap-3 border-2 border-dashed rounded-2xl px-4 py-3 cursor-pointer transition-colors ${imageFile || form.image_url ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-[var(--color-primary)]'}`}>
                                        <UploadCloud size={18} className={imageFile || form.image_url ? 'text-green-500' : 'text-gray-400'} />
                                        <span className={`text-sm font-medium truncate ${imageFile || form.image_url ? 'text-green-700' : 'text-gray-500'}`}>
                                            {imageFile ? imageFile.name : form.image_url ? 'Current image kept — click to replace' : 'Click to upload (max 2 MB)'}
                                        </span>
                                        <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageSelect} />
                                    </label>
                                    <p className="text-[10px] text-gray-400 ml-1">Best results at 1200×300 — wider images are cropped to fit.</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Placement</label>
                                        <select value={form.placement} onChange={e => setForm({ ...form, placement: e.target.value })}
                                            className="w-full h-12 rounded-2xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-900 focus:outline-none focus:border-[var(--color-primary)] outline-none">
                                            {PLACEMENTS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Sort order</label>
                                        <input type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: e.target.value })}
                                            className="w-full h-12 rounded-2xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-900 focus:outline-none focus:border-[var(--color-primary)]" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Starts</label>
                                        <input type="datetime-local" value={form.starts_at} onChange={e => setForm({ ...form, starts_at: e.target.value })}
                                            className="w-full h-12 rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 focus:outline-none focus:border-[var(--color-primary)]" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Ends (optional)</label>
                                        <input type="datetime-local" value={form.ends_at} onChange={e => setForm({ ...form, ends_at: e.target.value })}
                                            className="w-full h-12 rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 focus:outline-none focus:border-[var(--color-primary)]" />
                                    </div>
                                </div>

                                <Input label="Advertiser name (optional)" value={form.advertiser_name} onChange={e => setForm({ ...form, advertiser_name: e.target.value })} />
                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="Contact (optional)" value={form.contact_info} onChange={e => setForm({ ...form, contact_info: e.target.value })} />
                                    <Input label="Payment ref (optional)" value={form.payment_ref} onChange={e => setForm({ ...form, payment_ref: e.target.value })} />
                                </div>

                                <label className="flex items-center gap-3 cursor-pointer pt-1">
                                    <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })}
                                        className="w-4 h-4 accent-[var(--color-primary)]" />
                                    <span className="text-sm font-bold text-gray-700">Active</span>
                                </label>

                                <Button type="submit" disabled={saving} className="w-full h-13 rounded-2xl bg-gray-900 hover:bg-black text-white font-black mt-2">
                                    {saving ? <Loader2 className="animate-spin" /> : editing ? 'Save Changes' : 'Create Ad'}
                                </Button>
                            </form>
                        </Motion.div>
                    </Motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default AdsTab;
