import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { toast } from 'react-hot-toast';
import { CheckCircle, Loader2 } from 'lucide-react';

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

export default RenewalsTab;
