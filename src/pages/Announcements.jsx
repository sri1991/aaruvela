import { useEffect, useState } from 'react';
import { Loader2, Megaphone, Pin, ExternalLink } from 'lucide-react';
import api from '../lib/api';
import { categoryTheme, formatAnnouncementDate } from '../lib/announcements';
import AdSlot from '../components/AdSlot';

const CATEGORIES = ['ALL', 'GENERAL', 'EVENT', 'URGENT', 'MEETING'];

const AnnouncementCard = ({ item }) => {
    const theme = categoryTheme(item.category);

    return (
        <article className={`rounded-2xl border shadow-sm p-5 sm:p-6 ${theme.card}`}>
            <div className="flex items-start justify-between gap-4 mb-3">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${theme.badge}`}>
                    {theme.icon}
                    {item.category}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                    {item.pinned && <Pin size={13} className="text-[var(--color-primary)]" />}
                    <span className="text-[10px] text-gray-400 font-medium">{formatAnnouncementDate(item.publish_at)}</span>
                </div>
            </div>

            <h2 className="font-black text-gray-900 text-base sm:text-lg leading-snug">{item.title}</h2>

            {item.image_url && (
                <img
                    src={item.image_url}
                    alt=""
                    loading="lazy"
                    className="w-full max-h-80 object-cover rounded-xl mt-3 border border-gray-100"
                />
            )}

            {/* Plain text with line breaks preserved — never rendered as HTML. */}
            <p className="text-sm text-gray-600 mt-3 leading-relaxed whitespace-pre-line">{item.body}</p>

            {item.link_url && (
                <a
                    href={item.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-4 text-xs font-bold text-[var(--color-primary)] hover:underline"
                >
                    Read more <ExternalLink size={12} />
                </a>
            )}
        </article>
    );
};

const Announcements = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');

    useEffect(() => {
        api.get('/announcements', { params: { limit: 100 } })
            .then(res => setItems(res.data || []))
            .catch(() => setItems([]))
            .finally(() => setLoading(false));
    }, []);

    const filtered = filter === 'ALL' ? items : items.filter(i => i.category === filter);

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="container mx-auto max-w-3xl">
                <div className="mb-6">
                    <h1 className="text-2xl font-black text-gray-900">Announcements</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        {loading ? '...' : `${items.length} announcement${items.length !== 1 ? 's' : ''} from the Parishat`}
                    </p>
                </div>

                <div className="flex gap-2 mb-6 flex-wrap">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFilter(cat)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
                                filter === cat
                                    ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="animate-spin text-[var(--color-primary)] h-8 w-8" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20 text-gray-400">
                        <Megaphone size={40} className="mx-auto mb-3 opacity-30" />
                        <p className="font-medium">
                            {items.length === 0 ? 'No announcements right now.' : 'Nothing in this category.'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filtered.map(item => <AnnouncementCard key={item.id} item={item} />)}
                    </div>
                )}

                <AdSlot placement="FOOTER" />
            </div>
        </div>
    );
};

export default Announcements;
