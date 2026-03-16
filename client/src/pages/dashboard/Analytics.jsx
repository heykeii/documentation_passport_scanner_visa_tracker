import React, {useState, useEffect, useRef, useCallback} from "react";
import axios from "axios";
import { toast } from "sonner";
import {
    BarChart2, TrendingUp, TrendingDown, Users,
    Wallet, Upload, Download, Loader2, FileSpreadsheet,
    RefreshCw, ChevronLeft, ChevronRight, ChevronsLeft, 
    ChevronsRight, CheckCircle2, AlertCircle, X
} from 'lucide-react';

import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, 
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    ComposedChart, Line, Sector, Treemap, RadarChart, Radar,
    PolarGrid, PolarAngleAxis, PolarRadiusAxis, ScatterChart,
    Scatter, ZAxis, ReferenceLine,
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

// ─── Motion wrapper (graceful fallback if framer-motion not installed) ─────────
let motion = { div: 'div' };
try { motion = require('framer-motion').motion; } catch (_) {}

const MotionDiv = motion.div || 'div';

const fadeInUp = {
    hidden:  { opacity: 0, y: 18 },
    visible: (i = 0) => ({
        opacity: 1, y: 0,
        transition: { duration: 0.42, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }
    }),
};


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

// ─── Sparkline Mini Chart ────────────────────────────────────────────────────
const Sparkline = ({ data = [], color = '#576CBC', height = 40 }) => {
    if (!data || data.length < 2) return null;
    return (
        <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id={`spark-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={color} stopOpacity={0.22} />
                        <stop offset="95%" stopColor={color} stopOpacity={0.01} />
                    </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.8}
                    fill={`url(#spark-${color.replace('#','')})`} dot={false} isAnimationActive={false} />
            </AreaChart>
        </ResponsiveContainer>
    );
};

// ─── Stat Card (with sparkline) ───────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, subtitle, accentColor, loading, sparkData, sparkColor }) => (
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
            {/* Sparkline */}
            {!loading && sparkData && sparkData.length >= 2 && (
                <div className="mt-3 -mx-1">
                    <Sparkline data={sparkData} color={sparkColor || accentColor} height={36} />
                </div>
            )}
        </CardContent>
    </Card>
);

const ChartCard = ({title, description, children, className = '', animate = true, animDelay = 0}) => {
    const Wrapper = animate ? MotionDiv : 'div';
    const motionProps = animate ? { variants: fadeInUp, initial: 'hidden', animate: 'visible', custom: animDelay } : {};
    return (
        <Wrapper {...motionProps}>
            <Card className={`border border-slate-200 dark:border-[#576CBC]/20 bg-white dark:bg-[#0d1b35] shadow-sm rounded-2xl overflow-hidden font-[Outfit] ${className}`}>
                <CardHeader className="px-5 pt-5 pb-3 border-b border-slate-100 dark:border-white/8">
                    <CardTitle className="text-[15.5px] font-semibold text-[#0B2447] dark:text-white font-[Outfit]">{title}</CardTitle>
                    {description && (
                        <CardDescription className="text-[12.5px] text-slate-400 dark:text-[#A5D7E8]/50 font-[Outfit] mt-0.5">
                            {description}
                        </CardDescription>
                    )}
                </CardHeader>
                <CardContent className="p-4">{children}</CardContent>
            </Card>
        </Wrapper>
    );
};

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
        <div className="bg-white dark:bg-[#0B2447] border border-slate-200 dark:border-white/15 rounded-xl shadow-xl px-3.5 py-2.5 font-[Outfit] min-w-[150px]">
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

// ─── Active Donut Shape ────────────────────────────────────────────────────────
const renderActiveShape = (props) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
    return (
        <g>
            <text x={cx} y={cy - 10} textAnchor="middle" fill={fill} className="font-[Outfit]"
                style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Outfit' }}>
                {value}
            </text>
            <text x={cx} y={cy + 14} textAnchor="middle" fill="#94a3b8"
                style={{ fontSize: 12, fontFamily: 'Outfit' }}>
                {payload.status}
            </text>
            <text x={cx} y={cy + 30} textAnchor="middle" fill="#94a3b8"
                style={{ fontSize: 11, fontFamily: 'Outfit' }}>
                {(percent * 100).toFixed(1)}%
            </text>
            <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 8}
                startAngle={startAngle} endAngle={endAngle} fill={fill} />
            <Sector cx={cx} cy={cy} innerRadius={outerRadius + 12} outerRadius={outerRadius + 15}
                startAngle={startAngle} endAngle={endAngle} fill={fill} />
        </g>
    );
};

// ─── Waterfall / Composed Chart ────────────────────────────────────────────────
const WaterfallTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white dark:bg-[#0B2447] border border-slate-200 dark:border-white/15 rounded-xl shadow-xl px-3.5 py-2.5 font-[Outfit] min-w-[165px]">
            <p className="text-[11px] font-bold text-slate-400 dark:text-[#A5D7E8]/50 uppercase tracking-wider mb-1.5">{label}</p>
            {payload.map((p, i) => p.value != null && (
                <div key={i} className="flex items-center gap-2 text-[13px] font-medium">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{background: p.color || p.fill}}/>
                    <span className="flex-1 text-slate-500 dark:text-[#A5D7E8]/60">{p.name}:</span>
                    <span className="font-bold text-[#0B2447] dark:text-white">{fmtK(p.value)}</span>
                </div>
            ))}
        </div>
    );
};

