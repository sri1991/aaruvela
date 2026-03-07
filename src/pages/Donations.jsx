import { useState } from 'react';
import { User, Phone, MapPin, Heart } from 'lucide-react';
import { Button, Input } from '../components/ui';
import { toast } from 'react-hot-toast';
import paymentQR from '../assets/6000N Payment.jpg';

const Donations = () => {
    const [showQR, setShowQR] = useState(false);
    const [form, setForm] = useState({ name: '', phone: '', city: '' });

    const handleProceed = () => {
        if (!form.name.trim()) { toast.error('Please enter your name.'); return; }
        if (!form.phone.trim() || !/^\d{10}$/.test(form.phone.trim())) { toast.error('Please enter a valid 10-digit phone number.'); return; }
        if (!form.city.trim()) { toast.error('Please enter your city.'); return; }
        setShowQR(true);
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-md mx-auto">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Heart className="w-8 h-8 text-orange-500" />
                    </div>
                    <h1 className="text-2xl font-black text-gray-900">Donate to Aaruvela</h1>
                    <p className="text-sm text-gray-500 mt-2">Your contribution helps us serve the community.</p>
                </div>

                <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
                    {!showQR ? (
                        <div className="p-8 space-y-4">
                            <h2 className="text-lg font-black text-gray-900 mb-6">Tell us about yourself</h2>
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
                                label="City"
                                value={form.city}
                                onChange={(e) => setForm({ ...form, city: e.target.value })}
                                icon={<MapPin className="h-4 w-4" />}
                                placeholder="Your city"
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
                            <p className="text-xs text-gray-400">After payment, please share the screenshot with us at our contact number.</p>
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
