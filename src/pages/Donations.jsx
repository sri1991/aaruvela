import React from 'react';
import paymentQR from '../assets/6000N Payment.jpg';

const Donations = () => {
    return (
        <div className="min-h-screen bg-white">
            <section className="py-8 px-4">
                <div className="container mx-auto max-w-lg text-center">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Donate to Aaruvela</h1>
                    <p className="text-gray-500 mb-6 text-sm">
                        Scan the QR code below to make a donation via BHIM UPI.
                    </p>
                    <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-r-xl shadow-sm inline-block w-full">
                        <img
                            src={paymentQR}
                            alt="Donation QR Code - BHIM UPI"
                            className="w-full max-w-xs mx-auto h-auto rounded-lg shadow-sm"
                        />
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Donations;
