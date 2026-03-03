import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { z } from 'zod';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import AuthLeftPanel from '@/components/auth/AuthLeftPanel';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const forgotPasswordSchema = z.object({
    email: z.string().min(1, "Email is required").email("Invalid email address"),
});

const ForgotPassword = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const form = useForm({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: { email: "" },
        mode: "onBlur",
    });

    const onSubmit = async (data) => {
        setIsLoading(true);
        try {
            await axios.post("http://localhost:3000/api/auth/forgot-password", {
                email: data.email,
            });
            setSubmitted(true);
            toast.success("Reset link sent! Check your email.");
        } catch (error) {
            const errorMessage = error.response?.data?.error || "Request failed. Please try again.";
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

                <div className="w-full max-w-130 bg-white/90 backdrop-blur-sm rounded-[28px] p-10 shadow-[0_32px_80px_rgba(11,36,71,0.10),0_4px_24px_rgba(11,36,71,0.06)] border border-white relative z-10">

                    {!submitted ? (
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
                                    Forgot Password?
                                </h2>
                                <p className='text-[14px] text-slate-500 font-light leading-relaxed'>
                                    Enter your registered email and we'll send you a password reset link.
                                </p>
                            </div>

                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-5'>
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className='text-[11.5px] font-semibold text-slate-500 uppercase tracking-[0.08em]'>
                                                    Email Address
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="email"
                                                        placeholder="name@organization.com"
                                                        className='h-12 px-4 text-[14px] text-slate-800 placeholder:text-slate-400 border border-slate-200 rounded-2xl bg-slate-50/80 focus-visible:bg-white focus-visible:border-indigo-400 focus-visible:ring-indigo-400/20 focus-visible:ring-[3px] transition-all'
                                                        {...field}
                                                    />
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
                                        {isLoading ? "Sending..." : "Send Reset Link"}
                                    </Button>
                                </form>
                            </Form>

                            <div className='mt-6 flex items-center justify-end'>
                                <Link to='/' className='inline-flex items-center gap-1.5 text-[13px] text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer'>
                                    <ArrowLeft className='w-3.5 h-3.5' />
                                    Back to Login
                                </Link>
                            </div>
                        </>
                    ) : (
                        <div className='flex flex-col items-center justify-center text-center gap-6'>
                            <div className='flex gap-1.5 mb-4 w-full'>
                                <div className='h-0.75 flex-1 rounded-full bg-linear-to-r from-[#19376D] to-indigo-500' />
                                <div className='h-0.75 flex-1 rounded-full bg-slate-200' />
                            </div>

                            <div>
                                <div className='inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 text-[11px] font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-4'>
                                    <span className='w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse' />
                                    Check Email
                                </div>
                                <h2 className='font-[Outfit] text-[28px] font-700 text-slate-900 leading-tight mb-2'>
                                    Check your Email
                                </h2>
                                <p className='text-[14px] text-slate-500 font-light leading-relaxed'>
                                    If your email is registered, a password reset link has been sent. The link expires in 1 hour.
                                </p>
                            </div>

                            <Link to='/' className='w-full cursor-pointer'>
                                <Button className='w-full h-12 bg-linear-to-r from-[#19376D] to-indigo-500 hover:shadow-lg font-[Outfit] text-[14px] font-600 cursor-pointer'>
                                    Back to Login
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;