import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Users, ScanLine, FileCheck, ChevronRight,
    Upload, Download, Flag
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';

/* ── Stat card ── */
const StatCard = ({ icon: Icon, label, value, subtitle, accentColor, iconBg, loading }) => (
    <Card className="border-0 bg-white dark:bg-[#0d1b35] shadow-sm hover:shadow-md transition-shadow duration-200 rounded-2xl overflow-hidden font-[Outfit] relative"
        style={{ borderLeft: `4px solid ${accentColor}` }}>
        {/* Decorative large ghost icon */}
        <div className="absolute -right-3 -bottom-3 opacity-[0.04] dark:opacity-[0.06] pointer-events-none">
            <Icon className="w-28 h-28" strokeWidth={1} />
        </div>
        <CardContent className="p-5 relative z-10">
            <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: iconBg || `${accentColor}18` }}>
                    <Icon className="w-5 h-5" style={{ color: accentColor }} strokeWidth={2} />
                </div>
                <div className="w-2 h-2 rounded-full opacity-60" style={{ background: accentColor }} />
            </div>
            {loading
                ? <Skeleton className="h-9 w-24 mb-1.5 bg-slate-100 dark:bg-white/10" />
                : <p className="text-[34px] font-bold text-[#0B2447] dark:text-white font-[Outfit] leading-none mb-1.5">{value}</p>
            }
            <p className="text-[13.5px] font-medium text-slate-500 dark:text-[#A5D7E8]/60 font-[Outfit]">{label}</p>
            {subtitle && (
                <p className="text-[12px] text-slate-400 dark:text-[#A5D7E8]/35 font-[Outfit] mt-1.5 truncate">{subtitle}</p>
            )}
        </CardContent>
    </Card>
);