// ─── Treemap Content ──────────────────────────────────────────────────────────
const TreemapContent = ({ x, y, width, height, name, value, fill, children, hoveredName }) => {
    if (width < 10 || height < 10) return null;

    // Render labels only on leaf nodes (actual agents), never on the root container.
    const isLeaf = (!children || children.length === 0) && name !== 'Agents';
    const showTitle = isLeaf && width > 40 && height > 22;
    const showMeta = isLeaf && width > 120 && height > 58;
    const safeValue = Number(value) || 0;
    const isHovered = isLeaf && hoveredName && hoveredName === name;
    const dimmed = isLeaf && hoveredName && hoveredName !== name;
    const initials = String(name || '')
        .split(/\s+/)
        .filter(Boolean)
        .map(part => part[0])
        .join('')
        .slice(0, 4)
        .toUpperCase();
    const titleText = width > 95
        ? trunc(name, Math.max(8, Math.floor((width - 18) / 7)))
        : (initials || trunc(name, 8));

    return (
        <g>
            <rect
                x={x + 0.8}
                y={y + 0.8}
                width={Math.max(width - 1.6, 0)}
                height={Math.max(height - 1.6, 0)}
                rx={7}
                fill={fill || '#3f9d66'}
                stroke={isHovered ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.35)'}
                strokeWidth={isHovered ? 2.2 : 1}
                opacity={dimmed ? 0.55 : 1}
            />

            {showTitle && (
                <text
                    x={x + 9}
                    y={y + (width > 95 ? 21 : 18)}
                    fill="#f8fafc"
                    fontSize={width > 95 ? 12 : 10}
                    fontWeight={700}
                    fontFamily="Outfit, sans-serif"
                >
                    {titleText}
                </text>
            )}

            {showMeta && (
                <text
                    x={x + 9}
                    y={y + height - 10}
                    fill="rgba(248,250,252,0.95)"
                    fontSize={11}
                    fontWeight={600}
                    fontFamily="Outfit, sans-serif"
                >
                    {safeValue.toLocaleString()} pax
                </text>
            )}
        </g>
    );
};

// ─── Radar tooltip ────────────────────────────────────────────────────────────
const RadarTip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white dark:bg-[#0B2447] border border-slate-200 dark:border-white/15 rounded-xl shadow-xl px-3 py-2 font-[Outfit] text-[12.5px]">
            {payload.map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                    <span className="text-slate-500 dark:text-[#A5D7E8]/60">{p.name}:</span>
                    <span className="font-bold text-[#0B2447] dark:text-white">{Number(p.value).toFixed(1)}</span>
                </div>
            ))}
        </div>
    );
};

// ─── Heatmap Cell ─────────────────────────────────────────────────────────────
const HeatCell = ({ profit }) => {
    if (profit == null) return <div className="w-full h-full rounded bg-slate-100 dark:bg-white/5" />;
    const v = Number(profit);
    const max = 150000;
    if (v >= 0) {
        const t = Math.min(v / max, 1);
        return <div className="w-full h-full rounded transition-colors" style={{ background: `rgba(34,197,94,${0.12 + t * 0.78})` }} title={fmt(v)} />;
    } else {
        const t = Math.min(Math.abs(v) / max, 1);
        return <div className="w-full h-full rounded transition-colors" style={{ background: `rgba(239,68,68,${0.12 + t * 0.78})` }} title={fmt(v)} />;
    }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const buildSparkData = (monthlyTrend, key) =>
    (monthlyTrend || []).slice(-7).map(m => ({ v: Number(m[key]) || 0 }));

const buildAgentRadarData = (agent, avgAgent) => {
    if (!agent) return [];
    const safe = (v, d = 1) => Number(v) || d;
    const avgVolume     = safe(avgAgent?.avgPax,    50);
    const avgMargin     = safe(avgAgent?.avgMargin, 10);
    const avgReliability= safe(avgAgent?.avgReliability, 50);
    const avgTxSize     = safe(avgAgent?.avgTxSize, 5000);
    return [
        { metric: 'Volume',       agent: Math.min((safe(agent.totalPax) / Math.max(avgVolume * 2, 1)) * 100, 100),    avg: 50 },
        { metric: 'Margin %',     agent: Math.min((safe(agent.margin)   / Math.max(avgMargin * 2, 1)) * 100, 100),    avg: 50 },
        { metric: 'Reliability',  agent: Math.min((safe(agent.confirmedRatio) / Math.max(avgReliability * 2, 1)) * 100, 100), avg: 50 },
        { metric: 'Tx Size',      agent: Math.min((safe(agent.avgSOAPerPax) / Math.max(avgTxSize * 2, 1)) * 100, 100), avg: 50 },
    ];
};

const getDepartureMonthKey = (rawDate) => {
    if (rawDate == null) return null;
    const s = String(rawDate).trim();
    if (!s) return null;

    // ISO-like: 2025-02-27 or 2025-02-27T...
    const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (iso) {
        const y = iso[1];
        const m = String(Number(iso[2])).padStart(2, '0');
        return `${y}-${m}`;
    }

    // DD/MM/YYYY or DD-MM-YYYY (common in imported sheets)
    const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmy) {
        const m = String(Number(dmy[2])).padStart(2, '0');
        return `${dmy[3]}-${m}`;
    }

    return null;
};

