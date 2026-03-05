import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
    Moon, Sun, User, Lock, Save, Loader2,
    Eye, EyeOff, AlertCircle, CheckCircle2,
    Shield, Palette, ChevronRight, Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTheme } from '@/contexts/ThemeContext';
import { useUser } from '@/contexts/UserContext';

const API = 'http://localhost:3000/api';
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('authToken')}` });

/* ─── Field ─── */
const Field = ({ label, id, type = 'text', value, onChange, placeholder, showToggle, onToggle, error, hint }) => (
    <div className="flex flex-col gap-1.5 group">
        <Label htmlFor={id}
            className="text-[10.5px] font-bold tracking-widest uppercase text-slate-400 dark:text-slate-500 select-none transition-colors group-focus-within:text-[#19376D] dark:group-focus-within:text-[#A5D7E8]">
            {label}
        </Label>
        <div className="relative">
            <Input
                id={id}
                type={showToggle !== undefined ? (showToggle ? 'text' : 'password') : type}
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                className={`h-10 text-[13.5px] font-medium rounded-lg transition-all
                    bg-white dark:bg-slate-900/50
                    text-slate-800 dark:text-slate-100
                    placeholder:text-slate-300 dark:placeholder:text-slate-600
                    hover:border-slate-300 dark:hover:border-slate-600
                    focus-visible:ring-2 
                    ${onToggle ? 'pr-10' : ''}
                    ${error
                        ? 'border-rose-400 focus-visible:ring-rose-300/30 focus-visible:border-rose-400'
                        : 'border-slate-200 dark:border-slate-700/60 focus-visible:ring-[#19376D]/20 dark:focus-visible:ring-[#576CBC]/30 focus-visible:border-[#19376D]/50 dark:focus-visible:border-[#576CBC]/60'
                    }`}
            />
            {onToggle && (
                <button type="button" onClick={onToggle}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors">
                    {showToggle
                        ? <EyeOff className="w-4 h-4" strokeWidth={1.8} />
                        : <Eye className="w-4 h-4" strokeWidth={1.8} />}
                </button>
            )}
        </div>
        {hint && !error && <p className="text-[11px] text-slate-400 dark:text-slate-600 leading-relaxed">{hint}</p>}
        {error && (
            <p className="flex items-center gap-1.5 text-[11px] text-rose-500 font-medium">
                <AlertCircle className="w-3 h-3 shrink-0" strokeWidth={2} />{error}
            </p>
        )}
    </div>
);

/* ─── Password strength ─── */
const getStrength = (pw) => {
    if (!pw) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pw.length >= 8)  score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { score, label: 'Weak',   color: 'bg-rose-400',   text: 'text-rose-500' };
    if (score <= 3) return { score, label: 'Fair',   color: 'bg-amber-400',  text: 'text-amber-500' };
    return             { score, label: 'Strong', color: 'bg-emerald-400', text: 'text-emerald-500' };
};

const StrengthBar = ({ password }) => {
    const s = getStrength(password);
    if (!password) return null;
    return (
        <div className="space-y-1.5 mt-1">
            <div className="flex gap-1">
                {[1,2,3,4,5].map(i => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= s.score ? s.color : 'bg-slate-100 dark:bg-slate-800'}`} />
                ))}
            </div>
            <p className={`text-[11px] font-semibold ${s.text}`}>{s.label} password</p>
        </div>
    );
};

/* ─── Section wrapper ─── */
const Section = ({ children }) => (
    <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/70 dark:border-slate-700/50 shadow-sm overflow-hidden">
        {children}
    </div>
);

