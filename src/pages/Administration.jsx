import React, { useState } from 'react';
import { Users, Phone, BadgeCheck, FileText, MessageSquare } from 'lucide-react';
import rcImage from '../assets/administration-rc.jpg';
import chairmanMessagePdf from '../assets/6000N Pamplet.pdf';
import logoLeft from '../assets/logo-left-main.jpg';

const MemberCard = ({ name, post, mobile, image, isExecutive }) => (
    <div className={`p-3 md:p-4 rounded-xl border ${isExecutive ? 'border-l-4 border-l-[var(--color-secondary)] bg-blue-50' : 'border-l-4 border-l-yellow-400 bg-yellow-50'} shadow-sm hover:shadow-md transition-shadow flex items-center gap-3`}>
        <div className="w-12 h-12 md:w-16 md:h-16 rounded-full overflow-hidden border-2 border-white shadow-sm shrink-0 bg-gray-200">
            <img
                src={image || `https://placehold.co/100x100?text=${name.charAt(0)}`}
                alt={name}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/100x100?text=${name.charAt(0)}`; }}
            />
        </div>
        <div className="min-w-0 flex-1">
            <h3 className="font-bold text-gray-800 text-sm md:text-base flex items-start gap-1 flex-wrap leading-snug">
                <span className="break-words">{name}</span>
                {isExecutive && <BadgeCheck size={14} className="text-[var(--color-secondary)] shrink-0 mt-0.5" />}
            </h3>
            {post && <p className={`${isExecutive ? 'text-[var(--color-primary-dark)]' : 'text-yellow-700'} font-medium text-xs md:text-sm mb-1`}>{post}</p>}
            {mobile && (
                <a href={`tel:${mobile}`} className="flex items-center gap-1.5 text-gray-600 text-xs md:text-sm hover:text-[var(--color-primary)] transition-colors">
                    <Phone size={12} className="shrink-0" />
                    <span>{mobile}</span>
                </a>
            )}
        </div>
    </div>
);

const Administration = () => {
    const [activeTab, setActiveTab] = useState('founding');
    const [activeRegionTab, setActiveRegionTab] = useState('telangana');
    const [activeZonalTab, setActiveZonalTab] = useState('kosta');

    // Data provided by User
    const foundingMembers = [
        { name: "Vadrevu Venkata Satya Narasimha Venugopala Rao", mobile: "9849476726", image: "https://pbyhqbnfmwgdjsbjriaf.supabase.co/storage/v1/object/public/founders/venugopal.jpeg" },
        { name: "Chiruvolu Srinivasarao", mobile: "9885063577", image: "https://pbyhqbnfmwgdjsbjriaf.supabase.co/storage/v1/object/public/founders/ChSrinivasarao.jpeg" },
        { name: "Chayanam Srinivasa Murthy", mobile: "9440326363", image: "https://pbyhqbnfmwgdjsbjriaf.supabase.co/storage/v1/object/public/founders/Chayanam.jpeg" },
        { name: "Chiruvolu Satya Srinivas", mobile: "9491223344", image: "https://pbyhqbnfmwgdjsbjriaf.supabase.co/storage/v1/object/public/founders/chsrinivas2.jpeg" },
        { name: "Kunderu Kanubabu", mobile: "8309874005", image: "https://pbyhqbnfmwgdjsbjriaf.supabase.co/storage/v1/object/public/founders/kanubabu.jpeg" },
        { name: "Vadrevu Sarabharaju", mobile: "9866103483", image: "https://pbyhqbnfmwgdjsbjriaf.supabase.co/storage/v1/object/public/founders/Sarabharaju.jpeg" },
        { name: "Nadakuditi Sreeramachandra Murthy", mobile: "9848645899", image: "https://pbyhqbnfmwgdjsbjriaf.supabase.co/storage/v1/object/public/founders/Nadakuditi.jpeg" },
        { name: "Nerella Gnana Satya Venkatanarayana", mobile: "9848747447", image: "https://pbyhqbnfmwgdjsbjriaf.supabase.co/storage/v1/object/public/founders/Nerella.jpeg" },
        { name: "Vadrevu Srinivas", mobile: "7997459859", image: "https://pbyhqbnfmwgdjsbjriaf.supabase.co/storage/v1/object/public/founders/Vadrevu%20Srinivas.jpeg" },
        { name: "Ventrapragada Venugopalarao", mobile: "9440097872", image: "https://pbyhqbnfmwgdjsbjriaf.supabase.co/storage/v1/object/public/founders/Ventrapragada.jpeg" },
        { name: "Koochimanchi Sasidhara Sriram", mobile: "9246832468", image: "https://pbyhqbnfmwgdjsbjriaf.supabase.co/storage/v1/object/public/founders/Kuchimanchi.jpeg" },
    ];

    const executiveMembers = [
        { name: "Vadrevu Venkata Satya Narasimha Venugopala Rao", post: "Hon’ble President", mobile: "9849476726", image: "https://pbyhqbnfmwgdjsbjriaf.supabase.co/storage/v1/object/public/founders/venugopal.jpeg" },
        { name: "Chiruvolu Srinivasarao", post: "President", mobile: "9885063577", image: "https://pbyhqbnfmwgdjsbjriaf.supabase.co/storage/v1/object/public/founders/ChSrinivasarao.jpeg" },
        { name: "Chayanam Srinivasa Murthy", post: "Vice-President", mobile: "9440326363", image: "https://pbyhqbnfmwgdjsbjriaf.supabase.co/storage/v1/object/public/founders/Chayanam.jpeg" },
        { name: "Chiruvolu Satya Srinivas", post: "Co-Vice President", mobile: "9491223344", image: "https://pbyhqbnfmwgdjsbjriaf.supabase.co/storage/v1/object/public/founders/chsrinivas2.jpeg" },
        { name: "Kunderu Kanubabu", post: "Secretary", mobile: "8309874005", image: "https://pbyhqbnfmwgdjsbjriaf.supabase.co/storage/v1/object/public/founders/kanubabu.jpeg" },
        { name: "Vadrevu Sarabharaju", post: "Asst. Secretary", mobile: "9866103483", image: "https://pbyhqbnfmwgdjsbjriaf.supabase.co/storage/v1/object/public/founders/Sarabharaju.jpeg" },
        { name: "Nadakuditi Sreeramachandra Murthy", post: "Treasurer", mobile: "9848645899", image: "https://pbyhqbnfmwgdjsbjriaf.supabase.co/storage/v1/object/public/founders/Nadakuditi.jpeg" },
        { name: "Nerella Gnana Satya Venkatanarayana", post: "Member", mobile: "9848747447", image: "https://pbyhqbnfmwgdjsbjriaf.supabase.co/storage/v1/object/public/founders/Nerella.jpeg" },
        { name: "Vadrevu Srinivas", post: "Member", mobile: "7997459859", image: "https://pbyhqbnfmwgdjsbjriaf.supabase.co/storage/v1/object/public/founders/Vadrevu%20Srinivas.jpeg" },
        { name: "Ventrapragada Venugopalarao", post: "Member", mobile: "9440097872", image: "https://pbyhqbnfmwgdjsbjriaf.supabase.co/storage/v1/object/public/founders/Ventrapragada.jpeg" },
        { name: "Koochimanchi Sasidhara Sriram", post: "Member", mobile: "9246832468", image: "https://pbyhqbnfmwgdjsbjriaf.supabase.co/storage/v1/object/public/founders/Kuchimanchi.jpeg" },
    ];

    const tabs = [
        { id: 'founding', label: 'Founding Members' },
        { id: 'executive', label: 'Central Executive' },
        { id: 'divisional', label: 'Divisional Committee' },
        { id: 'zonal', label: 'Zone' },
        { id: 'regional', label: 'Region' },
        { id: 'legal', label: 'Legal Details' },
        { id: 'message', label: 'Chairman Message' },
    ];

    return (
        <div className="min-h-screen bg-white">
            <div className="container mx-auto px-4 py-8 max-w-7xl">

                {/* Tab Navigation */}
                <div className="mb-8">
                    <div className="bg-gray-100 p-2 rounded-xl grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 shadow-inner w-full">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full px-1 py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all duration-200 truncate ${activeTab === tab.id ? 'bg-white text-[var(--color-primary)] shadow-md ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Founding Members Section */}
                {activeTab === 'founding' && (
                    <section className="animate-in fade-in zoom-in-95 duration-300">
                        <div className="flex items-center gap-3 mb-6 border-b pb-4 border-yellow-100">
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-white shadow-sm border border-yellow-200 p-1 flex items-center justify-center">
                                <img src={logoLeft} alt="Parishat Logo" className="w-full h-full object-contain" />
                            </div>
                            <div>
                                <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
                                    Founding Members
                                </h2>
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
                                    Central Executive
                                </h2>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {executiveMembers.map((member, index) => (
                                <MemberCard key={index} {...member} isExecutive={true} />
                            ))}
                        </div>
                    </section>
                )}

                {/* Legal Details Section */}
                {activeTab === 'legal' && (
                    <section className="animate-in fade-in zoom-in-95 duration-300">
                        <div className="flex items-center gap-3 mb-6 border-b pb-4 border-gray-200">
                            <div className="p-3 bg-gray-100 text-gray-700 rounded-full">
                                <FileText size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
                                    Registration Certificate
                                </h2>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                            <div className="rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center p-2 border border-gray-200">
                                <img
                                    src={rcImage}
                                    alt="Aaruvela Niyogi Brahmana Seva Parishat Registration Certificate"
                                    className="w-full h-auto max-w-4xl rounded-lg shadow-sm"
                                />
                            </div>
                        </div>
                    </section>
                )}

                {/* Chairman Message Section */}
                {activeTab === 'message' && (
                    <section className="animate-in fade-in zoom-in-95 duration-300">
                        <div className="flex items-center gap-3 mb-6 border-b pb-4 border-gray-200">
                            <div className="p-3 bg-gray-100 text-gray-700 rounded-full">
                                <MessageSquare size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
                                    Chairman Message
                                </h2>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden flex flex-col h-[85vh] w-full">
                            {/* Toolbar */}
                            <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex justify-between items-center shrink-0">
                                <div className="flex items-center gap-2 text-gray-700 font-medium text-sm">
                                    <FileText size={16} />
                                    <span>6000N_Pamplet.pdf</span>
                                </div>
                                <a
                                    href={chairmanMessagePdf}
                                    download="Chairman_Message_Pamphlet.pdf"
                                    className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-md text-sm font-medium transition-colors shadow-sm"
                                >
                                    <span>Download</span>
                                </a>
                            </div>

                            {/* PDF Viewer */}
                            <div className="flex-1 bg-gray-100 relative w-full">
                                <object
                                    data={`${chairmanMessagePdf}#toolbar=0&navpanes=0&scrollbar=1`}
                                    type="application/pdf"
                                    className="w-full h-full block"
                                >
                                    {/* Fallback for browsers/mobile that don't allow inline PDF */}
                                    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                                        <FileText size={48} className="text-gray-300 mb-4" />
                                        <p className="text-gray-600 mb-4">
                                            This browser does not support inline PDF viewing.
                                        </p>
                                        <a
                                            href={chairmanMessagePdf}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 font-medium hover:underline"
                                        >
                                            Click here to view the PDF
                                        </a>
                                    </div>
                                </object>
                            </div>
                        </div>
                    </section>
                )}

                {/* Zonal Section with Sub-tabs */}
                {activeTab === 'zonal' && (
                    <section className="animate-in fade-in zoom-in-95 duration-300">
                        {/* Zonal Sub-tabs */}
                        <div className="flex justify-center mb-8">
                            <div className="bg-gray-100 p-1 rounded-lg inline-flex shadow-sm flex-wrap justify-center gap-1">
                                <button
                                    onClick={() => setActiveZonalTab('kosta')}
                                    className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeZonalTab === 'kosta' ? 'bg-white text-[var(--color-primary)] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Kosta Andhara
                                </button>
                                <button
                                    onClick={() => setActiveZonalTab('rayalaseema')}
                                    className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeZonalTab === 'rayalaseema' ? 'bg-white text-[var(--color-primary)] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Rayalaseema
                                </button>
                                <button
                                    onClick={() => setActiveZonalTab('uttara')}
                                    className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeZonalTab === 'uttara' ? 'bg-white text-[var(--color-primary)] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Uttara Andhara
                                </button>
                            </div>
                        </div>

                        {/* Kosta Content */}
                        {activeZonalTab === 'kosta' && (
                            <div className="text-center py-12 text-gray-500 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <h3 className="text-xl font-bold text-gray-700 mb-2">Kosta Andhara Zone</h3>
                                <p>Kosta Andhara Committee details coming soon...</p>
                            </div>
                        )}

                        {/* Rayaseema Content */}
                        {activeZonalTab === 'rayaseema' && (
                            <div className="text-center py-12 text-gray-500 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <h3 className="text-xl font-bold text-gray-700 mb-2">Rayaseema Zone</h3>
                                <p>Rayaseema Committee details coming soon...</p>
                            </div>
                        )}

                        {/* Uttara Content */}
                        {activeZonalTab === 'uttara' && (
                            <div className="text-center py-12 text-gray-500 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <h3 className="text-xl font-bold text-gray-700 mb-2">Uttara Andhara Zone</h3>
                                <p>Uttara Andhara Committee details coming soon...</p>
                            </div>
                        )}
                    </section>
                )}

                {/* Regional Section with Sub-tabs */}
                {activeTab === 'regional' && (
                    <section className="animate-in fade-in zoom-in-95 duration-300">
                        {/* Regional Sub-tabs */}
                        <div className="flex justify-center mb-8">
                            <div className="bg-gray-100 p-1 rounded-lg inline-flex shadow-sm flex-wrap justify-center gap-1">
                                <button
                                    onClick={() => setActiveRegionTab('telangana')}
                                    className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeRegionTab === 'telangana' ? 'bg-white text-[var(--color-primary)] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Telangana
                                </button>
                                <button
                                    onClick={() => setActiveRegionTab('tamilnadu')}
                                    className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeRegionTab === 'tamilnadu' ? 'bg-white text-[var(--color-primary)] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Tamil Nadu
                                </button>
                                <button
                                    onClick={() => setActiveRegionTab('karnataka')}
                                    className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeRegionTab === 'karnataka' ? 'bg-white text-[var(--color-primary)] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Karnataka
                                </button>
                                <button
                                    onClick={() => setActiveRegionTab('restofindia')}
                                    className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeRegionTab === 'restofindia' ? 'bg-white text-[var(--color-primary)] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Rest of India
                                </button>
                            </div>
                        </div>

                        {/* Telangana Content */}
                        {activeRegionTab === 'telangana' && (
                            <div className="text-center py-12 text-gray-500 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <h3 className="text-xl font-bold text-gray-700 mb-2">Telangana Region</h3>
                                <p>Telangana Committee details coming soon...</p>
                            </div>
                        )}

                        {/* Tamil Nadu Content */}
                        {activeRegionTab === 'tamilnadu' && (
                            <div className="text-center py-12 text-gray-500 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <h3 className="text-xl font-bold text-gray-700 mb-2">Tamil Nadu Region</h3>
                                <p>Tamil Nadu Committee details coming soon...</p>
                            </div>
                        )}

                        {/* Karnataka Content */}
                        {activeRegionTab === 'karnataka' && (
                            <div className="text-center py-12 text-gray-500 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <h3 className="text-xl font-bold text-gray-700 mb-2">Karnataka Region</h3>
                                <p>Karnataka Committee details coming soon...</p>
                            </div>
                        )}

                        {/* Rest of India Content */}
                        {activeRegionTab === 'restofindia' && (
                            <div className="text-center py-12 text-gray-500 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <h3 className="text-xl font-bold text-gray-700 mb-2">Rest of India</h3>
                                <p>Rest of India Committee details coming soon...</p>
                            </div>
                        )}
                    </section>
                )}

                {/* Placeholder Sections for Other Tabs */}
                {['divisional'].includes(activeTab) && (
                    <section className="animate-in fade-in zoom-in-95 duration-300 py-12 text-center text-gray-500">
                        <h2 className="text-2xl font-bold text-gray-400 mb-2 capitalize">{tabs.find(t => t.id === activeTab)?.label}</h2>
                        <p>Content coming soon...</p>
                    </section>
                )}

            </div>
        </div>
    );
};

export default Administration;
