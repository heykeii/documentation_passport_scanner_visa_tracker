import React from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

const pageTitles = {
    '/dashboard':            'Dashboard',
    '/dashboard/scan':       'Smart Scan',
    '/dashboard/management': 'Management',
    '/dashboard/records':    'Passenger Records',
    '/dashboard/settings':   'Settings',
};

const pageSubtitles = {
    '/dashboard/scan':       'AI-powered passport scanning and data extraction.',
    '/dashboard/management': 'Import, export and manage passport records in bulk.',
    '/dashboard/records':    'Browse and search all passenger entries.',
    '/dashboard/settings':   'Account, system, and application preferences.',
};

const Topbar = ({ user }) => {
    const { pathname } = useLocation();
    const title = pageTitles[pathname] || 'Dashboard';
    const firstName = user?.name ? user.name.split(' ')[0] : 'there';
    const subtitle = pathname === '/dashboard'
        ? `Welcome back, ${firstName}. Here's what's happening today.`
        : (pageSubtitles[pathname] || '');

    return (
        <header className="h-[62px] shrink-0 flex items-center px-6 gap-4 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-[#0d1b35]">

            {/* Title */}
            <div className="flex-1 min-w-0">
                <h1 className="font-[Outfit] text-[20px] font-bold text-[#0B2447] dark:text-white tracking-tight leading-none">
                    {title}
                </h1>
                <p className="font-[Outfit] text-[13.5px] text-slate-500 dark:text-[#A5D7E8]/55 mt-0.5 truncate">
                    {subtitle}
                </p>
            </div>

            {/* Right: Authorized badge + bell */}
            <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-1.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-full px-3 py-1.5">
                    <Lock className="w-3 h-3 text-red-500 dark:text-red-400" strokeWidth={2} />
                    <span className="font-[Outfit] text-[13px] font-medium text-red-600 dark:text-red-400">Authorized Staff Only</span>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 rounded-xl text-slate-500 hover:text-[#0B2447] hover:bg-slate-100 dark:text-[#A5D7E8]/60 dark:hover:text-white dark:hover:bg-white/10 cursor-pointer relative"
                >
                    <Bell className="w-4 h-4" strokeWidth={1.8} />
                </Button>
            </div>
        </header>
    );
};

export default Topbar;
