import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { Button } from '../components/ui';

import MembershipTab from './admin/MembershipTab';
import RenewalsTab from './admin/RenewalsTab';
import ArticlesTab from './admin/ArticlesTab';
import VideosTab from './admin/VideosTab';
import AnnouncementsTab from './admin/AnnouncementsTab';
import AdsTab from './admin/AdsTab';
import GalleryTab from './admin/GalleryTab';
import AccountsTab from './admin/AccountsTab';
import MatrimonyTab from './admin/MatrimonyTab';
import SiteContentTab from './admin/SiteContentTab';

const GROUPS = [
    {
        id: 'members',
        label: 'Members',
        tabs: [
            { id: 'membership', label: 'Membership Requests', Component: MembershipTab },
            { id: 'renewals',   label: 'Renewals',            Component: RenewalsTab },
            { id: 'accounts',   label: 'Accounts',             Component: AccountsTab },
            { id: 'matrimony',  label: 'Matrimony Profiles',  Component: MatrimonyTab },
        ],
    },
    {
        id: 'content',
        label: 'Content',
        tabs: [
            { id: 'articles',      label: 'Articles',      Component: ArticlesTab },
            { id: 'videos',        label: 'Videos',        Component: VideosTab },
            { id: 'announcements', label: 'Announcements', Component: AnnouncementsTab },
            { id: 'ads',           label: 'Ads',            Component: AdsTab },
            { id: 'gallery',       label: 'Gallery',       Component: GalleryTab },
            { id: 'site',          label: 'Site Content',  Component: SiteContentTab },
        ],
    },
];

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [activeGroup, setActiveGroup] = useState(GROUPS[0].id);
    const [activeTab, setActiveTab] = useState(GROUPS[0].tabs[0].id);

    const currentGroup = GROUPS.find(g => g.id === activeGroup) ?? GROUPS[0];
    const ActiveComponent = currentGroup.tabs.find(tab => tab.id === activeTab)?.Component ?? currentGroup.tabs[0].Component;

    const selectGroup = (group) => {
        setActiveGroup(group.id);
        setActiveTab(group.tabs[0].id);
    };

    return (
        <div className="bg-gray-50 min-h-screen py-8 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900">Admin Dashboard</h1>
                        <p className="text-gray-500">Manage members and content</p>
                    </div>
                    <Button onClick={() => navigate('/admin/onboard')} className="bg-gray-900 hover:bg-black text-white px-6 rounded-2xl h-14 shadow-lg shadow-gray-200">
                        <UserPlus size={18} className="mr-2" /> Onboard Members
                    </Button>
                </div>

                {/* Group Navigation */}
                <div className="flex gap-2 mb-4">
                    {GROUPS.map(group => (
                        <button key={group.id} onClick={() => selectGroup(group)}
                            className={`px-5 py-2 rounded-xl text-sm font-black uppercase tracking-wide transition-colors ${activeGroup === group.id ? 'bg-[var(--color-primary)] text-white' : 'bg-white text-gray-400 hover:text-gray-900 border border-gray-100'}`}>
                            {group.label}
                        </button>
                    ))}
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-1 bg-white rounded-2xl p-1 border border-gray-100 shadow-sm mb-8 flex-wrap">
                    {currentGroup.tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-colors ${activeTab === tab.id ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-900'}`}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                <ActiveComponent />
            </div>
        </div>
    );
};

export default AdminDashboard;
