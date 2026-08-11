import { useEffect, useState } from 'react';
import api from '../lib/api';
import AdBanner from './AdBanner';

/**
 * Renders an admin-managed ad for a placement, falling back to the house
 * "Advertise with us" banner when no campaign is live — the slot is never blank.
 */
const AdSlot = ({ placement = 'HOME_BANNER' }) => {
    const [ad, setAd] = useState(null);

    useEffect(() => {
        let cancelled = false;

        api.get('/ads', { params: { placement } })
            .then(res => {
                if (cancelled || !res.data?.length) return;
                // One ad per render; rotation across visitors comes from the random pick.
                const picked = res.data[Math.floor(Math.random() * res.data.length)];
                setAd(picked);
                api.post(`/ads/${picked.id}/impression`).catch(() => {});
            })
            .catch(() => { /* fall back to the house banner */ });

        return () => { cancelled = true; };
    }, [placement]);

    if (!ad) return <AdBanner />;

    const handleClick = () => {
        api.post(`/ads/${ad.id}/click`).catch(() => {});
    };

    const content = (
        <div className="w-full my-6 relative overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <span className="absolute top-2 right-3 z-10 text-[9px] font-black tracking-widest text-amber-400 uppercase bg-white/80 px-1.5 rounded">
                Ad
            </span>

            {ad.image_url && (
                <img
                    src={ad.image_url}
                    alt={ad.title}
                    loading="lazy"
                    className="w-full max-h-56 object-cover"
                />
            )}

            <div className="px-6 py-4">
                <h3 className="text-base sm:text-lg font-black text-gray-900 leading-tight">{ad.title}</h3>
                {ad.subtitle && <p className="text-xs text-gray-500 mt-1">{ad.subtitle}</p>}
                {ad.advertiser_name && (
                    <p className="text-[10px] font-bold tracking-widest text-amber-500 uppercase mt-2">
                        {ad.advertiser_name}
                    </p>
                )}
            </div>
        </div>
    );

    if (!ad.target_url) return content;

    return (
        <a
            href={ad.target_url}
            target="_blank"
            rel="noopener noreferrer sponsored"
            onClick={handleClick}
            className="block"
        >
            {content}
        </a>
    );
};

export default AdSlot;
