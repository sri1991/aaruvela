import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Input } from '../components/ui';
import { User, Users, Briefcase, MapPin, Phone, Mail, Calendar, Info, FileText, Smartphone, Camera, Loader2, CheckCircle2, UploadCloud } from 'lucide-react';
import api from '../lib/api';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import paymentQR from '../assets/6000N Payment.jpg';

const STEPS = [
    { title: 'Membership Type', icon: <Users /> },
    { title: 'Personal Details', icon: <User /> },
    { title: 'Contact & Work', icon: <MapPin /> },
    { title: 'Payment Proof', icon: <Smartphone /> },
    { title: 'Review', icon: <FileText /> }
];

const MembershipRequest = () => {
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        requested_role: 'NORMAL',
        bio_data: {
            full_name: '',
            father_guardian_name: '',
            age: '',
            dob: '',
            sub_sect: '',
            occupation: '',
            star_pada: '',
            address: '',
            cell_no: '',
            email: '',
            photo_url: '',
            payment_proof_url: '',
            zonal_committee: '',
            regional_committee: '',
            requirement: '',
            particulars: ''
        }
    });

    const [uploading, setUploading] = useState({
        photo: false,
        payment: false
    });

    const updateBioData = (field, value) => {
        setFormData(prev => ({
            ...prev,
            bio_data: { ...prev.bio_data, [field]: value }
        }));
    };

    const handleFileUpload = async (event, type) => {
        const file = event.target.files[0];
        if (!file) return;

        // Size check (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            toast.error('File size must be less than 2MB');
            return;
        }

        setUploading(prev => ({ ...prev, [type]: true }));
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `${type}/${fileName}`;

            const { error: uploadError, data } = await supabase.storage
                .from('membership')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('membership')
                .getPublicUrl(filePath);

            updateBioData(type === 'photo' ? 'photo_url' : 'payment_proof_url', publicUrl);
            toast.success(`${type === 'photo' ? 'Photo' : 'Receipt'} uploaded successfully`);
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Upload failed. Please check if "membership" bucket exists in Supabase.');
        } finally {
            setUploading(prev => ({ ...prev, [type]: false }));
        }
    };

    const handleNext = () => {
        if (step < STEPS.length - 1) setStep(step + 1);
    };

    const handleBack = () => {
        if (step > 0) setStep(step - 1);
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            // Clean data: convert empty strings to null for optional/numeric fields to avoid 422 error
            const submissionData = JSON.parse(JSON.stringify(formData));
            if (submissionData.bio_data.age === '') submissionData.bio_data.age = null;
            if (submissionData.bio_data.email === '') submissionData.bio_data.email = null;

            const response = await api.post('/members/apply', submissionData);
            toast.success(response.data.message);
            navigate('/dashboard');
        } catch (error) {
            console.error('Submission error:', error.response?.data);
            const detail = error.response?.data?.detail;
            const message = Array.isArray(detail)
                ? detail.map(d => d.msg).join(', ')
                : typeof detail === 'string'
                    ? detail
                    : 'Submission failed';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 0:
                return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6">
                        {['PERMANENT', 'NORMAL', 'ASSOCIATED'].map((role) => (
                            <div
                                key={role}
                                onClick={() => setFormData({ ...formData, requested_role: role })}
                                className={`p-6 rounded-2xl border-2 transition-all cursor-pointer text-center ${formData.requested_role === role ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5' : 'border-gray-200 hover:border-gray-300'}`}
                            >
                                <Users className={`h-12 w-12 mx-auto mb-4 ${formData.requested_role === role ? 'text-[var(--color-primary)]' : 'text-gray-400'}`} />
                                <h3 className="font-bold text-gray-900">{role}</h3>
                                <p className="text-xs text-gray-500 mt-2">Apply for {role.toLowerCase()} membership</p>
                            </div>
                        ))}
                    </div>
                );
            case 1:
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                        <Input label="Your Name" value={formData.bio_data.full_name} onChange={(e) => updateBioData('full_name', e.target.value)} icon={<User className="h-4 w-4" />} />
                        <Input label="Father / Guardian Name" value={formData.bio_data.father_guardian_name} onChange={(e) => updateBioData('father_guardian_name', e.target.value)} icon={<User className="h-4 w-4" />} />

                        <div className="md:col-span-2 p-6 border-2 border-dashed border-gray-100 rounded-[2rem] bg-gray-50/50 hover:bg-gray-50 transition-all group">
                            <label className="text-[10px] font-black uppercase tracking-[0.1em] text-gray-600 block mb-3 ml-1">Profile Photo (Passport size)</label>
                            <div className="flex items-center gap-6">
                                <div className="w-24 h-24 rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden flex items-center justify-center relative">
                                    {formData.bio_data.photo_url ? (
                                        <img src={formData.bio_data.photo_url} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <Camera className="w-8 h-8 text-gray-200 group-hover:text-[var(--color-primary)]/40 transition-colors" />
                                    )}
                                    {uploading.photo && (
                                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                            <Loader2 className="w-6 h-6 animate-spin text-[var(--color-primary)]" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <input
                                        type="file"
                                        id="photo-upload"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => handleFileUpload(e, 'photo')}
                                    />
                                    <label
                                        htmlFor="photo-upload"
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 cursor-pointer hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-all shadow-sm active:scale-95"
                                    >
                                        <UploadCloud size={18} />
                                        {formData.bio_data.photo_url ? 'Change Photo' : 'Upload Photo'}
                                    </label>
                                    <p className="text-[10px] text-gray-400 mt-2 ml-1">JPG, PNG, max 2MB. Clear face photo required for ID card.</p>
                                </div>
                            </div>
                        </div>

                        <Input label="Age" type="number" value={formData.bio_data.age} onChange={(e) => updateBioData('age', e.target.value)} />
                        <Input label="Date of Birth" type="date" value={formData.bio_data.dob} onChange={(e) => updateBioData('dob', e.target.value)} />
                        {formData.requested_role === 'PERMANENT' && (
                            <Input label="Sub-Sect" value={formData.bio_data.sub_sect} onChange={(e) => updateBioData('sub_sect', e.target.value)} placeholder="e.g. 6000N" />
                        )}
                    </div>
                );
            case 2:
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                        <Input label="Address" value={formData.bio_data.address} onChange={(e) => updateBioData('address', e.target.value)} icon={<MapPin className="h-4 w-4" />} />
                        <Input label="Cell No" value={formData.bio_data.cell_no} onChange={(e) => updateBioData('cell_no', e.target.value)} icon={<Phone className="h-4 w-4" />} />
                        <Input label="Email" type="email" value={formData.bio_data.email} onChange={(e) => updateBioData('email', e.target.value)} icon={<Mail className="h-4 w-4" />} />
                        <Input label="Occupation" value={formData.bio_data.occupation} onChange={(e) => updateBioData('occupation', e.target.value)} icon={<Briefcase className="h-4 w-4" />} />

                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-[0.1em] text-gray-600 ml-1">Zonal Committee</label>
                            <select
                                className="w-full h-12 rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 font-medium focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-primary-light)]/20 transition-all duration-300 focus:border-[var(--color-primary)] outline-none"
                                value={formData.bio_data.zonal_committee}
                                onChange={(e) => updateBioData('zonal_committee', e.target.value)}
                                required
                            >
                                <option value="" disabled hidden>Select Zone</option>
                                {['Uttar Andhra', 'Rayalaseema', 'Dakshina Kosta Andhra', 'Madhya Kosta'].map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-[0.1em] text-gray-600 ml-1">Regional Committee</label>
                            <select
                                className="w-full h-12 rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 font-medium focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-primary-light)]/20 transition-all duration-300 focus:border-[var(--color-primary)] outline-none"
                                value={formData.bio_data.regional_committee}
                                onChange={(e) => updateBioData('regional_committee', e.target.value)}
                                required
                            >
                                <option value="" disabled hidden>Select Region</option>
                                {['Telangana', 'Tamil Nadu', 'Karnataka', 'Rest of India'].map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="py-6 space-y-6">
                        <div className="bg-[var(--color-primary)]/5 p-6 rounded-3xl border border-[var(--color-primary)]/10 flex flex-col items-center gap-4 text-center">
                            <div className="bg-[var(--color-primary)]/10 p-3 rounded-2xl text-[var(--color-primary)]">
                                <Info size={24} />
                            </div>
                            <div>
                                <h4 className="text-lg font-black text-gray-900">Scan to Pay</h4>
                                <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">Scan the QR code below or use the details to pay your membership fee. Save the receipt to upload below.</p>
                            </div>
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-[var(--color-primary)] to-amber-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                                <img
                                    src={paymentQR}
                                    alt="Payment QR Code"
                                    className="relative w-64 h-auto rounded-2xl shadow-xl border-4 border-white"
                                />
                            </div>
                        </div>

                        <div className="md:col-span-2 p-8 border-2 border-dashed border-gray-100 rounded-[2.5rem] bg-gray-50/30 flex flex-col items-center gap-6 text-center group hover:bg-white hover:border-[var(--color-primary)]/20 transition-all">
                            <div className="w-20 h-20 rounded-3xl bg-white shadow-sm border border-gray-50 flex items-center justify-center text-gray-300 group-hover:text-[var(--color-primary)]/60 transition-colors">
                                {formData.bio_data.payment_proof_url.startsWith('http') ? (
                                    <div className="relative w-full h-full p-2">
                                        <img src={formData.bio_data.payment_proof_url} alt="Receipt" className="w-full h-full object-cover rounded-2xl" />
                                        <div className="absolute -top-2 -right-2 bg-green-500 text-white p-1 rounded-full shadow-lg">
                                            <CheckCircle2 size={16} />
                                        </div>
                                    </div>
                                ) : (
                                    <UploadCloud size={32} />
                                )}
                            </div>
                            <div>
                                <h4 className="font-black text-gray-900">Upload Payment Receipt</h4>
                                <p className="text-xs text-gray-400 mt-1">Take a screenshot of your successful transaction and upload here.</p>
                            </div>
                            <input
                                type="file"
                                id="payment-upload"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleFileUpload(e, 'payment')}
                            />
                            <label
                                htmlFor="payment-upload"
                                className={`inline-flex items-center gap-2 px-8 py-3 rounded-2xl text-sm font-bold transition-all cursor-pointer shadow-lg active:scale-95 ${formData.bio_data.payment_proof_url.startsWith('http') ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-[var(--color-primary)] text-white hover:shadow-[var(--color-primary)]/40'}`}
                            >
                                {uploading.payment ? <Loader2 className="animate-spin" size={18} /> : <Camera size={18} />}
                                {formData.bio_data.payment_proof_url.startsWith('http') ? 'Change Receipt' : 'Upload Receipt'}
                            </label>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                <div className="w-full border-t border-gray-100"></div>
                            </div>
                            <div className="relative flex justify-center">
                                <span className="bg-white px-3 text-[10px] font-black uppercase tracking-widest text-gray-400">Or enter Reference Number</span>
                            </div>
                        </div>

                        <Input
                            label="Transaction ID / UTR"
                            placeholder="e.g. UTR12345678"
                            value={formData.bio_data.payment_proof_url}
                            onChange={(e) => updateBioData('payment_proof_url', e.target.value)}
                            icon={<Smartphone className="h-4 w-4" />}
                        />
                    </div>
                );
            case 4:
                return (
                    <div className="py-6 space-y-4">
                        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <FileText className="h-5 w-5 text-[var(--color-primary)]" />
                                Review your application
                            </h3>
                            <div className="grid grid-cols-2 gap-y-4 text-sm">
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Requested Role</span>
                                <span className="font-bold text-gray-900">{formData.requested_role}</span>

                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Your Name</span>
                                <span className="font-bold text-gray-900">{formData.bio_data.full_name}</span>

                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Father/Guardian</span>
                                <span className="font-bold text-gray-900">{formData.bio_data.father_guardian_name}</span>

                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Zone</span>
                                <span className="font-bold text-[var(--color-primary)]">{formData.bio_data.zonal_committee || 'N/A'}</span>

                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Region</span>
                                <span className="font-bold text-[var(--color-primary)]">{formData.bio_data.regional_committee || 'N/A'}</span>

                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Payment Proof</span>
                                <span className="font-bold text-green-600 truncate">{formData.bio_data.payment_proof_url || 'Not provided'}</span>
                            </div>
                        </div>
                        <p className="text-xs text-gray-400 italic text-center">By submitting, you agree that all information provided is accurate and belongs to you.</p>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-[calc(100vh-120px)] bg-gray-50 py-12 px-4">
            <div className="max-w-3xl mx-auto">
                {/* Progress Bar */}
                <div className="flex justify-between mb-8 overflow-hidden">
                    {STEPS.map((s, i) => (
                        <div key={i} className={`flex flex-col items-center flex-1 z-10 ${i <= step ? 'text-[var(--color-primary)]' : 'text-gray-300'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 transition-all ${i <= step ? 'bg-[var(--color-primary)] text-white' : 'bg-gray-200 text-gray-400'}`}>
                                {React.cloneElement(s.icon, { size: 16 })}
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:block">{s.title}</span>
                        </div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-[2rem] shadow-2xl border border-gray-100 overflow-hidden"
                >
                    <div className="p-8">
                        <h2 className="text-2xl font-black text-gray-900 mb-2">{STEPS[step].title}</h2>
                        <p className="text-sm text-gray-500 mb-6 font-medium">Please provide accurate information for your Parishat membership.</p>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={step}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                {renderStep()}
                            </motion.div>
                        </AnimatePresence>

                        <div className="flex justify-between mt-10">
                            <Button variant="outline" onClick={handleBack} disabled={step === 0 || loading}>
                                Previous
                            </Button>
                            {step < STEPS.length - 1 ? (
                                <Button onClick={handleNext}>Next Step</Button>
                            ) : (
                                <Button onClick={handleSubmit} isLoading={loading}>Submit Application</Button>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default MembershipRequest;
