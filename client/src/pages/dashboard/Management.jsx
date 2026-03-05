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

const API = 'http://localhost:3000/api';
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('authToken')}` });

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

    /* Export state */
    const [exporting, setExporting] = useState(false);

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
        setImporting(true);
        setImportResult(null);
        try {
            const form = new FormData();
            form.append('file', selectedFile);
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
            const response = await axios.get(`${API}/management/export`, {
                headers: authHeaders(),
                responseType: 'blob',
            });
            const url = URL.createObjectURL(new Blob([response.data]));
            const a   = document.createElement('a');
            a.href    = url;
            a.download = `passenger-records-${new Date().toISOString().slice(0, 10)}.xlsx`;
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
                    Columns must match the template exactly. Required: Surname, First Name, Passport Number, Portal Ref No.
                </p>
            </Section>

            {/* ── Export & Template in a 2-col grid ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                {/* Export */}
                <Section
                    icon={Download}
                    iconColor="#576CBC"
                    title="Export to Excel"
                    description="Download all records as a spreadsheet"
                >
                    <p className="font-[Outfit] text-[13px] text-slate-500 dark:text-[#A5D7E8]/60 mb-4 leading-relaxed">
                        Exports every passenger record in the system to a formatted <strong>.xlsx</strong> file with all 17 columns including metadata.
                    </p>
                    <Button
                        onClick={handleExport}
                        disabled={exporting}
                        className="w-full font-[Outfit] text-[13.5px] font-semibold bg-[#576CBC] hover:bg-[#19376D] text-white rounded-lg h-9 cursor-pointer transition-colors disabled:opacity-50"
                    >
                        {exporting
                            ? <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />Exporting…</>
                            : <><Download className="w-3.5 h-3.5 mr-2" />Export All Records</>
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
                            { label: 'Surname',          required: true  },
                            { label: 'First Name',       required: true  },
                            { label: 'Middle Name',      required: false },
                            { label: 'Portal Ref No',    required: true  },
                            { label: 'Payment',          required: false },
                            { label: 'Agency',           required: false },
                            { label: 'Date of Birth',    required: false },
                            { label: 'Passport Number',  required: true  },
                            { label: 'Date of Issue',    required: false },
                            { label: 'Date of Expiry',   required: false },
                            { label: 'Appointment Date', required: false },
                            { label: 'Appointment Time', required: false },
                            { label: 'Embassy',          required: false },
                            { label: 'Departure Date',   required: false },
                            { label: 'Tour Name',        required: false },
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
