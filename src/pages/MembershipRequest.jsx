import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Input } from '../components/ui';
import { User, Users, Briefcase, MapPin, Phone, Mail, Calendar, Clock, Star, FileText, Smartphone } from 'lucide-react';
import api from '../lib/api';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const STEPS = [
    { title: 'Membership Type', icon: <Users /> },
    { title: 'Personal Details', icon: <User /> },
    { title: 'Contact & Work', icon: <MapPin /> },
    { title: 'Other Info', icon: <Star /> },
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
            father_guardian_name: '',
            age: '',
            dob: '',
            tob: '',
            gotram: '',
            sub_sect: '',
            occupation: '',
            annual_income: '',
            star_pada: '',
            address: '',
            cell_no: '',
            email: '',
            payment_proof_url: '',
            requirement: '',
            particulars: ''
        }
    });

    const updateBioData = (field, value) => {
        setFormData(prev => ({
            ...prev,
            bio_data: { ...prev.bio_data, [field]: value }
        }));
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
            if (submissionData.bio_data.annual_income === '') submissionData.bio_data.annual_income = null;
            if (submissionData.bio_data.email === '') submissionData.bio_data.email = null;

            const response = await api.post('/members/apply', submissionData);
            toast.success(response.data.message);
            navigate('/dashboard');
        } catch (error) {
            console.error('Submission error:', error.response?.data);
            toast.error(error.response?.data?.detail || 'Submission failed');
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
                        <Input label="Father / Guardian Name" value={formData.bio_data.father_guardian_name} onChange={(e) => updateBioData('father_guardian_name', e.target.value)} icon={<User className="h-4 w-4" />} />
                        <Input label="Age" type="number" value={formData.bio_data.age} onChange={(e) => updateBioData('age', e.target.value)} />
                        <Input label="Date of Birth" type="date" value={formData.bio_data.dob} onChange={(e) => updateBioData('dob', e.target.value)} icon={<Calendar className="h-4 w-4" />} />
                        <Input label="Time of Birth" type="time" value={formData.bio_data.tob} onChange={(e) => updateBioData('tob', e.target.value)} icon={<Clock className="h-4 w-4" />} />
                        <Input label="Gotram" value={formData.bio_data.gotram} onChange={(e) => updateBioData('gotram', e.target.value)} />
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
                        <Input label="Annual Income" type="number" value={formData.bio_data.annual_income} onChange={(e) => updateBioData('annual_income', e.target.value)} />
                    </div>
                );
            case 3:
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                        <Input label="Star with Pada" value={formData.bio_data.star_pada} onChange={(e) => updateBioData('star_pada', e.target.value)} icon={<Star className="h-4 w-4" />} />
                        <Input label="Requirement" value={formData.bio_data.requirement} onChange={(e) => updateBioData('requirement', e.target.value)} />
                        <div className="md:col-span-2">
                            <label className="text-sm font-medium text-gray-700 block mb-1">Particulars</label>
                            <textarea
                                className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:ring-2 focus:ring-[var(--color-primary-light)] focus:border-[var(--color-primary)] outline-none min-h-[100px]"
                                value={formData.bio_data.particulars}
                                onChange={(e) => updateBioData('particulars', e.target.value)}
                            />
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div className="py-6 space-y-6">
                        <div className="bg-yellow-50 p-6 rounded-2xl border border-yellow-100 flex items-start gap-4">
                            <div className="bg-yellow-100 p-2 rounded-lg text-yellow-700">
                                <FileText size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-yellow-900">Manual Payment Verification</h4>
                                <p className="text-sm text-yellow-700 mt-1">Please pay the prescribed fee to the Parishat account and upload a screenshot of the receipt or provide the UTR/Reference number.</p>
                            </div>
                        </div>
                        <Input
                            label="Payment Receipt / Reference Number"
                            placeholder="Enter Transaction ID or Link to Screenshot"
                            value={formData.bio_data.payment_proof_url}
                            onChange={(e) => updateBioData('payment_proof_url', e.target.value)}
                            icon={<Smartphone className="h-4 w-4" />}
                        />
                        <div className="bg-gray-100 p-8 rounded-2xl border-2 border-dashed border-gray-200 text-center">
                            <Smartphone className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                            <p className="text-xs text-gray-500 font-medium">Coming Soon: Direct screenshot upload to Supabase Storage</p>
                            <p className="text-[10px] text-gray-400 mt-1">For now, please enter the transaction ID/link above.</p>
                        </div>
                    </div>
                );
            case 5:
                return (
                    <div className="py-6 space-y-4">
                        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <FileText className="h-5 w-5 text-[var(--color-primary)]" />
                                Review your application
                            </h3>
                            <div className="grid grid-cols-2 gap-y-3 text-sm">
                                <span className="text-gray-500">Requested Role:</span>
                                <span className="font-semibold">{formData.requested_role}</span>
                                <span className="text-gray-500">Name:</span>
                                <span className="font-semibold text-gray-900">{formData.bio_data.father_guardian_name}</span>
                                <span className="text-gray-500">Gotram:</span>
                                <span className="font-semibold text-gray-900">{formData.bio_data.gotram}</span>
                                <span className="text-gray-500">Payment Proof:</span>
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
