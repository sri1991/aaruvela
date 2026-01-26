import React, { useState } from 'react';
import { Users, Phone, BadgeCheck } from 'lucide-react';

const MemberCard = ({ name, post, mobile, isExecutive }) => (
    <div className={`p-4 rounded-xl border ${isExecutive ? 'border-l-4 border-l-[var(--color-secondary)] bg-blue-50' : 'border-l-4 border-l-yellow-400 bg-yellow-50'} shadow-sm hover:shadow-md transition-shadow`}>
        <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
            {name}
            {isExecutive && <BadgeCheck size={16} className="text-[var(--color-secondary)]" />}
        </h3>
        <p className="text-[var(--color-primary-dark)] font-medium text-sm mb-2">{post}</p>
        {mobile && (
            <div className="flex items-center gap-2 text-gray-600 text-sm">
                <Phone size={14} />
                <span>{mobile}</span>
            </div>
        )}
    </div>
);

const About = () => {
    const [activeTab, setActiveTab] = useState('founding');

    // Data provided by User
    const foundingMembers = [
        { name: "Vadrevu Venkata Satya Narasimha Venugopala Rao", post: "Hon’ble President", mobile: "9849476726" },
        { name: "Chiruvolu Srinivasarao", post: "President", mobile: "9885063577" },
        { name: "Chayanam Srinivasa Murthy", post: "Vice-President", mobile: "9440326363" },
        { name: "Chiruvolu Satya Srinivas", post: "Co-Vice President", mobile: "9491223344" },
        { name: "Kunderu Kanubabu", post: "Secretary", mobile: "8309874005" },
        { name: "Vadrevu Sarabharaju", post: "Asst. Secretary", mobile: "9866103483" },
        { name: "Nadakuditi Sriramachandra Murthy", post: "Treasurer", mobile: "9848645899" },
        { name: "Nerella Gnana Satya Venkatanarayana", post: "Member", mobile: "9848747447" },
        { name: "Vadrevu Srinivas", post: "Member", mobile: "7997459859" },
        { name: "Ventrapragada Venugopalarao", post: "Member", mobile: "9440097872" },
        { name: "Koochimanchi Sasidhara Sriram", post: "Member", mobile: "9246832468" },
    ];

    const executiveMembers = [
        { name: "Vadrevu Venkata Satya Narasimha Venugopala Rao", post: "Hon’ble President", mobile: "9849476726" },
        { name: "Chiruvolu Srinivasarao", post: "President", mobile: "9885063577" },
        { name: "Chayanam Srinivasa Murthy", post: "Vice-President", mobile: "9440326363" },
        { name: "Chiruvolu Satya Srinivas", post: "Co-Vice President", mobile: "9491223344" },
        { name: "Kunderu Kanubabu", post: "Secretary", mobile: "8309874005" },
        { name: "Vadrevu Sarabharaju", post: "Asst. Secretary", mobile: "9866103483" },
        { name: "Nadakuditi Sriramachandra Murthy", post: "Treasurer", mobile: "9848645899" },
        { name: "Nerella Gnana Satya Venkatanarayana", post: "Member", mobile: "9848747447" },
        { name: "Vadrevu Srinivas", post: "Member", mobile: "7997459859" },
        { name: "Ventrapragada Venugopalarao", post: "Member", mobile: "9440097872" },
        { name: "Koochimanchi Sasidhara Sriram", post: "Member", mobile: "9246832468" },
    ];

    return (
        <div className="min-h-screen bg-white">
            {/* Header Banner */}

            <div className="container mx-auto px-4 py-8 max-w-5xl">

                {/* Tab Navigation */}
                <div className="flex justify-center mb-8">
                    <div className="bg-gray-100 p-1.5 rounded-xl inline-flex shadow-inner">
                        <button
                            onClick={() => setActiveTab('founding')}
                            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'founding' ? 'bg-white text-[var(--color-primary)] shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Founding Members
                        </button>
                        <button
                            onClick={() => setActiveTab('executive')}
                            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'executive' ? 'bg-white text-[var(--color-secondary)] shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Executive Committee
                        </button>
                    </div>
                </div>

                {/* Founding Members Section */}
                {activeTab === 'founding' && (
                    <section className="animate-in fade-in zoom-in-95 duration-300">
                        <div className="flex items-center gap-3 mb-6 border-b pb-4 border-yellow-100">
                            <div className="p-3 bg-yellow-100 text-yellow-700 rounded-full">
                                <Users size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
                                    Founding Members
                                </h2>
                                {/* <span className="text-sm text-gray-500 font-medium">(స్థాపక సభ్యులు)</span> */}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {foundingMembers.map((member, index) => (
                                <MemberCard key={index} {...member} />
                            ))}
                        </div>
                    </section>
                )}

                {/* Executive Committee Section */}
                {activeTab === 'executive' && (
                    <section className="animate-in fade-in zoom-in-95 duration-300">
                        <div className="flex items-center gap-3 mb-6 border-b pb-4 border-blue-100">
                            <div className="p-3 bg-blue-100 text-blue-700 rounded-full">
                                <BadgeCheck size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
                                    Executive Committee
                                </h2>
                                {/* <span className="text-sm text-gray-500 font-medium">(కార్యవర్గ సభ్యులు)</span> */}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {executiveMembers.map((member, index) => (
                                <MemberCard key={index} {...member} isExecutive={true} />
                            ))}
                        </div>
                    </section>
                )}

            </div>
        </div>
    );
};

export default About;
