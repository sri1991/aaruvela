import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { Button } from '../../components/ui';
import { toast } from 'react-hot-toast';
import { XCircle, Loader2, Plus, TrendingUp, TrendingDown, Wallet, IndianRupee } from 'lucide-react';
import { motion as Motion, AnimatePresence } from 'framer-motion';

const INCOME_CATEGORIES  = ['MEMBERSHIP_FEE', 'DONATION', 'EVENT', 'GRANT', 'OTHER'];
const EXPENSE_CATEGORIES = ['EVENT', 'MAINTENANCE', 'PRINTING', 'TRAVEL', 'ADMIN', 'OTHER'];

const fmt = (n) => `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const AccountsTab = () => {
    const [summary, setSummary]         = useState({ total_income: 0, total_expense: 0, net_balance: 0 });
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading]         = useState(true);
    const [showModal, setShowModal]     = useState(false);
    const [form, setForm]               = useState({ type: 'INCOME', category: 'MEMBERSHIP_FEE', amount: '', description: '', transaction_date: '' });
    const [saving, setSaving]           = useState(false);

    const fetchAll = async () => {
        try {
            const [sumRes, txRes] = await Promise.all([
                api.get('/accounts/summary'),
                api.get('/accounts/transactions'),
            ]);
            setSummary(sumRes.data);
            setTransactions(txRes.data);
        } catch {
            toast.error('Failed to load accounts');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAll(); }, []);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0) {
            toast.error('Enter a valid amount'); return;
        }
        setSaving(true);
        try {
            await api.post('/accounts/transactions', {
                type:             form.type,
                category:         form.category,
                amount:           parseFloat(form.amount),
                description:      form.description || null,
                transaction_date: form.transaction_date || null,
            });
            toast.success('Transaction recorded');
            setShowModal(false);
            setForm({ type: 'INCOME', category: 'MEMBERSHIP_FEE', amount: '', description: '', transaction_date: '' });
            fetchAll();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const categories = form.type === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[var(--color-primary)] h-8 w-8" /></div>;

    return (
        <>
            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                    <div className="p-3 bg-green-50 rounded-xl"><TrendingUp size={22} className="text-green-600" /></div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Income</p>
                        <p className="text-xl font-black text-green-600">{fmt(summary.total_income)}</p>
                    </div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                    <div className="p-3 bg-red-50 rounded-xl"><TrendingDown size={22} className="text-red-500" /></div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Expenses</p>
                        <p className="text-xl font-black text-red-500">{fmt(summary.total_expense)}</p>
                    </div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                    <div className="p-3 bg-amber-50 rounded-xl"><Wallet size={22} className="text-amber-500" /></div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Net Balance</p>
                        <p className={`text-xl font-black ${summary.net_balance >= 0 ? 'text-gray-900' : 'text-red-500'}`}>
                            {fmt(summary.net_balance)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Table header */}
            <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold text-gray-500">{transactions.length} transaction{transactions.length !== 1 ? 's' : ''}</p>
                <div className="flex gap-2">
                    <Button onClick={async () => {
                        try {
                            const res = await api.post('/accounts/backfill');
                            toast.success(res.data.message);
                            fetchAll();
                        } catch { toast.error('Backfill failed'); }
                    }} className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 rounded-2xl h-10 text-xs shadow-sm">
                        Backfill Existing Members
                    </Button>
                    <Button onClick={() => setShowModal(true)} className="bg-gray-900 hover:bg-black text-white px-5 rounded-2xl h-10 text-xs shadow-lg">
                        <Plus size={15} className="mr-1.5" /> Add Transaction
                    </Button>
                </div>
            </div>

            {/* Ledger table */}
            <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Date</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Type</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Category</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Description / Member</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {transactions.length === 0 ? (
                                <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-400">No transactions yet.</td></tr>
                            ) : transactions.map(tx => (
                                <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">{fmtDate(tx.transaction_date)}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase ${tx.type === 'INCOME' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                                            {tx.type === 'INCOME' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                            {tx.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-gray-600 font-medium">{tx.category.replace(/_/g, ' ')}</td>
                                    <td className="px-6 py-4 text-sm">
                                        <p className="text-gray-700">{tx.description || '—'}</p>
                                        {tx.member?.full_name && (
                                            <p className="text-xs text-gray-400 mt-0.5">{tx.member.full_name} · {tx.member.member_id}</p>
                                        )}
                                    </td>
                                    <td className={`px-6 py-4 text-right font-black text-sm ${tx.type === 'INCOME' ? 'text-green-600' : 'text-red-500'}`}>
                                        {tx.type === 'INCOME' ? '+' : '−'}{fmt(tx.amount)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Transaction Modal */}
            <AnimatePresence>
                {showModal && (
                    <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <Motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                            className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gray-900 rounded-xl text-white"><IndianRupee size={18} /></div>
                                    <h2 className="text-lg font-black text-gray-900">Add Transaction</h2>
                                </div>
                                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-900"><XCircle size={22} /></button>
                            </div>
                            <form onSubmit={handleAdd} className="p-6 space-y-4">
                                {/* Income / Expense toggle */}
                                <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl">
                                    {['INCOME', 'EXPENSE'].map(t => (
                                        <button key={t} type="button"
                                            onClick={() => setForm({ ...form, type: t, category: t === 'INCOME' ? 'MEMBERSHIP_FEE' : 'EVENT' })}
                                            className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-colors ${form.type === t ? (t === 'INCOME' ? 'bg-green-600 text-white' : 'bg-red-500 text-white') : 'text-gray-500'}`}>
                                            {t === 'INCOME' ? '↑ Income' : '↓ Expense'}
                                        </button>
                                    ))}
                                </div>

                                {/* Category */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Category</label>
                                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                                        className="w-full h-12 rounded-2xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-900 focus:outline-none focus:border-[var(--color-primary)] outline-none">
                                        {categories.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
                                    </select>
                                </div>

                                {/* Amount */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Amount (₹)</label>
                                    <input type="number" min="1" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                                        placeholder="0.00" required
                                        className="w-full h-12 rounded-2xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-900 focus:outline-none focus:border-[var(--color-primary)]" />
                                </div>

                                {/* Description */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Description (optional)</label>
                                    <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                                        placeholder="e.g. Ugadi celebration expenses"
                                        className="w-full h-12 rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 focus:outline-none focus:border-[var(--color-primary)]" />
                                </div>

                                {/* Date */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Date (leave blank for today)</label>
                                    <input type="date" value={form.transaction_date} onChange={e => setForm({ ...form, transaction_date: e.target.value })}
                                        className="w-full h-12 rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 focus:outline-none focus:border-[var(--color-primary)]" />
                                </div>

                                <Button type="submit" disabled={saving} className="w-full h-13 rounded-2xl bg-gray-900 hover:bg-black text-white font-black mt-2">
                                    {saving ? <Loader2 className="animate-spin" /> : 'Save Transaction'}
                                </Button>
                            </form>
                        </Motion.div>
                    </Motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default AccountsTab;