const SectionHeader = ({ icon: Icon, iconBg, iconColor, title, subtitle, accent }) => (
    <div className={`flex items-center gap-4 px-6 py-5 border-b border-slate-100 dark:border-slate-800/60 ${accent || ''}`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
            <Icon className={`w-5 h-5 ${iconColor}`} strokeWidth={1.8} />
        </div>
        <div>
            <p className="text-[14px] font-bold text-slate-800 dark:text-slate-100 leading-tight">{title}</p>
            <p className="text-[12px] text-slate-400 dark:text-slate-500 mt-0.5">{subtitle}</p>
        </div>
    </div>
);

const SectionBody = ({ children }) => (
    <div className="px-6 py-6 space-y-5">{children}</div>
);

const SaveBtn = ({ onClick, loading, label = 'Save Changes', disabled }) => (
    <div className="pt-1">
        <Button onClick={onClick} disabled={loading || disabled}
            className="h-10 px-6 text-[13px] font-bold text-white rounded-xl cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
            style={{ background: 'linear-gradient(135deg, #0B2447 0%, #19376D 60%, #576CBC 100%)' }}>
            {loading
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" strokeWidth={2} />Saving…</>
                : <><Save className="w-4 h-4 mr-2" strokeWidth={2} />{label}</>}
        </Button>
    </div>
);

/* ══════════════════════════════════════════ */

const Settings = () => {
    const { theme, toggleTheme } = useTheme();
    const { updateUser } = useUser();

    /* Display Name */
    const [name, setName]         = useState('');
    const [nameError, setNameError] = useState('');
    const [savingName, setSavingName] = useState(false);
    const [nameSaved, setNameSaved]   = useState(false);

    /* Password */
    const [currentPw, setCurrentPw] = useState('');
    const [newPw, setNewPw]         = useState('');
    const [confirmPw, setConfirmPw] = useState('');
    const [pwErrors, setPwErrors]   = useState({});
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew]         = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [savingPw, setSavingPw]       = useState(false);

    const handleUpdateName = async () => {
        if (!name.trim()) { setNameError('Display name cannot be empty.'); return; }
        setNameError(''); setSavingName(true);
        try {
            await axios.put(`${API}/user/name`, { name: name.trim() }, { headers: authHeaders() });
            updateUser({ name: name.trim() });
            toast.success('Display name updated.');
            setNameSaved(true);
            setTimeout(() => setNameSaved(false), 3000);
            setName('');
        } catch (err) {
            toast.error(err?.response?.data?.error || 'Failed to update name.');
        } finally { setSavingName(false); }
    };

    const handleUpdatePassword = async () => {
        const errs = {};
        if (!currentPw)            errs.currentPw = 'Current password is required.';
        if (!newPw)                errs.newPw     = 'New password is required.';
        else if (newPw.length < 8) errs.newPw     = 'Must be at least 8 characters.';
        if (!confirmPw)            errs.confirmPw = 'Please confirm your password.';
        else if (newPw !== confirmPw) errs.confirmPw = 'Passwords do not match.';
        if (Object.keys(errs).length) { setPwErrors(errs); return; }
        setPwErrors({}); setSavingPw(true);
        try {
            await axios.put(`${API}/user/password`,
                { currentPassword: currentPw, newPassword: newPw },
                { headers: authHeaders() });
            toast.success('Password changed successfully.');
            setCurrentPw(''); setNewPw(''); setConfirmPw('');
        } catch (err) {
            toast.error(err?.response?.data?.error || 'Failed to change password.');
        } finally { setSavingPw(false); }
    };

    const pwStrength = getStrength(newPw);
    const pwMatch    = confirmPw && newPw === confirmPw;

    /* ════════════════════ RENDER ════════════════════ */
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#070f1e]">

            {/* ── Sticky page header ── */}
            <div className="sticky top-0 z-20 bg-white/90 dark:bg-[#0a1628]/90 backdrop-blur-md border-b border-slate-200/70 dark:border-slate-800/60">
                <div className="max-w-2xl mx-auto px-6 h-16 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: 'linear-gradient(135deg, #0B2447 0%, #576CBC 100%)' }}>
                        <Shield className="w-4.5 h-4.5 text-white" strokeWidth={1.8} />
                    </div>
                    <div>
                        <h1 className="text-[16px] font-bold text-slate-900 dark:text-white tracking-tight leading-none">Settings</h1>
                        <p className="text-[11.5px] text-slate-400 dark:text-slate-500 mt-0.5 leading-none">Account preferences & security</p>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-6 py-8 space-y-5">

                {/* ══ APPEARANCE ══ */}
                <Section>
                    <SectionHeader
                        icon={theme === 'dark' ? Moon : Sun}
                        iconBg="bg-amber-50 dark:bg-amber-500/10"
                        iconColor="text-amber-600 dark:text-amber-400"
                        title="Appearance"
                        subtitle="Choose how the dashboard looks and feels"
                    />
                    <SectionBody>
                        <div className="grid grid-cols-2 gap-3">
                            {/* Light mode option */}
                            <button type="button" onClick={() => theme !== 'light' && toggleTheme()}
                                className={`relative flex flex-col items-start gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer text-left ${
                                    theme === 'light'
                                        ? 'border-[#19376D] bg-[#19376D]/4 dark:bg-[#19376D]/10 shadow-sm'
                                        : 'border-slate-200 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-900/40'
                                }`}>
                                {/* Preview */}
                                <div className="w-full h-16 rounded-lg overflow-hidden border border-slate-200/60 dark:border-slate-700/40 bg-[#f0f4fb] flex flex-col gap-1 p-2">
                                    <div className="flex gap-1.5 items-center">
                                        <div className="w-12 h-2.5 rounded-full bg-[#0B2447]" />
                                        <div className="w-6 h-2 rounded-full bg-slate-200 ml-auto" />
                                    </div>
                                    <div className="flex gap-1.5 mt-1">
                                        <div className="w-8 h-2 rounded-full bg-slate-200" />
                                        <div className="w-12 h-2 rounded-full bg-slate-200" />
                                        <div className="w-6 h-2 rounded-full bg-[#576CBC]/40" />
                                    </div>
                                    <div className="flex gap-1.5 mt-1">
                                        <div className="flex-1 h-5 rounded-md bg-white border border-slate-200" />
                                        <div className="flex-1 h-5 rounded-md bg-white border border-slate-200" />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between w-full">
                                    <div>
                                        <p className="text-[13px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                            <Sun className="w-3.5 h-3.5 text-amber-500" strokeWidth={2} /> Light
                                        </p>
                                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Clean & bright</p>
                                    </div>
                                    {theme === 'light' && (
                                        <div className="w-5 h-5 rounded-full bg-[#19376D] flex items-center justify-center">
                                            <Check className="w-3 h-3 text-white" strokeWidth={3} />
                                        </div>
                                    )}
                                </div>
                            </button>

                            {/* Dark mode option */}
                            <button type="button" onClick={() => theme !== 'dark' && toggleTheme()}
                                className={`relative flex flex-col items-start gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer text-left ${
                                    theme === 'dark'
                                        ? 'border-[#576CBC] bg-[#576CBC]/8 shadow-sm'
                                        : 'border-slate-200 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-900/40'
                                }`}>
                                {/* Preview */}
                                <div className="w-full h-16 rounded-lg overflow-hidden border border-slate-700/40 bg-[#0a1628] flex flex-col gap-1 p-2">
                                    <div className="flex gap-1.5 items-center">
                                        <div className="w-12 h-2.5 rounded-full bg-[#576CBC]" />
                                        <div className="w-6 h-2 rounded-full bg-white/10 ml-auto" />
                                    </div>
                                    <div className="flex gap-1.5 mt-1">
                                        <div className="w-8 h-2 rounded-full bg-white/10" />
                                        <div className="w-12 h-2 rounded-full bg-white/10" />
                                        <div className="w-6 h-2 rounded-full bg-[#A5D7E8]/30" />
                                    </div>
                                    <div className="flex gap-1.5 mt-1">
                                        <div className="flex-1 h-5 rounded-md bg-white/5 border border-white/10" />
                                        <div className="flex-1 h-5 rounded-md bg-white/5 border border-white/10" />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between w-full">
                                    <div>
                                        <p className="text-[13px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                            <Moon className="w-3.5 h-3.5 text-[#576CBC] dark:text-[#A5D7E8]" strokeWidth={2} /> Dark
                                        </p>
                                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Easy on the eyes</p>
                                    </div>
                                    {theme === 'dark' && (
                                        <div className="w-5 h-5 rounded-full bg-[#576CBC] flex items-center justify-center">
                                            <Check className="w-3 h-3 text-white" strokeWidth={3} />
                                        </div>
                                    )}
                                </div>
                            </button>
                        </div>

                        {/* Current theme note */}
                        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/50 rounded-xl px-4 py-3">
                            <Palette className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" strokeWidth={1.8} />
                            <p className="text-[12px] text-slate-500 dark:text-slate-400">
                                Currently using <span className="font-semibold text-slate-700 dark:text-slate-200">{theme === 'light' ? 'Light' : 'Dark'} Mode</span>. Your preference is saved locally and persists across sessions.
                            </p>
                        </div>
                    </SectionBody>
                </Section>

                {/* ══ DISPLAY NAME ══ */}
                <Section>
                    <SectionHeader
                        icon={User}
                        iconBg="bg-blue-50 dark:bg-blue-500/10"
                        iconColor="text-blue-600 dark:text-blue-400"
                        title="Display Name"
                        subtitle="Update how your name appears throughout the app"
                    />
                    <SectionBody>
                        <Field
                            label="New Display Name" id="name"
                            value={name}
                            onChange={v => { setName(v); setNameError(''); setNameSaved(false); }}
                            placeholder="e.g. Juan Dela Cruz"
                            error={nameError}
                            hint="This name will be shown in the sidebar and activity logs."
                        />

                        <div className="flex items-center gap-3 pt-1">
                            <SaveBtn onClick={handleUpdateName} loading={savingName} label="Save Name" />
                            {nameSaved && (
                                <div className="flex items-center gap-1.5 text-[12px] font-semibold text-emerald-600 dark:text-emerald-400 animate-in fade-in slide-in-from-left-2 duration-300">
                                    <CheckCircle2 className="w-4 h-4" strokeWidth={2} />
                                    Name updated!
                                </div>
                            )}
                        </div>
                    </SectionBody>
                </Section>

                {/* ══ PASSWORD ══ */}
                <Section>
                    <SectionHeader
                        icon={Lock}
                        iconBg="bg-violet-50 dark:bg-violet-500/10"
                        iconColor="text-violet-600 dark:text-violet-400"
                        title="Change Password"
                        subtitle="Use a strong password of at least 8 characters"
                    />
                    <SectionBody>
                        {/* Current password */}
                        <Field
                            label="Current Password" id="currentPw"
                            value={currentPw}
                            onChange={v => { setCurrentPw(v); setPwErrors(e => ({ ...e, currentPw: '' })); }}
                            placeholder="Enter your current password"
                            showToggle={showCurrent} onToggle={() => setShowCurrent(s => !s)}
                            error={pwErrors.currentPw}
                        />

                        {/* Divider */}
                        <div className="border-t border-slate-100 dark:border-slate-800/60 pt-1" />

                        {/* New password + strength */}
                        <div className="space-y-2">
                            <Field
                                label="New Password" id="newPw"
                                value={newPw}
                                onChange={v => { setNewPw(v); setPwErrors(e => ({ ...e, newPw: '' })); }}
                                placeholder="Minimum 8 characters"
                                showToggle={showNew} onToggle={() => setShowNew(s => !s)}
                                error={pwErrors.newPw}
                            />
                            <StrengthBar password={newPw} />
                        </div>

                        {/* Confirm new password */}
                        <div className="space-y-1.5">
                            <div className="group">
                                <label className="text-[10.5px] font-bold tracking-widest uppercase text-slate-400 dark:text-slate-500 select-none transition-colors group-focus-within:text-[#19376D] dark:group-focus-within:text-[#A5D7E8] block mb-1.5">
                                    Confirm New Password
                                </label>
                                <div className="relative">
                                    <Input
                                        id="confirmPw"
                                        type={showConfirm ? 'text' : 'password'}
                                        value={confirmPw}
                                        onChange={e => { setConfirmPw(e.target.value); setPwErrors(er => ({ ...er, confirmPw: '' })); }}
                                        placeholder="Re-enter new password"
                                        className={`h-10 text-[13.5px] font-medium rounded-lg transition-all pr-10
                                            bg-white dark:bg-slate-900/50
                                            text-slate-800 dark:text-slate-100
                                            placeholder:text-slate-300 dark:placeholder:text-slate-600
                                            hover:border-slate-300 dark:hover:border-slate-600
                                            focus-visible:ring-2
                                            ${pwErrors.confirmPw
                                                ? 'border-rose-400 focus-visible:ring-rose-300/30'
                                                : pwMatch
                                                    ? 'border-emerald-400 dark:border-emerald-500/60 focus-visible:ring-emerald-300/30'
                                                    : 'border-slate-200 dark:border-slate-700/60 focus-visible:ring-[#19376D]/20 dark:focus-visible:ring-[#576CBC]/30 focus-visible:border-[#19376D]/50'
                                            }`}
                                    />
                                    <button type="button" onClick={() => setShowConfirm(s => !s)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors">
                                        {showConfirm ? <EyeOff className="w-4 h-4" strokeWidth={1.8} /> : <Eye className="w-4 h-4" strokeWidth={1.8} />}
                                    </button>
                                    {/* Match indicator inside input */}
                                    {pwMatch && (
                                        <div className="absolute right-9 top-1/2 -translate-y-1/2">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500" strokeWidth={2.5} />
                                        </div>
                                    )}
                                </div>
                                {pwErrors.confirmPw && (
                                    <p className="flex items-center gap-1.5 text-[11px] text-rose-500 font-medium mt-1.5">
                                        <AlertCircle className="w-3 h-3 shrink-0" strokeWidth={2} />{pwErrors.confirmPw}
                                    </p>
                                )}
                                {pwMatch && !pwErrors.confirmPw && (
                                    <p className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1.5">
                                        <CheckCircle2 className="w-3 h-3 shrink-0" strokeWidth={2.5} />Passwords match
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Security tip */}
                        <div className="flex items-start gap-3 bg-violet-50 dark:bg-violet-500/8 border border-violet-200/60 dark:border-violet-500/20 rounded-xl px-4 py-3">
                            <Shield className="w-4 h-4 text-violet-500 dark:text-violet-400 shrink-0 mt-0.5" strokeWidth={1.8} />
                            <p className="text-[11.5px] text-violet-700 dark:text-violet-300 leading-relaxed">
                                <span className="font-bold">Security tip —</span> Use a mix of uppercase, lowercase, and numbers. Avoid reusing passwords from other sites.
                            </p>
                        </div>

                        <SaveBtn
                            onClick={handleUpdatePassword}
                            loading={savingPw}
                            label="Change Password"
                            disabled={newPw && confirmPw && !pwMatch}
                        />
                    </SectionBody>
                </Section>

            </div>
        </div>
    );
};

export default Settings;