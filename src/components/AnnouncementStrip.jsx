import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Megaphone, Pin, ArrowRight } from 'lucide-react';
import api from '../lib/api';
import { categoryTheme, formatAnnouncementDate } from '../lib/announcements';

/**
 * The three most recent live announcements, shown above the home gallery.
 * Renders nothing at all when there are none — no empty state on the landing page.
 */
const AnnouncementStrip = ({ limit = 3 }) => {
    const [items, setItems] = useState([]);

    useEffect(() => {
        let cancelled = false;
        api.get('/announcements', { params: { limit } })
            .then(res => { if (!cancelled) setItems(res.data || []); })
            .catch(() => { /* silent — the home page works fine without it */ });
        return () => { cancelled = true; };
    }, [limit]);

    if (!items.length) return null;

    return (
        <section className="mb-6">
            <div className="flex items-center justify-between mb-3">
                <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-gray-500">
                    <Megaphone size={15} className="text-[var(--color-primary)]" />
                    Announcements
                </h2>
                <Link to="/announcements" className="text-xs font-bold text-[var(--color-primary)] hover:underline flex items-center gap-1">
                    View all <ArrowRight size={12} />
                </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map(item => {
                    const theme = categoryTheme(item.category);
                    return (
                        <Link
                            key={item.id}
                            to="/announcements"
                            className={`block rounded-2xl border p-4 shadow-sm hover:shadow-md transition-shadow ${theme.card}`}
                        >
                            <div className="flex items-center justify-between mb-1.5">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${theme.badge}`}>
                                    {theme.icon}
                                    {item.category}
                                </span>
                                {item.pinned && <Pin size={12} className="text-[var(--color-primary)]" />}
                            </div>
                            <h3 className="font-black text-gray-900 text-sm leading-snug line-clamp-2">{item.title}</h3>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2 whitespace-pre-line">{item.body}</p>
                            <p className="text-[10px] text-gray-400 font-medium mt-2">{formatAnnouncementDate(item.publish_at)}</p>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
};

export default AnnouncementStrip;
