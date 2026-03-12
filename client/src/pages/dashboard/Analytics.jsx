import React, {useState, useEffect, useRef, useCallback} from "react";
import axios from "axios";
import { toast } from "sonner";
import {
    BarChart2, TrendingUp, TrendingDown, Users,
    Wallet, Upload, Download, Loader2, FileSpreadsheet,
    RefreshCw, ChevronLeft, ChevronRight, ChevronsLeft, 
    ChevronsRight, CheckCircle2, AlertCircle 
} from 'lucide-react';

import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, 
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";

import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

import {
    Dialog, DialogContent, DialogHeader, DialogTitle, 
    DialogDescription, DialogFooter,
} from '@/components/ui/dialog';

import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';


const API = 'http://localhost:3000/api';
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('authToken')}` });
const MONTH_OPTIONS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const YEAR_OPTIONS = Array.from({length: 10}, (_, i) => String(2022 + i));
const PAGE_SIZES = [10, 20, 50];

const STATUS_COLORS = {Confirmed: '#22c55e', Closed: '#3b82f6', Cancelled: '#ef4444'};
const CHART = {soa: '#576CBC', po: '#8b5cf6', profit: '#22c55e', margin: '#f59e0b'};


const fmt = (n) => {
    const num = Number(n) || 0;
    const abs = Math.abs(num).toLocaleString('en-PH', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    return num < 0 ? `-₱${abs}` : `₱${abs}`;
};

const fmtK = (n) => {
    const num = Number(n) || 0;
    const abs = Math.abs(num);
    let s;
    if (abs >= 1_000_000) s = `₱${(abs / 1_000_000).toFixed(2)}M`;
    else if (abs >= 1_000) s = `₱${(abs / 1_000).toFixed(1)}K`;
    else                   s = `₱${abs.toFixed(0)}`;
    return num < 0 ? `-${s}` : s;
};
const trunc = (str, len = 22) => str && str.length > len ? str.slice(0, len) + '...' : (str || '');

const StatCard = ({ icon: Icon, label, value, subtitle, accentColor, loading   }) => (
    <Card className='border-0 bg-white dark:bg-[#0d1b35] shadow-sm hover:shadow-md transition-shadow duration-200 rounded-2xl overflow-hidden font-[Outfit] relative' style={{borderLeft: `4px solid ${accentColor}`}}>
        <div className="absolute -right-3 -bottom-3 opacity-[0.04] dark:opacity-[0.06] pointer-events-none">
            <Icon className="w-28 h-28" strokeWidth={1}/>
        </div>
        <CardContent className="p-5 relative z-10">
            <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${accentColor}18` }}>
                    <Icon className="w-5 h-5" style={{color: accentColor}} strokeWidth={2}/>
                </div>
                <div className="w-2 h-2 rounded-full opacity-60" style={{background: accentColor}}/>
            </div>

            {loading
                ? <Skeleton className='h-9 w-24 mb-1.5 bg-slate-100 dark:bg-white/10'/> 
                : <p className="text-[28px] font-bold text-[#0B2447] dark:text-white font-[Outfit] leading-none mb-1.5 truncate">{value}</p>
            }
             <p className="text-[13.5px] font-medium text-slate-500 dark:text-[#A5D7E8]/60 font-[Outfit]">{label}</p>
            {subtitle && (
                <p className="text-[12px] text-slate-400 dark:text-[#A5D7E8]/35 font-[Outfit] mt-1.5 truncate">{subtitle}</p>
            )}
        </CardContent>
    </Card>
);

const ChartCard = ({title, description, children, className = ''}) => (
    <Card className={`border border-slate-200 dark:border-[#576CBC]/20 bg-white dark:bg-[#0d1b35] shadow-sm rounded-2xl overflow-hidden font-[Outfit] ${className}`}>
        <CardHeader className="px-5 pt-5 pb-3 border-b border-slate-100 dark:border-white/8">
        <CardTitle className="text-[15.5px] font-semibold text-[#0B2447] dark:text-white font-[Outfit] "> {title} </CardTitle>
        { description && (
            <CardDescription className="text-[12.5px] text-slate-400 dark:text-[#A5D7E8]/50 font-[Outfit] mt-0.5">
                {description}
            </CardDescription>
        )}
        </CardHeader>
        <CardContent className="p-4">{children}</CardContent>
    </Card>
);