const formatMonthKey = (key) => {
    const m = String(key || '').match(/^(\d{4})-(\d{2})$/);
    if (!m) return key || '';
    const dt = new Date(Number(m[1]), Number(m[2]) - 1, 1);
    return dt.toLocaleString('en-PH', { month: 'short', year: '2-digit' });
};

const buildHeatmapData = (transactions) => {
    if (!transactions?.length) return { agents: [], months: [], map: {} };
    const agentSet = new Set();
    const monthSet = new Set();
    const map = {};
    const agentTotals = {};
    transactions.forEach(t => {
        const a = String(t.agentName || 'Unknown').trim() || 'Unknown';
        const dep = getDepartureMonthKey(t.departureDate);
        if (!dep) return;
        agentSet.add(a);
        monthSet.add(dep);
        const key = `${a}||${dep}`;
        const profit = Number(t.netProfit) || 0;
        map[key] = (map[key] || 0) + profit;
        agentTotals[a] = (agentTotals[a] || 0) + profit;
    });

    // Show all agencies; sort by total contribution so key players stay near top.
    const agents = [...agentSet].sort((a, b) => (agentTotals[b] || 0) - (agentTotals[a] || 0));
    const months = [...monthSet].sort((a, b) => a.localeCompare(b));
    return { agents, months, map };
};


