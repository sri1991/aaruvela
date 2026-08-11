import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../features/auth/AuthContext';
import AdSlot from '../components/AdSlot';
import { Loader2, Video as VideoIcon, LogIn, Search, Clock, Play } from 'lucide-react';

const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const daysLeft = (expires) => {
    if (!expires) return null;
    const diff = Math.ceil((new Date(expires) - new Date()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
};

const VideoCard = ({ video }) => {
    const [playing, setPlaying] = useState(false);
    const left = daysLeft(video.expires_at);

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col">
            <div className="relative aspect-video bg-gray-900">
                {playing ? (
                    <video
                        src={video.video_url}
                        poster={video.thumbnail_url || undefined}
                        controls
                        autoPlay
                        preload="metadata"
                        className="w-full h-full"
                    />
                ) : (
                    // Nothing is downloaded until the member actually presses play —
                    // a grid of auto-loading videos would burn through bandwidth.
                    <button
                        onClick={() => setPlaying(true)}
                        className="group w-full h-full relative flex items-center justify-center"
                        aria-label={`Play ${video.title}`}
                    >
                        {video.thumbnail_url ? (
                            <img src={video.thumbnail_url} alt="" loading="lazy" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                        ) : (
                            <div className="w-full h-full bg-gray-800" />
                        )}
                        <span className="absolute inset-0 flex items-center justify-center">
                            <span className="w-14 h-14 rounded-full bg-white/90 group-hover:bg-white flex items-center justify-center shadow-lg transition-all group-hover:scale-105">
                                <Play size={22} className="text-gray-900 ml-1" fill="currentColor" />
                            </span>
                        </span>
                    </button>
                )}
            </div>

            <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-black text-gray-900 text-sm leading-snug line-clamp-2">{video.title}</h3>
                {video.description && (
                    <p className="text-xs text-gray-500 mt-1.5 leading-relaxed line-clamp-2">{video.description}</p>
                )}

                <div className="flex items-center justify-between pt-3 mt-auto border-t border-gray-50 text-[10px]">
                    <span className="text-gray-400 font-medium truncate">
                        {video.users?.full_name || 'Member'} · {formatDate(video.published_at)}
                    </span>
                    {left !== null && (
                        <span className={`inline-flex items-center gap-1 font-bold shrink-0 ml-2 ${left <= 2 ? 'text-amber-500' : 'text-gray-300'}`}>
                            <Clock size={10} /> {left}d left
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

const LoginPrompt = () => {
    const navigate = useNavigate();
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4">
                <LogIn size={28} className="text-amber-500" />
            </div>
            <h2 className="text-xl font-black text-gray-900 mb-2">Members Only</h2>
            <p className="text-gray-500 text-sm mb-6 max-w-xs">
                Community videos are exclusive to active members. Log in to watch them.
            </p>
            <button
                onClick={() => navigate('/auth')}
                className="bg-[var(--color-primary)] text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
            >
                Login / Sign Up
            </button>
        </div>
    );
};

const Videos = () => {
    const { user, loading: authLoading } = useAuth();
    const isActiveMember = user?.status === 'ACTIVE';
    // null means "not fetched yet" — lets loading be derived rather than a second state.
    const [videos, setVideos] = useState(null);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (!isActiveMember) return;
        let cancelled = false;
        api.get('/videos')
            .then(res => { if (!cancelled) setVideos(res.data); })
            .catch(() => { if (!cancelled) setVideos([]); });
        return () => { cancelled = true; };
    }, [isActiveMember]);

    if (!authLoading && !isActiveMember) return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="container mx-auto max-w-5xl"><LoginPrompt /></div>
        </div>
    );

    const loading = authLoading || videos === null;
    const list = videos ?? [];
    const filtered = list.filter(v => !search || v.title?.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="container mx-auto max-w-5xl">
                <div className="mb-6">
                    <h1 className="text-2xl font-black text-gray-900">Community Videos</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        {loading ? '...' : `${list.length} video${list.length !== 1 ? 's' : ''} shared by members`}
                    </p>
                </div>

                <div className="relative mb-6">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search videos..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-[var(--color-primary)]"
                    />
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="animate-spin text-[var(--color-primary)] h-8 w-8" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20 text-gray-400">
                        <VideoIcon size={40} className="mx-auto mb-3 opacity-30" />
                        <p className="font-medium">
                            {list.length === 0 ? 'No videos are live right now.' : 'No videos match your search.'}
                        </p>
                        {list.length === 0 && (
                            <p className="text-xs mt-2">Share one from your dashboard — approved videos stay up for a week.</p>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filtered.map(video => <VideoCard key={video.id} video={video} />)}
                    </div>
                )}

                <AdSlot placement="FOOTER" />
            </div>
        </div>
    );
};

export default Videos;