const EmptyChart = ({ label }) => (
    <div className="h-52 flex flex-col items-center justify-center gap-2">
        <BarChart2 className="w-8 h-8 text-slate-300 dark:text-[#A5D7E8]/20" strokeWidth={1.2}/>
        <p className="text-[13.5px] text-slate-400 dark:text-[#A5D7E8]/40 font-[Outfit]">{label}</p>
    </div>
);

const StatusBadge = ({status}) => {
    const cfg = {
        Confirmed: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
        Closed: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
        Cancelled: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
    };
    return(
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[12px] font-semibold font-[Outfit] ${cfg[status] || 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300'}`}>
            {status || '—'}
        </span>

    );
};

const CustomTooltip = ({active, payload, label, currency = false}) => {
    if (!active || !payload?.length) return null;
    return(
        <div className="bg-white dark:bg-[#0B2447] border border-slate-200 dark:border-white/15 rounded-xl shadow-xl px-3.5 py-2.5 font-[Outfit] min-w-37.5">
            {label && (
                <p className="text-[11px] font-bold text-slate-400 dark:text-[#A5D7E8]/50 uppercase tracking-wider mb-1.5">{label}</p>

            )}

            {payload.map((p, i) => (
                <div key={i} className="flex items-center gap-2 text-[13px] font-medium text-[#0B2447] dark:text-white">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{background: p.color}}/>
                    <span className="flex-1 text-slate-500 dark:text-[#A5D7E8]/60 capitalize">{p.name}:</span>
                    <span className="font-bold">{currency ? fmtK(p.value) : Number(p.value).toLocaleString()}</span>
                </div>
            ))}

        </div>
    );
};


