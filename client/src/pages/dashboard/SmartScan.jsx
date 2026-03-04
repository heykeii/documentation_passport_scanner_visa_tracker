import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
    ScanLine, Inbox, RefreshCw, ChevronRight,
    Layers, User, CalendarClock, UserCheck,
    Clock, CheckCircle2, XCircle, Loader2, Plus,
    AlertCircle, Sparkles, BookOpen, Hash,
    BadgeCheck, BriefcaseBusiness, MapPin, Plane,
    CalendarDays, Calendar, Building2, FileText,
    CreditCard, Fingerprint, X, ArrowRight,
    Shield, ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Sheet, SheetContent, SheetHeader, SheetTitle,
    SheetDescription, SheetFooter,
} from '@/components/ui/sheet';

/* ─── Constants ─── */
const API = 'http://localhost:3000/api';
const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('authToken')}`,
});

const PASSPORT_FIELDS = {
    surname: '', firstName: '', middleName: '',
    dateOfBirth: '', passportNumber: '',
    dateOfIssue: '', dateOfExpiry: '',
};
const ASSIGNMENT_FIELDS = {
    portalRefNo: '', payment: '', agency: '',
    appointmentDate: '', appointmentTime: '',
    embassy: '', departureDate: '', tourName: '',
};
const GROUP_CLEAR_FIELDS = { ...PASSPORT_FIELDS, portalRefNo: '' };
const EMPTY_FORM = { ...PASSPORT_FIELDS, ...ASSIGNMENT_FIELDS };

const formatDate = (date) => date.toISOString().split('T')[0];
const addDays = (days) => {
    const d = new Date(); d.setDate(d.getDate() + days); return formatDate(d);
};

/* ─── Field Component ─── */
const Field = ({ label, id, placeholder, value, onChange, type = 'text', required = false, error = '', icon: Icon, readOnly = false, hint }) => (
    <div className="flex flex-col gap-1.5 group">
        <Label htmlFor={id} className="flex items-center gap-1.5 text-[11px] font-semibold tracking-widest uppercase text-slate-400 dark:text-slate-500 select-none transition-colors group-focus-within:text-[#19376D] dark:group-focus-within:text-[#A5D7E8]">
            {Icon && <Icon className="w-3 h-3" strokeWidth={2} />}
            {label}
            {required && <span className="text-rose-400 normal-case tracking-normal font-bold">*</span>}
        </Label>
        <div className="relative">
            <Input
                id={id} type={type} placeholder={placeholder} value={value} readOnly={readOnly}
                onChange={e => !readOnly && onChange(id, e.target.value)}
                className={`
                    h-8 text-[13px] font-medium rounded-lg transition-all
                    bg-white dark:bg-slate-900/50
                    border-slate-200 dark:border-slate-700/60
                    text-slate-800 dark:text-slate-100
                    placeholder:text-slate-300 dark:placeholder:text-slate-600
                    focus-visible:ring-2 focus-visible:ring-[#19376D]/20 dark:focus-visible:ring-[#576CBC]/30
                    focus-visible:border-[#19376D]/50 dark:focus-visible:border-[#576CBC]/60
                    hover:border-slate-300 dark:hover:border-slate-600
                    ${readOnly ? 'opacity-60 cursor-default bg-slate-50 dark:bg-slate-800/50' : ''}
                    ${error ? 'border-rose-400 focus-visible:ring-rose-300/30 focus-visible:border-rose-400' : ''}
                `}
            />
        </div>
        {hint && !error && <p className="text-[11px] text-slate-400 dark:text-slate-600">{hint}</p>}
        {error && (
            <p className="flex items-center gap-1 text-[11px] text-rose-500 font-medium">
                <AlertCircle className="w-3 h-3 shrink-0" strokeWidth={2} />{error}
            </p>
        )}
    </div>
);

/* ─── Date Field ─── */
const DateField = ({ label, id, value, onChange, icon: Icon, required }) => (
    <div className="flex flex-col gap-1 group">
        <Label htmlFor={id} className="flex items-center gap-1.5 text-[11px] font-semibold tracking-widest uppercase text-slate-400 dark:text-slate-500 select-none transition-colors group-focus-within:text-[#19376D] dark:group-focus-within:text-[#A5D7E8]">
            {Icon && <Icon className="w-3 h-3" strokeWidth={2} />}
            {label}
            {required && <span className="text-rose-400 normal-case tracking-normal font-bold">*</span>}
        </Label>
        <Input id={id} type="date" value={value} onChange={e => onChange(id, e.target.value)}
            className="h-8 text-[13px] font-medium rounded-lg transition-all bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-100 focus-visible:ring-2 focus-visible:ring-[#19376D]/20 dark:focus-visible:ring-[#576CBC]/30 focus-visible:border-[#19376D]/50 dark:focus-visible:border-[#576CBC]/60 hover:border-slate-300 dark:hover:border-slate-600"
        />
    </div>
);

/* ─── Time Field ─── */
const TimeField = ({ label, id, value, onChange, icon: Icon }) => (
    <div className="flex flex-col gap-1 group">
        <Label htmlFor={id} className="flex items-center gap-1.5 text-[11px] font-semibold tracking-widest uppercase text-slate-400 dark:text-slate-500 select-none transition-colors group-focus-within:text-[#19376D] dark:group-focus-within:text-[#A5D7E8]">
            {Icon && <Icon className="w-3 h-3" strokeWidth={2} />}
            {label}
        </Label>
        <Input id={id} type="time" value={value} onChange={e => onChange(id, e.target.value)}
            className="h-8 text-[13px] font-medium rounded-lg transition-all bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-100 focus-visible:ring-2 focus-visible:ring-[#19376D]/20 dark:focus-visible:ring-[#576CBC]/30 focus-visible:border-[#19376D]/50 dark:focus-visible:border-[#576CBC]/60 hover:border-slate-300 dark:hover:border-slate-600"
        />
    </div>
);

const DATE_PRESETS = {
    today:       [{ label: 'Today',  value: () => formatDate(new Date()) }],
    future:      [{ label: 'Today', value: () => formatDate(new Date()) }, { label: '+7d', value: () => addDays(7) }, { label: '+30d', value: () => addDays(30) }],
    appointment: [{ label: 'Tmrw',  value: () => addDays(1) }, { label: '+3d', value: () => addDays(3) }, { label: '+7d', value: () => addDays(7) }],
};
const TIME_PRESETS = {
    appointment: [{ label: '8AM', value: '08:00' }, { label: '9AM', value: '09:00' }, { label: '10AM', value: '10:00' }, { label: '2PM', value: '14:00' }],
};

/* ─── Stat Pill ─── */
const StatPill = ({ icon: Icon, label, value, color, loading }) => (
    <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border bg-white dark:bg-slate-900/60 ${color.border} shadow-sm`}>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${color.bg}`}>
            <Icon className={`w-3.5 h-3.5 ${color.icon}`} strokeWidth={2.2} />
        </div>
        <div>
            {loading
                ? <Skeleton className="h-4 w-10 mb-0.5 bg-slate-100 dark:bg-slate-800" />
                : <p className={`text-[15px] font-bold leading-none ${color.text}`}>{value}</p>
            }
            <p className="text-[10.5px] text-slate-400 dark:text-slate-500 mt-0.5 leading-none">{label}</p>
        </div>
    </div>
);

/* ─── Section Panel ─── */
const SectionPanel = ({ step, stepColor, title, subtitle, icon: Icon, children, right }) => (
    <div className="relative">
        {/* Step number */}
        <div className="flex items-start gap-4">
            <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-black text-white shadow-md mt-0.5 ${stepColor}`}>
                {step}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                        <div>
                            <p className="text-[14px] font-bold text-slate-800 dark:text-slate-100 leading-tight">{title}</p>
                            <p className="text-[11.5px] text-slate-400 dark:text-slate-500 mt-0.5">{subtitle}</p>
                        </div>
                    </div>
                    {right}
                </div>
                <div className="pl-0">{children}</div>
            </div>
        </div>
    </div>
);

