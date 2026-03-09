import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    User, Phone, ArrowLeft, UserPlus, CheckCircle,
    Upload, Download, AlertCircle, X, Loader2
} from 'lucide-react';
import { Button, Input } from '../components/ui';
import { toast } from 'react-hot-toast';
import api from '../lib/api';
import * as XLSX from 'xlsx';

const ZONES = ['Uttar Andhra', 'Rayalaseema', 'Dakshina Kosta Andhra', 'Madhya Kosta'];
const REGIONS = ['Andhra', 'Telangana', 'Tamil Nadu', 'Karnataka', 'Rest of India'];
const ROLES = ['PERMANENT', 'NORMAL', 'ASSOCIATED'];
const EMPTY_FORM = { full_name: '', phone: '', role: 'NORMAL', zonal_committee: '', regional_committee: '' };

const roleBadgeColor = {
    PERMANENT: 'bg-amber-100 text-amber-700 border-amber-200',
    NORMAL: 'bg-blue-100 text-blue-700 border-blue-200',
    ASSOCIATED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

const SelectField = ({ label, value, onChange, options, placeholder = 'Select...' }) => (
    <div className="space-y-1">
        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">{label}</label>
        <select
            value={value}
            onChange={onChange}
            className="w-full h-12 rounded-2xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-900 focus:outline-none focus:border-gray-400"
        >
            <option value="">{placeholder}</option>
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
    </div>
);

// ── Excel template download ──────────────────────────────────────────────────
const downloadTemplate = () => {
    const headers = ['full_name', 'phone', 'role', 'zonal_committee', 'regional_committee'];

    const notes = [
        ['INSTRUCTIONS — please read before filling'],
        [''],
        ['full_name        ', 'Required. Full name of the member.'],
        ['phone            ', 'Required. 10-digit mobile number (used to log in).'],
        ['role             ', `Required. One of: ${ROLES.join(', ')}`],
        ['zonal_committee  ', `Optional. One of: ${ZONES.join(', ')}`],
        ['regional_committee', `Optional. One of: ${REGIONS.join(', ')}`],
        [''],
        ['• Delete these instruction rows before uploading.'],
        ['• Do NOT change column headers in the Data sheet.'],
        ['• Default login PIN for all created members is 1234.'],
    ];

    const sampleData = [
        ['Ramesh Kumar', '9876543210', 'PERMANENT', 'Uttar Andhra', 'Andhra'],
        ['Sita Devi', '9123456780', 'NORMAL', 'Rayalaseema', 'Telangana'],
        ['Arjun Rao', '9000000001', 'ASSOCIATED', '', ''],
    ];

    const wb = XLSX.utils.book_new();

    // Data sheet
    const dataWs = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);

    // Column widths
    dataWs['!cols'] = [
        { wch: 30 }, // full_name
        { wch: 15 }, // phone
        { wch: 14 }, // role
        { wch: 26 }, // zonal_committee
        { wch: 22 }, // regional_committee
    ];

    // Header row style (bold)
    headers.forEach((_, i) => {
        const cell = dataWs[XLSX.utils.encode_cell({ r: 0, c: i })];
        if (cell) cell.s = { font: { bold: true } };
    });

    XLSX.utils.book_append_sheet(wb, dataWs, 'Members');

    // Instructions sheet
    const instrWs = XLSX.utils.aoa_to_sheet(notes);
    instrWs['!cols'] = [{ wch: 22 }, { wch: 70 }];
    XLSX.utils.book_append_sheet(wb, instrWs, 'Instructions');

    XLSX.writeFile(wb, 'Parishat_Member_Onboarding_Template.xlsx');
};

// ── Parse uploaded Excel ─────────────────────────────────────────────────────
const parseExcel = (file) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const wb = XLSX.read(e.target.result, { type: 'array' });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
                resolve(rows);
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });

const validateRow = (row, i) => {
    const errors = [];
    if (!String(row.full_name || '').trim()) errors.push('full_name is required');
    if (!/^\d{10}$/.test(String(row.phone || '').trim())) errors.push('phone must be 10 digits');
    const role = String(row.role || '').trim().toUpperCase();
    if (!ROLES.includes(role)) errors.push(`role must be one of ${ROLES.join(', ')}`);
    return errors.length ? { row: i + 2, errors } : null;
};

