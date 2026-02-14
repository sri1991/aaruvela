import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { Button, Input } from '../components/ui';
import { toast } from 'react-hot-toast';
import { CheckCircle, XCircle, User, Loader2, ShieldCheck, Plus, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../features/auth/AuthContext';

const AdminDashboard = () => {
    const { signOut } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newMember, setNewMember] = useState({
        phone: '',
        full_name: '',
        role: 'NORMAL',
        zonal_committee: '',
        regional_committee: ''
    });

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const response = await api.get('/admin/pending-requests');
            setRequests(response.data);
        } catch (error) {
            toast.error('Failed to fetch requests');
        } finally {
            setLoading(false);
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
            fetchRequests(); // Refresh list if needed (though it's for pending)
        } catch (error) {
            const detail = error.response?.data?.detail;
            const message = Array.isArray(detail)
                ? detail.map(d => d.msg).join(', ')
                : typeof detail === 'string'
                    ? detail
                    : 'Failed to add member';
            toast.error(message);
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="animate-spin text-[var(--color-primary)] h-10 w-10" />
        </div>
    );

    return (
        <div className="bg-gray-50 min-h-screen py-8 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900">Admin Dashboard</h1>
                        <p className="text-gray-500">Manage membership applications and approvals</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button
                            onClick={() => setShowAddModal(true)}
                            className="bg-gray-900 hover:bg-black text-white px-6 rounded-2xl h-14 shadow-lg shadow-gray-200"
                        >
                            <Plus size={18} className="mr-2" />
                            Add Member
                        </Button>
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
                            <ShieldCheck className="text-green-600 h-6 w-6" />
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active Requests</p>
                                <p className="text-xl font-black text-gray-900">{requests.length}</p>
                            </div>
                        </div>
                    </div>
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
                                    <tr>
                                        <td colSpan="4" className="px-6 py-12 text-center text-gray-400">
                                            No pending membership requests found.
                                        </td>
                                    </tr>
                                ) : (
                                    requests.map((req) => (
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
                                                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                                    {req.requested_role}
                                                </span>
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
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-9 w-9 p-0 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                                                        onClick={() => handleAction(req.user_id, 'REJECT')}
                                                        disabled={actionLoading === req.user_id}
                                                    >
                                                        <XCircle size={18} />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        className="h-9 px-4 rounded-lg bg-green-600 hover:bg-green-700 border-none flex items-center gap-2"
                                                        onClick={() => handleAction(req.user_id, 'APPROVE')}
                                                        isLoading={actionLoading === req.user_id}
                                                    >
                                                        <CheckCircle size={18} />
                                                        Approve
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Application Details Modal */}
            <AnimatePresence>
                {selectedRequest && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl border border-gray-100"
                        >
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
                                    {/* Personal Info */}
                                    <div className="space-y-4">
                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--color-primary)]">Personal Information</h3>
                                        <div className="space-y-2">
                                            <DetailItem label="Applicant Name" value={selectedRequest.application_data.full_name} />
                                            <DetailItem label="Father/Guardian" value={selectedRequest.application_data.father_guardian_name} />
                                            <DetailItem label="Age" value={selectedRequest.application_data.age} />
                                            <DetailItem label="DOB" value={selectedRequest.application_data.dob} />
                                            <DetailItem label="Sub Sect" value={selectedRequest.application_data.sub_sect} />
                                        </div>
                                    </div>

                                    {/* Contact & Professional */}
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
                                    <Button
                                        variant="outline"
                                        className="flex-1 rounded-2xl h-14 border-red-100 text-red-600 hover:bg-red-50 hover:border-red-200"
                                        onClick={() => handleAction(selectedRequest.user_id, 'REJECT')}
                                        disabled={actionLoading}
                                    >
                                        Reject Application
                                    </Button>
                                    <Button
                                        className="flex-1 rounded-2xl h-14 bg-green-600 hover:bg-green-700 shadow-xl shadow-green-200"
                                        onClick={() => handleAction(selectedRequest.user_id, 'APPROVE')}
                                        isLoading={actionLoading === selectedRequest.user_id}
                                    >
                                        Approve & Activate
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Add Member Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl"
                        >
                            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gray-900 rounded-xl text-white">
                                        <UserPlus size={20} />
                                    </div>
                                    <h2 className="text-xl font-black text-gray-900">Add New Member</h2>
                                </div>
                                <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-900 transition-colors">
                                    <XCircle size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleAddMember} className="p-8 space-y-4">
                                <Input label="Full Name" required value={newMember.full_name} onChange={(e) => setNewMember({ ...newMember, full_name: e.target.value })} />
                                <Input label="Phone Number" required value={newMember.phone} onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })} placeholder="e.g. 9876543210" />

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Membership Type</label>
                                        <select
                                            className="w-full h-12 rounded-2xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-900 focus-visible:outline-none focus:border-[var(--color-primary)] outline-none"
                                            value={newMember.role}
                                            onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                                        >
                                            <option value="PERMANENT">Permanent</option>
                                            <option value="NORMAL">Normal</option>
                                            <option value="ASSOCIATED">Associated</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Zone</label>
                                        <select
                                            className="w-full h-12 rounded-2xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-900 focus-visible:outline-none focus:border-[var(--color-primary)] outline-none"
                                            value={newMember.zonal_committee}
                                            onChange={(e) => setNewMember({ ...newMember, zonal_committee: e.target.value })}
                                        >
                                            <option value="">Select Zone</option>
                                            {['Uttar Andhra', 'Rayalaseema', 'Dakshina Kosta Andhra', 'Madhya Kosta'].map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Regional Committee</label>
                                    <select
                                        className="w-full h-12 rounded-2xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-900 focus-visible:outline-none focus:border-[var(--color-primary)] outline-none"
                                        value={newMember.regional_committee}
                                        onChange={(e) => setNewMember({ ...newMember, regional_committee: e.target.value })}
                                    >
                                        <option value="">Select Region</option>
                                        {['Telangana', 'Tamil Nadu', 'Karnataka', 'Rest of India'].map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={actionLoading === 'adding'}
                                    className="w-full h-14 bg-gray-900 hover:bg-black text-white rounded-2xl mt-4 shadow-xl shadow-gray-200"
                                >
                                    {actionLoading === 'adding' ? <Loader2 className="animate-spin" /> : 'Create Active Membership'}
                                </Button>
                                <p className="text-[10px] text-center text-gray-400 font-bold uppercase tracking-widest">Default PIN: 1234</p>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
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