/* ══════════════════════════════════════════ */

const SmartScan = () => {
    const [activeTab, setActiveTab] = useState('manual');
    const [form, setForm]           = useState(EMPTY_FORM);
    const [errors, setErrors]       = useState({});
    const [groupMode, setGroupMode] = useState(false);
    const [saving, setSaving]       = useState(false);
    const [pendingScans, setPendingScans] = useState([]);
    const [loadingScans, setLoadingScans] = useState(false);
    const [savedToday, setSavedToday]     = useState(null);
    const [totalRecords, setTotalRecords] = useState(null);
    const [statsLoading, setStatsLoading] = useState(true);
    const [importOpen, setImportOpen]     = useState(false);
    const [activeImport, setActiveImport] = useState(null);
    const [assignForm, setAssignForm]     = useState(ASSIGNMENT_FIELDS);
    const [assignErrors, setAssignErrors] = useState({});
    const [importing, setImporting]       = useState(false);

    const updateField  = (key, val) => { setForm(f => ({ ...f, [key]: val })); if (errors[key]) setErrors(e => ({ ...e, [key]: '' })); };
    const updateAssign = (key, val) => { setAssignForm(f => ({ ...f, [key]: val })); if (assignErrors[key]) setAssignErrors(e => ({ ...e, [key]: '' })); };

    const validateForm = () => {
        const e = {};
        if (!form.surname.trim())        e.surname        = 'Required';
        if (!form.firstName.trim())      e.firstName      = 'Required';
        if (!form.passportNumber.trim()) e.passportNumber = 'Required';
        else if (form.passportNumber.trim().length < 5) e.passportNumber = 'Min 5 characters';
        setErrors(e); return Object.keys(e).length === 0;
    };
    const validateAssign = () => {
        const e = {};
        if (!assignForm.portalRefNo.trim()) e.portalRefNo = 'Portal Ref is required';
        setAssignErrors(e); return Object.keys(e).length === 0;
    };

    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const { data } = await axios.get(`${API}/passports`, { headers: authHeaders() });
            const records = data.data || [];
            const today = new Date().toISOString().slice(0, 10);
            setTotalRecords(records.length);
            setSavedToday(records.filter(r => (r.createdAt || '').slice(0, 10) === today).length);
        } catch { setTotalRecords(0); setSavedToday(0); }
        finally { setStatsLoading(false); }
    }, []);

    const fetchPending = useCallback(async () => {
        setLoadingScans(true);
        try {
            const { data } = await axios.get(`${API}/pending-scans`, { headers: authHeaders() });
            setPendingScans(data.data || []);
        } catch { toast.error('Failed to load pending scans.'); }
        finally { setLoadingScans(false); }
    }, []);

    useEffect(() => { fetchStats(); }, [fetchStats]);
    useEffect(() => { if (activeTab === 'pending') fetchPending(); }, [activeTab, fetchPending]);

    const handleSave = async () => {
        if (!validateForm()) return;
        setSaving(true);
        try {
            await axios.post(`${API}/passports`, form, { headers: authHeaders() });
            toast.success('Record saved!', { description: `${form.firstName} ${form.surname} added.` });
            if (groupMode) { setForm(f => ({ ...f, ...GROUP_CLEAR_FIELDS })); setErrors({}); }
            else { setForm(EMPTY_FORM); setErrors({}); }
            fetchStats();
        } catch (err) { toast.error(err?.response?.data?.error || 'Failed to save record.'); }
        finally { setSaving(false); }
    };

    const openImport = (scan) => { setActiveImport(scan); setAssignForm(ASSIGNMENT_FIELDS); setAssignErrors({}); setImportOpen(true); };

    const handleImport = async () => {
        if (!validateAssign()) return;
        setImporting(true);
        try {
            await axios.post(`${API}/passports`, { ...activeImport, ...assignForm }, { headers: authHeaders() });
            await axios.delete(`${API}/pending-scans/${activeImport.scanId}`, { headers: authHeaders() });
            toast.success('Scan imported!', { description: `${activeImport.firstName} ${activeImport.surname} added.` });
            setImportOpen(false);
            setPendingScans(prev => prev.filter(s => s.scanId !== activeImport.scanId));
            fetchStats();
        } catch (err) { toast.error(err?.response?.data?.error || 'Failed to import.'); }
        finally { setImporting(false); }
    };

    const handleDismiss = async (scanId, name) => {
        try {
            await axios.delete(`${API}/pending-scans/${scanId}`, { headers: authHeaders() });
            setPendingScans(prev => prev.filter(s => s.scanId !== scanId));
            toast.info(`${name} dismissed.`);
        } catch { toast.error('Failed to dismiss.'); }
    };

    const expiryBadge = (date) => {
        if (!date) return null;
        const days = Math.ceil((new Date(date) - new Date()) / 86400000);
        if (days < 0)   return { label: 'Expired',       cls: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400' };
        if (days <= 90) return { label: 'Expiring Soon', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400' };
        return { label: 'Valid', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' };
    };

    /* passport completeness indicator */
    const passportFields = ['surname', 'firstName', 'passportNumber', 'dateOfBirth', 'dateOfIssue', 'dateOfExpiry'];
    const passportFilled = passportFields.filter(f => form[f]).length;
    const passportPct    = Math.round((passportFilled / passportFields.length) * 100);

    const assignmentFields = ['agency', 'embassy', 'tourName', 'appointmentDate', 'departureDate'];
    const assignmentFilled = assignmentFields.filter(f => form[f]).length;
    const assignmentPct    = Math.round((assignmentFilled / assignmentFields.length) * 100);

    /* ════════════════════ RENDER ════════════════════ */
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#070f1e]">

            {/* ══ TOP HEADER BAR ══ */}
            <div className="sticky top-0 z-20 bg-white/90 dark:bg-[#0a1628]/90 backdrop-blur-md border-b border-slate-200/70 dark:border-slate-800/60">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">

                    {/* Left: title */}
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: 'linear-gradient(135deg, #0B2447 0%, #576CBC 100%)' }}>
                            <ScanLine className="w-4.5 h-4.5 text-white" strokeWidth={1.8} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-[16px] font-bold text-slate-900 dark:text-white tracking-tight leading-none">
                                    Smart Scan
                                </h1>
                                <span className="inline-flex items-center gap-1 text-[9.5px] font-bold bg-linear-to-r from-[#0B2447] to-[#576CBC] text-white px-2 py-0.5 rounded-full tracking-wide">
                                    <Sparkles className="w-2.5 h-2.5" strokeWidth={2.5} /> AI
                                </span>
                            </div>
                            <p className="text-[11.5px] text-slate-400 dark:text-slate-500 mt-0.5 leading-none">Passport data entry & assignment</p>
                        </div>
                    </div>

                    {/* Right: stats */}
                    <div className="flex items-center gap-2">
                        <StatPill icon={BookOpen} label="Total Records" value={totalRecords ?? '—'} loading={statsLoading}
                            color={{ bg: 'bg-blue-50 dark:bg-blue-500/10', icon: 'text-blue-600 dark:text-blue-400', text: 'text-[#0B2447] dark:text-white', border: 'border-slate-200/70 dark:border-slate-700/50' }} />
                        <StatPill icon={BadgeCheck} label="Saved Today" value={savedToday ?? '—'} loading={statsLoading}
                            color={{ bg: 'bg-emerald-50 dark:bg-emerald-500/10', icon: 'text-emerald-600 dark:text-emerald-400', text: 'text-[#0B2447] dark:text-white', border: 'border-slate-200/70 dark:border-slate-700/50' }} />
                        <StatPill icon={Inbox} label="Pending Scans" value={pendingScans.length} loading={false}
                            color={{
                                bg: pendingScans.length > 0 ? 'bg-amber-50 dark:bg-amber-500/10' : 'bg-slate-50 dark:bg-slate-800/50',
                                icon: pendingScans.length > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-slate-600',
                                text: 'text-[#0B2447] dark:text-white',
                                border: 'border-slate-200/70 dark:border-slate-700/50'
                            }} />
                    </div>
                </div>
            </div>

            {/* ══ MAIN CONTENT ══ */}
            <div className="max-w-6xl mx-auto px-6 py-6">

                {/* Tab strip */}
                <div className="flex items-center gap-3 mb-6">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <div className="flex items-center justify-between">
                            <TabsList className="bg-white dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-700/50 p-1 rounded-xl h-11 gap-0.5 shadow-sm">
                                <TabsTrigger value="manual"
                                    className="font-semibold text-[13px] data-[state=active]:bg-[#0B2447] dark:data-[state=active]:bg-[#19376D] data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg px-5 h-9 transition-all cursor-pointer text-slate-500 dark:text-slate-400 gap-1.5">
                                    <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                                    Manual Entry
                                </TabsTrigger>
                                <TabsTrigger value="pending"
                                    className="font-semibold text-[13px] data-[state=active]:bg-[#0B2447] dark:data-[state=active]:bg-[#19376D] data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg px-5 h-9 transition-all cursor-pointer text-slate-500 dark:text-slate-400 gap-1.5">
                                    <Inbox className="w-3.5 h-3.5" strokeWidth={2} />
                                    Pending Scans
                                    {pendingScans.length > 0 && (
                                        <span className="bg-amber-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none min-w-4.5 text-center">
                                            {pendingScans.length}
                                        </span>
                                    )}
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {/* ══════════ MANUAL ENTRY TAB ══════════ */}
                        <TabsContent value="manual" className="mt-5 outline-none">
                            <div className="grid grid-cols-[1fr_300px] gap-5 items-start">

                                {/* ── LEFT: Main Form ── */}
                                <div className="space-y-4">

                                    {/* ── SECTION 1: Passport Identity ── */}
                                    <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/70 dark:border-slate-700/50 shadow-sm overflow-hidden">
                                        {/* Section header */}
                                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800/60"
                                            style={{ background: 'linear-gradient(135deg, #0B2447 0%, #19376D 100%)' }}>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
                                                    <Fingerprint className="w-4 h-4 text-white" strokeWidth={1.8} />
                                                </div>
                                                <div>
                                                    <p className="text-[13.5px] font-bold text-white leading-tight">Passport Identity</p>
                                                    <p className="text-[11px] text-white/55 mt-0.5">Extracted from scan or entered manually</p>
                                                </div>
                                            </div>
                                            {/* Completion meter */}
                                            <div className="flex items-center gap-2.5">
                                                <div className="text-right">
                                                    <p className="text-[11px] text-white/60 leading-none mb-1">Completeness</p>
                                                    <p className="text-[13px] font-bold text-white leading-none">{passportPct}%</p>
                                                </div>
                                                <div className="w-24 h-1.5 bg-white/20 rounded-full overflow-hidden">
                                                    <div className="h-full bg-white rounded-full transition-all duration-500"
                                                        style={{ width: `${passportPct}%` }} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-4 space-y-3">
                                            {/* Name row */}
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-1.5">Full Name</p>
                                                <div className="grid grid-cols-3 gap-2">
                                                    <Field label="Surname" id="surname" placeholder="e.g. DELA CRUZ"
                                                        value={form.surname} onChange={updateField} required error={errors.surname} icon={User} />
                                                    <Field label="First Name" id="firstName" placeholder="e.g. JUAN"
                                                        value={form.firstName} onChange={updateField} required error={errors.firstName} icon={User} />
                                                    <Field label="Middle Name" id="middleName" placeholder="e.g. SANTOS (opt.)"
                                                        value={form.middleName} onChange={updateField} icon={User} />
                                                </div>
                                            </div>

                                            {/* Passport details */}
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-1.5">Document Details</p>
                                                <div className="grid grid-cols-4 gap-2">
                                                    <Field label="Passport No." id="passportNumber" placeholder="A1234567"
                                                        value={form.passportNumber} onChange={updateField} required error={errors.passportNumber} icon={Hash} />
                                                    <DateField label="Date of Birth" id="dateOfBirth"
                                                        value={form.dateOfBirth} onChange={updateField} icon={CalendarDays} />
                                                    <DateField label="Date of Issue" id="dateOfIssue"
                                                        value={form.dateOfIssue} onChange={updateField} icon={CalendarDays} />
                                                    <DateField label="Date of Expiry" id="dateOfExpiry"
                                                        value={form.dateOfExpiry} onChange={updateField} icon={CalendarDays} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ── SECTION 2: Assignment Details ── */}
                                    <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/70 dark:border-slate-700/50 shadow-sm overflow-hidden">
                                        {/* Section header */}
                                        <div className="flex items-center justify-between px-5 py-2.5 border-b border-slate-100 dark:border-slate-800/60">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-500/15 flex items-center justify-center">
                                                    <CalendarClock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" strokeWidth={1.8} />
                                                </div>
                                                <div>
                                                    <p className="text-[13.5px] font-bold text-slate-800 dark:text-slate-100 leading-tight">Assignment Details</p>
                                                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Tour, embassy & booking information</p>
                                                </div>
                                            </div>
                                            {/* Progress + Group Mode toggle — same line */}
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-20 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                        <div className="h-full bg-indigo-400 rounded-full transition-all duration-500"
                                                            style={{ width: `${assignmentPct}%` }} />
                                                    </div>
                                                    <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">{assignmentPct}%</span>
                                                </div>
                                                {/* Group Mode */}
                                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${groupMode ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50'}`}
                                                    onClick={() => setGroupMode(g => !g)}>
                                                    <Layers className={`w-3.5 h-3.5 ${groupMode ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`} strokeWidth={2} />
                                                    <span className={`text-[12px] font-semibold select-none ${groupMode ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400'}`}>
                                                        Group Mode
                                                    </span>
                                                    <Switch checked={groupMode} onCheckedChange={setGroupMode}
                                                        className="data-[state=checked]:bg-indigo-500 scale-90"
                                                        onClick={e => e.stopPropagation()} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-4 space-y-3">
                                            {/* Group mode banner */}
                                            {groupMode && (
                                                <div className="flex items-center gap-2.5 bg-indigo-50 dark:bg-indigo-500/8 border border-indigo-200/70 dark:border-indigo-500/20 rounded-xl px-3 py-2">
                                                    <Layers className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 shrink-0" strokeWidth={2} />
                                                    <p className="text-[12px] text-indigo-700 dark:text-indigo-300">
                                                        <span className="font-bold">Group Mode ON — </span>
                                                        Passport info &amp; portal ref cleared after each save. Assignment details <span className="font-bold">retained</span>.
                                                    </p>
                                                </div>
                                            )}

                                            {/* Booking row */}
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-1.5">Booking</p>
                                                <div className="grid grid-cols-3 gap-2">
                                                    <Field label="Portal Ref No" id="portalRefNo" placeholder="e.g. REF-2026-001"
                                                        value={form.portalRefNo} onChange={updateField} icon={FileText} />
                                                    <Field label="Payment Status" id="payment" placeholder="PAID / PARTIAL / UNPAID"
                                                        value={form.payment} onChange={updateField} icon={CreditCard} />
                                                    <Field label="Agency" id="agency" placeholder="e.g. Ace Travel PH"
                                                        value={form.agency} onChange={updateField} icon={BriefcaseBusiness} />
                                                </div>
                                            </div>

                                            {/* Appointment row */}
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-1.5">Appointment & Travel</p>
                                                <div className="grid grid-cols-4 gap-2">
                                                    <DateField label="Appointment Date" id="appointmentDate"
                                                        value={form.appointmentDate} onChange={updateField} icon={Calendar} />
                                                    <TimeField label="Appointment Time" id="appointmentTime"
                                                        value={form.appointmentTime} onChange={updateField} icon={Clock} />
                                                    <Field label="Embassy" id="embassy" placeholder="e.g. Japan Embassy"
                                                        value={form.embassy} onChange={updateField} icon={Building2} />
                                                    <DateField label="Departure Date" id="departureDate"
                                                        value={form.departureDate} onChange={updateField} icon={Plane} />
                                                </div>
                                            </div>

                                            {/* Tour name */}
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-1.5">Tour</p>
                                                <Field label="Tour Name" id="tourName" placeholder="e.g. Japan Cherry Blossom 2026 — 10D/9N"
                                                    value={form.tourName} onChange={updateField} icon={MapPin} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* ── RIGHT: Summary Panel ── */}
                                <div className="space-y-3 sticky top-20">

                                    {/* Preview card */}
                                    <div className="rounded-2xl overflow-hidden border border-slate-200/70 dark:border-slate-700/50 shadow-sm">
                                        <div className="px-4 pt-4 pb-3"
                                            style={{ background: 'linear-gradient(150deg, #0B2447 0%, #19376D 60%, #1e3f7a 100%)' }}>
                                            <div className="flex items-center gap-2 mb-4">
                                                <Shield className="w-3.5 h-3.5 text-[#A5D7E8]/60" strokeWidth={2} />
                                                <p className="text-[10px] font-bold text-[#A5D7E8]/60 uppercase tracking-widest">Passenger Preview</p>
                                            </div>
                                            {form.surname || form.firstName ? (
                                                <>
                                                    <p className="text-[19px] font-bold text-white leading-tight tracking-tight">
                                                        {form.surname || '—'}{form.firstName ? `, ${form.firstName}` : ''}
                                                    </p>
                                                    {form.middleName && <p className="text-[12px] text-white/50 mt-0.5">{form.middleName}</p>}
                                                </>
                                            ) : (
                                                <p className="text-[15px] text-white/30 italic">No name entered yet</p>
                                            )}
                                            {form.passportNumber && (
                                                <div className="mt-3 inline-flex items-center gap-1.5 bg-white/10 border border-white/15 rounded-lg px-2.5 py-1">
                                                    <Hash className="w-3 h-3 text-[#A5D7E8]/70" strokeWidth={2} />
                                                    <span className="text-[12px] font-bold text-white/80 tracking-wider">{form.passportNumber}</span>
                                                </div>
                                            )}
                                        </div>
                                        {/* Detail rows */}
                                        <div className="bg-white dark:bg-slate-900/80 divide-y divide-slate-100 dark:divide-slate-800/60">
                                            {[
                                                { icon: CalendarDays, label: 'Date of Birth',   val: form.dateOfBirth   || '—' },
                                                { icon: CalendarDays, label: 'Expiry Date',      val: form.dateOfExpiry  || '—' },
                                                { icon: Building2,    label: 'Embassy',           val: form.embassy       || '—' },
                                                { icon: MapPin,       label: 'Tour',              val: form.tourName      || '—' },
                                                { icon: Plane,        label: 'Departure',         val: form.departureDate || '—' },
                                            ].map(({ icon: Ic, label, val }) => (
                                                <div key={label} className="flex items-center justify-between px-4 py-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <Ic className="w-3 h-3 text-slate-400 dark:text-slate-600" strokeWidth={2} />
                                                        <span className="text-[11.5px] text-slate-400 dark:text-slate-500">{label}</span>
                                                    </div>
                                                    <span className={`text-[12px] font-semibold max-w-32.5 truncate text-right ${val === '—' ? 'text-slate-300 dark:text-slate-700' : 'text-slate-700 dark:text-slate-200'}`}>{val}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="space-y-2">
                                        <Button onClick={handleSave} disabled={saving} className="w-full h-9 font-bold text-[13px] rounded-xl text-white shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                                            style={{ background: 'linear-gradient(135deg, #0B2447 0%, #19376D 60%, #576CBC 100%)' }}>
                                            {saving
                                                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" strokeWidth={2} />Saving…</>
                                                : <><CheckCircle2 className="w-4 h-4 mr-2" strokeWidth={2} />Save Record</>
                                            }
                                        </Button>
                                        <Button variant="ghost" onClick={() => { setForm(EMPTY_FORM); setErrors({}); }}
                                            className="w-full h-8 text-[12px] font-medium text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-xl cursor-pointer">
                                            <X className="w-3.5 h-3.5 mr-1.5" strokeWidth={2} />
                                            Clear all fields
                                        </Button>
                                    </div>

                                    {/* Field checklist */}
                                    <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/70 dark:border-slate-700/50 px-4 py-3 shadow-sm">
                                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-2">Required Fields</p>
                                        <div className="space-y-1.5">
                                            {[
                                                { key: 'surname',        label: 'Surname' },
                                                { key: 'firstName',      label: 'First Name' },
                                                { key: 'passportNumber', label: 'Passport No.' },
                                            ].map(({ key, label }) => (
                                                <div key={key} className="flex items-center gap-2">
                                                    <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-all ${form[key] ? 'bg-emerald-500' : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'}`}>
                                                        {form[key] && <CheckCircle2 className="w-3 h-3 text-white" strokeWidth={2.5} />}
                                                    </div>
                                                    <span className={`text-[12px] transition-colors ${form[key] ? 'text-slate-700 dark:text-slate-300 font-medium' : 'text-slate-400 dark:text-slate-600'}`}>{label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* ══════════ PENDING SCANS TAB ══════════ */}
                        <TabsContent value="pending" className="mt-5 outline-none">
                            <div className="flex items-center justify-between mb-5">
                                <div>
                                    <p className="text-[16px] font-bold text-slate-800 dark:text-slate-100">Pending Scans</p>
                                    <p className="text-[12.5px] text-slate-400 dark:text-slate-500 mt-0.5">
                                        {loadingScans ? 'Loading…' : `${pendingScans.length} scan${pendingScans.length !== 1 ? 's' : ''} awaiting assignment`}
                                    </p>
                                </div>
                                <Button variant="outline" size="sm" onClick={fetchPending} disabled={loadingScans}
                                    className="text-[12.5px] font-semibold border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer h-9 rounded-xl gap-1.5">
                                    <RefreshCw className={`w-3.5 h-3.5 ${loadingScans ? 'animate-spin' : ''}`} strokeWidth={2} />
                                    Refresh
                                </Button>
                            </div>

                            {loadingScans && (
                                <div className="space-y-3">
                                    {[1,2,3].map(i => (
                                        <div key={i} className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/70 dark:border-slate-700/50 p-5 flex items-center gap-4">
                                            <Skeleton className="w-12 h-12 rounded-xl shrink-0 bg-slate-100 dark:bg-slate-800" />
                                            <div className="flex-1 space-y-2">
                                                <Skeleton className="h-4 w-48 bg-slate-100 dark:bg-slate-800" />
                                                <Skeleton className="h-3 w-32 bg-slate-100 dark:bg-slate-800" />
                                            </div>
                                            <div className="flex gap-2">
                                                <Skeleton className="h-9 w-20 rounded-xl bg-slate-100 dark:bg-slate-800" />
                                                <Skeleton className="h-9 w-24 rounded-xl bg-slate-100 dark:bg-slate-800" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {!loadingScans && pendingScans.length === 0 && (
                                <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/70 dark:border-slate-700/50 shadow-sm">
                                    <div className="py-24 flex flex-col items-center text-center gap-4">
                                        <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/50 flex items-center justify-center">
                                            <Inbox className="w-7 h-7 text-slate-300 dark:text-slate-600" strokeWidth={1.3} />
                                        </div>
                                        <div>
                                            <p className="text-[16px] font-bold text-slate-800 dark:text-slate-100">No Pending Scans</p>
                                            <p className="text-[13px] text-slate-400 dark:text-slate-500 mt-1.5 max-w-xs">Passport scans from mobile will appear here. Hit Refresh to check.</p>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={fetchPending}
                                            className="text-[12.5px] border-slate-200 dark:border-slate-700 cursor-pointer rounded-xl gap-1.5">
                                            <RefreshCw className="w-3.5 h-3.5" strokeWidth={2} /> Refresh Now
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {!loadingScans && pendingScans.length > 0 && (
                                <div className="space-y-2.5">
                                    {pendingScans.map((scan, idx) => {
                                        const badge = expiryBadge(scan.dateOfExpiry);
                                        return (
                                            <div key={scan.scanId}
                                                className="group bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/70 dark:border-slate-700/50 shadow-sm hover:border-[#19376D]/40 dark:hover:border-[#576CBC]/40 hover:shadow-md transition-all duration-200 overflow-hidden">
                                                <div className="flex items-center gap-5 p-5">
                                                    {/* Index + avatar */}
                                                    <div className="relative shrink-0">
                                                        <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                                                            style={{ background: 'linear-gradient(135deg, #0B2447, #19376D)' }}>
                                                            <UserCheck className="w-5.5 h-5.5 text-white" strokeWidth={1.8} />
                                                        </div>
                                                        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-black text-slate-500 dark:text-slate-400 flex items-center justify-center">
                                                            {idx + 1}
                                                        </span>
                                                    </div>

                                                    {/* Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2.5 flex-wrap mb-1">
                                                            <p className="text-[15px] font-bold text-slate-800 dark:text-slate-100 leading-tight">
                                                                {scan.surname}{scan.firstName ? `, ${scan.firstName}` : ''}{scan.middleName ? ` ${scan.middleName}` : ''}
                                                            </p>
                                                            {badge && (
                                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-4 flex-wrap">
                                                            <span className="flex items-center gap-1 text-[12px] font-semibold text-slate-500 dark:text-slate-400">
                                                                <Hash className="w-3 h-3" strokeWidth={2} />{scan.passportNumber || '—'}
                                                            </span>
                                                            {scan.dateOfExpiry && (
                                                                <span className="flex items-center gap-1 text-[12px] text-slate-400 dark:text-slate-500">
                                                                    <CalendarDays className="w-3 h-3" strokeWidth={2} />Exp. {scan.dateOfExpiry}
                                                                </span>
                                                            )}
                                                            {scan.dateOfBirth && (
                                                                <span className="flex items-center gap-1 text-[12px] text-slate-400 dark:text-slate-500">
                                                                    <User className="w-3 h-3" strokeWidth={2} />DOB {scan.dateOfBirth}
                                                                </span>
                                                            )}
                                                            <span className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-600">
                                                                <Clock className="w-3 h-3" strokeWidth={2} />
                                                                {new Date(scan.scannedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <Button variant="ghost" size="sm"
                                                            onClick={() => handleDismiss(scan.scanId, `${scan.firstName} ${scan.surname}`)}
                                                            className="text-[12px] font-medium text-slate-400 dark:text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 cursor-pointer h-9 px-3 rounded-xl gap-1.5 transition-colors">
                                                            <XCircle className="w-3.5 h-3.5" strokeWidth={2} />Dismiss
                                                        </Button>
                                                        <Button size="sm" onClick={() => openImport(scan)}
                                                            className="text-[12.5px] font-bold cursor-pointer h-9 px-5 rounded-xl text-white shadow-sm hover:shadow-md transition-all gap-1.5"
                                                            style={{ background: 'linear-gradient(135deg, #0B2447, #19376D)' }}>
                                                            Import <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* ══════════ IMPORT SHEET ══════════ */}
            <Sheet open={importOpen} onOpenChange={setImportOpen}>
                <SheetContent side="right"
                    className="w-full sm:max-w-130 bg-white dark:bg-[#0a1628] border-l border-slate-200/70 dark:border-slate-800/60 flex flex-col p-0 gap-0">

                    <div className="h-1 w-full shrink-0" style={{ background: 'linear-gradient(90deg, #0B2447, #19376D, #576CBC)' }} />

                    <SheetHeader className="px-6 pt-6 pb-5 shrink-0 border-b border-slate-100 dark:border-slate-800/60">
                        <SheetTitle className="text-[18px] font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                                style={{ background: 'linear-gradient(135deg, #0B2447, #19376D)' }}>
                                <CheckCircle2 className="w-4 h-4 text-white" strokeWidth={2} />
                            </div>
                            Complete & Import
                        </SheetTitle>
                        <SheetDescription className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">
                            Add assignment details to save this passport scan to records.
                        </SheetDescription>
                    </SheetHeader>

                    {activeImport && (
                        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                            {/* Passport preview */}
                            <div className="rounded-2xl overflow-hidden"
                                style={{ background: 'linear-gradient(150deg, #0B2447 0%, #19376D 100%)' }}>
                                <div className="px-5 pt-5 pb-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Fingerprint className="w-3.5 h-3.5 text-[#A5D7E8]/60" strokeWidth={2} />
                                        <p className="text-[10px] font-bold text-[#A5D7E8]/60 uppercase tracking-widest">Scanned Passport</p>
                                    </div>
                                    <p className="text-[19px] font-bold text-white leading-tight">
                                        {activeImport.surname}, {activeImport.firstName}
                                        {activeImport.middleName ? ` ${activeImport.middleName}` : ''}
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-px bg-white/10">
                                    {[
                                        ['Passport No.', activeImport.passportNumber],
                                        ['Date of Birth', activeImport.dateOfBirth],
                                        ['Date of Issue', activeImport.dateOfIssue],
                                        ['Date of Expiry', activeImport.dateOfExpiry],
                                    ].filter(([, v]) => v).map(([k, v]) => (
                                        <div key={k} className="bg-white/5 px-4 py-3">
                                            <p className="text-[10px] text-[#A5D7E8]/45 uppercase tracking-wide mb-1">{k}</p>
                                            <p className="text-[13px] font-semibold text-white">{v}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Assignment fields */}
                            <div className="space-y-3.5">
                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">Assignment Details</p>
                                <Field label="Portal Ref No" id="portalRefNo" placeholder="e.g. REF-2026-001"
                                    value={assignForm.portalRefNo} onChange={updateAssign} required error={assignErrors.portalRefNo} icon={FileText} />
                                <Field label="Payment Status" id="payment" placeholder="PAID / PARTIAL / UNPAID"
                                    value={assignForm.payment} onChange={updateAssign} icon={CreditCard} />
                                <Field label="Agency" id="agency" placeholder="e.g. Ace Travel PH"
                                    value={assignForm.agency} onChange={updateAssign} icon={BriefcaseBusiness} />
                                <div className="grid grid-cols-2 gap-3">
                                    <Field label="Appt. Date" id="appointmentDate" type="date"
                                        value={assignForm.appointmentDate} onChange={updateAssign} icon={Calendar} />
                                    <Field label="Appt. Time" id="appointmentTime" type="time"
                                        value={assignForm.appointmentTime} onChange={updateAssign} icon={Clock} />
                                </div>
                                <Field label="Embassy" id="embassy" placeholder="e.g. Japan Embassy - Manila"
                                    value={assignForm.embassy} onChange={updateAssign} icon={Building2} />
                                <Field label="Departure Date" id="departureDate" type="date"
                                    value={assignForm.departureDate} onChange={updateAssign} icon={Plane} />
                                <Field label="Tour Name" id="tourName" placeholder="e.g. Japan Cherry Blossom 2026"
                                    value={assignForm.tourName} onChange={updateAssign} icon={MapPin} />
                            </div>
                        </div>
                    )}

                    <SheetFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800/60 shrink-0 flex gap-2.5">
                        <Button variant="outline" onClick={() => setImportOpen(false)}
                            className="flex-1 text-[13px] font-semibold border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer h-10 rounded-xl">
                            Cancel
                        </Button>
                        <Button onClick={handleImport} disabled={importing}
                            className="flex-1 text-[13.5px] font-bold cursor-pointer h-10 rounded-xl text-white shadow-lg"
                            style={{ background: 'linear-gradient(135deg, #0B2447, #19376D)' }}>
                            {importing
                                ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" strokeWidth={2} />Saving…</>
                                : <><CheckCircle2 className="w-4 h-4 mr-1.5" strokeWidth={2} />Save & Import</>
                            }
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    );
};

export default SmartScan;