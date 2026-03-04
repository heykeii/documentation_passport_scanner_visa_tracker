import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Wifi, CalendarDays, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useTheme } from '@/contexts/ThemeContext';

const pageTitles = {
    '/dashboard':            'Tradewings Documentation Dashboard',
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
    const { theme, toggleTheme } = useTheme();
    const title = pageTitles[pathname] || 'Dashboard';
    const firstName = user?.name ? user.name.split(' ')[0] : 'there';
    const subtitle = pathname === '/dashboard'
        ? `Welcome back, ${firstName}. Here's what's happening today.`
        : (pageSubtitles[pathname] || '');

    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const t = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    const formattedDate = time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const formattedTime = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    return (
        <header className="h-[66px] shrink-0 flex items-center px-7 gap-4 border-b border-slate-200/70 dark:border-white/8 bg-white dark:bg-[#0d1b35]">

            {/* Left: Title + subtitle */}
            <div className="flex-1 min-w-0">
                <h1 className="font-[Outfit] text-[20px] font-bold text-[#0B2447] dark:text-white tracking-tight leading-none">
                    {title}
                </h1>
                {subtitle && (
                    <p className="font-[Outfit] text-[13px] text-slate-400 dark:text-[#A5D7E8]/50 mt-1 truncate">
                        {subtitle}
                    </p>
                )}
            </div>

            {/* Right: Info chips + theme switch + bell */}
            <div className="flex items-center gap-2.5 shrink-0">

                {/* System Online indicator */}
                <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/70 dark:border-emerald-500/20 rounded-lg px-3 py-1.5">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    <Wifi className="w-3 h-3 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
                    <span className="font-[Outfit] text-[12.5px] font-semibold text-emerald-700 dark:text-emerald-400">System Online</span>
                </div>

                {/* Date + Time */}
                <div className="hidden sm:flex items-center gap-2 bg-slate-50 dark:bg-white/5 border border-slate-200/70 dark:border-white/8 rounded-lg px-3 py-1.5">
                    <CalendarDays className="w-3.5 h-3.5 text-slate-400 dark:text-[#A5D7E8]/50" strokeWidth={1.8} />
                    <span className="font-[Outfit] text-[12.5px] font-medium text-slate-600 dark:text-[#A5D7E8]/70">{formattedDate}</span>
                    <span className="w-px h-3 bg-slate-300 dark:bg-white/15" />
                    <span className="font-[Outfit] text-[12.5px] font-semibold text-[#0B2447] dark:text-white tabular-nums">{formattedTime}</span>
                </div>

                {/* Theme Switch */}
                <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200/70 dark:border-white/8 rounded-lg px-2.5 py-1.5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors duration-200">
                    <Sun className={`w-3.5 h-3.5 transition-all duration-300 ${theme === 'light' ? 'text-amber-500 opacity-100' : 'text-slate-400 dark:text-slate-600 opacity-50'}`} strokeWidth={2} />
                    <Switch
                        checked={theme === 'dark'}
                        onCheckedChange={toggleTheme}
                        aria-label="Toggle dark mode"
                        size="sm"
                        className="scale-90"
                    />
                    <Moon className={`w-3.5 h-3.5 transition-all duration-300 ${theme === 'dark' ? 'text-blue-400 opacity-100' : 'text-slate-400 dark:text-slate-600 opacity-50'}`} strokeWidth={2} />
                </div>

                {/* Bell */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="w-9 h-9 rounded-lg text-slate-400 hover:text-[#0B2447] hover:bg-slate-100 dark:text-[#A5D7E8]/50 dark:hover:text-white dark:hover:bg-white/10 cursor-pointer relative transition-colors"
                >
                    <Bell className="w-4 h-4" strokeWidth={1.8} />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full border-2 border-white dark:border-[#0d1b35]" />
                </Button>
            </div>
        </header>
    );
};

export default Topbar;

