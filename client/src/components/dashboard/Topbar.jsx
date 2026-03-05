import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Wifi, CalendarDays, Sun, Moon, AlertCircle, Clock, Users, X, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotifications } from '@/contexts/NotificationContext';

const typeConfig = {
    PASSPORT_EXPIRED:       { icon: AlertCircle,  color: 'text-red-500',     bg: 'bg-red-50 dark:bg-red-500/10',        dot: 'bg-red-500'      },
    PASSPORT_EXPIRING_SOON: { icon: Clock,         color: 'text-amber-500',   bg: 'bg-amber-50 dark:bg-amber-500/10',    dot: 'bg-amber-500'    },
    VISA_APPOINTMENT_SOON:  { icon: CalendarDays,  color: 'text-blue-500',    bg: 'bg-blue-50 dark:bg-blue-500/10',      dot: 'bg-blue-500'     },
    PASSPORT_ADDED:         { icon: Users,         color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10',dot: 'bg-emerald-500'  },
};

function relativeTime(isoString) {
    const diff = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
}

const NotificationBell = () => {
    const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div className="relative" ref={ref}>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(v => !v)}
                className="w-9 h-9 rounded-lg text-slate-400 hover:text-[#0B2447] hover:bg-slate-100 dark:text-[#A5D7E8]/50 dark:hover:text-white dark:hover:bg-white/10 cursor-pointer relative transition-colors"
            >
                <Bell className="w-4 h-4" strokeWidth={1.8} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-4 h-4 bg-blue-500 rounded-full border-2 border-white dark:border-[#0d1b35] flex items-center justify-center">
                        <span className="text-[9px] font-bold text-white leading-none px-0.5">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    </span>
                )}
                {unreadCount === 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-slate-300 dark:bg-white/20 rounded-full border-2 border-white dark:border-[#0d1b35]" />
                )}
            </Button>

            {open && (
                <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0d1b35] shadow-2xl z-50 overflow-hidden">
                    {/* Header */}
                    <div className="px-4 py-3 flex items-center justify-between border-b border-slate-100 dark:border-white/8">
                        <div className="flex items-center gap-2">
                            <Bell className="w-4 h-4 text-[#0B2447] dark:text-white" strokeWidth={1.8} />
                            <span className="font-[Outfit] text-[14px] font-semibold text-[#0B2447] dark:text-white">Notifications</span>
                            {unreadCount > 0 && (
                                <span className="bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">{unreadCount}</span>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="flex items-center gap-1 text-[12px] font-[Outfit] font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors cursor-pointer"
                            >
                                <CheckCheck className="w-3.5 h-3.5" strokeWidth={1.8} />
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* List */}
                    <div className="max-h-85 overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
                        {notifications.length === 0 ? (
                            <div className="py-10 flex flex-col items-center gap-2">
                                <Bell className="w-7 h-7 text-slate-300 dark:text-white/20" strokeWidth={1.5} />
                                <p className="font-[Outfit] text-[13px] text-slate-400 dark:text-[#A5D7E8]/40">No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map(n => {
                                const cfg = typeConfig[n.type] || typeConfig['PASSPORT_ADDED'];
                                const Icon = cfg.icon;
                                return (
                                    <div
                                        key={n.id}
                                        onClick={() => { if (!n.isRead) markAsRead(n.id); }}
                                        className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors duration-150 border-b border-slate-100 dark:border-white/5 last:border-0 ${
                                            !n.isRead
                                                ? 'bg-blue-50/60 dark:bg-blue-500/5 hover:bg-blue-50 dark:hover:bg-blue-500/10'
                                                : 'hover:bg-slate-50 dark:hover:bg-white/3'
                                        }`}
                                    >
                                        <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cfg.bg}`}>
                                            <Icon className={`w-4 h-4 ${cfg.color}`} strokeWidth={1.8} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`font-[Outfit] text-[13px] leading-snug ${
                                                !n.isRead
                                                    ? 'font-semibold text-[#0B2447] dark:text-white'
                                                    : 'font-medium text-slate-600 dark:text-[#A5D7E8]/70'
                                            }`}>
                                                {n.message}
                                            </p>
                                            <p className="font-[Outfit] text-[11.5px] text-slate-400 dark:text-[#A5D7E8]/40 mt-0.5">
                                                {relativeTime(n.createdAt)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0 mt-1">
                                            {!n.isRead && (
                                                <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                                            )}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                                                className="w-5 h-5 rounded-md flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
                                            >
                                                <X className="w-3 h-3" strokeWidth={2} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

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
                <NotificationBell />
            </div>
        </header>
    );
};

export default Topbar;

