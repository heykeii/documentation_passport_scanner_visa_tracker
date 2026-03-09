import React, { useEffect, useState, useMemo, useCallback } from 'react';
import axios from 'axios';
import {
    Users, Search, RefreshCw, Pencil, Trash2, X,
    ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
    AlertCircle, Loader2, User, Hash, Calendar, CalendarDays,
    Building2, MapPin, CreditCard, Plane, FileText,
    BriefcaseBusiness, Clock, TriangleAlert, ShieldCheck,
    ArrowUpDown, ChevronDown, ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

/* ─── Constants ─── */
const API = 'http://localhost:3000/api';
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('authToken')}` });
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

/* ─── Helpers ─── */
// Format Excel time fraction or HH:MM string to "h:MM AM/PM"
const fmtTime = (t) => {
    if (!t) return '';
    const str = String(t).trim();
    // Handle decimal fraction stored from old imports
    const frac = parseFloat(str);
    let hh, mm;
    if (!isNaN(frac) && frac >= 0 && frac < 1) {
        const totalMinutes = Math.round(frac * 24 * 60);
        hh = Math.floor(totalMinutes / 60) % 24;
        mm = totalMinutes % 60;
    } else {
        const match = str.match(/^(\d{1,2}):(\d{2})/);
        if (!match) return str;
        hh = parseInt(match[1], 10);
        mm = parseInt(match[2], 10);
    }
    const period = hh < 12 ? 'AM' : 'PM';
    const h12 = hh % 12 || 12;
    return `${h12}:${String(mm).padStart(2, '0')} ${period}`;
};

const MONTH_NAMES = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];

const resolveMonthlyDate = (rec) => {
    const created = rec.createdAt ? new Date(rec.createdAt) : null;
    const createdValid = created && !isNaN(created) ? created : null;

    const migrationMonth = Number.isInteger(rec.migrationMonth)
        ? rec.migrationMonth
        : parseInt(rec.migrationMonth, 10);
    const migrationYear = Number.isInteger(rec.migrationYear)
        ? rec.migrationYear
        : parseInt(rec.migrationYear, 10);
    const hasMigrationDate =
        !isNaN(migrationMonth) && migrationMonth >= 0 && migrationMonth <= 11 &&
        !isNaN(migrationYear) && migrationYear >= 1900 && migrationYear <= 2200;

    const appt = rec.appointmentDate ? String(rec.appointmentDate).trim() : '';
    if (!appt) {
        if (hasMigrationDate) return new Date(migrationYear, migrationMonth, 1);
        if (rec.entryMode === 'migration') return null;
        return createdValid;
    }

    // Handle DD/MM/YYYY format
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(appt)) {
        const [dd, mm, yyyy] = appt.split('/');
        return new Date(parseInt(yyyy, 10), parseInt(mm, 10) - 1, parseInt(dd, 10));
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(appt)) return new Date(appt);

    const partial = appt.match(/^(\d{1,2})\s+([A-Za-z]{3})$/);
    if (partial) {
        const m = MONTH_NAMES.indexOf(partial[2].toLowerCase());
        if (m >= 0) {
            if (hasMigrationDate) return new Date(migrationYear, m, parseInt(partial[1], 10));
            if (rec.entryMode !== 'migration' && createdValid) return new Date(createdValid.getFullYear(), m, parseInt(partial[1], 10));
        }
    }

    if (hasMigrationDate) return new Date(migrationYear, migrationMonth, 1);
    if (rec.entryMode === 'migration') return null;
    return createdValid;
};

const fmt = (d) => {
    if (!d) return '—';
    const str = String(d).trim();
    
    // DD/MM/YYYY (1 or 2 digit day/month) — ALWAYS treat first number as day
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
        const [dd, mm, yyyy] = str.split('/');
        const date = new Date(parseInt(yyyy, 10), parseInt(mm, 10) - 1, parseInt(dd, 10));
        if (!isNaN(date.getTime())) {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
    }
    
    // If in ISO format YYYY-MM-DD, convert to Date object
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
        const date = new Date(str);
        if (!isNaN(date.getTime())) {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
    }
    
    // Return raw string as-is — do NOT use new Date(str) as a fallback;
    // it parses slash dates as MM/DD which would corrupt DD/MM/YYYY values.
    return str || '—';
};

const getExpiryStatus = (expiryDate) => {
    if (!expiryDate) return 'none';
    // Parse DD/MM/YYYY (1 or 2 digit day/month) — same strict treatment as fmt()
    const m = String(expiryDate).trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    let d;
    if (m) {
        d = new Date(parseInt(m[3], 10), parseInt(m[2], 10) - 1, parseInt(m[1], 10));
    } else {
        // ISO YYYY-MM-DD is safe for new Date()
        d = new Date(expiryDate);
    }
    if (isNaN(d.getTime())) return 'none';
    const diff = Math.ceil((d - new Date()) / 86400000);
    if (diff < 0) return 'expired';
    if (diff <= 90) return 'expiring';
    return 'valid';
};

const paymentColor = (p) => {
    const v = (p || '').toLowerCase();
    if (v === 'paid') return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
    if (v.includes('partial')) return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
    if (v === 'unpaid') return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20';
    return 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
};

// Convert DD/MM/YYYY to YYYY-MM-DD for date input fields
const toInputDate = (d) => {
    if (!d) return '';
    const str = String(d).trim();
    // Already in YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    // Convert from DD/MM/YYYY (1 or 2 digit day/month) to YYYY-MM-DD
    const m = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) {
        const dd = m[1].padStart(2, '0');
        const mm = m[2].padStart(2, '0');
        return `${m[3]}-${mm}-${dd}`;
    }
    return str;
};

// Convert YYYY-MM-DD to DD/MM/YYYY for submission
const toDisplayDate = (d) => {
    if (!d) return '';
    const str = String(d).trim();
    // Already in DD/MM/YYYY format (1 or 2 digit day/month)
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) return str;
    // Convert from YYYY-MM-DD to DD/MM/YYYY
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
        const [yyyy, mm, dd] = str.split('-');
        return `${dd}/${mm}/${yyyy}`;
    }
    return str;
};

/* ─── Expiry Badge ─── */
const ExpiryBadge = ({ date }) => {
    const status = getExpiryStatus(date);
    const configs = {
        valid:    { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20', label: fmt(date) },
        expiring: { cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20', label: fmt(date) },
        expired:  { cls: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20', label: fmt(date) },
        none:     { cls: 'bg-slate-50 text-slate-400 border-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700', label: '—' },
    };
    const c = configs[status];
    return (
        <span className={`inline-flex items-center gap-1 text-[11.5px] font-semibold px-2 py-0.5 rounded-md border ${c.cls}`}>
            {status === 'expiring' && <TriangleAlert className="w-3 h-3" strokeWidth={2} />}
            {status === 'expired'  && <X className="w-3 h-3" strokeWidth={2.5} />}
            {status === 'valid'    && <ShieldCheck className="w-3 h-3" strokeWidth={2} />}
            {c.label}
        </span>
    );
};

/* ─── Edit Sheet Field ─── */
const EField = ({ label, id, placeholder, value, onChange, type = 'text', icon: Icon, required, error }) => (
    <div className="flex flex-col gap-1.5">
        <Label htmlFor={`edit-${id}`} className="flex items-center gap-1.5 text-[11px] font-semibold tracking-widest uppercase text-slate-600 dark:text-slate-300 select-none">
            {Icon && <Icon className="w-3 h-3" strokeWidth={2} />}{label}
            {required && <span className="text-rose-400 font-bold">*</span>}
        </Label>
        <Input
            id={`edit-${id}`} type={type} placeholder={placeholder}
            value={value || ''} onChange={e => onChange(id, e.target.value)}
            className={`h-8 text-[13px] font-medium rounded-lg bg-white dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-600 focus-visible:ring-2 transition-colors ${
                error
                    ? 'border-rose-400 focus-visible:ring-rose-300/30 focus-visible:border-rose-400'
                    : 'border-slate-200 dark:border-slate-700/60 focus-visible:ring-[#19376D]/20 dark:focus-visible:ring-[#576CBC]/30 focus-visible:border-[#19376D]/50 dark:focus-visible:border-[#576CBC]/60'
            }`}
        />
        {error && (
            <p className="flex items-center gap-1 text-[11px] text-rose-500 font-medium">
                <AlertCircle className="w-3 h-3 shrink-0" strokeWidth={2} />{error}
            </p>
        )}
    </div>
);

/* ─── Sortable Column Header ─── */
const SortHeader = ({ label, field, sortBy, sortDir, onSort }) => (
    <button
        className="flex items-center gap-1 text-[12px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-[#19376D] dark:hover:text-[#A5D7E8] transition-colors select-none"
        onClick={() => onSort(field)}
    >
        {label}
        {sortBy === field
            ? sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
            : <ArrowUpDown className="w-3 h-3 opacity-40" />}
    </button>
);

/* ══════════════════════════════════════════════════════
        MAIN COMPONENT
   ══════════════════════════════════════════════════════ */
const PassengerRecords = () => {
    const [records, setRecords]     = useState([]);
    const [loading, setLoading]     = useState(true);
    const [refreshing, setRefresh]  = useState(false);

    // Search & filter
    const [query, setQuery]         = useState('');
    const [statusFilter, setStatus] = useState('all');
    const [payFilter, setPay]       = useState('all');
    const [monthFilter, setMonth]   = useState('all');
    const [yearFilter, setYear]     = useState('all');


    // Sort
    const [sortBy, setSortBy]       = useState('createdAt');
    const [sortDir, setSortDir]     = useState('desc');

    // Pagination
    const [page, setPage]           = useState(1);
    const [pageSize, setPageSize]   = useState(100);

    // Edit
    const [editOpen, setEditOpen]   = useState(false);
    const [editRec, setEditRec]     = useState(null);
    const [editForm, setEditForm]   = useState({});
    const [editErrors, setEditErrors] = useState({});
    const [saving, setSaving]       = useState(false);

    // Delete
    const [delOpen, setDelOpen]     = useState(false);
    const [delTarget, setDelTarget] = useState(null);
    const [deleting, setDeleting]   = useState(false);

    /* ─── Fetch all records ─── */
    const fetchRecords = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        else setRefresh(true);
        try {
            const { data } = await axios.get(`${API}/passports`, { headers: authHeaders() });
            setRecords(data.data || []);
        } catch {
            toast.error('Failed to load records.');
        } finally {
            setLoading(false);
            setRefresh(false);
        }
    }, []);

    useEffect(() => { fetchRecords(); }, [fetchRecords]);


    const apptYears = useMemo(()=>[...new Set(records.map(r => resolveMonthlyDate(r)?.getFullYear()).filter(Boolean))].sort(), [records]);

    /* ─── Filter + Sort + Search ─── */
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        let result = [...records];

        if (q) {
            result = result.filter(r =>
                (r.surname        || '').toLowerCase().includes(q) ||
                (r.firstName      || '').toLowerCase().includes(q) ||
                (r.passportNumber || '').toLowerCase().includes(q) ||
                (r.tourName       || '').toLowerCase().includes(q) ||
                (r.embassy        || '').toLowerCase().includes(q) ||
                (r.agency         || '').toLowerCase().includes(q) ||
                (r.portalRefNo    || '').toLowerCase().includes(q) 
            );
        }

        if (statusFilter !== 'all') {
            result = result.filter(r => getExpiryStatus(r.dateOfExpiry) === statusFilter);
        }

        if (payFilter !== 'all') {
            result = result.filter(r => (r.payment || '').toLowerCase() === payFilter);
        }

        if (monthFilter !== 'all' || yearFilter !== 'all') {
            result = result.filter(r => {
                const d = resolveMonthlyDate(r);
                if (!d || isNaN(d)) return false;
                const monthOk = monthFilter === 'all' || d.getMonth() === parseInt(monthFilter, 10);
                const yearOk = yearFilter === 'all' || d.getFullYear() === parseInt(yearFilter, 10)
                return monthOk && yearOk;
            })
        }

        result.sort((a, b) => {
            const av = a[sortBy] || '';
            const bv = b[sortBy] || '';
            const cmp = av.localeCompare(bv, undefined, { sensitivity: 'base' });
            return sortDir === 'asc' ? cmp : -cmp;
        });

        return result;
    }, [records, query, statusFilter, payFilter, sortBy, sortDir, monthFilter, yearFilter]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const paginated  = filtered.slice((page - 1) * pageSize, page * pageSize);

    const handleSort = (field) => {
        if (sortBy === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortBy(field); setSortDir('asc'); }
        setPage(1);
    };

    useEffect(() => { setPage(1); }, [query, statusFilter, payFilter, pageSize, monthFilter, yearFilter]);

    /* ─── Edit handlers ─── */
    const openEdit = (rec) => {
        setEditRec(rec);
        // Convert dates from DD/MM/YYYY to YYYY-MM-DD for date input fields
        const dateFields = ['dateOfBirth', 'dateOfIssue', 'dateOfExpiry', 'appointmentDate', 'departureDate'];
        const formData = { ...rec, payment: (rec.payment || 'unpaid').toLowerCase().trim() };
        dateFields.forEach(field => {
            if (formData[field]) formData[field] = toInputDate(formData[field]);
        });
        setEditForm(formData);
        setEditErrors({});
        setEditOpen(true);
    };
    const updateEditForm = (id, val) => {
        setEditForm(f => ({ ...f, [id]: val }));
        setEditErrors(e => ({ ...e, [id]: '' }));
    };

    const validateEditForm = () => {
        const errs = {};
        // Required fields
        if (!editForm.surname?.trim())        errs.surname        = 'Required';
        if (!editForm.firstName?.trim())      errs.firstName      = 'Required';
        if (!editForm.passportNumber?.trim()) errs.passportNumber = 'Required';
        if (!editForm.portalRefNo?.trim())    errs.portalRefNo    = 'Required';

        // Date of Issue must be before Date of Expiry
        if (editForm.dateOfIssue && editForm.dateOfExpiry) {
            if (new Date(editForm.dateOfIssue) >= new Date(editForm.dateOfExpiry)) {
                errs.dateOfIssue  = 'Must be before expiry date';
                errs.dateOfExpiry = 'Must be after issue date';
            }
        }

        // Date of Birth must be before Date of Issue
        if (editForm.dateOfBirth && editForm.dateOfIssue) {
            if (new Date(editForm.dateOfBirth) >= new Date(editForm.dateOfIssue)) {
                errs.dateOfBirth = 'Must be before date of issue';
                errs.dateOfIssue = errs.dateOfIssue || 'Must be after date of birth';
            }
        }

        // Appointment Date must be before Departure Date
        if (editForm.appointmentDate && editForm.departureDate) {
            if (new Date(editForm.appointmentDate) >= new Date(editForm.departureDate)) {
                errs.appointmentDate = 'Must be before departure date';
                errs.departureDate   = 'Must be after appointment date';
            }
        }

        return errs;
    };

    const handleSave = async () => {
        const errs = validateEditForm();
        if (Object.keys(errs).length > 0) {
            setEditErrors(errs);
            const firstMsg = Object.values(errs)[0];
            const firstField = Object.keys(errs)[0];
            const labels = {
                surname: 'Surname', firstName: 'First Name', passportNumber: 'Passport No.',
                portalRefNo: 'Portal Ref No', dateOfIssue: 'Date of Issue',
                dateOfExpiry: 'Date of Expiry', dateOfBirth: 'Date of Birth',
                appointmentDate: 'Appointment Date', departureDate: 'Departure Date',
            };
            toast.error(`${labels[firstField] || firstField}: ${firstMsg}`);
            return;
        }
        setSaving(true);
        try {
            // Convert dates from YYYY-MM-DD back to DD/MM/YYYY for submission
            const dateFields = ['dateOfBirth', 'dateOfIssue', 'dateOfExpiry', 'appointmentDate', 'departureDate'];
            const dataToSubmit = { ...editForm };
            dateFields.forEach(field => {
                if (dataToSubmit[field]) dataToSubmit[field] = toDisplayDate(dataToSubmit[field]);
            });
            const { data } = await axios.put(
                `${API}/passports/${editRec.passportId}`,
                dataToSubmit,
                { headers: authHeaders() }
            );
            setRecords(prev => prev.map(r => r.passportId === editRec.passportId ? data.data : r));
            toast.success('Record updated successfully.');
            setEditOpen(false);
        } catch {
            toast.error('Failed to update record.');
        } finally {
            setSaving(false);
        }
    };

    /* ─── Delete handlers ─── */
    const openDelete = (rec) => { setDelTarget(rec); setDelOpen(true); };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await axios.delete(`${API}/passports/${delTarget.passportId}`, { headers: authHeaders() });
            setRecords(prev => prev.filter(r => r.passportId !== delTarget.passportId));
            toast.success('Record deleted.');
            setDelOpen(false);
        } catch {
            toast.error('Failed to delete record.');
        } finally {
            setDeleting(false);
        }
    };

    /* ─── Stat counts ─── */
    const stats = useMemo(() => ({
        total:    records.length,
        valid:    records.filter(r => getExpiryStatus(r.dateOfExpiry) === 'valid').length,
        expiring: records.filter(r => getExpiryStatus(r.dateOfExpiry) === 'expiring').length,
        expired:  records.filter(r => getExpiryStatus(r.dateOfExpiry) === 'expired').length,
    }), [records]);

    /* ══════════════════════════════════════════════════════
            RENDER
       ══════════════════════════════════════════════════════ */
    return (
        <div className="flex flex-col gap-5 font-[Outfit] pb-6">

            {/* ── Page Header ── */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: 'linear-gradient(135deg, #0B2447, #19376D)' }}>
                        <Users className="w-5 h-5 text-white" strokeWidth={1.8} />
                    </div>
                    <div>
                        <h1 className="text-[20px] font-bold text-[#0B2447] dark:text-white leading-tight">
                            Passenger Records
                        </h1>
                        <p className="text-[13px] text-slate-500 dark:text-[#A5D7E8]/60 mt-0.5">
                            {loading
                                ? 'Loading records…'
                                : `${records.length} total record${records.length !== 1 ? 's' : ''} in the system`}
                        </p>
                    </div>
                </div>
                <Button
                    variant="outline" size="sm"
                    onClick={() => fetchRecords(true)}
                    disabled={refreshing || loading}
                    className="flex items-center gap-2 h-9 text-[13px] border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-[Outfit]"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} strokeWidth={2} />
                    Refresh
                </Button>
            </div>

            {/* ── Stat Chips ── */}
            <div className="grid grid-cols-4 gap-3">
                {[
                    { label: 'Total Records', value: stats.total,    chipCls: 'bg-[#0B2447]/8 dark:bg-[#19376D]/20 text-[#0B2447] dark:text-[#A5D7E8] border-[#19376D]/15 dark:border-[#576CBC]/25', dot: 'bg-[#19376D]' },
                    { label: 'Valid',          value: stats.valid,    chipCls: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200/70 dark:border-emerald-500/20', dot: 'bg-emerald-500' },
                    { label: 'Expiring Soon', value: stats.expiring, chipCls: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200/70 dark:border-amber-500/20', dot: 'bg-amber-400' },
                    { label: 'Expired',        value: stats.expired,  chipCls: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200/70 dark:border-rose-500/20', dot: 'bg-rose-500' },
                ].map(s => (
                    <div key={s.label} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${s.chipCls}`}>
                        <span className={`w-2 h-2 rounded-full shrink-0 ${s.dot}`} />
                        <div>
                            {loading
                                ? <Skeleton className="h-5 w-8 mb-1 bg-current/10" />
                                : <p className="text-[20px] font-bold leading-none">{s.value}</p>}
                            <p className="text-[11.5px] font-medium opacity-80 mt-0.5">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Toolbar ── */}
            <div className="bg-white dark:bg-[#0d1b35] border border-slate-200 dark:border-[#576CBC]/20 rounded-2xl shadow-sm px-4 py-3.5">
                <div className="flex flex-wrap items-center gap-3">

                    {/* Search input */}
                    <div className="relative flex-1 min-w-55">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500 pointer-events-none" strokeWidth={2} />
                        <Input
                            placeholder="Search by name, passport no., tour, embassy…"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            className="pl-8 h-8 text-[13px] font-medium bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 rounded-lg focus-visible:ring-2 focus-visible:ring-[#19376D]/20 dark:focus-visible:ring-[#576CBC]/30 focus-visible:border-[#19376D]/50 dark:focus-visible:border-[#576CBC]/60 font-[Outfit]"
                        />
                        {query && (
                            <button onClick={() => setQuery('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Expiry status filter */}
                    <Select value={statusFilter} onValueChange={setStatus}>
                        <SelectTrigger className="w-37.5 h-8 text-[13px] font-medium font-[Outfit] bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 rounded-lg focus:ring-2 focus:ring-[#19376D]/20">
                            <SelectValue placeholder="Expiry Status" />
                        </SelectTrigger>
                        <SelectContent className="font-[Outfit]">
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="valid">Valid</SelectItem>
                            <SelectItem value="expiring">Expiring Soon</SelectItem>
                            <SelectItem value="expired">Expired</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Payment filter */}
                    <Select value={payFilter} onValueChange={setPay}>
                        <SelectTrigger className="w-35 h-8 text-[13px] font-medium font-[Outfit] bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 rounded-lg focus:ring-2 focus:ring-[#19376D]/20">
                            <SelectValue placeholder="Payment" />
                        </SelectTrigger>
                        <SelectContent className="font-[Outfit]">
                            <SelectItem value="all">All Payments</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="partial">Partial</SelectItem>
                            <SelectItem value="unpaid">Unpaid</SelectItem>
                        </SelectContent>
                    </Select>

                    {/** Month Filter */}
                    <Select value={monthFilter} onValueChange={setMonth}>
                        <SelectTrigger className='w-32 h-8 text-[13px] font-medium font-[Outfit] bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 rounded-lg focus:ring-2 focus:ring-[#19376D]/20'>
                            <SelectValue placeholder="Month" />
                        </SelectTrigger>

                        <SelectContent className='font-[Outfit]'>
                            <SelectItem value="all">All Months</SelectItem>
                            {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
                                <SelectItem key={i} value={String(i)}>{m}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/**Year Filter */}
                    <Select value={yearFilter} onValueChange={setYear}>
                        <SelectTrigger className='w-28 h-8 text-[13px] font-medium font-[Outfit] bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 rounded-lg focus:ring-2 focus:ring-[#19376D]/20'>
                                <SelectValue placeholder="Year"/>
                        </SelectTrigger>
                        <SelectContent className='font-[Outfit]'>
                            <SelectItem value="all">All Years</SelectItem>
                            {
                                apptYears.map(y => (
                                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                                ))
                            }
                        </SelectContent>
                    </Select>

                    {/* Clear filters */}
                    {(statusFilter !== 'all' || payFilter !== 'all' || monthFilter!== 'all' || yearFilter !== 'all' || query) && (
                        <button
                            onClick={() => { setQuery(''); setStatus('all'); setPay('all'); setMonth('all'); setYear('all'); }}
                            className="flex items-center gap-1 text-[12px] font-semibold text-rose-500 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 transition-colors"
                        >
                            <X className="w-3 h-3" /> Clear filters
                        </button>
                    )}

                    {/* Page size */}
                    <div className="ml-auto flex items-center gap-2 shrink-0">
                        <span className="text-[12px] text-slate-400 dark:text-slate-500 font-medium">Show</span>
                        <Select value={String(pageSize)} onValueChange={v => setPageSize(Number(v))}>
                            <SelectTrigger className="w-17 h-8 text-[13px] font-medium font-[Outfit] bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 rounded-lg focus:ring-2 focus:ring-[#19376D]/20">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="font-[Outfit]">
                                {PAGE_SIZE_OPTIONS.map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Results summary */}
                {!loading && (
                    <p className="text-[11.5px] text-slate-400 dark:text-slate-500 font-medium mt-2.5">
                        Showing{' '}
                        <span className="font-semibold text-slate-600 dark:text-slate-300">
                            {filtered.length === 0 ? 0 : (page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)}
                        </span>{' '}
                        of{' '}
                        <span className="font-semibold text-slate-600 dark:text-slate-300">{filtered.length}</span>{' '}
                        result{filtered.length !== 1 ? 's' : ''}
                        {query && <> for "<span className="font-semibold text-[#19376D] dark:text-[#A5D7E8]">{query}</span>"</>}
                    </p>
                )}
            </div>

            {/* ── Table ── */}
            <div className="bg-white dark:bg-[#0d1b35] border border-slate-200 dark:border-[#576CBC]/20 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-slate-300 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/40 hover:bg-slate-50/80 dark:hover:bg-slate-900/40">
                                <TableHead className="w-10 text-center text-[12px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 pl-5">#</TableHead>
                                <TableHead className="min-w-42.5">
                                    <SortHeader label="Passenger"    field="surname"         sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                                </TableHead>
                                <TableHead className="min-w-30">
                                    <SortHeader label="Passport No." field="passportNumber"   sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                                </TableHead>
                                <TableHead className="min-w-28.75">
                                    <SortHeader label="Date of Birth" field="dateOfBirth"     sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                                </TableHead>
                                <TableHead className="min-w-28.75">
                                    <SortHeader label="Date of Issue" field="dateOfIssue"     sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                                </TableHead>
                                <TableHead className="min-w-32.5">
                                    <SortHeader label="Expiry Date"  field="dateOfExpiry"     sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                                </TableHead>
                                <TableHead className="min-w-35">
                                    <SortHeader label="Embassy"      field="embassy"          sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                                </TableHead>
                                <TableHead className="min-w-32.5">
                                    <SortHeader label="Agency"       field="agency"           sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                                </TableHead>
                                <TableHead className="min-w-42.5">
                                    <SortHeader label="Tour"         field="tourName"         sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                                </TableHead>
                                <TableHead className="min-w-32.5">
                                    <SortHeader label="Appointment"  field="appointmentDate"  sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                                </TableHead>
                                <TableHead className="min-w-28.75">
                                    <SortHeader label="Departure"    field="departureDate"    sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                                </TableHead>
                                <TableHead className="min-w-26.25">
                                    <SortHeader label="Payment"      field="payment"          sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                                </TableHead>
                                <TableHead className="text-right pr-5 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {/* Loading state */}
                            {loading ? (
                                Array.from({ length: 7 }).map((_, i) => (
                                    <TableRow key={i} className="border-slate-300 dark:border-slate-700/80">
                                        <TableCell colSpan={13} className="py-2.5 px-5">
                                            <Skeleton className="h-7 w-full rounded-lg bg-slate-100 dark:bg-slate-800/60" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : paginated.length === 0 ? (
                                /* Empty state */
                                <TableRow>
                                    <TableCell colSpan={13}>
                                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                                <Users className="w-6 h-6 text-slate-300 dark:text-slate-600" strokeWidth={1.5} />
                                            </div>
                                            <p className="text-[14px] font-semibold text-slate-500 dark:text-slate-400">
                                                {query || statusFilter !== 'all' || payFilter !== 'all' || monthFilter !== 'all' || yearFilter !== 'all'
                                                    ? 'No records match your filters'
                                                    : 'No records yet'}
                                            </p>
                                            <p className="text-[12px] text-slate-400 dark:text-slate-500">
                                                {query || statusFilter !== 'all' || payFilter !== 'all' || monthFilter !== 'all' || yearFilter !== 'all'
                                                    ? 'Try adjusting your search or filters'
                                                    : 'Records saved from Smart Scan will appear here'}
                                            </p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : paginated.map((rec, idx) => (
                                <TableRow key={rec.passportId}
                                    className="border-slate-300 dark:border-slate-700/80 hover:bg-slate-50/70 dark:hover:bg-slate-800/20 transition-colors group align-top">

                                    {/* Row # */}
                                    <TableCell className="pl-3 text-center text-[11px] font-semibold text-slate-400 dark:text-slate-500 py-1.5">
                                        {(page - 1) * pageSize + idx + 1}
                                    </TableCell>

                                    {/* Passenger */}
                                    <TableCell className="py-1.5">
                                        <p className="text-[12px] font-semibold text-[#0B2447] dark:text-white leading-tight whitespace-nowrap">
                                            {rec.surname}, {rec.firstName}
                                            {rec.middleName ? ` ${rec.middleName[0]}.` : ''}
                                        </p>
                                    </TableCell>

                                    {/* Passport No. */}
                                    <TableCell>
                                        <span className="text-[11px] font-mono font-semibold text-slate-700 dark:text-slate-200 tracking-wide">
                                            {rec.passportNumber || '—'}
                                        </span>
                                    </TableCell>

                                    {/* DOB */}
                                    <TableCell className="text-[11px] text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap">
                                        {fmt(rec.dateOfBirth)}
                                    </TableCell>

                                    {/* Date of Issue */}
                                    <TableCell className="text-[11px] text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap">
                                        {fmt(rec.dateOfIssue)}
                                    </TableCell>

                                    {/* Expiry */}
                                    <TableCell>
                                        <ExpiryBadge date={rec.dateOfExpiry} />
                                    </TableCell>

                                    {/* Embassy */}
                                    <TableCell className="text-[11px] text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap">
                                        {rec.embassy || <span className="text-slate-300 dark:text-slate-600">—</span>}
                                    </TableCell>

                                    {/* Agency */}
                                    <TableCell className="text-[11px] text-slate-600 dark:text-slate-300 font-medium max-w-[220px] whitespace-nowrap truncate py-1.5">
                                        {rec.agency ? <span className="block truncate" title={rec.agency}>{rec.agency}</span> : <span className="text-slate-300 dark:text-slate-600">—</span>}
                                    </TableCell>

                                    {/* Tour */}
                                    <TableCell className="text-[11px] text-slate-600 dark:text-slate-300 font-medium max-w-[170px] whitespace-nowrap truncate py-1.5">
                                        {rec.tourName ? <span className="block truncate" title={rec.tourName}>{rec.tourName}</span> : <span className="text-slate-300 dark:text-slate-600">—</span>}
                                    </TableCell>

                                    {/* Appointment */}
                                    <TableCell className="text-[11px] text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap">
                                        {rec.appointmentDate ? (
                                            `${fmt(rec.appointmentDate)}${rec.appointmentTime ? ` • ${fmtTime(rec.appointmentTime)}` : ''}`
                                        ) : <span className="text-slate-300 dark:text-slate-600">—</span>}
                                    </TableCell>

                                    {/* Departure Date */}
                                    <TableCell className="text-[11px] text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap">
                                        {fmt(rec.departureDate)}
                                    </TableCell>

                                    {/* Payment */}
                                    <TableCell>
                                        {rec.payment
                                                                                        ? <span className={`inline-block text-[10px] font-semibold px-1 py-0.5 rounded-md border capitalize ${paymentColor(rec.payment)}`}>
                                                {rec.payment}
                                              </span>
                                            : <span className="text-slate-300 dark:text-slate-600">—</span>
                                        }
                                    </TableCell>

                                    {/* Actions */}
                                    <TableCell className="text-right pr-3 py-1.5">
                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost" size="sm"
                                                onClick={() => openEdit(rec)}
                                                className="h-6 w-6 p-0 rounded-lg text-slate-400 hover:text-[#19376D] hover:bg-[#19376D]/8 dark:hover:text-[#A5D7E8] dark:hover:bg-[#576CBC]/15 transition-colors"
                                            >
                                                <Pencil className="w-3.5 h-3.5" strokeWidth={2} />
                                            </Button>
                                            <Button
                                                variant="ghost" size="sm"
                                                onClick={() => openDelete(rec)}
                                                className="h-6 w-6 p-0 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 transition-colors"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* ── Pagination bar ── */}
                {!loading && filtered.length > 0 && (
                    <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 dark:border-slate-800/60">
                        <p className="text-[12px] text-slate-400 dark:text-slate-500 font-medium">
                            Page {page} of {totalPages}
                        </p>
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm"
                                onClick={() => setPage(1)} disabled={page === 1}
                                className="h-7 w-7 p-0 rounded-lg text-slate-400 hover:text-[#0B2447] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30">
                                <ChevronsLeft className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm"
                                onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                className="h-7 w-7 p-0 rounded-lg text-slate-400 hover:text-[#0B2447] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30">
                                <ChevronLeft className="w-3.5 h-3.5" />
                            </Button>

                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let p;
                                if (totalPages <= 5)       p = i + 1;
                                else if (page <= 3)        p = i + 1;
                                else if (page >= totalPages - 2) p = totalPages - 4 + i;
                                else                       p = page - 2 + i;
                                return (
                                    <Button key={p} variant="ghost" size="sm"
                                        onClick={() => setPage(p)}
                                        className={`h-7 w-7 p-0 rounded-lg text-[12.5px] font-semibold transition-colors ${page === p
                                            ? 'bg-[#19376D] text-white hover:bg-[#19376D]'
                                            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                                        {p}
                                    </Button>
                                );
                            })}

                            <Button variant="ghost" size="sm"
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                                className="h-7 w-7 p-0 rounded-lg text-slate-400 hover:text-[#0B2447] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30">
                                <ChevronRight className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm"
                                onClick={() => setPage(totalPages)} disabled={page === totalPages}
                                className="h-7 w-7 p-0 rounded-lg text-slate-400 hover:text-[#0B2447] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30">
                                <ChevronsRight className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* ══════════════════════════════════════════════════════
                    EDIT SHEET
               ══════════════════════════════════════════════════════ */}
            <Sheet open={editOpen} onOpenChange={v => { setEditOpen(v); if (!v) setEditErrors({}); }}>
                <SheetContent
                    side="right"
                    className="w-full max-w-135 sm:max-w-135 p-0 flex flex-col bg-white dark:bg-[#0B2447] border-l border-slate-200 dark:border-[#576CBC]/25 font-[Outfit]"
                >
                    <SheetHeader className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800/60 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-[#19376D]/10 dark:bg-[#576CBC]/20 flex items-center justify-center">
                                <Pencil className="w-4 h-4 text-[#19376D] dark:text-[#A5D7E8]" strokeWidth={2} />
                            </div>
                            <div>
                                <SheetTitle className="text-[15px] font-bold text-[#0B2447] dark:text-white leading-tight font-[Outfit]">
                                    Edit Record
                                </SheetTitle>
                                <SheetDescription className="text-[12px] text-slate-400 dark:text-[#A5D7E8]/50 font-[Outfit] mt-0.5">
                                    {editRec ? `${editRec.surname}, ${editRec.firstName} — ${editRec.passportNumber}` : ''}
                                </SheetDescription>
                            </div>
                        </div>
                    </SheetHeader>

                    {/* Scrollable form */}
                    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5" style={{ scrollbarWidth: 'none' }}>

                        {/* Passport Identity */}
                        <section>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="w-1 h-4 rounded-full bg-[#19376D] dark:bg-[#576CBC]" />
                                <p className="text-[11.5px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">Passport Identity</p>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <EField label="Surname"     id="surname"    placeholder="DELA CRUZ" value={editForm.surname}    onChange={updateEditForm} icon={User} required error={editErrors.surname} />
                                <EField label="First Name"  id="firstName"  placeholder="JUAN"       value={editForm.firstName}  onChange={updateEditForm} icon={User} required error={editErrors.firstName} />
                                <EField label="Middle Name" id="middleName" placeholder="SANTOS"     value={editForm.middleName} onChange={updateEditForm} icon={User} />
                            </div>
                            <div className="grid grid-cols-2 gap-3 mt-3">
                                <EField label="Passport No."  id="passportNumber" placeholder="A1234567"  value={editForm.passportNumber} onChange={updateEditForm} icon={Hash}         required error={editErrors.passportNumber} />
                                <EField label="Date of Birth" id="dateOfBirth"    type="date"              value={editForm.dateOfBirth}    onChange={updateEditForm} icon={CalendarDays}  error={editErrors.dateOfBirth} />
                            </div>
                            <div className="grid grid-cols-2 gap-3 mt-3">
                                <EField label="Date of Issue"  id="dateOfIssue"  type="date" value={editForm.dateOfIssue}  onChange={updateEditForm} icon={Calendar} error={editErrors.dateOfIssue} />
                                <EField label="Date of Expiry" id="dateOfExpiry" type="date" value={editForm.dateOfExpiry} onChange={updateEditForm} icon={Calendar} error={editErrors.dateOfExpiry} />
                            </div>
                        </section>

                        <div className="border-t border-slate-100 dark:border-slate-800/60" />

                        {/* Booking */}
                        <section>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="w-1 h-4 rounded-full bg-indigo-400 dark:bg-indigo-500" />
                                <p className="text-[11.5px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">Booking & Assignment</p>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <EField label="Portal Ref No" id="portalRefNo" placeholder="REF-2026-001" value={editForm.portalRefNo} onChange={updateEditForm} icon={FileText} required error={editErrors.portalRefNo} />
                                {/* Payment Status — Select */}
                                <div className="flex flex-col gap-1.5">
                                    <Label className="flex items-center gap-1.5 text-[11px] font-semibold tracking-widest uppercase text-slate-600 dark:text-slate-300 select-none">
                                        <CreditCard className="w-3 h-3" strokeWidth={2} />Payment Status
                                    </Label>
                                    <Select
                                        value={editForm.payment || 'unpaid'}
                                        onValueChange={val => updateEditForm('payment', val)}
                                    >
                                        <SelectTrigger className="h-8 text-[13px] font-medium rounded-lg bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[#19376D]/20 dark:focus:ring-[#576CBC]/30 font-[Outfit]">
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent className="font-[Outfit]">
                                            <SelectItem value="unpaid">Unpaid</SelectItem>
                                            <SelectItem value="partial">Partial</SelectItem>
                                            <SelectItem value="paid">Paid</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <EField label="Agency" id="agency" placeholder="Ace Travel PH" value={editForm.agency} onChange={updateEditForm} icon={BriefcaseBusiness} />
                            </div>
                        </section>

                        <div className="border-t border-slate-100 dark:border-slate-800/60" />

                        {/* Travel */}
                        <section>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="w-1 h-4 rounded-full bg-sky-400 dark:bg-sky-500" />
                                <p className="text-[11.5px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">Appointment & Travel</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <EField label="Appointment Date" id="appointmentDate" type="date" value={editForm.appointmentDate} onChange={updateEditForm} icon={Calendar} error={editErrors.appointmentDate} />
                                <EField label="Appointment Time" id="appointmentTime" type="time" value={editForm.appointmentTime} onChange={updateEditForm} icon={Clock} />
                            </div>
                            <div className="grid grid-cols-2 gap-3 mt-3">
                                <EField label="Embassy"        id="embassy"       placeholder="Japan Embassy" value={editForm.embassy}       onChange={updateEditForm} icon={Building2} />
                                <EField label="Departure Date" id="departureDate" type="date"                 value={editForm.departureDate} onChange={updateEditForm} icon={Plane} error={editErrors.departureDate} />
                            </div>
                            <div className="mt-3">
                                <EField label="Tour Name" id="tourName" placeholder="Japan Cherry Blossom 2026 — 10D/9N" value={editForm.tourName} onChange={updateEditForm} icon={MapPin} />
                            </div>
                        </section>
                    </div>

                    {/* Footer buttons */}
                    <SheetFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800/60 shrink-0 flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setEditOpen(false)}
                            disabled={saving}
                            className="flex-1 h-9 text-[13px] font-semibold font-[Outfit] border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex-1 h-9 text-[13px] font-semibold font-[Outfit] rounded-xl border-0"
                            style={{ background: 'linear-gradient(135deg, #0B2447, #19376D)' }}
                        >
                            {saving
                                ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />Saving…</>
                                : 'Save Changes'}
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            {/* ══════════════════════════════════════════════════════
                    DELETE CONFIRMATION DIALOG
               ══════════════════════════════════════════════════════ */}
            <AlertDialog open={delOpen} onOpenChange={setDelOpen}>
                <AlertDialogContent className="font-[Outfit] max-w-100 border-slate-200 dark:border-slate-700/60 dark:bg-[#0B2447]">
                    <AlertDialogHeader>
                        <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center mb-3">
                            <Trash2 className="w-5 h-5 text-rose-500 dark:text-rose-400" strokeWidth={1.8} />
                        </div>
                        <AlertDialogTitle className="text-[16px] font-bold text-[#0B2447] dark:text-white font-[Outfit]">
                            Delete Record?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-[13px] text-slate-500 dark:text-[#A5D7E8]/60 font-[Outfit] leading-relaxed">
                            You are about to permanently delete the record for{' '}
                            <span className="font-semibold text-[#0B2447] dark:text-white">
                                {delTarget ? `${delTarget.surname}, ${delTarget.firstName}` : ''}
                            </span>
                            {delTarget?.passportNumber && (
                                <> (Passport: <span className="font-mono font-semibold">{delTarget.passportNumber}</span>)</>
                            )}.{' '}
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel
                            disabled={deleting}
                            className="h-9 text-[13px] font-semibold font-[Outfit] border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl"
                        >
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleting}
                            className="h-9 text-[13px] font-semibold font-[Outfit] bg-rose-600 hover:bg-rose-700 text-white rounded-xl border-0"
                        >
                            {deleting
                                ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />Deleting…</>
                                : 'Yes, Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </div>
    );
};

export default PassengerRecords;
