import React from 'react';
import { Mail, Megaphone } from 'lucide-react';

const AdBanner = () => (
    <div className="w-full my-6 relative overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 shadow-sm">
        {/* Ad label */}
        <span className="absolute top-2 right-3 text-[9px] font-black tracking-widest text-amber-400 uppercase">
            Ad
        </span>

        <div className="px-6 py-5 flex flex-col sm:flex-row items-center gap-5">
            {/* Icon */}
            <div className="w-12 h-12 rounded-xl bg-amber-400 flex items-center justify-center shrink-0 shadow-sm">
                <Megaphone size={22} className="text-white" />
            </div>

            {/* Copy */}
            <div className="flex-1 text-center sm:text-left">
                <p className="text-xs font-black tracking-widest text-amber-500 uppercase mb-0.5">
                    Advertise with Us
                </p>
                <h3 className="text-base font-black text-gray-900 leading-snug">
                    Reach 6000+ Niyogi Brahmin families
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                    Promote your business, event or service directly to our active community members.
                </p>
            </div>

            {/* Email */}
            <a
                href="mailto:msbdigitallabs@zohomail.in"
                className="shrink-0 flex items-center gap-2 text-amber-600 hover:text-amber-800 transition-colors font-bold text-sm"
            >
                <Mail size={15} />
                msbdigitallabs@zohomail.in
            </a>
        </div>
    </div>
);

export default AdBanner;
