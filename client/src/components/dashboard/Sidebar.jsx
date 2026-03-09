import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ScanLine, FileSpreadsheet, Users, Settings, LogOut, Plane, MoreVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';

const navMain = [
    { to: '/dashboard',            label: 'Dashboard',         icon: LayoutDashboard, end: true },
    { to: '/dashboard/scan',       label: 'Smart Scan',        icon: ScanLine,        badge: 'AI' },
];
const navData = [
    { to: '/dashboard/management', label: 'Management',        icon: FileSpreadsheet },
    { to: '/dashboard/records',    label: 'Passenger Records', icon: Users },
];
const navSystem = [
    { to: '/dashboard/settings',   label: 'Settings',          icon: Settings },
];

const NavItem = ({ to, label, icon: Icon, badge, end }) => (
    <NavLink
        to={to}
        end={end}
        className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14.5px] font-[Outfit] transition-all duration-150 cursor-pointer select-none ` +
            (isActive
                ? 'bg-[#576CBC]/20 text-[#19376D] border border-[#576CBC]/40 font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] dark:bg-[#19376D] dark:text-white dark:border-transparent dark:shadow-none'
                : 'text-slate-600 hover:bg-slate-100 hover:text-[#0B2447] dark:text-[#A5D7E8]/70 dark:hover:bg-[#19376D]/60 dark:hover:text-white')
        }
    >
        <Icon className="w-4 h-4 shrink-0" strokeWidth={1.8} />
        <span className="flex-1">{label}</span>
        {badge && (
            <Badge className="text-[10.5px] font-bold bg-[#576CBC] text-white px-1.5 py-0 rounded-md border-0 hover:bg-[#576CBC] leading-4">
                {badge}
            </Badge>
        )}
    </NavLink>
);

const SectionLabel = ({ children }) => (
    <p className="text-[11px] font-semibold text-slate-400 dark:text-[#A5D7E8]/40 uppercase tracking-widest px-3 pt-5 pb-1.5 font-[Outfit]">
        {children}
    </p>
);

const Sidebar = ({ user }) => {
    const navigate = useNavigate();
    const [showUserMenu, setShowUserMenu] = useState(false);

    const handleLogout = async () => {
        try {
            // Call logout API so server can broadcast PASSPORT_ADDED notification
            await axios.post('http://localhost:3000/api/auth/logout', {}, {
                headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
            });
        } catch {
            // Proceed with logout even if API call fails
        }
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        toast.success('Logged out successfully.');
        navigate('/');
    };

    const initials = user?.name
        ? user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
        : 'U';

    return (
        <nav
            className="w-64 h-screen shrink-0 flex flex-col overflow-hidden z-10 bg-white dark:bg-[#0B2447] border-r border-slate-200 dark:border-white/10"
        >
            {/* Logo */}
            <div className="px-5 pt-5 pb-4 flex items-center gap-3 shrink-0">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'linear-gradient(135deg, #0B2447, #19376D)' }}>
                    <Plane className="w-4.5 h-4.5 text-white" strokeWidth={2} />
                </div>
                <div className="font-[Outfit] leading-tight">
                    <p className="text-[13px] font-bold text-[#0B2447] dark:text-white uppercase tracking-wide">Passenger Tracker</p>
                    <p className="text-[13px] font-bold text-[#576CBC] dark:text-[#A5D7E8] uppercase tracking-wide">Pro</p>
                </div>
            </div>

            <div className="mx-4 h-px bg-slate-200 dark:bg-white/8 shrink-0" />

            {/* Nav */}
            <div className="flex-1 px-3 py-2 flex flex-col overflow-y-auto">
                <SectionLabel>Main</SectionLabel>
                {navMain.map(item => <NavItem key={item.to} {...item} />)}
                <SectionLabel>Data</SectionLabel>
                {navData.map(item => <NavItem key={item.to} {...item} />)}
                <SectionLabel>System</SectionLabel>
                {navSystem.map(item => <NavItem key={item.to} {...item} />)}
            </div>

            
           

            {/* User row */}
            <div className="px-3 py-3 flex items-center gap-2.5 relative">
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-[Outfit] text-[11.5px] font-bold text-white shrink-0"
                    style={{ background: 'linear-gradient(135deg, #0B2447, #19376D)' }}>
                    {initials}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-[#0B2447] dark:text-white font-[Outfit] truncate leading-tight">{user?.name || 'Staff'}</p>
                    <p className="text-[12.5px] text-slate-500 dark:text-[#A5D7E8]/60 font-[Outfit]">Documentation Officer</p>
                </div>
                <button
                    onClick={() => setShowUserMenu(v => !v)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-[#0B2447] hover:bg-slate-100 dark:text-[#A5D7E8]/50 dark:hover:text-white dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                >
                    <MoreVertical className="w-3.5 h-3.5" strokeWidth={1.8} />
                </button>
                {showUserMenu && (
                    <div className="absolute bottom-full right-3 mb-1 bg-white rounded-xl shadow-xl border border-slate-200 py-1 min-w-36 z-50">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[14px] font-[Outfit] text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        >
                            <LogOut className="w-3.5 h-3.5" strokeWidth={1.8} />
                            Sign Out
                        </button>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Sidebar;