// ────────────────────────────────────────────────────────────────────────────
const OnboardMembers = () => {
    const navigate = useNavigate();
    const fileRef = useRef(null);

    // Manual entry
    const [form, setForm] = useState(EMPTY_FORM);
    const [formLoading, setFormLoading] = useState(false);
    const [created, setCreated] = useState(null);
    const [session, setSession] = useState([]);

    // Excel upload
    const [preview, setPreview] = useState(null);   // { rows, validationErrors }
    const [bulkLoading, setBulkLoading] = useState(false);
    const [bulkProgress, setBulkProgress] = useState(null); // { done, total, failed }

    const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

    // ── Manual submit ────────────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.full_name.trim()) { toast.error('Full name is required.'); return; }
        if (!/^\d{10}$/.test(form.phone.trim())) { toast.error('Enter a valid 10-digit phone number.'); return; }

        setFormLoading(true);
        try {
            const { data } = await api.post('/admin/create-member', {
                full_name: form.full_name.trim(),
                phone: form.phone.trim(),
                role: form.role,
                zonal_committee: form.zonal_committee || undefined,
                regional_committee: form.regional_committee || undefined,
            });
            const entry = { member_id: data.member_id, full_name: form.full_name.trim(), role: form.role, phone: form.phone.trim() };
            setCreated(entry);
            setSession(s => [entry, ...s]);
        } catch (err) {
            const detail = err.response?.data?.detail;
            toast.error(typeof detail === 'string' ? detail : 'Failed to create member.');
        } finally {
            setFormLoading(false);
        }
    };

    const handleAddAnother = () => { setForm(EMPTY_FORM); setCreated(null); };

    // ── Excel file selected ──────────────────────────────────────────────────
    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = '';

        try {
            const rows = await parseExcel(file);
            if (!rows.length) { toast.error('The file has no data rows.'); return; }

            const validationErrors = rows
                .map((row, i) => validateRow(row, i))
                .filter(Boolean);

            setPreview({ rows, validationErrors });
            setBulkProgress(null);
        } catch {
            toast.error('Could not read the file. Make sure it is a valid .xlsx file.');
        }
    };

    // ── Bulk upload ──────────────────────────────────────────────────────────
    const handleBulkUpload = async () => {
        if (!preview || preview.validationErrors.length) return;
        setBulkLoading(true);

        const total = preview.rows.length;
        let done = 0, failed = 0;
        const added = [];

        for (const row of preview.rows) {
            try {
                const { data } = await api.post('/admin/create-member', {
                    full_name: String(row.full_name).trim(),
                    phone: String(row.phone).trim(),
                    role: String(row.role).trim().toUpperCase(),
                    zonal_committee: String(row.zonal_committee || '').trim() || undefined,
                    regional_committee: String(row.regional_committee || '').trim() || undefined,
                });
                added.push({ member_id: data.member_id, full_name: String(row.full_name).trim(), role: String(row.role).trim().toUpperCase(), phone: String(row.phone).trim() });
                done++;
            } catch {
                failed++;
            }
            setBulkProgress({ done: done + failed, total, failed });
        }

        setSession(s => [...added.reverse(), ...s]);
        setBulkLoading(false);
        toast.success(`${done} member${done !== 1 ? 's' : ''} created${failed ? `, ${failed} failed` : ''}.`);
        setPreview(null);
    };

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4">
            <div className="max-w-5xl mx-auto">

                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => navigate('/admin')} className="p-2 rounded-xl hover:bg-gray-200 transition-colors text-gray-500">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900">Onboard Existing Members</h1>
                        <p className="text-sm text-gray-500">Enter minimum details — members can complete their profile after login.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6 items-start">
                    <div className="space-y-6">

                        {/* ── Excel Upload Section ── */}
                        <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 p-8">
                            <h2 className="text-lg font-black text-gray-900 mb-1">Bulk Upload via Excel</h2>
                            <p className="text-xs text-gray-400 mb-6">Download the template, fill in member details, then upload.</p>

                            <div className="flex flex-wrap gap-3 mb-6">
                                <Button
                                    onClick={downloadTemplate}
                                    variant="outline"
                                    className="h-11 rounded-2xl flex items-center gap-2 border-gray-200"
                                >
                                    <Download size={15} />
                                    Download Template (.xlsx)
                                </Button>
                                <Button
                                    onClick={() => fileRef.current?.click()}
                                    className="h-11 rounded-2xl bg-gray-900 hover:bg-black text-white flex items-center gap-2"
                                >
                                    <Upload size={15} />
                                    Upload Filled Excel
                                </Button>
                                <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} />
                            </div>

                            {/* Preview */}
                            {preview && (
                                <div className="space-y-4">
                                    {/* Validation errors */}
                                    {preview.validationErrors.length > 0 && (
                                        <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <AlertCircle size={15} className="text-red-500" />
                                                <span className="text-sm font-black text-red-700">Fix these errors before uploading</span>
                                            </div>
                                            <ul className="space-y-1">
                                                {preview.validationErrors.map((e, i) => (
                                                    <li key={i} className="text-xs text-red-600">
                                                        <span className="font-bold">Row {e.row}:</span> {e.errors.join(', ')}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Table preview */}
                                    <div className="overflow-x-auto rounded-2xl border border-gray-100">
                                        <table className="w-full text-xs">
                                            <thead className="bg-gray-50 border-b border-gray-100">
                                                <tr>
                                                    {['#', 'Full Name', 'Phone', 'Role', 'Zone', 'Region'].map(h => (
                                                        <th key={h} className="px-4 py-3 text-left font-black text-gray-400 uppercase tracking-wider text-[10px]">{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {preview.rows.map((row, i) => {
                                                    const hasError = preview.validationErrors.some(e => e.row === i + 2);
                                                    return (
                                                        <tr key={i} className={hasError ? 'bg-red-50' : ''}>
                                                            <td className="px-4 py-2 text-gray-400">{i + 1}</td>
                                                            <td className="px-4 py-2 font-bold text-gray-900">{row.full_name || <span className="text-red-400">—</span>}</td>
                                                            <td className="px-4 py-2 font-mono text-gray-700">{row.phone}</td>
                                                            <td className="px-4 py-2">
                                                                {ROLES.includes(String(row.role || '').toUpperCase())
                                                                    ? <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border uppercase ${roleBadgeColor[String(row.role).toUpperCase()]}`}>{String(row.role).toUpperCase()}</span>
                                                                    : <span className="text-red-400 font-bold">{row.role || '—'}</span>
                                                                }
                                                            </td>
                                                            <td className="px-4 py-2 text-gray-600">{row.zonal_committee || <span className="text-gray-300">—</span>}</td>
                                                            <td className="px-4 py-2 text-gray-600">{row.regional_committee || <span className="text-gray-300">—</span>}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Progress bar */}
                                    {bulkProgress && (
                                        <div>
                                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                                                <span>{bulkProgress.done} / {bulkProgress.total} processed</span>
                                                {bulkProgress.failed > 0 && <span className="text-red-500">{bulkProgress.failed} failed</span>}
                                            </div>
                                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gray-900 rounded-full transition-all duration-300"
                                                    style={{ width: `${(bulkProgress.done / bulkProgress.total) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex gap-3">
                                        <Button
                                            onClick={handleBulkUpload}
                                            disabled={bulkLoading || preview.validationErrors.length > 0}
                                            className="h-12 px-6 bg-gray-900 hover:bg-black text-white rounded-2xl flex items-center gap-2"
                                        >
                                            {bulkLoading
                                                ? <><Loader2 size={15} className="animate-spin" /> Uploading...</>
                                                : <><Upload size={15} /> Create {preview.rows.length} Member{preview.rows.length !== 1 ? 's' : ''}</>
                                            }
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => setPreview(null)}
                                            className="h-12 px-4 rounded-2xl"
                                            disabled={bulkLoading}
                                        >
                                            <X size={15} />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ── Manual Entry ── */}
                        <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
                            {!created ? (
                                <form onSubmit={handleSubmit} className="p-8 space-y-4">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2 bg-gray-900 rounded-xl text-white">
                                            <UserPlus size={18} />
                                        </div>
                                        <h2 className="text-lg font-black text-gray-900">Add Single Member</h2>
                                    </div>

                                    <Input
                                        label="Full Name"
                                        required
                                        value={form.full_name}
                                        onChange={set('full_name')}
                                        icon={<User className="h-4 w-4" />}
                                        placeholder="Member's full name"
                                    />
                                    <Input
                                        label="Phone Number"
                                        required
                                        type="tel"
                                        value={form.phone}
                                        onChange={(e) => setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                                        icon={<Phone className="h-4 w-4" />}
                                        placeholder="10-digit mobile (used to log in)"
                                    />

                                    <div className="grid grid-cols-2 gap-4">
                                        <SelectField label="Membership Type" value={form.role} onChange={set('role')} options={ROLES} />
                                        <SelectField label="Zone" value={form.zonal_committee} onChange={set('zonal_committee')} options={ZONES} placeholder="Select Zone" />
                                    </div>
                                    <SelectField label="Region" value={form.regional_committee} onChange={set('regional_committee')} options={REGIONS} placeholder="Select Region" />

                                    <div className="pt-2">
                                        <Button type="submit" disabled={formLoading} className="w-full h-14 bg-gray-900 hover:bg-black text-white rounded-2xl shadow-xl shadow-gray-200">
                                            {formLoading ? 'Creating...' : 'Create Profile & Activate'}
                                        </Button>
                                        <p className="text-[10px] text-center text-gray-400 font-bold uppercase tracking-widest mt-3">
                                            Default login PIN: <span className="text-gray-700">1234</span>
                                        </p>
                                    </div>
                                </form>
                            ) : (
                                <div className="p-8 text-center space-y-6">
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                        <CheckCircle className="text-green-600 w-8 h-8" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-gray-900">{created.full_name}</h2>
                                        <p className="text-sm text-gray-500 mt-1">Profile created and activated</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5 space-y-3 text-left">
                                        <Row label="Member ID" value={<span className="font-black text-gray-900 text-base tracking-tight">{created.member_id}</span>} />
                                        <Row label="Phone (Login)" value={created.phone} />
                                        <Row label="Type" value={
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border uppercase ${roleBadgeColor[created.role]}`}>{created.role}</span>
                                        } />
                                        <Row label="Default PIN" value={<span className="font-black text-gray-700">1234</span>} />
                                    </div>
                                    <div className="flex gap-3">
                                        <Button onClick={handleAddAnother} className="flex-1 h-12 bg-gray-900 hover:bg-black text-white rounded-2xl">
                                            <UserPlus size={16} className="mr-2" /> Add Another
                                        </Button>
                                        <Button variant="outline" onClick={() => navigate('/admin')} className="flex-1 h-12 rounded-2xl">
                                            Back to Dashboard
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Session Log */}
                    <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 p-5 sticky top-6">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">
                            Added this session ({session.length})
                        </h3>
                        {session.length === 0 ? (
                            <p className="text-xs text-gray-400 text-center py-6">No members added yet.</p>
                        ) : (
                            <ul className="space-y-3 max-h-[60vh] overflow-y-auto">
                                {session.map((m, i) => (
                                    <li key={i} className="flex items-center justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-gray-900 truncate">{m.full_name}</p>
                                            <p className="text-[10px] text-gray-400 font-mono">{m.member_id}</p>
                                        </div>
                                        <span className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] font-black border uppercase ${roleBadgeColor[m.role]}`}>
                                            {m.role.slice(0, 4)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const Row = ({ label, value }) => (
    <div className="flex justify-between items-center text-sm">
        <span className="text-[10px] font-black uppercase tracking-[0.1em] text-gray-400">{label}</span>
        <span>{value}</span>
    </div>
);

export default OnboardMembers;
