import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../features/auth/AuthContext';
import { FileText, Newspaper, Loader2, Search, LogIn, Tag, X, Download, ExternalLink } from 'lucide-react';

const categoryColors = {
    NEWS:    { badge: 'bg-blue-100 text-blue-700 border-blue-200',   icon: <Newspaper size={12} /> },
    ARTICLE: { badge: 'bg-amber-100 text-amber-700 border-amber-200', icon: <FileText size={12} /> },
};

const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const daysLeft = (expires) => {
    if (!expires) return null;
    const diff = Math.ceil((new Date(expires) - new Date()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
};

// ─── PDF Viewer Modal ─────────────────────────────────────────────────────────

const PdfViewerModal = ({ article, onClose }) => {
    const [iframeError, setIframeError] = useState(false);
    const theme = categoryColors[article.category] || categoryColors.ARTICLE;

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-gray-900">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                    <span className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider shrink-0 ${theme.badge}`}>
                        {theme.icon}
                        {article.category}
                    </span>
                    <h2 className="text-white font-bold text-sm truncate">{article.title}</h2>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-4">
                    <a
                        href={article.pdf_url}
                        download
                        className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                    >
                        <Download size={13} />
                        <span className="hidden sm:inline">Download</span>
                    </a>
                    <a
                        href={article.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                    >
                        <ExternalLink size={13} />
                        <span className="hidden sm:inline">New tab</span>
                    </a>
                    <button
                        onClick={onClose}
                        className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* PDF Frame */}
            <div className="flex-1 relative">
                {!iframeError ? (
                    <iframe
                        src={article.pdf_url}
                        title={article.title}
                        className="w-full h-full border-0"
                        onError={() => setIframeError(true)}
                    />
                ) : (
                    // Fallback for browsers that block iframe PDF rendering
                    <div className="flex flex-col items-center justify-center h-full text-center px-4">
                        <FileText size={48} className="text-white/30 mb-4" />
                        <p className="text-white/70 text-sm mb-6">
                            Your browser blocked the inline viewer. Use one of the options below.
                        </p>
                        <div className="flex gap-3">
                            <a href={article.pdf_url} download
                                className="inline-flex items-center gap-2 bg-white text-gray-900 font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-gray-100 transition-colors">
                                <Download size={15} /> Download PDF
                            </a>
                            <a href={article.pdf_url} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 bg-white/10 text-white font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-white/20 transition-colors">
                                <ExternalLink size={15} /> Open in New Tab
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Article Card ─────────────────────────────────────────────────────────────

const ArticleCard = ({ article, onOpen }) => {
    const theme = categoryColors[article.category] || categoryColors.ARTICLE;
    const days = daysLeft(article.expires_at);

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-amber-200 transition-all p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${theme.badge}`}>
                    {theme.icon}
                    {article.category}
                </span>
                <span className="text-[10px] text-gray-400 font-medium">{formatDate(article.published_at)}</span>
            </div>

            <div className="flex-1">
                <h3 className="font-black text-gray-900 text-sm leading-snug">{article.title}</h3>
                {article.summary && (
                    <p className="text-xs text-gray-500 mt-1.5 leading-relaxed line-clamp-3">{article.summary}</p>
                )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                {days !== null && (
                    <span className={`text-[10px] font-bold ${days <= 5 ? 'text-red-400' : 'text-gray-300'}`}>
                        {days}d left
                    </span>
                )}
                <button
                    onClick={() => onOpen(article)}
                    className="ml-auto inline-flex items-center gap-1.5 bg-gray-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-gray-700 transition-colors"
                >
                    <FileText size={11} />
                    Read
                </button>
            </div>
        </div>
    );
};

// ─── Login Prompt ─────────────────────────────────────────────────────────────

const LoginPrompt = () => {
    const navigate = useNavigate();
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4">
                <LogIn size={28} className="text-amber-500" />
            </div>
            <h2 className="text-xl font-black text-gray-900 mb-2">Members Only</h2>
            <p className="text-gray-500 text-sm mb-6 max-w-xs">
                News and articles are exclusive to active members. Log in to read them.
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

// ─── Page ─────────────────────────────────────────────────────────────────────

const News = () => {
    const { user } = useAuth();
    const isActiveMember = user?.status === 'ACTIVE';
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState('ALL');
    const [viewingArticle, setViewingArticle] = useState(null);

    useEffect(() => {
        if (!isActiveMember) { setLoading(false); return; }
        api.get('/articles')
            .then(res => setArticles(res.data))
            .catch(() => setArticles([]))
            .finally(() => setLoading(false));
    }, [isActiveMember]);

    const filtered = articles.filter(a => {
        const matchesSearch = !search || a.title?.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = filterCategory === 'ALL' || a.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    if (!isActiveMember) return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="container mx-auto max-w-5xl">
                <LoginPrompt />
            </div>
        </div>
    );

    return (
        <>
            <div className="min-h-screen bg-gray-50 py-8 px-4">
                <div className="container mx-auto max-w-5xl">
                    <div className="mb-6">
                        <h1 className="text-2xl font-black text-gray-900">News & Articles</h1>
                        <p className="text-gray-500 text-sm mt-1">
                            {loading ? '...' : `${articles.length} published article${articles.length !== 1 ? 's' : ''}`}
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 mb-6">
                        <div className="relative flex-1">
                            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search articles..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-[var(--color-primary)]"
                            />
                        </div>
                        <div className="flex gap-2">
                            {['ALL', 'NEWS', 'ARTICLE'].map(cat => (
                                <button key={cat} onClick={() => setFilterCategory(cat)}
                                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
                                        filterCategory === cat
                                            ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="animate-spin text-[var(--color-primary)] h-8 w-8" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-20 text-gray-400">
                            <Tag size={40} className="mx-auto mb-3 opacity-30" />
                            <p className="font-medium">No articles found</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {filtered.map(article => (
                                <ArticleCard key={article.id} article={article} onOpen={setViewingArticle} />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {viewingArticle && (
                <PdfViewerModal article={viewingArticle} onClose={() => setViewingArticle(null)} />
            )}
        </>
    );
};

export default News;