const Analytics = () => {
    const now = new Date();

    const [filterMonth, setFilterMonth] = useState(String(now.getMonth() + 1));
    const [filterYear, setFilterYear] = useState(String(now.getFullYear()));

    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    const [importOpen, setImportOpen] = useState(false);
    const [importFile, setImportFile] = useState(null);
    const [importMonth, setImportMonth] = useState(String(now.getMonth() + 1));
    const [importYear, setImportYear] = useState(String(now.getFullYear()));
    const [importReplace, setImportReplace] = useState(true);
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const fileInputRef = useRef(null);

    const [txPage, setTxPage] = useState(1);
    const [txPageSize, setTxPageSize] = useState(10);

    const fetchAnalytics = useCallback(async (monthOverride, yearOverride) => {
        setLoading(true);
        try {
            const params = {};
            const m = monthOverride != null ? monthOverride : filterMonth;
            const y = yearOverride  != null ? yearOverride  : filterYear;
            if (m) params.month = m;
            if (y) params.year  = y;
            const res = await axios.get(`${API}/analytics/data`, {headers: authHeaders(), params });
            setAnalytics(res.data.data);
            setTxPage(1);
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to load analytics.');
        } finally {
            setLoading(false);
        }
    }, [filterMonth, filterYear]);

    useEffect(() => {fetchAnalytics(); }, [fetchAnalytics]);

      const handleImport = async () => {
        if (!importFile)           { toast.error('Please select an Excel file.'); return; }
        if (!importMonth || !importYear) { toast.error('Select month and year.'); return; }
        setImporting(true);
        setImportResult(null);
        try {
            const form = new FormData();
            form.append('file',    importFile);
            form.append('month',   importMonth);
            form.append('year',    importYear);
            form.append('replace', String(importReplace));
            const res = await axios.post(`${API}/analytics/import`, form, {
                headers: { ...authHeaders(), 'Content-Type': 'multipart/form-data' },
            });
            setImportResult(res.data);
            toast.success(`Imported ${res.data.saved} transactions.`);
            setImportOpen(false);
            setImportFile(null);
            setImportResult(null);
            // Always force a re-fetch with the import month/year.
            // We update the filter dropdowns AND call fetchAnalytics directly with
            // the new values so it works even if the filter was already at this month/year
            // (React ignores identical setState calls and useEffect would never fire).
            setFilterMonth(importMonth);
            setFilterYear(importYear);
            fetchAnalytics(importMonth, importYear);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Import failed.');
        } finally {
            setImporting(false);
        }
    };



    const handleExport = () => {
        const params = new URLSearchParams();
        if (filterMonth) params.set('month', filterMonth);
        if (filterYear) params.set('year', filterYear);
        fetch(`${API}/analytics/export?${params.toString()}`, {
            headers: authHeaders(),
        })
            .then(r => r.blob())
            .then(blob => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                const mLabel = filterMonth ? MONTH_OPTIONS[parseInt(filterMonth) - 1] : 'all';
                a.href = url;
                a.download = `visa-analytics-${mLabel}-${filterYear || 'all'}.xlsx`;
                a.click();
                URL.revokeObjectURL(url);
            })
            .catch(() => toast.error('Export failed.'));

    }



    const kpi = analytics?.kpi || {};
    const byAgent = analytics?.byAgent || [];
    const byStatus = analytics?.byStatus || [];
    const byRegion = analytics?.byRegion || [];
    const monthlyTrend = analytics?.monthlyTrend || [];
    const byAgentMargin = analytics?.byAgentMargin || [];
    const transactions = analytics?.transactions || [];

    const topAgents = byAgent.slice(0, 10).map(a => ({...a, shortName: trunc(a.agentName, 20)}));
    const topMargins = byAgentMargin.slice(0, 10).map(a => ({...a, shortName: trunc(a.agentName, 18)}));

    const txStart = (txPage - 1) * txPageSize;
    const txSlice = transactions.slice(txStart, txStart + txPageSize);
    const txPages = Math.max(1, Math.ceil(transactions.length / txPageSize));

    const currentLabel = filterMonth
        ? `${MONTH_OPTIONS[parseInt(filterMonth) - 1]} ${filterYear}`
        : filterYear || 'All Time';

    const profitColor = (Number(kpi.netProfit) ?? 0) >= 0 ? '#22c55e' : '#ef4444';

    return (
        <div className="space-y-5 font-[Outfit]">

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-[22px] font-bold text-[#0B2447] dark:text-white font-[Outfit] leading-tight">Analytics</h1>
                    <p className="text-[13.5px] text-slate-500 dark:text-[#A5D7E8]/60 font-[Outfit] mt-0.5">
                        Financial Performance & Operational Insights - {currentLabel}
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <Select value={filterMonth} onValueChange={v => setFilterMonth(v)}>
                        <SelectTrigger className='h-9 w-28 text-[13.5px] font-[Outfit] bg-white dark:bg-[#0d1b35] border-slate-200 dark:border-white/15 rounded-lg'>
                            <SelectValue placeholder="Month"/>
                        </SelectTrigger>
                        <SelectContent>
                            {MONTH_OPTIONS.map((m,i)=>(
                                <SelectItem key={m} value={String(i+1)} className="font-[Outfit] text-[13.5px]">{m}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={filterYear} onValueChange={v => setFilterYear(v)}>
                        <SelectTrigger className="h-9 w-24 text-[13.5px] font-[Outfit] bg-white dark:bg-[#0d1b35] border-slate-200 dark:border-white/15 rounded-lg">
                            <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent>
                            {YEAR_OPTIONS.map(y => (
                                <SelectItem key={y} value={y} className="font-[Outfit] text-[13.5px]">{y}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button variant="outline" size="icon" onClick={fetchAnalytics} disabled={loading}
                        className="h-9 w-9 rounded-lg border-slate-200 dark:border-white/15 cursor-pointer">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} strokeWidth={1.8} />
                    </Button>

                    <Button variant="outline" onClick={()=>{setImportResult(null); setImportFile(null); setImportOpen(true);}}
                        className = 'h-9 px-3.5 text-[13.5px] font-[Outfit] border-slate-200 dark:border-white/15 bg-white dark:bg-[#0d1b35] rounded-lg cursor-pointer gap-1.5'
                        >
                        <Upload className="w-4 h-4" strokeWidth={1.8}/>
                        Import
                    </Button>

                    <Button onClick={handleExport}
                    className="h-9 px-3.5 text-[13.5px] font-[Outfit] bg-[#0B2447] hover:bg-[#19376D] dark:bg-[#19376D] dark:hover:bg-[#576CBC] text-white rounded-lg cursor-pointer gap-1.5"
                    >
                        <Download className="w-4 h-4" strokeWidth={1.8}/>
                        Export
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard icon={TrendingUp}   label="Total Revenue (SOA)" value={loading ? '' : fmtK(kpi.totalSOA)}  subtitle={loading ? '' : fmt(kpi.totalSOA)}  accentColor="#576CBC" loading={loading} />
                <StatCard icon={TrendingDown} label="Total Cost (PO)"     value={loading ? '' : fmtK(kpi.totalPO)}   subtitle={loading ? '' : fmt(kpi.totalPO)}   accentColor="#8b5cf6" loading={loading} />
                <StatCard icon={Wallet}       label="Net Profit"           value={loading ? '' : fmtK(kpi.netProfit)} subtitle={loading ? '' : fmt(kpi.netProfit)} accentColor={profitColor} loading={loading} />
                <StatCard icon={Users}        label="Total Passengers"     value={loading ? '' : (kpi.totalPax || 0).toLocaleString()} subtitle="All pax in selected period" accentColor="#19376D" loading={loading} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <ChartCard className="xl:col-span-2" title="Monthly Revenue Trend"
                description="Revenue (SOA), Cost (PO), and Net Profit Over Time">

                    {loading ? (
                        <Skeleton className='h-64 w-full bg-slate-100 dark:bg-white/5 rounded-xl'/>
                    ) : monthlyTrend.length === 0 ? (
                        <EmptyChart label="No trend data for this period"/>
                    ) : (
                        <ResponsiveContainer width="100%" height={260}>
                            <AreaChart data={monthlyTrend} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="gSOA"    x1="0" y1="0" x2="0" y2="1"><stop offset="5%"  stopColor={CHART.soa}    stopOpacity={0.18} /><stop offset="95%" stopColor={CHART.soa}    stopOpacity={0.01} /></linearGradient>
                                    <linearGradient id="gPO"     x1="0" y1="0" x2="0" y2="1"><stop offset="5%"  stopColor={CHART.po}     stopOpacity={0.18} /><stop offset="95%" stopColor={CHART.po}     stopOpacity={0.01} /></linearGradient>
                                    <linearGradient id="gProfit" x1="0" y1="0" x2="0" y2="1"><stop offset="5%"  stopColor={CHART.profit} stopOpacity={0.18} /><stop offset="95%" stopColor={CHART.profit} stopOpacity={0.01} /></linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                <XAxis dataKey="label"      tick={{ fontSize: 11, fontFamily: 'Outfit', fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <YAxis tickFormatter={fmtK} tick={{ fontSize: 11, fontFamily: 'Outfit', fill: '#94a3b8' }} axisLine={false} tickLine={false} width={60} />
                                <Tooltip content={<CustomTooltip currency />} />
                                <Legend wrapperStyle={{ fontFamily: 'Outfit', fontSize: 12, paddingTop: 8 }} />
                                <Area type="monotone" dataKey="totalSOA"  name="Revenue" stroke={CHART.soa}    strokeWidth={2} fill="url(#gSOA)"    dot={false} />
                                <Area type="monotone" dataKey="totalPO"   name="Cost"    stroke={CHART.po}     strokeWidth={2} fill="url(#gPO)"     dot={false} />
                                <Area type="monotone" dataKey="netProfit" name="Profit"  stroke={CHART.profit} strokeWidth={2} fill="url(#gProfit)" dot={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}

                </ChartCard>

                <ChartCard title="Transaction Status" description="Distribution by confirmation status">
                    {loading ? (
                        <Skeleton className="h-64 w-full bg-slate-100 dark:bg-white/5 rounded-xl" />
                    ) : byStatus.length === 0 ? (
                        <EmptyChart label="No status data" />
                    ) : (
                        <div className="flex flex-col items-center gap-3">
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie data={byStatus} dataKey="count" nameKey="status"
                                        cx="50%" cy="50%" innerRadius={52} outerRadius={80}
                                        paddingAngle={3} strokeWidth={0}>
                                        {byStatus.map((entry, i) => (
                                            <Cell key={i} fill={STATUS_COLORS[entry.status] || '#94a3b8'} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(v, n) => [v, n]} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5">
                                {byStatus.map((s, i) => (
                                    <div key={i} className="flex items-center gap-1.5 text-[12.5px] font-[Outfit] text-slate-600 dark:text-[#A5D7E8]/70">
                                        <span className="w-2.5 h-2.5 rounded-full shrink-0"
                                            style={{ background: STATUS_COLORS[s.status] || '#94a3b8' }} />
                                        <span>{s.status}</span>
                                        <span className="font-bold text-[#0B2447] dark:text-white">({s.count})</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </ChartCard>
            </div>




            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <ChartCard title="Agent Leaderboard" description="Top 10 agents by net profit">
                    {loading ? (
                        <Skeleton className="h-80 w-full bg-slate-100 dark:bg-white/5 rounded-xl" />
                    ) : topAgents.length === 0 ? (
                        <EmptyChart label="No agent data" />
                    ) : (
                        <ResponsiveContainer width="100%" height={Math.max(200, topAgents.length * 38)}>
                            <BarChart data={[...topAgents].reverse()} layout="vertical"
                                margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                                <XAxis type="number" tickFormatter={fmtK} tick={{ fontSize: 11, fontFamily: 'Outfit', fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <YAxis type="category" dataKey="shortName" width={136} tick={{ fontSize: 11, fontFamily: 'Outfit', fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip currency />} />
                                <Bar dataKey="netProfit" name="Net Profit" fill={CHART.profit} radius={[0, 4, 4, 0]} barSize={18} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </ChartCard>

                <ChartCard title="Regional Breakdown" description="Revenue and profit by Philippine region">
                    {loading ? (
                        <Skeleton className="h-80 w-full bg-slate-100 dark:bg-white/5 rounded-xl" />
                    ) : byRegion.length === 0 ? (
                        <EmptyChart label="No regional data" />
                    ) : (
                        <ResponsiveContainer width="100%" height={Math.max(200, byRegion.length * 44 + 40)}>
                            <BarChart data={byRegion} layout="vertical"
                                margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                                <XAxis type="number" tickFormatter={fmtK} tick={{ fontSize: 11, fontFamily: 'Outfit', fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <YAxis type="category" dataKey="region" width={112} tick={{ fontSize: 11, fontFamily: 'Outfit', fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip currency />} />
                                <Legend wrapperStyle={{ fontFamily: 'Outfit', fontSize: 11, paddingTop: 6 }} />
                                <Bar dataKey="totalSOA"  name="Revenue" fill={CHART.soa}    radius={[0, 3, 3, 0]} barSize={11} />
                                <Bar dataKey="netProfit" name="Profit"  fill={CHART.profit} radius={[0, 3, 3, 0]} barSize={11} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </ChartCard>
            </div>

            <ChartCard title="Profit Margin by Agent"
                description="Net profit as a % of SOA — top 10 highest-margin agents">
                {loading ? (
                    <Skeleton className="h-52 w-full bg-slate-100 dark:bg-white/5 rounded-xl" />
                ) : topMargins.length === 0 ? (
                    <EmptyChart label="No margin data" />
                ) : (
                    <ResponsiveContainer width="100%" height={230}>
                        <BarChart data={topMargins} margin={{ top: 4, right: 16, left: 0, bottom: 36 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                            <XAxis dataKey="shortName" tick={{ fontSize: 10, fontFamily: 'Outfit', fill: '#94a3b8' }}
                                axisLine={false} tickLine={false} angle={-35} textAnchor="end" interval={0} />
                            <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 11, fontFamily: 'Outfit', fill: '#94a3b8' }}
                                axisLine={false} tickLine={false} width={44} />
                            <Tooltip formatter={v => [`${v}%`, 'Margin']} />
                            <Bar dataKey="margin" name="Margin %" fill={CHART.margin} radius={[4, 4, 0, 0]} barSize={26} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </ChartCard>

            <Card className="border border-slate-200 dark:border-[#576CBC]/20 bg-white dark:bg-[#0d1b35] shadow-sm rounded-2xl overflow-hidden font-[Outfit]">
                <CardHeader className="px-5 pt-5 pb-3 border-b border-slate-100 dark:border-white/8 flex flex-row items-start justify-between">
                    <div>
                        <CardTitle className="text-[15.5px] font-semibold text-[#0B2447] dark:text-white font-[Outfit]">
                            Transactions
                        </CardTitle>
                        <CardDescription className="text-[12.5px] text-slate-400 dark:text-[#A5D7E8]/50 font-[Outfit] mt-0.5">
                            {transactions.length} records in selected period
                        </CardDescription>
                    </div>
                    <Select value={String(txPageSize)} onValueChange={v => { setTxPageSize(Number(v)); setTxPage(1); }}>
                        <SelectTrigger className="h-8 w-[110px] text-[12.5px] font-[Outfit] border-slate-200 dark:border-white/15 rounded-lg">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {PAGE_SIZES.map(s => (
                                <SelectItem key={s} value={String(s)} className="font-[Outfit] text-[13px]">{s} / page</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardHeader>

                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-5 space-y-3">
                            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-11 w-full bg-slate-100 dark:bg-white/5 rounded-lg" />)}
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="py-14 text-center">
                            <BarChart2 className="w-10 h-10 mx-auto text-slate-300 dark:text-[#A5D7E8]/20 mb-3" strokeWidth={1.2} />
                            <p className="text-[15px] text-slate-400 dark:text-[#A5D7E8]/40 font-[Outfit]">No transactions found</p>
                            <p className="text-[13.5px] text-slate-300 dark:text-[#A5D7E8]/30 font-[Outfit] mt-1">
                                Import a monthly Excel report to see data here.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-slate-100 dark:border-white/8 hover:bg-transparent">
                                            {['Ref No.', 'Agent', 'Status', 'Pax', 'SOA', 'PO', 'Net Profit', 'Departure', 'Area'].map(h => (
                                                <TableHead key={h} className="font-[Outfit] text-[12px] text-slate-400 dark:text-[#A5D7E8]/45 font-semibold uppercase tracking-wider py-3 px-4 whitespace-nowrap">
                                                    {h}
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {txSlice.map(t => (
                                            <TableRow key={t.transactionId}
                                                className="border-slate-50 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/3 transition-colors">
                                                <TableCell className="font-mono text-[13px] font-semibold text-[#576CBC] dark:text-[#A5D7E8] px-4 py-3 whitespace-nowrap">{t.refNo || '—'}</TableCell>
                                                <TableCell className="font-[Outfit] text-[13px] text-[#0B2447] dark:text-white px-4 py-3 max-w-[180px] truncate">{t.agentName || '—'}</TableCell>
                                                <TableCell className="px-4 py-3"><StatusBadge status={t.status} /></TableCell>
                                                <TableCell className="font-[Outfit] text-[13px] font-semibold text-slate-700 dark:text-[#A5D7E8]/80 px-4 py-3 text-center">{t.numberOfPax || 0}</TableCell>
                                                <TableCell className="font-[Outfit] text-[13px] text-slate-600 dark:text-[#A5D7E8]/70 px-4 py-3 whitespace-nowrap">{fmt(t.totalSOA)}</TableCell>
                                                <TableCell className="font-[Outfit] text-[13px] text-slate-600 dark:text-[#A5D7E8]/70 px-4 py-3 whitespace-nowrap">{fmt(t.totalPO)}</TableCell>
                                                <TableCell className={`font-[Outfit] text-[13px] font-semibold px-4 py-3 whitespace-nowrap ${(t.netProfit || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                                                    {fmt(t.netProfit)}
                                                </TableCell>
                                                <TableCell className="font-[Outfit] text-[13px] text-slate-500 dark:text-[#A5D7E8]/60 px-4 py-3 whitespace-nowrap">{t.departureDate || '—'}</TableCell>
                                                <TableCell className="font-[Outfit] text-[13px] text-slate-500 dark:text-[#A5D7E8]/60 px-4 py-3 whitespace-nowrap">{t.area || '—'}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination */}
                            <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 dark:border-white/8">
                                <p className="text-[12.5px] text-slate-500 dark:text-[#A5D7E8]/50 font-[Outfit]">
                                    {txStart + 1}–{Math.min(txStart + txPageSize, transactions.length)} of {transactions.length}
                                </p>
                                <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => setTxPage(1)} disabled={txPage === 1}
                                        className="h-8 w-8 rounded-lg cursor-pointer text-slate-400 hover:text-[#0B2447] dark:hover:text-white disabled:opacity-30">
                                        <ChevronsLeft className="w-4 h-4" strokeWidth={1.8} />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => setTxPage(p => Math.max(1, p - 1))} disabled={txPage === 1}
                                        className="h-8 w-8 rounded-lg cursor-pointer text-slate-400 hover:text-[#0B2447] dark:hover:text-white disabled:opacity-30">
                                        <ChevronLeft className="w-4 h-4" strokeWidth={1.8} />
                                    </Button>
                                    <span className="text-[13px] font-medium text-[#0B2447] dark:text-white font-[Outfit] px-2">
                                        {txPage} / {txPages}
                                    </span>
                                    <Button variant="ghost" size="icon" onClick={() => setTxPage(p => Math.min(txPages, p + 1))} disabled={txPage === txPages}
                                        className="h-8 w-8 rounded-lg cursor-pointer text-slate-400 hover:text-[#0B2447] dark:hover:text-white disabled:opacity-30">
                                        <ChevronRight className="w-4 h-4" strokeWidth={1.8} />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => setTxPage(txPages)} disabled={txPage === txPages}
                                        className="h-8 w-8 rounded-lg cursor-pointer text-slate-400 hover:text-[#0B2447] dark:hover:text-white disabled:opacity-30">
                                        <ChevronsRight className="w-4 h-4" strokeWidth={1.8} />
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

             <Dialog open={importOpen} onOpenChange={v => { setImportOpen(v); if (!v) { setImportFile(null); setImportResult(null); } }}>
                <DialogContent className="sm:max-w-md bg-white dark:bg-[#0d1b35] border border-slate-200 dark:border-white/15 rounded-2xl font-[Outfit]">
                    <DialogHeader>
                        <DialogTitle className="text-[17px] font-bold text-[#0B2447] dark:text-white font-[Outfit]">
                            Import Analytics Excel
                        </DialogTitle>
                        <DialogDescription className="text-[13.5px] text-slate-500 dark:text-[#A5D7E8]/60 font-[Outfit]">
                            Upload your monthly Visa transaction report (.xlsx) with columns: Ref No., Agents, Status, No. of Pax, Total SOA, Total PO, Net Profit, SOA No., Departure, Area.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-1">
                        {/* File picker */}
                        <div>
                            <Label className="text-[11px] font-bold tracking-widest uppercase text-slate-400 dark:text-slate-500">
                                Excel File
                            </Label>
                            <button type="button" onClick={() => fileInputRef.current?.click()}
                                className="mt-1.5 w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed border-slate-200 dark:border-white/15 hover:border-[#576CBC] dark:hover:border-[#576CBC] transition-colors cursor-pointer group">
                                <FileSpreadsheet className="w-5 h-5 text-slate-400 group-hover:text-[#576CBC] transition-colors shrink-0" strokeWidth={1.8} />
                                <span className={`text-[13.5px] font-[Outfit] truncate ${importFile ? 'text-[#0B2447] dark:text-white font-medium' : 'text-slate-400'}`}>
                                    {importFile ? importFile.name : 'Click to select .xlsx file'}
                                </span>
                            </button>
                            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden"
                                onChange={e => setImportFile(e.target.files?.[0] || null)} />
                        </div>

                        {/* Month + Year */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-[11px] font-bold tracking-widest uppercase text-slate-400 dark:text-slate-500">Month</Label>
                                <Select value={importMonth} onValueChange={v => setImportMonth(v)}>
                                    <SelectTrigger className="mt-1.5 h-10 text-[13.5px] font-[Outfit] bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-700/60 rounded-lg">
                                        <SelectValue placeholder="Month" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {MONTH_OPTIONS.map((m, i) => (
                                            <SelectItem key={m} value={String(i + 1)} className="font-[Outfit] text-[13.5px]">{m}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-[11px] font-bold tracking-widest uppercase text-slate-400 dark:text-slate-500">Year</Label>
                                <Select value={importYear} onValueChange={v => setImportYear(v)}>
                                    <SelectTrigger className="mt-1.5 h-10 text-[13.5px] font-[Outfit] bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-700/60 rounded-lg">
                                        <SelectValue placeholder="Year" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {YEAR_OPTIONS.map(y => (
                                            <SelectItem key={y} value={y} className="font-[Outfit] text-[13.5px]">{y}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Replace toggle */}
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input type="checkbox" checked={importReplace} onChange={e => setImportReplace(e.target.checked)}
                                className="mt-0.5 w-4 h-4 rounded border-slate-300 cursor-pointer accent-[#19376D]" />
                            <div>
                                <p className="text-[13.5px] font-medium text-[#0B2447] dark:text-white font-[Outfit]">Replace existing data</p>
                                <p className="text-[12px] text-slate-400 dark:text-[#A5D7E8]/50 font-[Outfit]">
                                    Clear records for this month/year before importing
                                </p>
                            </div>
                        </label>

                        {/* Result panel */}
                        {importResult && (
                            <div className={`rounded-xl border px-4 py-3 ${importResult.success
                                ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/8'
                                : 'border-red-200 bg-red-50 dark:border-red-500/20 dark:bg-red-500/8'}`}>
                                <div className="flex items-center gap-2 mb-1">
                                    {importResult.success
                                        ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" strokeWidth={2} />
                                        : <AlertCircle  className="w-4 h-4 text-red-500 shrink-0"     strokeWidth={2} />}
                                    <p className="text-[13.5px] font-semibold text-[#0B2447] dark:text-white font-[Outfit]">
                                        {importResult.message}
                                    </p>
                                </div>
                                {importResult.skipped?.length > 0 && (
                                    <div className="mt-2 space-y-1 max-h-28 overflow-y-auto">
                                        {importResult.skipped.slice(0, 5).map((s, i) => (
                                            <p key={i} className="text-[12px] text-slate-500 dark:text-[#A5D7E8]/60 font-[Outfit]">
                                                Row {s.row}: {s.reason}
                                            </p>
                                        ))}
                                        {importResult.skipped.length > 5 && (
                                            <p className="text-[12px] text-slate-400 font-[Outfit]">
                                                +{importResult.skipped.length - 5} more…
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setImportOpen(false)}
                            className="font-[Outfit] text-[13.5px] rounded-lg border-slate-200 dark:border-white/15 cursor-pointer">
                            Cancel
                        </Button>
                        <Button onClick={handleImport} disabled={importing || !importFile}
                            className="font-[Outfit] text-[13.5px] rounded-lg bg-[#0B2447] hover:bg-[#19376D] dark:bg-[#19376D] dark:hover:bg-[#576CBC] text-white cursor-pointer">
                            {importing
                                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Importing…</>
                                : <><Upload className="w-4 h-4 mr-2" strokeWidth={1.8} />Import</>}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>



        </div>
    );

};

export default Analytics;