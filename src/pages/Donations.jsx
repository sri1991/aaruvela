import { useState } from 'react';
import { User, Phone, MapPin, Heart, IndianRupee, Hash } from 'lucide-react';
import { Button, Input } from '../components/ui';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import paymentQR from '../assets/6000N Payment.jpg';

const Donations = () => {
    const [showQR, setShowQR] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({ name: '', phone: '', place: '' });
    const [payment, setPayment] = useState({ amount: '', reference: '' });

    const handleProceed = () => {
        if (!form.name.trim()) { toast.error('Please enter your name.'); return; }
        if (!form.phone.trim() || !/^\d{10}$/.test(form.phone.trim())) { toast.error('Please enter a valid 10-digit phone number.'); return; }
        if (!form.place.trim()) { toast.error('Please enter your place.'); return; }
        setShowQR(true);
    };

    const handleConfirm = async () => {
        if (!payment.amount || isNaN(payment.amount) || Number(payment.amount) <= 0) {
            toast.error('Please enter a valid amount paid.');
            return;
        }
        if (!payment.reference.trim()) {
            toast.error('Please enter the payment reference / UTR number.');
            return;
        }

        setSubmitting(true);
        const { error } = await supabase.from('donations').insert({
            donor_name: form.name.trim(),
            phone: form.phone.trim(),
            place: form.place.trim(),
            amount: Number(payment.amount),
            payment_reference: payment.reference.trim(),
        });
        setSubmitting(false);

        if (error) {
            console.error(error);
            toast.error('Failed to record donation. Please try again.');
            return;
        }

        toast.success('Donation recorded! Thank you for your contribution.');
        setForm({ name: '', phone: '', place: '' });
        setPayment({ amount: '', reference: '' });
        setShowQR(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-md mx-auto">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Heart className="w-8 h-8 text-orange-500" />
                    </div>
                    <h1 className="text-2xl font-black text-gray-900">Donate</h1>
                    <p className="text-sm text-gray-500 mt-2">Your contribution helps us serve the community.</p>
                </div>

                <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
                    {!showQR ? (
                        <div className="p-8 space-y-4">
                            <h2 className="text-lg font-black text-gray-900 mb-6">Donor details</h2>
                            <Input
                                label="Full Name"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                icon={<User className="h-4 w-4" />}
                                placeholder="Your name"
                            />
                            <Input
                                label="Phone Number"
                                type="tel"
                                value={form.phone}
                                onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                                icon={<Phone className="h-4 w-4" />}
                                placeholder="10-digit mobile number"
                            />
                            <Input
                                label="Place"
                                value={form.place}
                                onChange={(e) => setForm({ ...form, place: e.target.value })}
                                icon={<MapPin className="h-4 w-4" />}
                                placeholder="Your place"
                            />
                            <Button onClick={handleProceed} className="w-full mt-2">
                                Proceed to Pay
                            </Button>
                        </div>
                    ) : (
                        <div className="p-8 text-center space-y-6">
                            <div>
                                <p className="text-sm text-gray-500">Thank you, <span className="font-bold text-gray-800">{form.name}</span>!</p>
                                <h2 className="text-lg font-black text-gray-900 mt-1">Scan to Donate via UPI</h2>
                            </div>
                            <div className="relative group inline-block">
                                <div className="absolute -inset-1 bg-gradient-to-r from-orange-400 to-amber-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-700"></div>
                                <img
                                    src={paymentQR}
                                    alt="Donation QR Code - BHIM UPI"
                                    className="relative w-64 h-auto rounded-2xl shadow-xl border-4 border-white mx-auto"
                                />
                            </div>
                            <p className="text-xs text-gray-400">After payment, fill in the details below and confirm.</p>

                            <div className="space-y-3 text-left">
                                <Input
                                    label="Amount Paid (₹)"
                                    type="number"
                                    value={payment.amount}
                                    onChange={(e) => setPayment({ ...payment, amount: e.target.value })}
                                    icon={<IndianRupee className="h-4 w-4" />}
                                    placeholder="e.g. 500"
                                />
                                <Input
                                    label="Payment Reference / UTR No."
                                    value={payment.reference}
                                    onChange={(e) => setPayment({ ...payment, reference: e.target.value })}
                                    icon={<Hash className="h-4 w-4" />}
                                    placeholder="12-digit UTR or transaction ID"
                                />
                            </div>

                            <Button onClick={handleConfirm} disabled={submitting} className="w-full">
                                {submitting ? 'Saving...' : 'Confirm Donation'}
                            </Button>

                            <button
                                onClick={() => setShowQR(false)}
                                className="text-xs text-gray-400 underline hover:text-gray-600 transition-colors"
                            >
                                Go back
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Donations;
