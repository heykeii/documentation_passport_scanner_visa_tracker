import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { z } from 'zod';
import { toast } from 'sonner';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import AuthLeftPanel from '@/components/auth/AuthLeftPanel';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const resetPasswordSchema = z.object({
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Must contain at least one uppercase letter")
        .regex(/[0-9]/, "Must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const form = useForm({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: { password: "", confirmPassword: "" },
        mode: "onBlur",
    });

    const onSubmit = async (data) => {
        const token = searchParams.get('token');
        if (!token) {
            toast.error("Reset token is missing. Please use the link from your email.");
            return;
        }

        setIsLoading(true);
        try {
            await axios.post("http://localhost:3000/api/auth/reset-password", {
                token,
                password: data.password,
            });

            setSuccess(true);
            toast.success("Password reset successfully!");

            setTimeout(() => navigate('/'), 3000);

        } catch (error) {
            const errorMessage = error.response?.data?.error || "Password reset failed. The link may have expired.";
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className='flex min-h-screen overflow-hidden bg-slate-900'>
            <AuthLeftPanel />
            <div className='flex-1 bg-white flex items-center justify-center px-8 py-10 relative overflow-y-auto'>
                <div className="absolute top-0 right-0 w-125 h-125 rounded-full bg-indigo-400/5 blur-[80px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-100 h-100 rounded-full bg-indigo-400/5 blur-[80px] pointer-events-none" />

                <div className='w-full max-w-130 bg-white/90 backdrop-blur-sm rounded-[28px] p-10 shadow-[0_32px_80px_rgba(11,36,71,0.10),0_4px_24px_rgba(11,36,71,0.06)] border border-white relative z-10'>

                    {!success ? (
                        <>
                            <div className='flex gap-1.5 mb-8'>
                                <div className='h-0.75 w-8 rounded-full bg-linear-to-r from-[#19376D] to-indigo-500' />
                                <div className='h-0.75 w-5 rounded-full bg-slate-200' />
                            </div>

                            <div className='mb-8'>
                                <div className='inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 text-[11px] font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-4'>
                                    <span className='w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse' />
                                    Password Recovery
                                </div>
                                <h2 className='font-[Outfit] text-[28px] font-700 text-slate-900 leading-tight mb-2'>
                                    Set New Password
                                </h2>
                                <p className='text-[14px] text-slate-500 font-light leading-relaxed'>
                                    Choose a strong new password for your account.
                                </p>
                            </div>

                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-5'>
                                    {/* New Password */}
                                    <FormField
                                        control={form.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className='text-[11.5px] font-semibold text-slate-500 uppercase tracking-[0.08em]'>
                                                    New Password
                                                </FormLabel>
                                                <FormControl>
                                                    <div className='relative'>
                                                        <Input
                                                            type={showPassword ? "text" : "password"}
                                                            placeholder="Min. 8 characters"
                                                            className='h-12 px-4 pr-12 text-[14px] text-slate-800 placeholder:text-slate-400 border border-slate-200 rounded-2xl bg-slate-50/80 focus-visible:bg-white focus-visible:border-indigo-400 focus-visible:ring-indigo-400/20 focus-visible:ring-[3px] transition-all'
                                                            {...field}
                                                        />
                                                        <button
                                                            type='button'
                                                            onClick={() => setShowPassword(!showPassword)}
                                                            className='absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer'
                                                        >
                                                            {showPassword ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
                                                        </button>
                                                    </div>
                                                </FormControl>
                                                <FormMessage className='text-[11px]' />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Confirm Password */}
                                    <FormField
                                        control={form.control}
                                        name="confirmPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className='text-[11.5px] font-semibold text-slate-500 uppercase tracking-[0.08em]'>
                                                    Confirm Password
                                                </FormLabel>
                                                <FormControl>
                                                    <div className='relative'>
                                                        <Input
                                                            type={showConfirm ? "text" : "password"}
                                                            placeholder="Re-enter your password"
                                                            className='h-12 px-4 pr-12 text-[14px] text-slate-800 placeholder:text-slate-400 border border-slate-200 rounded-2xl bg-slate-50/80 focus-visible:bg-white focus-visible:border-indigo-400 focus-visible:ring-indigo-400/20 focus-visible:ring-[3px] transition-all'
                                                            {...field}
                                                        />
                                                        <button
                                                            type='button'
                                                            onClick={() => setShowConfirm(!showConfirm)}
                                                            className='absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer'
                                                        >
                                                            {showConfirm ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
                                                        </button>
                                                    </div>
                                                </FormControl>
                                                <FormMessage className='text-[11px]' />
                                            </FormItem>
                                        )}
                                    />

                                    <Button
                                        type="submit"
                                        disabled={isLoading}
                                        className='w-full h-12 bg-linear-to-r from-[#19376D] to-indigo-500 hover:shadow-lg font-[Outfit] text-[14px] font-600 cursor-pointer'
                                    >
                                        {isLoading ? "Resetting..." : "Reset Password"}
                                    </Button>
                                </form>
                            </Form>
                        </>
                    ) : (
                        <div className='flex flex-col items-center text-center gap-6'>
                            <CheckCircle className='w-16 h-16 text-green-500' />
                            <div>
                                <h2 className='font-[Outfit] text-[28px] font-700 text-slate-900 mb-2'>Password Reset!</h2>
                                <p className='text-[14px] text-slate-500 font-light'>
                                    Your password has been reset successfully. Redirecting to login in 3 seconds...
                                </p>
                            </div>
                            <Link to='/'>
                                <Button className='w-full h-12 bg-linear-to-r from-[#19376D] to-indigo-500 font-[Outfit] text-[14px] cursor-pointer'>
                                    Go to Login
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;