import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { Button } from '../../components/ui';
import { toast } from 'react-hot-toast';
import { Heart, CheckCircle, Loader2 } from 'lucide-react';

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
        } catch {
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

export default MatrimonyTab;
