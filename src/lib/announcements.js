import { AlertTriangle, CalendarDays, Megaphone, Users } from 'lucide-react';
import { createElement } from 'react';

const THEMES = {
    GENERAL: {
        badge: 'bg-blue-100 text-blue-700 border-blue-200',
        card:  'bg-white border-gray-100 hover:border-blue-200',
        icon:  createElement(Megaphone, { size: 11 }),
    },
    EVENT: {
        badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        card:  'bg-white border-gray-100 hover:border-emerald-200',
        icon:  createElement(CalendarDays, { size: 11 }),
    },
    URGENT: {
        badge: 'bg-red-100 text-red-700 border-red-200',
        card:  'bg-red-50/50 border-red-200 hover:border-red-300',
        icon:  createElement(AlertTriangle, { size: 11 }),
    },
    MEETING: {
        badge: 'bg-amber-100 text-amber-700 border-amber-200',
        card:  'bg-white border-gray-100 hover:border-amber-200',
        icon:  createElement(Users, { size: 11 }),
    },
};

export const categoryTheme = (category) => THEMES[category] || THEMES.GENERAL;

export const formatAnnouncementDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};
