import React from 'react';
import { Megaphone, Mail } from 'lucide-react';

const AdBanner = () => {
    return (
        <div className="w-full bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-2xl overflow-hidden shadow-xl border border-gray-700 relative group my-8">
            {/* Decorative background accents */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-yellow-500/20 transition-all duration-700"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 group-hover:bg-amber-500/20 transition-all duration-700"></div>
            
            <div className="relative z-10 px-6 py-8 md:px-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-5 w-full md:w-auto">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shrink-0 shadow-inner">
                        <Megaphone size={28} className="text-white" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded text-[10px] font-black tracking-widest bg-white/10 text-yellow-500 uppercase border border-white/5">
                                Sponsorship Opportunity
                            </span>
                        </div>
                        <h3 className="text-xl md:text-2xl font-black text-white leading-tight">
                            Showcase Your Brand Here
                        </h3>
                        <p className="text-gray-400 text-sm mt-1 max-w-md">
                            Reach our dedicated community of members. We are now open for advertising and premium sponsorships.
                        </p>
                    </div>
                </div>
                
                <div className="shrink-0 w-full md:w-auto">
                    <a href="mailto:sponsorships@aaruvela.org" className="flex items-center justify-center gap-2 w-full md:w-auto px-6 py-3 rounded-xl bg-white text-gray-900 font-bold hover:bg-gray-100 transition-colors shadow-sm cursor-pointer hover:-translate-y-0.5 group/btn">
                        <Mail size={16} className="text-gray-500 group-hover/btn:text-amber-500 transition-colors" />
                        Contact for Details
                    </a>
                </div>
            </div>
        </div>
    );
};

export default AdBanner;
