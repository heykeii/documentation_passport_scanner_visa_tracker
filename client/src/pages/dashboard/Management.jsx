import React, { useRef, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
    FileSpreadsheet, Upload, Download, FileDown,
    CheckCircle2, AlertCircle, Loader2, X, FileUp,
    Table2, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

const API = 'http://localhost:3000/api';
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('authToken')}` });
const MONTH_OPTIONS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const YEAR_OPTIONS = Array.from({ length: 31 }, (_, i) => String(2010 + i));

/* ─── Section card wrapper ─── */
const Section = ({ icon: Icon, iconColor, title, description, children }) => (
    <Card className="border border-slate-200 dark:border-[#576CBC]/20 bg-white dark:bg-[#0d1b35] shadow-sm dark:shadow-none rounded-2xl overflow-hidden font-[Outfit]">
        <CardHeader className="px-6 py-5 border-b border-slate-100 dark:border-white/8">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: iconColor + '18' }}>
                    <Icon className="w-4.5 h-4.5" style={{ color: iconColor }} strokeWidth={1.9} />
                </div>
                <div>
                    <CardTitle className="text-[15px] font-semibold text-[#0B2447] dark:text-white font-[Outfit] leading-tight">
                        {title}
                    </CardTitle>
                    <CardDescription className="text-[12.5px] text-slate-400 dark:text-[#A5D7E8]/50 font-[Outfit] mt-0.5">
                        {description}
                    </CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent className="px-6 py-5">
            {children}
        </CardContent>
    </Card>
);

/* ─── Import Result Panel ─── */
const ImportResult = ({ result, onDismiss }) => (
    <div className="mt-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/3 overflow-hidden">
        {/* Summary row */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-white/8">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" strokeWidth={2} />
            <p className="font-[Outfit] text-[13.5px] font-semibold text-[#0B2447] dark:text-white flex-1">
                {result.message}
            </p>
            <button onClick={onDismiss}
                className="w-6 h-6 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors cursor-pointer">
                <X className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
        </div>

        {/* Stat pills */}
        <div className="flex items-center gap-3 px-4 py-3">
            <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" strokeWidth={2.5} />
                {result.saved} saved
            </span>
            {result.skipped.length > 0 && (
                <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                    <AlertCircle className="w-3 h-3" strokeWidth={2.5} />
                    {result.skipped.length} skipped
                </span>
            )}
        </div>

        {/* Skipped rows detail */}
        {result.skipped.length > 0 && (
            <div className="px-4 pb-4">
                <p className="font-[Outfit] text-[11.5px] font-semibold text-slate-400 dark:text-[#A5D7E8]/40 uppercase tracking-widest mb-2">
                    Skipped Rows
                </p>
                <div className="space-y-1.5 max-h-40 overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
                    {result.skipped.map((s, i) => (
                        <div key={i} className="flex items-start gap-2 text-[12.5px] font-[Outfit]">
                            <span className="shrink-0 font-semibold text-amber-600 dark:text-amber-400 w-12">
                                Row {s.row}
                            </span>
                            <span className="text-slate-500 dark:text-[#A5D7E8]/60">{s.reason}</span>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
);

/* ══════════════════════════════════════════════════════════ */

const Management = () => {
    const fileInputRef = useRef(null);

    /* Import state */
    const [dragging,      setDragging]      = useState(false);
    const [selectedFile,  setSelectedFile]  = useState(null);
    const [importing,     setImporting]     = useState(false);
    const [importResult,  setImportResult]  = useState(null);
    const [migrationMode, setMigrationMode] = useState(false);
    const [migrationMonth, setMigrationMonth] = useState('');
    const [migrationYear, setMigrationYear] = useState('');

    /* Export state */
    const [exporting, setExporting] = useState(false);
    const [exportMonth, setExportMonth] = useState('');
    const [exportYear, setExportYear] = useState('');

    /* Template state */
    const [downloading, setDownloading] = useState(false);

    /* ── File helpers ── */
    const acceptFile = (file) => {
        if (!file) return;
        const ok = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
        ].includes(file.type);
        if (!ok) { toast.error('Only Excel files (.xlsx, .xls) are accepted.'); return; }
        setSelectedFile(file);
        setImportResult(null);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        acceptFile(e.dataTransfer.files[0]);
    };

    /* ── Import ── */
    const handleImport = async () => {
        if (!selectedFile) return;
        if (migrationMode && (!migrationMonth || !migrationYear)) {
            toast.error('Select migration month and year first.');
            return;
        }
        setImporting(true);
        setImportResult(null);
        try {
            const form = new FormData();
            form.append('file', selectedFile);
            form.append('entryMode', migrationMode ? 'migration' : 'normal');
            if (migrationMode) {
                form.append('migrationMonth', migrationMonth);
                form.append('migrationYear', migrationYear);
            }
            const { data } = await axios.post(`${API}/management/import`, form, {
                headers: { ...authHeaders(), 'Content-Type': 'multipart/form-data' },
            });
            setImportResult(data);
            if (data.saved > 0) toast.success(`${data.saved} record${data.saved > 1 ? 's' : ''} imported successfully.`);
            if (data.skipped.length > 0) toast.warning(`${data.skipped.length} row${data.skipped.length > 1 ? 's' : ''} skipped.`);
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (err) {
            toast.error(err?.response?.data?.error || 'Import failed.');
        } finally {
            setImporting(false);
        }
    };

    /* ── Export ── */
    const handleExport = async () => {
        setExporting(true);
         try {
            const params = new URLSearchParams();
            if (exportMonth !== '') params.set('month', exportMonth);
            if (exportYear  !== '') params.set('year',  exportYear);
            const qs = params.toString() ? `?${params.toString()}` : '';

            const response = await axios.get(`${API}/management/export${qs}`, {
                headers: authHeaders(),
                responseType: 'blob',
            });

            // Mirror backend filename logic
            const MONTH_ABBR = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
            let slug = new Date().toISOString().slice(0, 10);
            if (exportMonth !== '' && exportYear !== '') slug = `${MONTH_ABBR[Number(exportMonth)]}-${exportYear}`;
            else if (exportMonth !== '') slug = MONTH_ABBR[Number(exportMonth)];
            else if (exportYear  !== '') slug = exportYear;

            const url = URL.createObjectURL(new Blob([response.data]));
            const a   = document.createElement('a');
            a.href    = url;
            a.download = `passenger-records-${slug}.xlsx`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success('Records exported successfully.');
        } catch {
            toast.error('Export failed.');
        } finally {
            setExporting(false);
        }
    };

    /* ── Template ── */
    const handleTemplate = async () => {
        setDownloading(true);
        try {
            const response = await axios.get(`${API}/management/template`, {
                headers: authHeaders(),
                responseType: 'blob',
            });
            const url = URL.createObjectURL(new Blob([response.data]));
            const a   = document.createElement('a');
            a.href    = url;
            a.download = 'passenger-records-template.xlsx';
            a.click();
            URL.revokeObjectURL(url);
            toast.success('Template downloaded.');
        } catch {
            toast.error('Failed to download template.');
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-5 font-[Outfit]">

            {/* ── Page header ── */}
            <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'linear-gradient(135deg, #0B2447, #19376D)' }}>
                    <FileSpreadsheet className="w-5 h-5 text-white" strokeWidth={1.9} />
                </div>
                <div>
                    <h2 className="text-[18px] font-bold text-[#0B2447] dark:text-white font-[Outfit] leading-tight">
                        Excel Management
                    </h2>
                    <p className="text-[13px] text-slate-400 dark:text-[#A5D7E8]/50 font-[Outfit]">
                        Import, export, and download passport record templates
                    </p>
                </div>
            </div>

            {/* ── Import Section ── */}
            <Section
                icon={Upload}
                iconColor="#19376D"
                title="Import Excel"
                description="Upload an .xlsx file to bulk-add passenger records"
            >
                {/* Drop zone */}
                <div
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-xl px-6 py-10 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200 select-none
                        ${dragging
                            ? 'border-[#19376D] bg-[#19376D]/5 dark:bg-[#19376D]/10 scale-[1.01]'
                            : selectedFile
                                ? 'border-emerald-400 dark:border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-500/5'
                                : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/3 hover:border-[#576CBC]/50 hover:bg-slate-100/50 dark:hover:bg-white/5'
                        }`}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls"
                        className="hidden"
                        onChange={(e) => acceptFile(e.target.files[0])}
                    />

                    {selectedFile ? (
                        <>
                            <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center">
                                <FileUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" strokeWidth={1.9} />
                            </div>
                            <div className="text-center">
                                <p className="font-[Outfit] text-[14px] font-semibold text-emerald-700 dark:text-emerald-400">
                                    {selectedFile.name}
                                </p>
                                <p className="font-[Outfit] text-[12.5px] text-slate-400 dark:text-[#A5D7E8]/50 mt-0.5">
                                    {(selectedFile.size / 1024).toFixed(1)} KB · Click to change
                                </p>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-white/8 flex items-center justify-center">
                                <Table2 className="w-5 h-5 text-slate-400 dark:text-[#A5D7E8]/50" strokeWidth={1.8} />
                            </div>
                            <div className="text-center">
                                <p className="font-[Outfit] text-[14px] font-semibold text-[#0B2447] dark:text-white">
                                    Drop your Excel file here
                                </p>
                                <p className="font-[Outfit] text-[12.5px] text-slate-400 dark:text-[#A5D7E8]/50 mt-0.5">
                                    or click to browse · .xlsx, .xls supported · up to 10 MB
                                </p>
                            </div>
                        </>
                    )}
                </div>

                {/* Action row */}
                <div className="mt-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/3 px-3.5 py-3">
                    <div className="flex flex-wrap items-center gap-2.5">
                        <Button
                            type="button"
                            variant={migrationMode ? 'default' : 'outline'}
                            onClick={() => setMigrationMode(v => !v)}
                            className={`h-8 text-[12px] font-semibold rounded-lg cursor-pointer ${
                                migrationMode
                                    ? 'bg-[#19376D] hover:bg-[#0B2447] text-white'
                                    : 'border-slate-200 dark:border-white/15 text-slate-600 dark:text-slate-300'
                            }`}
                        >
                            Migration Mode {migrationMode ? 'ON' : 'OFF'}
                        </Button>

                        <Select value={migrationMonth || 'none'} onValueChange={(v) => setMigrationMonth(v === 'none' ? '' : v)}>
                            <SelectTrigger className="w-30 h-8 text-[12.5px] font-medium font-[Outfit] bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-700/60 rounded-lg">
                                <SelectValue placeholder="Month" />
                            </SelectTrigger>
                            <SelectContent className="font-[Outfit]">
                                <SelectItem value="none">Month</SelectItem>
                                {MONTH_OPTIONS.map((m, i) => <SelectItem key={m} value={String(i)}>{m}</SelectItem>)}
                            </SelectContent>
                        </Select>

                        <Select value={migrationYear || 'none'} onValueChange={(v) => setMigrationYear(v === 'none' ? '' : v)}>
                            <SelectTrigger className="w-28 h-8 text-[12.5px] font-medium font-[Outfit] bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-700/60 rounded-lg">
                                <SelectValue placeholder="Year" />
                            </SelectTrigger>
                            <SelectContent className="font-[Outfit]">
                                <SelectItem value="none">Year</SelectItem>
                                {YEAR_OPTIONS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                            </SelectContent>
                        </Select>

                        <p className="text-[11.5px] text-slate-500 dark:text-[#A5D7E8]/55">
                            {migrationMode
                                ? 'Selected migration month/year overrides appointment and created dates for month/year filtering.'
                                : 'Use migration mode only for old data with missing appointment year.'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 mt-4">
                    <Button
                        onClick={handleImport}
                        disabled={!selectedFile || importing}
                        className="font-[Outfit] text-[13.5px] font-semibold bg-[#0B2447] hover:bg-[#19376D] text-white rounded-lg px-5 h-9 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {importing
                            ? <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />Importing…</>
                            : <><Upload className="w-3.5 h-3.5 mr-2" />Import Records</>
                        }
                    </Button>
                    {selectedFile && !importing && (
                        <button
                            onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setImportResult(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                            className="font-[Outfit] text-[13px] text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
                        >
                            Clear
                        </button>
                    )}
                </div>

                {/* Result */}
                {importResult && (
                    <ImportResult result={importResult} onDismiss={() => setImportResult(null)} />
                )}

                {/* Hint */}
                <p className="font-[Outfit] text-[12px] text-slate-400 dark:text-[#A5D7E8]/40 mt-3 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" strokeWidth={1.8} />
                    Columns must match the template exactly. Required: SURNAME, NAME, PPT #, PORTAL.
                </p>
            </Section>

            {/* ── Export & Template in a 2-col grid ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                {/* Export */}
                <Section
                    icon={Download}
                    iconColor="#576CBC"
                    title="Export to Excel"
                    description="Download records as a spreadsheet"
                >
                    <p className="font-[Outfit] text-[13px] text-slate-500 dark:text-[#A5D7E8]/60 mb-3 leading-relaxed">
                        Filter by month and/or year, or leave both blank to export <strong>all records</strong>.
                    </p>
                    <div className="flex items-center gap-2 mb-3">
                        <Select value={exportMonth || 'all'} onValueChange={(v) => setExportMonth(v === 'all' ? '' : v)}>
                            <SelectTrigger className="flex-1 h-8 text-[12.5px] font-medium font-[Outfit] bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-700/60 rounded-lg">
                                <SelectValue placeholder="All Months" />
                            </SelectTrigger>
                            <SelectContent className="font-[Outfit]">
                                <SelectItem value="all">All Months</SelectItem>
                                {MONTH_OPTIONS.map((m, i) => <SelectItem key={m} value={String(i)}>{m}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={exportYear || 'all'} onValueChange={(v) => setExportYear(v === 'all' ? '' : v)}>
                            <SelectTrigger className="flex-1 h-8 text-[12.5px] font-medium font-[Outfit] bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-700/60 rounded-lg">
                                <SelectValue placeholder="All Years" />
                            </SelectTrigger>
                            <SelectContent className="font-[Outfit]">
                                <SelectItem value="all">All Years</SelectItem>
                                {YEAR_OPTIONS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button
                        onClick={handleExport}
                        disabled={exporting}
                        className="w-full font-[Outfit] text-[13.5px] font-semibold bg-[#576CBC] hover:bg-[#19376D] text-white rounded-lg h-9 cursor-pointer transition-colors disabled:opacity-50"
                    >
                        {exporting
                            ? <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />Exporting…</>
                            : <><Download className="w-3.5 h-3.5 mr-2" />Export Records</>
                        }
                    </Button>
                </Section>

                {/* Template */}
                <Section
                    icon={FileDown}
                    iconColor="#0ea5e9"
                    title="Download Template"
                    description="Get the blank Excel import template"
                >
                    <p className="font-[Outfit] text-[13px] text-slate-500 dark:text-[#A5D7E8]/60 mb-4 leading-relaxed">
                        Downloads a blank <strong>.xlsx</strong> template with all required column headers pre-formatted for import.
                    </p>
                    <Button
                        onClick={handleTemplate}
                        disabled={downloading}
                        variant="outline"
                        className="w-full font-[Outfit] text-[13.5px] font-semibold text-[#0B2447] dark:text-white border-slate-200 dark:border-white/15 hover:bg-slate-50 dark:hover:bg-white/8 rounded-lg h-9 cursor-pointer transition-colors disabled:opacity-50"
                    >
                        {downloading
                            ? <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />Downloading…</>
                            : <><FileDown className="w-3.5 h-3.5 mr-2" />Download Template</>
                        }
                    </Button>
                </Section>
            </div>

            {/* ── Column reference ── */}
            <Card className="border border-slate-200 dark:border-[#576CBC]/20 bg-white dark:bg-[#0d1b35] shadow-sm rounded-2xl font-[Outfit]">
                <CardHeader className="px-6 py-4 border-b border-slate-100 dark:border-white/8">
                    <CardTitle className="text-[14px] font-semibold text-[#0B2447] dark:text-white font-[Outfit]">
                        Expected Column Headers
                    </CardTitle>
                    <CardDescription className="text-[12.5px] text-slate-400 dark:text-[#A5D7E8]/50 font-[Outfit]">
                        Your Excel file must use these exact headers in the first row
                    </CardDescription>
                </CardHeader>
                <CardContent className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                        {[
                            { label: 'SURNAME',      required: true  },
                            { label: 'NAME',         required: true  },
                            { label: 'MIDDLE NAME',  required: false },
                            { label: 'PORTAL',       required: true  },
                            { label: 'PAYMENT',      required: false },
                            { label: 'AGENCY',       required: false },
                            { label: 'DOB',          required: false },
                            { label: 'PPT #',        required: true  },
                            { label: 'DOI',          required: false },
                            { label: 'DOE',          required: false },
                            { label: 'APPT DATE',    required: false },
                            { label: 'TIME',         required: false },
                            { label: 'EMBASSY',      required: false },
                            { label: 'DEP DATE',     required: false },
                            { label: 'TOUR NAME',    required: false },
                        ].map(({ label, required }) => (
                            <span key={label}
                                className={`inline-flex items-center gap-1 text-[12px] font-medium px-2.5 py-1 rounded-lg border font-[Outfit]
                                    ${required
                                        ? 'bg-[#0B2447]/5 dark:bg-[#576CBC]/15 text-[#0B2447] dark:text-[#A5D7E8] border-[#0B2447]/20 dark:border-[#576CBC]/30'
                                        : 'bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-[#A5D7E8]/50 border-slate-200 dark:border-white/10'
                                    }`}
                            >
                                {required && <span className="text-red-500 font-bold">*</span>}
                                {label}
                            </span>
                        ))}
                    </div>
                    <p className="text-[11.5px] text-slate-400 dark:text-[#A5D7E8]/40 font-[Outfit] mt-3 flex items-center gap-1">
                        <span className="text-red-500 font-bold">*</span> Required fields
                    </p>
                </CardContent>
            </Card>

        </div>
    );
};

export default Management;
