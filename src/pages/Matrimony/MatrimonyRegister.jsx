import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { useAuth } from '../../features/auth/AuthContext';
import { ShieldCheck, Heart, Loader2, UploadCloud, User, CheckCircle, AlertCircle, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

// ₹10/month — update UPI_ID to the parishat's UPI handle
const UPI_ID = '6000niyogi@sbi';
const UPI_NAME = '6000N Niyogi Matrimony';
const SUBSCRIPTION_FEE = 10;

const UPI_QR_URL = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
    `upi://pay?pa=${UPI_ID}&pn=${UPI_NAME}&am=${SUBSCRIPTION_FEE}&cu=INR&tn=Matrimony+Registration+Fee`
)}`;

const PARTICULARS_WORD_LIMIT = 100;
const REQUIREMENT_WORD_LIMIT = 50;

function countWords(text) {
    return text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
}

const MatrimonyRegister = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [photos, setPhotos] = useState([]); // [{url, size}]
    const [formData, setFormData] = useState({
        full_name: '',
        gender: 'MALE',
        parishat_id: '',
        father_guardian_name: '',
        age: '',
        brothers: '',
        sisters: '',
        willing_to_relocate: '',
        dob: '',
        tob: '',
        gotram: '',
        star_with_pada: '',
        place_of_birth: '',
        current_city: '',
        occupation: '',
        annual_income: '',
        sub_sect: '',
        sect_no: '',
        particulars: '',
        requirement: '',
        contact_no: '',
        email: '',
        payment_reference: '',
    });

    const MAX_PHOTOS = 3;
    const MAX_TOTAL_BYTES = 6 * 1024 * 1024; // 6MB total
    const totalUploadedSize = photos.reduce((sum, p) => sum + p.size, 0);

    // Preload member data from auth context
    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                full_name: user.full_name || '',
                parishat_id: user.member_id || '',
                contact_no: user.identifier || '',
            }));
        }
    }, [user]);

    const particularsWords = countWords(formData.particulars);
    const requirementWords = countWords(formData.requirement);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        e.target.value = ''; // reset so same file can be re-selected after remove
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            toast.error('Only image files are allowed');
            return;
        }
        if (file.size > 3 * 1024 * 1024) {
            toast.error('Each photo must be under 3MB');
            return;
        }
        if (photos.length >= MAX_PHOTOS) {
            toast.error(`Maximum ${MAX_PHOTOS} photos allowed`);
            return;
        }
        if (totalUploadedSize + file.size > MAX_TOTAL_BYTES) {
            toast.error('Total photo size cannot exceed 6MB');
            return;
        }

        setUploadingImage(true);
        try {
            const formPayload = new FormData();
            formPayload.append('file', file);
            const res = await api.post('/matrimony/upload-photo', formPayload, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setPhotos(prev => [...prev, { url: res.data.url, size: file.size }]);
            toast.success('Photo uploaded!');
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to upload photo. Contact admin.');
        } finally {
            setUploadingImage(false);
        }
    };

    const removePhoto = (index) => {
        setPhotos(prev => prev.filter((_, i) => i !== index));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Enforce word limits on textarea fields
        if (name === 'particulars') {
            if (countWords(value) > PARTICULARS_WORD_LIMIT) return;
        }
        if (name === 'requirement') {
            if (countWords(value) > REQUIREMENT_WORD_LIMIT) return;
        }

        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (photos.length === 0) {
            toast.error('At least one profile photo is required before submitting.');
            return;
        }
        if (particularsWords > PARTICULARS_WORD_LIMIT) {
            toast.error(`Particulars must not exceed ${PARTICULARS_WORD_LIMIT} words.`);
            return;
        }
        if (requirementWords > REQUIREMENT_WORD_LIMIT) {
            toast.error(`Requirements must not exceed ${REQUIREMENT_WORD_LIMIT} words.`);
            return;
        }

        setLoading(true);
        try {
            const payload = { ...formData, photos: photos.map(p => p.url) };

            // Coerce age
            if (payload.age === '' || payload.age === null) payload.age = null;
            else { const n = parseInt(payload.age); payload.age = isNaN(n) ? null : n; }

            // Append seconds to time if browser omits them
            if (payload.tob && payload.tob.length === 5) payload.tob = payload.tob + ':00';

            // Coerce integer fields
            for (const key of ['brothers', 'sisters']) {
                if (payload[key] === '' || payload[key] === null) payload[key] = null;
                else { const n = parseInt(payload[key]); payload[key] = isNaN(n) ? null : n; }
            }

            // Coerce boolean
            if (payload.willing_to_relocate === '') payload.willing_to_relocate = null;
            else if (payload.willing_to_relocate === 'true') payload.willing_to_relocate = true;
            else if (payload.willing_to_relocate === 'false') payload.willing_to_relocate = false;

            // Null-out any optional string fields left as empty string
            const optionalStrings = ['father_guardian_name', 'gotram', 'star_with_pada',
                'place_of_birth', 'current_city', 'occupation', 'annual_income',
                'sub_sect', 'sect_no',
                'particulars', 'requirement', 'contact_no', 'email'];
            for (const key of optionalStrings) {
                if (payload[key] === '') payload[key] = null;
            }

            const res = await api.post('/matrimony/register', payload);
            toast.success(res.data.message);
            navigate('/matrimony');
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to submit profile');
        } finally {
            setLoading(false);
        }
    };

    const inputCls = "w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors";
    const readonlyCls = "w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50 text-gray-500 outline-none cursor-not-allowed";

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="container mx-auto max-w-3xl">
                <div className="bg-white rounded-3xl shadow-sm border border-blue-100 overflow-hidden">
                    <div className="bg-blue-900 px-8 py-6 text-white flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-black flex items-center gap-3">
                                <Heart className="text-blue-300" />
                                6000N Matrimony Registration
                            </h2>
                            <p className="text-blue-200 text-sm mt-1 opacity-90">
                                Your personal bio-data profile — for yourself only.
                            </p>
                        </div>
                        <ShieldCheck size={40} className="text-blue-500/30" />
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-8">

                        {/* Section 1: Profile Basics */}
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 border-b pb-2 mb-4 border-gray-100">Profile Basics</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Candidate Full Name *</label>
                                    <input
                                        required
                                        type="text"
                                        name="full_name"
                                        value={formData.full_name}
                                        onChange={handleChange}
                                        className={inputCls}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Gender *</label>
                                    <select name="gender" value={formData.gender} onChange={handleChange} className={`${inputCls} bg-white`}>
                                        <option value="MALE">Male</option>
                                        <option value="FEMALE">Female</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">
                                        Member ID
                                        <span className="ml-1 text-gray-400 font-normal normal-case">(pre-filled)</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="parishat_id"
                                        value={formData.parishat_id}
                                        readOnly
                                        className={readonlyCls}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Age</label>
                                    <input type="number" name="age" value={formData.age} onChange={handleChange} className={inputCls} />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Father / Guardian Name</label>
                                    <input type="text" name="father_guardian_name" value={formData.father_guardian_name} onChange={handleChange} className={inputCls} />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Brothers</label>
                                    <input type="number" min="0" name="brothers" value={formData.brothers} onChange={handleChange} className={inputCls} placeholder="0" />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Sisters</label>
                                    <input type="number" min="0" name="sisters" value={formData.sisters} onChange={handleChange} className={inputCls} placeholder="0" />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Willing to Relocate</label>
                                    <select name="willing_to_relocate" value={formData.willing_to_relocate} onChange={handleChange} className={`${inputCls} bg-white`}>
                                        <option value="">Select</option>
                                        <option value="true">Yes</option>
                                        <option value="false">No</option>
                                    </select>
                                </div>
                            </div>

                            {/* Photo Upload — Mandatory, up to 3 */}
                            <div className="mt-6 bg-gray-50 border border-gray-200 p-5 rounded-2xl">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1">
                                        Profile Photos
                                        <span className="text-blue-500 text-xs font-bold">(At least 1 required)</span>
                                        {photos.length > 0 && <CheckCircle size={14} className="text-green-500 ml-1" />}
                                    </h4>
                                    <span className={`text-xs font-semibold ${totalUploadedSize > MAX_TOTAL_BYTES * 0.85 ? 'text-blue-500' : 'text-gray-400'}`}>
                                        {(totalUploadedSize / (1024 * 1024)).toFixed(1)} / 6 MB
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 mb-4">Upload up to 3 photos. Max 3MB each, 6MB total. JPG/PNG/WebP.</p>
                                <div className="flex flex-wrap gap-3">
                                    {photos.map((photo, i) => (
                                        <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-green-300 shrink-0">
                                            <img src={photo.url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => removePhoto(i)}
                                                className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors"
                                            >
                                                <X size={12} />
                                            </button>
                                            {i === 0 && (
                                                <span className="absolute bottom-0 left-0 right-0 text-center text-[9px] font-bold bg-green-600 text-white py-0.5">MAIN</span>
                                            )}
                                        </div>
                                    ))}
                                    {photos.length < MAX_PHOTOS && (
                                        <label className={`w-24 h-24 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer shrink-0 transition-colors ${uploadingImage ? 'border-gray-200 bg-gray-100' : 'border-blue-300 bg-blue-50 hover:bg-blue-100'}`}>
                                            {uploadingImage ? (
                                                <Loader2 size={20} className="animate-spin text-gray-400" />
                                            ) : (
                                                <>
                                                    <UploadCloud size={20} className="text-blue-400 mb-1" />
                                                    <span className="text-[10px] font-bold text-blue-500">Add Photo</span>
                                                </>
                                            )}
                                            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                                        </label>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Astrological */}
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 border-b pb-2 mb-4 border-gray-100">Astrological Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Date of Birth *</label>
                                    <input required type="date" name="dob" value={formData.dob} onChange={handleChange} className={inputCls} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Time of Birth *</label>
                                    <input required type="time" name="tob" value={formData.tob} onChange={handleChange} className={inputCls} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Gotram</label>
                                    <input type="text" name="gotram" value={formData.gotram} onChange={handleChange} className={inputCls} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Star with Pada</label>
                                    <input type="text" name="star_with_pada" value={formData.star_with_pada} onChange={handleChange} className={inputCls} placeholder="e.g. Ashwini - 1" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Place of Birth</label>
                                    <input type="text" name="place_of_birth" value={formData.place_of_birth} onChange={handleChange} className={inputCls} placeholder="e.g. Hyderabad" />
                                </div>
                            </div>

                            {/* AID-only: Sub-sect fields */}
                            {user?.role === 'ASSOCIATED' && (
                                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-amber-50 border border-amber-100 rounded-2xl p-4">
                                    <div className="md:col-span-2">
                                        <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-3">Associated Member Details</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Sub-Sect</label>
                                        <select name="sub_sect" value={formData.sub_sect} onChange={handleChange} className={`${inputCls} bg-white`}>
                                            <option value="">Select</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Sect No</label>
                                        <select name="sect_no" value={formData.sect_no} onChange={handleChange} className={`${inputCls} bg-white`}>
                                            <option value="">Select</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Section 3: Professional & Contact */}
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 border-b pb-2 mb-4 border-gray-100">Professional & Contact</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Current City</label>
                                    <input type="text" name="current_city" value={formData.current_city} onChange={handleChange} className={inputCls} placeholder="e.g. Hyderabad" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Occupation</label>
                                    <input type="text" name="occupation" value={formData.occupation} onChange={handleChange} className={inputCls} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Annual Income</label>
                                    <input type="text" name="annual_income" value={formData.annual_income} onChange={handleChange} className={inputCls} placeholder="e.g. 15 LPA" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">
                                        Contact Number
                                        <span className="ml-1 text-gray-400 font-normal normal-case">(pre-filled)</span>
                                    </label>
                                    <input type="text" name="contact_no" value={formData.contact_no} readOnly className={readonlyCls} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Email</label>
                                    <input type="email" name="email" value={formData.email} onChange={handleChange} className={inputCls} />
                                </div>
                            </div>
                        </div>

                        {/* Section 4: Description & Requirements with word limits */}
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 border-b pb-2 mb-4 border-gray-100">Description & Requirements</h3>
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">Particulars (Description)</label>
                                        <span className={`text-xs font-semibold ${particularsWords >= PARTICULARS_WORD_LIMIT ? 'text-blue-600' : 'text-gray-400'}`}>
                                            {particularsWords}/{PARTICULARS_WORD_LIMIT} words
                                        </span>
                                    </div>
                                    <textarea
                                        name="particulars"
                                        rows="4"
                                        value={formData.particulars}
                                        onChange={handleChange}
                                        className={`${inputCls} resize-none`}
                                        placeholder="Physical description, height, complexion, place of origin, family background etc."
                                    />
                                    {particularsWords >= PARTICULARS_WORD_LIMIT && (
                                        <p className="text-xs text-blue-500 mt-1 flex items-center gap-1"><AlertCircle size={12} /> Word limit reached</p>
                                    )}
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">Requirements</label>
                                        <span className={`text-xs font-semibold ${requirementWords >= REQUIREMENT_WORD_LIMIT ? 'text-blue-600' : 'text-gray-400'}`}>
                                            {requirementWords}/{REQUIREMENT_WORD_LIMIT} words
                                        </span>
                                    </div>
                                    <textarea
                                        name="requirement"
                                        rows="3"
                                        value={formData.requirement}
                                        onChange={handleChange}
                                        className={`${inputCls} resize-none`}
                                        placeholder="Partner expectations — education, occupation, region, family preference etc."
                                    />
                                    {requirementWords >= REQUIREMENT_WORD_LIMIT && (
                                        <p className="text-xs text-blue-500 mt-1 flex items-center gap-1"><AlertCircle size={12} /> Word limit reached</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Section 5: Payment — UPI QR + Reference */}
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 border-b pb-2 mb-4 border-gray-100">Monthly Subscription Payment</h3>
                            <div className="bg-blue-50 border border-blue-100 rounded-2xl overflow-hidden">
                                <div className="p-5 flex flex-col md:flex-row gap-6 items-center">
                                    {/* QR Code */}
                                    <div className="flex flex-col items-center shrink-0">
                                        <div className="bg-white p-3 rounded-xl shadow-sm border border-blue-100">
                                            <img
                                                src={UPI_QR_URL}
                                                alt="UPI QR Code"
                                                className="w-[160px] h-[160px]"
                                                onError={(e) => { e.target.style.display = 'none'; }}
                                            />
                                        </div>
                                        <p className="text-[10px] text-blue-700 font-semibold mt-2 text-center">Scan with any UPI app</p>
                                    </div>

                                    {/* Payment details */}
                                    <div className="flex-1 space-y-3">
                                        <div>
                                            <p className="text-sm font-black text-blue-900">₹{SUBSCRIPTION_FEE}/month subscription</p>
                                            <p className="text-xs text-blue-700 mt-0.5 leading-relaxed">
                                                Pay ₹{SUBSCRIPTION_FEE} to activate your profile for 1 month. Admin will verify and approve your listing.
                                            </p>
                                        </div>
                                        <div className="bg-white rounded-xl p-3 border border-blue-100 space-y-1">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-gray-500">UPI ID</span>
                                                <span className="font-bold text-gray-800 font-mono">{UPI_ID}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-gray-500">Name</span>
                                                <span className="font-semibold text-gray-800">{UPI_NAME}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-gray-500">Amount</span>
                                                <span className="font-bold text-blue-700">₹{SUBSCRIPTION_FEE}</span>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-blue-800 mb-1 uppercase tracking-wider">
                                                Transaction UTR / Reference *
                                            </label>
                                            <input
                                                required
                                                type="text"
                                                name="payment_reference"
                                                value={formData.payment_reference}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2.5 rounded-xl border border-blue-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                                                placeholder="e.g. UPI-12345678 or UTR number"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Photo missing warning */}
                                {photos.length === 0 && (
                                    <div className="bg-amber-50 border-t border-amber-100 px-5 py-3 flex items-center gap-2">
                                        <AlertCircle size={14} className="text-amber-600 shrink-0" />
                                        <p className="text-xs text-amber-700 font-medium">Please upload a profile photo above before submitting.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => navigate('/matrimony')}
                                className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                disabled={loading || uploadingImage || photos.length === 0}
                                type="submit"
                                className="bg-[var(--color-primary)] text-white px-8 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading && <Loader2 size={16} className="animate-spin" />}
                                Submit Profile for Verification
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default MatrimonyRegister;
