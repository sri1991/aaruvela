import React from 'react';
import { Shield, AlertTriangle, Scale, Heart, Info } from 'lucide-react';

const Disclaimer = () => {
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-black text-gray-900 sm:text-4xl mb-4">
                        Disclaimer & Legal Information
                    </h1>
                    <p className="text-lg text-gray-600">
                        Important information regarding our services, content, and your responsibilities as a user.
                    </p>
                    <div className="w-24 h-1.5 bg-primary mx-auto mt-6 rounded-full"></div>
                </div>

                <div className="space-y-8">
                    {/* 1. Third-Party Content & Advertisement Disclaimer */}
                    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-amber-50 px-6 py-4 border-b border-amber-100 flex items-center gap-3">
                            <AlertTriangle className="text-amber-600" size={24} />
                            <h2 className="text-xl font-bold text-amber-900">1. Third-Party Content & Advertisement Disclaimer</h2>
                        </div>
                        <div className="p-6 prose prose-amber max-w-none text-gray-700 leading-relaxed">
                            <p><strong>Accuracy of Content:</strong> Please note that we host advertisements and matrimony listings provided by third parties. We do not guarantee the accuracy, completeness, or reliability of any information contained in these advertisements.</p>
                            <p><strong>No Endorsement:</strong> The appearance of an advertisement on this platform does not constitute an endorsement, recommendation, or guarantee by MSB digital labs and consulting or its affiliates.</p>
                            <p><strong>Verification Responsibility:</strong> We do not verify the credentials, character, or status (marital, financial, or legal) of individuals or services listed in advertisements. Users assume full responsibility for confirming the background of any person or service they interact with.</p>
                            <div className="bg-amber-100/50 p-4 rounded-xl border border-amber-200 mt-4">
                                <p className="text-amber-900 font-bold mb-0">
                                    "Users are advised to make independent inquiries before acting upon any advertisement."
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* 2. "As Is" and "As Available" Disclaimer */}
                    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-blue-50 px-6 py-4 border-b border-blue-100 flex items-center gap-3">
                            <Info className="text-blue-600" size={24} />
                            <h2 className="text-xl font-bold text-blue-900">2. "As Is" and "As Available" Disclaimer</h2>
                        </div>
                        <div className="p-6 text-gray-700 leading-relaxed">
                            <p><strong>Service Continuity:</strong> This application is provided on an "as is" and "as available" basis without any warranties of any kind, whether express or implied, including but not limited to fitness for a particular purpose or non-infringement.</p>
                            <p className="mt-4"><strong>Maintenance & Downtime:</strong> We reserve the right to perform scheduled or unscheduled maintenance. We are not liable for any loss of data, connectivity, or business opportunities during these maintenance windows or due to unexpected technical failures.</p>
                        </div>
                    </section>

                    {/* 3. Limitation of Liability */}
                    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-red-50 px-6 py-4 border-b border-red-100 flex items-center gap-3">
                            <Scale className="text-red-600" size={24} />
                            <h2 className="text-xl font-bold text-red-900">3. Limitation of Liability</h2>
                        </div>
                        <div className="p-6 text-gray-700 leading-relaxed">
                            <p><strong>Indirect Damages:</strong> To the maximum extent permitted by law, MSB digital labs and consulting shall not be liable for any indirect, incidental, special, or consequential damages, including but not limited to loss of profits, emotional distress resulting from matrimony matches, or data breaches caused by third-party services.</p>
                            <p className="mt-4"><strong>Liability Cap:</strong> Our total liability for any claim arising out of or relating to use of the app is limited to the amount paid by the user (if any) to use the service in the 12 months preceding the claim, or a nominal fixed fee as determined by local regulations.</p>
                        </div>
                    </section>

                    {/* 4. Matrimony-Specific Disclaimers */}
                    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-rose-50 px-6 py-4 border-b border-rose-100 flex items-center gap-3">
                            <Heart className="text-rose-600" size={24} />
                            <h2 className="text-xl font-bold text-rose-900">4. Matrimony-Specific Disclaimers</h2>
                        </div>
                        <div className="p-6 text-gray-700 leading-relaxed">
                            <p><strong>No Guarantee of Marriage:</strong> This platform serves as a facilitation tool for information exchange within the community. We do not guarantee a successful match or subsequent marriage.</p>
                            
                            <div className="bg-rose-100/50 p-4 rounded-xl border border-rose-200 my-4">
                                <p className="text-rose-900 font-bold mb-2 flex items-center gap-2">
                                    <Shield size={18} /> Safe Usage Warning
                                </p>
                                <p className="text-rose-800 text-sm italic">
                                    "For your safety, never share financial details or send money to people you meet through advertisements or matrimony listings."
                                </p>
                            </div>

                            <p><strong>Background Checks:</strong> We do not conduct criminal background checks or official verification of documents for any advertiser or user of this platform.</p>
                        </div>
                    </section>

                    {/* 5. Indemnity Clause */}
                    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-primary-light/10 px-6 py-4 border-b border-primary-light/20 flex items-center gap-3">
                            <Shield className="text-primary" size={24} />
                            <h2 className="text-xl font-bold text-primary-dark">5. Indemnity Clause</h2>
                        </div>
                        <div className="p-6 text-gray-700 leading-relaxed">
                            <p>Users and advertisers agree to indemnify, defend, and hold harmless MSB digital labs and consulting, its officers, directors, and employees from and against any and all claims, losses, expenses, or legal fees (including attorney fees) arising from their breach of these terms, their use of the platform, or their violation of any law or third-party rights.</p>
                        </div>
                    </section>
                </div>

                {/* Footer Note */}
                <div className="mt-12 text-center text-sm text-gray-500">
                    <p>Last Updated: April 13, 2026</p>
                    <p className="mt-2">By using this application, you acknowledge that you have read and understood these disclaimers.</p>
                </div>
            </div>
        </div>
    );
};

export default Disclaimer;
