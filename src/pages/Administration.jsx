import React from 'react';
import rcImage from '../assets/administration-rc.jpg';
import { FileText } from 'lucide-react';

const Administration = () => {
    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* Header Banner */}


            <div className="container mx-auto px-4 py-12 max-w-4xl">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 p-2 md:p-6">
                    <div className="flex items-center gap-3 mb-6 px-2">
                        <div className="p-3 bg-blue-100 text-[var(--color-primary)] rounded-full">
                            <FileText size={24} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800">Registration Certificate</h2>
                    </div>

                    <div className="rounded-xl overflow-hidden border-2 border-gray-100 bg-gray-50 flex items-center justify-center p-2">
                        <img
                            src={rcImage}
                            alt="Aaruvela Niyogi Brahmana Seva Parishat Registration Certificate"
                            className="w-full h-auto max-w-full rounded-lg shadow-sm"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Administration;
