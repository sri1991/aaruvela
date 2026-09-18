import { useEffect, useState } from 'react';
import { X, Megaphone, Mail } from 'lucide-react';
import api from '../lib/api';

const DISMISS_KEY = 'ad-bar-dismissed';

/**
 * Slim bar pinned to the bottom of the viewport — unlike an in-page ad slot,
 * this is visible immediately without scrolling. Falls back to a compact
 * "Advertise with us" prompt when no campaign is live for FOOTER, same as
 * AdSlot. Dismissible; the dismissal only lasts the browser session so the
 * bar comes back on the next visit.
 */
const StickyAdBar = () => {
    const [ad, setAd] = useState(null);
    const [dismissed, setDismissed] = useState(() => {
        try {
            return sessionStorage.getItem(DISMISS_KEY) === '1';
        } catch {
            return false;
        }
    });

    useEffect(() => {
        if (dismissed) return;
        let cancelled = false;

        api.get('/ads', { params: { placement: 'FOOTER' } })
            .then(res => {
                if (cancelled || !res.data?.length) return;
                const picked = res.data[Math.floor(Math.random() * res.data.length)];
                setAd(picked);
                api.post(`/ads/${picked.id}/impression`).catch(() => {});
            })
            .catch(() => { /* fall back to the house prompt */ });

        return () => { cancelled = true; };
    }, [dismissed]);

    if (dismissed) return null;

    const dismiss = () => {
        try {
            sessionStorage.setItem(DISMISS_KEY, '1');
        } catch { /* private browsing, etc. — just hide for this render */ }
        setDismissed(true);
    };

    const handleClick = () => {
        if (ad) api.post(`/ads/${ad.id}/click`).catch(() => {});
    };

    return (
        <div className="fixed bottom-0 inset-x-0 z-40 border-t border-amber-200 bg-amber-50/95 backdrop-blur-sm shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
            <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2 flex items-center gap-3">
                <span className="hidden sm:inline shrink-0 text-[9px] font-black tracking-widest text-amber-400 uppercase">Ad</span>

                {ad ? (
                    <a
                        href={ad.target_url || undefined}
                        target={ad.target_url ? '_blank' : undefined}
                        rel={ad.target_url ? 'noopener noreferrer sponsored' : undefined}
                        onClick={handleClick}
                        className="flex-1 min-w-0 flex items-center gap-3 group"
                    >
                        {ad.image_url && (
                            <img src={ad.image_url} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
                        )}
                        <div className="min-w-0">
                            <p className="text-sm font-black text-gray-900 truncate group-hover:underline">{ad.title}</p>
                            {ad.subtitle && <p className="text-[11px] text-gray-500 truncate">{ad.subtitle}</p>}
                        </div>
                    </a>
                ) : (
                    <a
                        href="mailto:msbdigitallabs@zohomail.in"
                        className="flex-1 min-w-0 flex items-center gap-3 group"
                    >
                        <div className="w-9 h-9 rounded-lg bg-amber-400 flex items-center justify-center shrink-0">
                            <Megaphone size={16} className="text-white" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-black text-gray-900 truncate">Advertise with us</p>
                            <p className="text-[11px] text-amber-600 truncate flex items-center gap-1">
                                <Mail size={11} /> msbdigitallabs@zohomail.in
                            </p>
                        </div>
                    </a>
                )}

                <button onClick={dismiss} aria-label="Dismiss" className="shrink-0 p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-black/5 transition-colors">
                    <X size={16} />
                </button>
            </div>
        </div>
    );
};

export default StickyAdBar;