// ══════════════════════════════════════════════════════════════════════════════
//  Main Analytics Component
// ══════════════════════════════════════════════════════════════════════════════
const Analytics = () => {
    const now = new Date();

    const [filterMonth, setFilterMonth] = useState(String(now.getMonth() + 1));
    const [filterYear,  setFilterYear]  = useState(String(now.getFullYear()));

    const [analytics, setAnalytics] = useState(null);
    const [loading,   setLoading]   = useState(true);

    const [importOpen,    setImportOpen]    = useState(false);
    const [importFile,    setImportFile]    = useState(null);
    const [importMonth,   setImportMonth]   = useState(String(now.getMonth() + 1));
    const [importYear,    setImportYear]    = useState(String(now.getFullYear()));
    const [importReplace, setImportReplace] = useState(true);
    const [importing,     setImporting]     = useState(false);
    const [importResult,  setImportResult]  = useState(null);
    const fileInputRef = useRef(null);

    const [txPage,     setTxPage]     = useState(1);
    const [txPageSize, setTxPageSize] = useState(10);

    // Donut active index
    const [activeStatusIdx, setActiveStatusIdx] = useState(0);
    const [hoveredTreemapAgent, setHoveredTreemapAgent] = useState('');

    // Radar: selected agent
    const [radarAgent,  setRadarAgent]  = useState(null);
    const [radarOpen,   setRadarOpen]   = useState(false);

    const fetchAnalytics = useCallback(async (monthOverride, yearOverride) => {
        setLoading(true);
        try {
            const params = {};
            const m = monthOverride != null ? monthOverride : filterMonth;
            const y = yearOverride  != null ? yearOverride  : filterYear;
            if (m) params.month = m;
            if (y) params.year  = y;
            const res = await axios.get(`${API}/analytics/data`, {headers: authHeaders(), params});
            setAnalytics(res.data.data);
            setTxPage(1);
            setActiveStatusIdx(0);
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to load analytics.');
        } finally {
            setLoading(false);
        }
    }, [filterMonth, filterYear]);

    useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

    const handleImport = async () => {
        if (!importFile)                { toast.error('Please select an Excel file.'); return; }
        if (!importMonth || !importYear){ toast.error('Select month and year.'); return; }
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
        if (filterYear)  params.set('year',  filterYear);
        fetch(`${API}/analytics/export?${params.toString()}`, { headers: authHeaders() })
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
    };

    // ─── Derived data ─────────────────────────────────────────────────────────
    const kpi            = analytics?.kpi             || {};
    const byAgent        = analytics?.byAgent         || [];
    const byStatus       = analytics?.byStatus        || [];
    const byRegion       = analytics?.byRegion        || [];
    const monthlyTrend   = analytics?.monthlyTrend    || [];
    const byAgentMargin  = analytics?.byAgentMargin   || [];
    const transactions   = analytics?.transactions    || [];

    const topAgents  = byAgent.slice(0, 10).map(a => ({...a, shortName: trunc(a.agentName, 20)}));
    const topMargins = byAgentMargin.slice(0, 10).map(a => ({...a, shortName: trunc(a.agentName, 28)}));

    // Sparkline last-7 months
    const soaSpark    = buildSparkData(monthlyTrend, 'totalSOA');
    const poSpark     = buildSparkData(monthlyTrend, 'totalPO');
    const profitSpark = buildSparkData(monthlyTrend, 'netProfit');
    const paxSpark    = buildSparkData(monthlyTrend, 'totalPax');

    // Waterfall chart — color net-profit bars by sign
    const waterfallData = monthlyTrend.map(m => ({
        label:     m.label,
        totalSOA:  Number(m.totalSOA)  || 0,
        totalPO:   Number(m.totalPO)   || 0,
        netProfit: Number(m.netProfit) || 0,
    }));

    // Treemap
    const treemapChildren = [...byAgent]
        .sort((a, b) => (Number(b.totalPax) || 0) - (Number(a.totalPax) || 0))
        .filter(a => Number(a.totalPax) > 0)
        .map(a => {
            const pax = Number(a.totalPax) || 0;
            const profit = Number(a.netProfit) || 0;
            const intensity = Math.min(Math.abs(profit) / 250000, 1);
            const fill = profit >= 0
                ? `hsl(147 42% ${40 - intensity * 12}%)`
                : `hsl(3 70% ${48 - intensity * 10}%)`;
            return {
                name:      a.agentName || 'Unknown',
                noOfPax:   pax,
                netProfit: profit,
                size:      pax,
                fill,
            };
        });

    // Calculate total size for root node - Recharts NEEDS this to subdivide correctly
    const treemapTotalSize = treemapChildren.reduce((sum, child) => sum + child.size, 0);
    
    const treemapData = [{
        name: 'Agents',
        size: Math.max(treemapTotalSize, 1),
        children: treemapChildren,
    }];
    const topTreemapAgents = [...treemapChildren].sort((a, b) => (Number(b.size) || 0) - (Number(a.size) || 0));

    // Radar averages
    const avgAgent = byAgent.length ? {
        avgPax:         byAgent.reduce((s, a) => s + (Number(a.totalPax) || 0), 0) / byAgent.length,
        avgMargin:      byAgent.reduce((s, a) => s + (Number(a.margin)   || 0), 0) / byAgent.length,
        avgReliability: byAgent.reduce((s, a) => s + (Number(a.confirmedRatio) || 0), 0) / byAgent.length,
        avgTxSize:      byAgent.reduce((s, a) => s + (Number(a.avgSOAPerPax)   || 0), 0) / byAgent.length,
    } : null;

    const radarData = buildAgentRadarData(radarAgent, avgAgent);

    // Heatmap
    const { agents: hmAgents, months: hmMonths, map: hmMap } = buildHeatmapData(transactions);

    // Pagination
    const txStart = (txPage - 1) * txPageSize;
    const txSlice = transactions.slice(txStart, txStart + txPageSize);
    const txPages = Math.max(1, Math.ceil(transactions.length / txPageSize));

    const currentLabel = filterMonth
        ? `${MONTH_OPTIONS[parseInt(filterMonth) - 1]} ${filterYear}`
        : filterYear || 'All Time';

    const profitColor = (Number(kpi.netProfit) ?? 0) >= 0 ? '#22c55e' : '#ef4444';

    // ─── Custom bar shape for waterfall (colors by sign) ─────────────────────
    const ProfitBar = (props) => {
        const { x, y, width, height, value } = props;
        const color = (value || 0) >= 0 ? '#22c55e' : '#ef4444';
        return <rect x={x} y={y} width={width} height={height} fill={color} rx={3} />;
    };

    return (
        <div className="space-y-5 font-[Outfit]">

            {/* ── Header ───────────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-[22px] font-bold text-[#0B2447] dark:text-white font-[Outfit] leading-tight">Analytics</h1>
                    <p className="text-[13.5px] text-slate-500 dark:text-[#A5D7E8]/60 font-[Outfit] mt-0.5">
                        Financial Performance & Operational Insights — {currentLabel}
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

                    <Button variant="outline" onClick={()=>{ setImportResult(null); setImportFile(null); setImportOpen(true); }}
                        className='h-9 px-3.5 text-[13.5px] font-[Outfit] border-slate-200 dark:border-white/15 bg-white dark:bg-[#0d1b35] rounded-lg cursor-pointer gap-1.5'>
                        <Upload className="w-4 h-4" strokeWidth={1.8}/>Import
                    </Button>

                    <Button onClick={handleExport}
                        className="h-9 px-3.5 text-[13.5px] font-[Outfit] bg-[#0B2447] hover:bg-[#19376D] dark:bg-[#19376D] dark:hover:bg-[#576CBC] text-white rounded-lg cursor-pointer gap-1.5">
                        <Download className="w-4 h-4" strokeWidth={1.8}/>Export
                    </Button>
                </div>
            </div>

            {/* ── KPI Stat Cards with Sparklines ───────────────────────────── */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                <MotionDiv variants={fadeInUp} initial="hidden" animate="visible" custom={0}>
                    <StatCard icon={TrendingUp}   label="Total Revenue (SOA)" value={loading ? '' : fmtK(kpi.totalSOA)}
                        subtitle={loading ? '' : fmt(kpi.totalSOA)} accentColor="#576CBC" loading={loading}
                        sparkData={soaSpark} sparkColor="#576CBC" />
                </MotionDiv>
                <MotionDiv variants={fadeInUp} initial="hidden" animate="visible" custom={1}>
                    <StatCard icon={TrendingDown} label="Total Cost (PO)" value={loading ? '' : fmtK(kpi.totalPO)}
                        subtitle={loading ? '' : fmt(kpi.totalPO)} accentColor="#8b5cf6" loading={loading}
                        sparkData={poSpark} sparkColor="#8b5cf6" />
                </MotionDiv>
                <MotionDiv variants={fadeInUp} initial="hidden" animate="visible" custom={2}>
                    <StatCard icon={Wallet} label="Net Profit" value={loading ? '' : fmtK(kpi.netProfit)}
                        subtitle={loading ? '' : fmt(kpi.netProfit)} accentColor={profitColor} loading={loading}
                        sparkData={profitSpark} sparkColor={profitColor} />
                </MotionDiv>
                <MotionDiv variants={fadeInUp} initial="hidden" animate="visible" custom={3}>
                    <StatCard icon={Users} label="Total Passengers" value={loading ? '' : (kpi.totalPax || 0).toLocaleString()}
                        subtitle="All pax in selected period" accentColor="#19376D" loading={loading}
                        sparkData={paxSpark} sparkColor="#19376D" />
                </MotionDiv>
            </div>

            {/* ── Waterfall + Active Donut ─────────────────────────────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <ChartCard className="xl:col-span-2" animDelay={1}
                    title="Financial Flow — Waterfall View"
                    description="Revenue eroded by Cost to Net Profit. Red bars = month operated at a loss.">
                    {loading ? (
                        <Skeleton className='h-64 w-full bg-slate-100 dark:bg-white/5 rounded-xl'/>
                    ) : waterfallData.length === 0 ? (
                        <EmptyChart label="No trend data for this period"/>
                    ) : (
                        <ResponsiveContainer width="100%" height={260}>
                            <ComposedChart data={waterfallData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} syncId="main">
                                <defs>
                                    <linearGradient id="gSOAwf" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%"  stopColor={CHART.soa} stopOpacity={0.25} />
                                        <stop offset="95%" stopColor={CHART.soa} stopOpacity={0.04} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                <XAxis dataKey="label" tick={{ fontSize: 11, fontFamily: 'Outfit', fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <YAxis tickFormatter={fmtK} tick={{ fontSize: 11, fontFamily: 'Outfit', fill: '#94a3b8' }} axisLine={false} tickLine={false} width={60} />
                                <Tooltip content={<WaterfallTooltip />} />
                                <Legend wrapperStyle={{ fontFamily: 'Outfit', fontSize: 12, paddingTop: 8 }} />
                                <ReferenceLine y={0} stroke="#e2e8f0" strokeWidth={1.5} />
                                {/* SOA as light area background */}
                                <Area type="monotone" dataKey="totalSOA" name="Revenue (SOA)"
                                    stroke={CHART.soa} strokeWidth={2} fill="url(#gSOAwf)" dot={false} />
                                {/* PO as stacked bar */}
                                <Bar dataKey="totalPO" name="Cost (PO)" fill={CHART.po} opacity={0.75}
                                    radius={[3, 3, 0, 0]} barSize={18} />
                                {/* Net Profit as color-coded line with dots */}
                                <Line type="monotone" dataKey="netProfit" name="Net Profit"
                                    stroke="#22c55e" strokeWidth={2.5}
                                    dot={(p) => {
                                        const color = (p.value || 0) >= 0 ? '#22c55e' : '#ef4444';
                                        return <circle key={p.key} cx={p.cx} cy={p.cy} r={4} fill={color} stroke="#fff" strokeWidth={2} />;
                                    }}
                                    activeDot={{ r: 6 }}
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    )}
                </ChartCard>

                {/* Active-Shape Donut */}
                <ChartCard animDelay={2} title="Transaction Status" description="Click a segment for details">
                    {loading ? (
                        <Skeleton className="h-64 w-full bg-slate-100 dark:bg-white/5 rounded-xl" />
                    ) : byStatus.length === 0 ? (
                        <EmptyChart label="No status data" />
                    ) : (
                        <div className="flex flex-col items-center gap-3">
                            <ResponsiveContainer width="100%" height={210}>
                                <PieChart>
                                    <Pie data={byStatus} dataKey="count" nameKey="status"
                                        cx="50%" cy="50%" innerRadius={56} outerRadius={82}
                                        paddingAngle={3} strokeWidth={0}
                                        activeIndex={activeStatusIdx}
                                        activeShape={renderActiveShape}
                                        onMouseEnter={(_, i) => setActiveStatusIdx(i)}
                                        onClick={(_, i) => setActiveStatusIdx(i)}>
                                        {byStatus.map((entry, i) => (
                                            <Cell key={i} fill={STATUS_COLORS[entry.status] || '#94a3b8'} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5">
                                {byStatus.map((s, i) => (
                                    <button key={i} onClick={() => setActiveStatusIdx(i)}
                                        className={`flex items-center gap-1.5 text-[12.5px] font-[Outfit] transition-opacity ${i === activeStatusIdx ? 'opacity-100' : 'opacity-50 hover:opacity-80'}`}>
                                        <span className="w-2.5 h-2.5 rounded-full shrink-0"
                                            style={{ background: STATUS_COLORS[s.status] || '#94a3b8' }} />
                                        <span className="text-slate-600 dark:text-[#A5D7E8]/70">{s.status}</span>
                                        <span className="font-bold text-[#0B2447] dark:text-white">({s.count})</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </ChartCard>
            </div>

            {/* ── Agent Treemap + Regional ──────────────────────────────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <ChartCard animDelay={3}
                    title="Agent Market Share"
                    description="Block size = passenger volume · Color intensity = net profit (green = profitable, red = loss). Click to compare.">
                    {loading ? (
                        <Skeleton className="h-80 w-full bg-slate-100 dark:bg-white/5 rounded-xl" />
                    ) : treemapData[0]?.children?.length === 0 ? (
                        <EmptyChart label="No agent data" />
                    ) : (
                        <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2.5">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-1 text-[11px] font-semibold">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Profitable
                                </span>
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 text-rose-700 px-2.5 py-1 text-[11px] font-semibold">
                                    <span className="w-2 h-2 rounded-full bg-rose-500" /> Loss-making
                                </span>
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 text-slate-600 px-2.5 py-1 text-[11px] font-semibold">
                                    Top {treemapChildren.length} agents shown
                                </span>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_220px] gap-3 rounded-xl border border-slate-200/80 dark:border-white/10 bg-[radial-gradient(circle_at_top_left,#f8fafc,#eef2f7)] dark:bg-[radial-gradient(circle_at_top_left,#12233f,#0d1b35)] p-2">
                                <div>
                                    <ResponsiveContainer width="100%" height={320}>
                                        <Treemap
                                            data={treemapData}
                                            dataKey="size"
                                            aspectRatio={4 / 3}
                                            content={<TreemapContent hoveredName={hoveredTreemapAgent} />}
                                            isAnimationActive
                                            animationDuration={500}
                                            onMouseMove={(node) => {
                                                if (node?.name && node.name !== 'Agents') setHoveredTreemapAgent(node.name);
                                            }}
                                            onMouseLeave={() => setHoveredTreemapAgent('')}
                                            onClick={(node) => {
                                                if (node.depth !== 1) return;
                                                const full = byAgent.find(a => a.agentName === node.name);
                                                if (full) { setRadarAgent(full); setRadarOpen(true); }
                                            }}
                                        >
                                            <Tooltip
                                                content={({ active, payload }) => {
                                                    if (!active || !payload?.length) return null;
                                                    const d = payload[0]?.payload;
                                                    if (!d || !d.name || d.name === 'Agents') return null;
                                                    return (
                                                        <div className="bg-white dark:bg-[#0B2447] border border-slate-200 dark:border-white/15 rounded-xl shadow-xl px-3.5 py-2.5 font-[Outfit] min-w-41.25">
                                                            <p className="text-[13px] font-bold text-[#0B2447] dark:text-white mb-1">{d.name}</p>
                                                            <p className="text-[12px] text-slate-500 dark:text-[#A5D7E8]/60">Passengers: <b>{Number(d.noOfPax || 0).toLocaleString()}</b></p>
                                                            <p className="text-[12px] text-slate-500 dark:text-[#A5D7E8]/60">Net Profit: <b className={Number(d.netProfit) >= 0 ? 'text-green-600' : 'text-red-500'}>{fmtK(d.netProfit)}</b></p>
                                                        </div>
                                                    );
                                                }}
                                            />
                                        </Treemap>
                                    </ResponsiveContainer>
                                </div>

                                <div className="rounded-lg bg-white/65 dark:bg-[#0b1f3f]/55 border border-slate-200/70 dark:border-white/10 p-3">
                                    <p className="text-[12px] font-bold tracking-wide uppercase text-slate-500 dark:text-[#A5D7E8]/60 mb-2">Agency Directory ({topTreemapAgents.length})</p>
                                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                                        {topTreemapAgents.map((a, idx) => (
                                            <button
                                                key={`${a.name}-${idx}`}
                                                type="button"
                                                className={`w-full text-left rounded-md px-2 py-1.5 transition-colors border ${hoveredTreemapAgent === a.name ? 'bg-slate-100 dark:bg-white/10 border-slate-300 dark:border-white/25' : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-white/5'}`}
                                                onMouseEnter={() => setHoveredTreemapAgent(a.name)}
                                                onMouseLeave={() => setHoveredTreemapAgent('')}
                                                onClick={() => {
                                                    const full = byAgent.find(x => x.agentName === a.name);
                                                    if (full) { setRadarAgent(full); setRadarOpen(true); }
                                                }}
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-[12.5px] font-semibold text-[#0B2447] dark:text-white truncate" title={a.name}>{a.name}</span>
                                                    <span className="text-[11.5px] font-bold text-slate-500 dark:text-[#A5D7E8]/70">{Number(a.noOfPax).toLocaleString()}</span>
                                                </div>
                                                <p className={`text-[11px] mt-0.5 ${a.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                                    {fmtK(a.netProfit)}
                                                </p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </ChartCard>

                <ChartCard animDelay={4} title="Regional Breakdown" description="Revenue and profit by Philippine region">
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

            {/* ── Profit Margin + Heatmap ───────────────────────────────────── */}
            <ChartCard animDelay={5}
                title="Profit Margin by Agent"
                description="Net profit as a % of SOA — top 10 highest-margin agents">
                {loading ? (
                    <Skeleton className="h-52 w-full bg-slate-100 dark:bg-white/5 rounded-xl" />
                ) : topMargins.length === 0 ? (
                    <EmptyChart label="No margin data" />
                ) : (
                    <ResponsiveContainer width="100%" height={Math.max(320, topMargins.length * 34 + 30)}>
                        <BarChart data={topMargins} layout="vertical" margin={{ top: 4, right: 20, left: 10, bottom: 8 }} syncId="main">
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                            <XAxis
                                type="number"
                                tickFormatter={(v) => `${v}%`}
                                tick={{ fontSize: 11, fontFamily: 'Outfit', fill: '#94a3b8' }}
                                axisLine={false}
                                tickLine={false}
                                domain={[0, 'dataMax + 10']}
                            />
                            <YAxis
                                type="category"
                                dataKey="shortName"
                                width={200}
                                tick={{ fontSize: 12, fontFamily: 'Outfit', fill: '#475569' }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip
                                formatter={(v) => [`${Number(v).toFixed(2)}%`, 'Margin']}
                                labelFormatter={(_, payload) => payload?.[0]?.payload?.agentName || 'Agent'}
                            />
                            <Bar dataKey="margin" name="Margin %" fill={CHART.margin} radius={[0, 6, 6, 0]} barSize={16} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </ChartCard>

            {/* ── Profit Heatmap ────────────────────────────────────────────── */}
            {!loading && hmAgents.length > 0 && hmMonths.length > 0 && (
                <MotionDiv variants={fadeInUp} initial="hidden" animate="visible" custom={6}>
                    <Card className="border border-slate-200 dark:border-[#576CBC]/20 bg-white dark:bg-[#0d1b35] shadow-sm rounded-2xl overflow-hidden font-[Outfit]">
                        <CardHeader className="px-5 pt-5 pb-3 border-b border-slate-100 dark:border-white/8">
                            <CardTitle className="text-[15.5px] font-semibold text-[#0B2447] dark:text-white font-[Outfit]">
                                Profit Heatmap
                            </CardTitle>
                            <CardDescription className="text-[12.5px] text-slate-400 dark:text-[#A5D7E8]/50 font-[Outfit] mt-0.5">
                                Agent × Departure Month — Green = profitable window · Red = loss period · Hover for exact value
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-5 overflow-x-auto">
                            <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-[radial-gradient(circle_at_top_left,#f8fafc,#eef2f7)] dark:bg-[radial-gradient(circle_at_top_left,#12233f,#0d1b35)] p-3" style={{ minWidth: hmMonths.length * 52 + 250 }}>
                                {/* Header row */}
                                <div className="flex gap-1 mb-1 pl-56">
                                    {hmMonths.map(m => (
                                        <div key={m} className="w-12 shrink-0 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#A5D7E8]/55 font-[Outfit]">
                                            {formatMonthKey(m)}
                                        </div>
                                    ))}
                                </div>
                                {/* Agent rows */}
                                <div className="max-h-110 overflow-y-auto pr-1">
                                {hmAgents.map(agent => (
                                    <div key={agent} className="flex items-center gap-1 mb-1">
                                        <div className="w-56 shrink-0 text-[11.5px] text-slate-700 dark:text-[#A5D7E8]/75 font-[Outfit] truncate pr-2 text-right" title={agent}>
                                            {agent}
                                        </div>
                                        {hmMonths.map(month => {
                                            const val = hmMap[`${agent}||${month}`];
                                            return (
                                                <div key={month} className="w-12 h-7 shrink-0 relative group">
                                                    <HeatCell profit={val} />
                                                    {val != null && (
                                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#0B2447] dark:bg-slate-800 text-white text-[10.5px] font-[Outfit] px-2 py-1 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                                            {fmt(val)}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                                </div>
                                {/* Legend */}
                                <div className="flex items-center gap-3 mt-4 pl-56">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-3 h-3 rounded" style={{background:'rgba(239,68,68,0.85)'}}/>
                                        <span className="text-[11px] text-slate-400 font-[Outfit]">High loss</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-3 h-3 rounded" style={{background:'rgba(239,68,68,0.2)'}}/>
                                        <span className="text-[11px] text-slate-400 font-[Outfit]">Minor loss</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-3 h-3 rounded bg-slate-100 dark:bg-white/10"/>
                                        <span className="text-[11px] text-slate-400 font-[Outfit]">No data</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-3 h-3 rounded" style={{background:'rgba(34,197,94,0.3)'}}/>
                                        <span className="text-[11px] text-slate-400 font-[Outfit]">Minor profit</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-3 h-3 rounded" style={{background:'rgba(34,197,94,0.9)'}}/>
                                        <span className="text-[11px] text-slate-400 font-[Outfit]">High profit</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </MotionDiv>
            )}

            {/* ── Transactions Table ────────────────────────────────────────── */}
            <MotionDiv variants={fadeInUp} initial="hidden" animate="visible" custom={7}>
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
                                                {['Ref No.','Agent','Status','Pax','SOA','PO','Net Profit','Departure','Area'].map(h => (
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
                                <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 dark:border-white/8">
                                    <p className="text-[12.5px] text-slate-500 dark:text-[#A5D7E8]/50 font-[Outfit]">
                                        {txStart + 1}–{Math.min(txStart + txPageSize, transactions.length)} of {transactions.length}
                                    </p>
                                    <div className="flex items-center gap-1">
                                        {[
                                            {icon: ChevronsLeft, action: () => setTxPage(1), disabled: txPage === 1},
                                            {icon: ChevronLeft,  action: () => setTxPage(p => Math.max(1, p-1)), disabled: txPage === 1},
                                            null,
                                            {icon: ChevronRight, action: () => setTxPage(p => Math.min(txPages, p+1)), disabled: txPage === txPages},
                                            {icon: ChevronsRight,action: () => setTxPage(txPages), disabled: txPage === txPages},
                                        ].map((btn, i) => btn ? (
                                            <Button key={i} variant="ghost" size="icon" onClick={btn.action} disabled={btn.disabled}
                                                className="h-8 w-8 rounded-lg cursor-pointer text-slate-400 hover:text-[#0B2447] dark:hover:text-white disabled:opacity-30">
                                                <btn.icon className="w-4 h-4" strokeWidth={1.8} />
                                            </Button>
                                        ) : (
                                            <span key={i} className="text-[13px] font-medium text-[#0B2447] dark:text-white font-[Outfit] px-2">
                                                {txPage} / {txPages}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </MotionDiv>

            {/* ── Agent Radar Dialog ────────────────────────────────────────── */}
            <Dialog open={radarOpen} onOpenChange={setRadarOpen}>
                <DialogContent className="sm:max-w-lg bg-white dark:bg-[#0d1b35] border border-slate-200 dark:border-white/15 rounded-2xl font-[Outfit]">
                    <DialogHeader>
                        <DialogTitle className="text-[17px] font-bold text-[#0B2447] dark:text-white font-[Outfit]">
                            Agent Performance Radar
                        </DialogTitle>
                        <DialogDescription className="text-[13px] text-slate-500 dark:text-[#A5D7E8]/60 font-[Outfit]">
                            {radarAgent?.agentName} — compared to agency average across 4 dimensions (score out of 100)
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-2">
                        {radarData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <RadarChart data={radarData} margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
                                    <PolarGrid stroke="#e2e8f0" />
                                    <PolarAngleAxis dataKey="metric"
                                        tick={{ fontSize: 12, fontFamily: 'Outfit', fill: '#64748b' }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                    <Radar name="Agent" dataKey="agent"
                                        stroke="#576CBC" fill="#576CBC" fillOpacity={0.28} strokeWidth={2} />
                                    <Radar name="Avg" dataKey="avg"
                                        stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.10} strokeWidth={1.5}
                                        strokeDasharray="4 3" />
                                    <Legend wrapperStyle={{ fontFamily: 'Outfit', fontSize: 12 }} />
                                    <Tooltip content={<RadarTip />} />
                                </RadarChart>
                            </ResponsiveContainer>
                        ) : (
                            <EmptyChart label="Insufficient data for radar" />
                        )}
                        {radarAgent && (
                            <div className="grid grid-cols-2 gap-3 mt-2">
                                {[
                                    { label: 'Net Profit',  value: fmt(radarAgent.netProfit),    color: (radarAgent.netProfit||0) >= 0 ? '#22c55e' : '#ef4444' },
                                    { label: 'Margin %',    value: `${Number(radarAgent.margin||0).toFixed(1)}%`,  color: '#f59e0b' },
                                    { label: 'Total Pax',   value: (radarAgent.totalPax||0).toLocaleString(), color: '#576CBC' },
                                    { label: 'Avg SOA/Pax', value: fmt(radarAgent.avgSOAPerPax||0), color: '#8b5cf6' },
                                ].map(item => (
                                    <div key={item.label} className="bg-slate-50 dark:bg-white/5 rounded-xl px-3.5 py-2.5">
                                        <p className="text-[11px] text-slate-400 font-[Outfit] uppercase tracking-wider">{item.label}</p>
                                        <p className="text-[15px] font-bold font-[Outfit] mt-0.5" style={{ color: item.color }}>{item.value}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRadarOpen(false)}
                            className="font-[Outfit] text-[13.5px] rounded-lg border-slate-200 dark:border-white/15 cursor-pointer">
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Import Dialog ─────────────────────────────────────────────── */}
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