/* ── Status dot badge ── */
const StatusDot = ({ status }) => {
    const map = {
        active:   { dot: 'bg-green-500',  text: 'text-green-700 dark:text-green-400',  label: 'Active'       },
        expiring: { dot: 'bg-orange-400', text: 'text-orange-600 dark:text-orange-400', label: 'Expiring Soon' },
        expired:  { dot: 'bg-red-500',    text: 'text-red-600 dark:text-red-400',       label: 'Expired'      },
    };
    const s = map[status?.toLowerCase()] || map.active;
    return (
        <span className={`flex items-center gap-1.5 text-[13.5px] font-medium font-[Outfit] ${s.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
            {s.label}
        </span>
    );
};

/* ── Passport expiry status ── */
const getStatus = (expiryDate) => {
    if (!expiryDate) return 'active';
    const diff = Math.ceil((new Date(expiryDate) - new Date()) / 86400000);
    if (diff < 0) return 'expired';
    if (diff <= 90) return 'expiring';
    return 'active';
};

/* ── Quick action row ── */
const ActionRow = ({ icon: Icon, iconBg, title, desc, onClick }) => (
    <button
        onClick={onClick}
        className="w-full flex items-center gap-3.5 p-3.5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer text-left group"
    >
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: iconBg }}>
            <Icon className="w-4 h-4 text-white" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-[14.5px] font-semibold text-[#0B2447] dark:text-white font-[Outfit] leading-tight">{title}</p>
            <p className="text-[13px] text-slate-500 dark:text-[#A5D7E8]/55 font-[Outfit] mt-0.5 truncate">{desc}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400 dark:text-[#A5D7E8]/40 group-hover:text-slate-600 dark:group-hover:text-[#A5D7E8] transition-colors shrink-0" strokeWidth={1.8} />
    </button>
);

/* ═══════════════════════════════════════════════ */

const DashboardHome = () => {
    const navigate = useNavigate();
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRecords = async () => {
            try {
                const token = localStorage.getItem('authToken');
                const res = await axios.get('http://localhost:3000/api/passports', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setRecords(res.data.data || []);
            } catch {
                // silently fail on demo
            } finally {
                setLoading(false);
            }
        };
        fetchRecords();
    }, []);

    const total    = records.length;
    const active   = records.filter(r => getStatus(r.dateOfExpiry) === 'active').length;
    const expiring = records.filter(r => getStatus(r.dateOfExpiry) === 'expiring').length;
    const expired  = records.filter(r => getStatus(r.dateOfExpiry) === 'expired').length;

    const recent = [...records]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 8);

    return (
        <div className="space-y-5 font-[Outfit]">

            {/* ── Stat cards ── */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard icon={Users}     label="Total Passengers"   value={total}    subtitle="All registered records" accentColor="#576CBC" loading={loading} />
                <StatCard icon={FileCheck} label="Active Records"      value={active}   subtitle="Valid & non-expired"   accentColor="#19376D" loading={loading} />
                <StatCard icon={Flag}      label="Expiring Soon"        value={expiring} subtitle="Within 90 days"        accentColor="#eab308" loading={loading} />
                <StatCard icon={ScanLine}  label="Expired"              value={expired}  subtitle="Need renewal"          accentColor="#ef4444" loading={loading} />
            </div>

            {/* ── Main two-column area ── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

                {/* ── Recent Passenger Records (2/3) ── */}
                <Card className="xl:col-span-2 border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0d1b35] shadow-sm rounded-xl overflow-hidden">
                    <CardHeader className="px-5 pt-5 pb-3 flex flex-row items-start justify-between">
                        <div>
                            <CardTitle className="text-[17px] font-bold text-[#0B2447] dark:text-white font-[Outfit]">
                                Recent Passenger Records
                            </CardTitle>
                            <CardDescription className="text-[13.5px] text-slate-500 dark:text-[#A5D7E8]/55 font-[Outfit] mt-0.5">
                                Latest entries processed by the system
                            </CardDescription>
                        </div>
                        <Button
                            onClick={() => navigate('/dashboard/records')}
                            variant="ghost"
                            className="cursor-pointer text-[13.5px] text-[#576CBC] dark:text-[#A5D7E8] hover:text-[#0B2447] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/8 h-8 px-3 font-[Outfit] rounded-lg font-medium shrink-0"
                        >
                            View All
                        </Button>
                    </CardHeader>

                    <div className="px-5 pb-0">
                        <div className="h-px bg-slate-100 dark:bg-white/8" />
                    </div>

                    <CardContent className="p-0">
                        {loading ? (
                            <div className="p-5 space-y-3">
                                {[...Array(5)].map((_, i) => (
                                    <Skeleton key={i} className="h-11 w-full bg-slate-100 dark:bg-white/5 rounded-lg" />
                                ))}
                            </div>
                        ) : recent.length === 0 ? (
                            <div className="py-14 text-center">
                                <Users className="w-10 h-10 mx-auto text-slate-300 dark:text-[#A5D7E8]/20 mb-3" strokeWidth={1.2} />
                                <p className="text-[15px] text-slate-400 dark:text-[#A5D7E8]/40 font-[Outfit]">No records yet</p>
                                <p className="text-[13.5px] text-slate-300 dark:text-[#A5D7E8]/30 font-[Outfit] mt-1">
                                    Start by adding a passport entry or importing from Excel.
                                </p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-slate-100 dark:border-white/8 hover:bg-transparent">
                                        {['Name', 'Passport #', 'Tour', 'DOE', 'Status'].map(h => (
                                            <TableHead key={h} className="font-[Outfit] text-[12.5px] text-slate-400 dark:text-[#A5D7E8]/45 font-semibold uppercase tracking-wider py-3 first:pl-5 last:pr-5">
                                                {h}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recent.map((r) => {
                                        const status = getStatus(r.dateOfExpiry);
                                        const fullName = [r.firstName, r.surname].filter(Boolean).join(' ') || '—';
                                        return (
                                            <TableRow
                                                key={r.passportId}
                                                className="border-slate-50 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/3 cursor-pointer transition-colors"
                                                onClick={() => navigate('/dashboard/records')}
                                            >
                                                <TableCell className="font-[Outfit] text-[14.5px] font-semibold text-[#0B2447] dark:text-white pl-5 py-3.5">{fullName}</TableCell>
                                                <TableCell className="font-mono text-[14px] font-semibold text-[#576CBC] dark:text-[#A5D7E8]">{r.passportNumber || '—'}</TableCell>
                                                <TableCell className="font-[Outfit] text-[14px] text-slate-600 dark:text-[#A5D7E8]/70">{r.embassy || '—'}</TableCell>
                                                <TableCell className="font-[Outfit] text-[14px] text-slate-500 dark:text-[#A5D7E8]/60">{r.dateOfExpiry || '—'}</TableCell>
                                                <TableCell className="pr-5">
                                                    <StatusDot status={status} />
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                {/* ── Quick Actions (1/3) ── */}
                <Card className="border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0d1b35] shadow-sm rounded-xl overflow-hidden">
                    <CardHeader className="px-5 pt-5 pb-3">
                        <CardTitle className="text-[17px] font-bold text-[#0B2447] dark:text-white font-[Outfit]">
                            Quick Actions
                        </CardTitle>
                        <CardDescription className="text-[13.5px] text-slate-500 dark:text-[#A5D7E8]/55 font-[Outfit] mt-0.5">
                            Jump to common tasks
                        </CardDescription>
                    </CardHeader>

                    <div className="px-5">
                        <div className="h-px bg-slate-100 dark:bg-white/8" />
                    </div>

                    <CardContent className="px-3 py-3 space-y-1">
                        <ActionRow
                            icon={ScanLine}
                            iconBg="linear-gradient(135deg, #0B2447, #19376D)"
                            title="Start Smart Scan"
                            desc="Capture a passport via mobile AI scan"
                            onClick={() => navigate('/dashboard/scan')}
                        />
                        <ActionRow
                            icon={Upload}
                            iconBg="linear-gradient(135deg, #059669, #34d399)"
                            title="Import Excel Sheet"
                            desc="Upload your migration data file"
                            onClick={() => navigate('/dashboard/management')}
                        />
                        <ActionRow
                            icon={Download}
                            iconBg="linear-gradient(135deg, #d97706, #fbbf24)"
                            title="Export to Excel"
                            desc="Download current records as spreadsheet"
                            onClick={() => navigate('/dashboard/management')}
                        />
                    </CardContent>
                </Card>

            </div>
        </div>
    );
};

export default DashboardHome;
