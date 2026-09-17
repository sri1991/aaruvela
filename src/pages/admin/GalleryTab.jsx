import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { uploadAdminAsset } from '../../lib/upload';
import { Button, Input } from '../../components/ui';
import { toast } from 'react-hot-toast';
import { Images, Loader2, Plus, XCircle, Trash2, Pencil, UploadCloud, EyeOff } from 'lucide-react';
import { motion as Motion, AnimatePresence } from 'framer-motion';

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

const EMPTY_FORM = { image_url: '', image_path: '', caption: '', sort_order: 0, active: true };

const GalleryTab = () => {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [imageFile, setImageFile] = useState(null);
    const [saving, setSaving] = useState(false);

    const fetchAll = async () => {
        try {
            const res = await api.get('/gallery/all');
            setImages(res.data);
        } catch {
            toast.error('Failed to load gallery images');
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

    const openEdit = (image) => {
        setEditing(image);
        setForm({
            image_url: image.image_url || '',
            image_path: image.image_path || '',
            caption: image.caption || '',
            sort_order: image.sort_order ?? 0,
            active: !!image.active,
        });
        setImageFile(null);
        setShowModal(true);
    };

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { toast.error('Use a JPG, PNG or WebP image'); return; }
        if (file.size > MAX_IMAGE_BYTES) { toast.error('Image too large (max 4 MB)'); return; }
        setImageFile(file);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!imageFile && !form.image_url) { toast.error('Choose an image to upload'); return; }
        setSaving(true);
        try {
            let { image_url, image_path } = form;
            if (imageFile) {
                const uploaded = await uploadAdminAsset('gallery', imageFile);
                image_url = uploaded.url;
                image_path = uploaded.path;
            }

            const payload = {
                image_url,
                image_path,
                caption: form.caption || null,
                sort_order: Number(form.sort_order) || 0,
                active: form.active,
            };

            if (editing) {
                await api.put(`/gallery/${editing.id}`, payload);
                toast.success('Image updated');
            } else {
                await api.post('/gallery', payload);
                toast.success('Image added');
            }
            setShowModal(false);
            fetchAll();
        } catch (err) {
            toast.error(err.response?.data?.detail || err.message || 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const toggleActive = async (image) => {
        setBusyId(image.id);
        try {
            await api.put(`/gallery/${image.id}`, { active: !image.active });
            fetchAll();
        } catch {
            toast.error('Failed to update');
        } finally {
            setBusyId(null);
        }
    };

    const handleDelete = async (image) => {
        if (!window.confirm('Remove this image from the gallery? This cannot be undone.')) return;
        setBusyId(image.id);
        try {
            await api.delete(`/gallery/${image.id}`);
            toast.success('Image removed');
            fetchAll();
        } catch {
            toast.error('Failed to delete');
        } finally {
            setBusyId(null);
        }
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[var(--color-primary)] h-8 w-8" /></div>;

    const liveCount = images.filter(i => i.active).length;

    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
                    <Images className="text-[var(--color-primary)] h-5 w-5" />
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Live on home page</p>
                        <p className="text-xl font-black text-gray-900">{liveCount}</p>
                    </div>
                </div>
                <Button onClick={openCreate} className="bg-gray-900 hover:bg-black text-white px-5 rounded-2xl h-11 shadow-lg">
                    <Plus size={16} className="mr-2" /> Add Image
                </Button>
            </div>

            {images.length === 0 ? (
                <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 py-16 text-center text-gray-400">
                    No gallery images yet.
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {images.map(image => (
                        <div key={image.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group">
                            <div className="relative aspect-[4/3] bg-gray-100">
                                <img src={image.image_url} alt={image.caption || ''} className="w-full h-full object-cover" />
                                {!image.active && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-1.5 text-white text-xs font-bold uppercase tracking-wide">
                                        <EyeOff size={13} /> Hidden
                                    </div>
                                )}
                                <span className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                    #{image.sort_order ?? 0}
                                </span>
                            </div>
                            <div className="p-3 space-y-2">
                                <p className="text-xs text-gray-600 line-clamp-1 min-h-[1rem]">{image.caption || '—'}</p>
                                <div className="flex items-center justify-between gap-2">
                                    <Button size="sm" variant="outline" className="h-8 px-3 rounded-lg text-xs flex-1"
                                        onClick={() => toggleActive(image)} disabled={busyId === image.id}>
                                        {image.active ? 'Hide' : 'Show'}
                                    </Button>
                                    <Button size="sm" variant="outline" className="h-8 w-8 p-0 rounded-lg" title="Edit"
                                        onClick={() => openEdit(image)} disabled={busyId === image.id}>
                                        <Pencil size={14} />
                                    </Button>
                                    <Button size="sm" variant="outline" className="h-8 w-8 p-0 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200" title="Delete"
                                        onClick={() => handleDelete(image)} disabled={busyId === image.id}>
                                        <Trash2 size={14} />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <AnimatePresence>
                {showModal && (
                    <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <Motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                            className="bg-white rounded-[2.5rem] w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gray-900 rounded-xl text-white"><Images size={18} /></div>
                                    <h2 className="text-lg font-black text-gray-900">{editing ? 'Edit' : 'Add'} Image</h2>
                                </div>
                                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-900"><XCircle size={22} /></button>
                            </div>

                            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Photo</label>
                                    <label className={`flex items-center gap-3 border-2 border-dashed rounded-2xl px-4 py-3 cursor-pointer transition-colors ${imageFile || form.image_url ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-[var(--color-primary)]'}`}>
                                        <UploadCloud size={18} className={imageFile || form.image_url ? 'text-green-500' : 'text-gray-400'} />
                                        <span className={`text-sm font-medium truncate ${imageFile || form.image_url ? 'text-green-700' : 'text-gray-500'}`}>
                                            {imageFile ? imageFile.name : form.image_url ? 'Current image kept — click to replace' : 'Click to upload (max 4 MB)'}
                                        </span>
                                        <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageSelect} />
                                    </label>
                                </div>

                                <Input label="Caption (optional)" value={form.caption} onChange={e => setForm({ ...form, caption: e.target.value })} />

                                <div className="grid grid-cols-2 gap-4 items-end">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Sort order</label>
                                        <input type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: e.target.value })}
                                            className="w-full h-12 rounded-2xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-900 focus:outline-none focus:border-[var(--color-primary)]" />
                                    </div>
                                    <label className="flex items-center gap-3 cursor-pointer pb-3">
                                        <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })}
                                            className="w-4 h-4 accent-[var(--color-primary)]" />
                                        <span className="text-sm font-bold text-gray-700">Show on home page</span>
                                    </label>
                                </div>

                                <Button type="submit" disabled={saving} className="w-full h-13 rounded-2xl bg-gray-900 hover:bg-black text-white font-black mt-2">
                                    {saving ? <Loader2 className="animate-spin" /> : editing ? 'Save Changes' : 'Add Image'}
                                </Button>
                            </form>
                        </Motion.div>
                    </Motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default GalleryTab;
