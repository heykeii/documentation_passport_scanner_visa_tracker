import React from 'react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import AuthLeftPanel from '@/components/auth/AuthLeftPanel'
import { loginSchema } from '@/schemas/authSchema'

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner';
import { email } from 'zod'

const Login = () => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
        mode: "onBlur",
    });

    const onSubmit = async (data) => {
        setIsLoading(true);
        try {
            const response = await axios.post("http://localhost:3000/api/auth/login", {
                email: data.email,
                password: data.password,
            });

            localStorage.setItem("authToken", response.data.token);
            localStorage.setItem("user", JSON.stringify(response.data.user));

            toast.success(`Welcome Back, ${response.data.user.name}!`);
            navigate("/dashboard");


        } catch (error) {
            const errorMessage = error.response?.data?.error || "Login Failed. Please Try Again.";
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
                    <div className='flex gap-1.5 mb-8'>
                        <div className='h-0.75 w-8 rounded-full bg-linear-to-r from-[#19376D] to-indigo-500' />
                        <div className='h-0.75 w-5 rounded-full bg-slate-200' />
                    </div>

                    <div className='mb-8'>
                        <div className='inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 text-[11px] font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-4'>
                            <span className='w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse' />
                            Documentation Visa Tracker
                        </div>
                        <h2 className='font-[Outfit] text-[28px] font-700 text-slate-900 leading-tight mb-2'>
                            Welcome Back
                        </h2>
                        <p className='text-[14px] text-slate-500 font-light leading-relaxed'>
                            Sign in to Continue Managing Passenger Records...
                        </p>
                    </div>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-5'>
                            {/**Email Field */}
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

                            {/**Password Field */}
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className='flex items-center justify-between mb-1'>
                                            <FormLabel className='text-[11.5px] font-semibold text-slate-500 uppercase tracking-[0.08em]'>
                                                Password
                                            </FormLabel>
                                            <a href='/forgot-password' className='text-[11.5px] text-indigo-500 font-medium hover:underline cursor-pointer'>
                                                Forgot password?
                                            </a>
                                        </div>
                                        <FormControl>
                                            <div className='relative'>
                                                <Input
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="Enter your password"
                                                    className='h-12 px-4 pr-12 text-[14px] text-slate-800 placeholder:text-slate-400 border border-slate-200 rounded-2xl bg-slate-50/80 focus-visible:border-indigo-400 focus-visible:ring-indigo-400/20 focus-visible:ring-[3px] transition-all w-full'
                                                    {...field}
                                                />
                                                <Button
                                                    type="button"
                                                    variant='ghost'
                                                    size='icon'
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className='absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 text-slate-400 hover:text-indigo-500 hover:bg-transparent cursor-pointer'

                                                >

                                                </Button>
                                            </div>
                                        </FormControl>
                                        <FormMessage className='text-[11px]' />
                                    </FormItem>
                                )}
                            />

                            {/**Submit Button */}
                            <Button
                                type='submit'
                                disabled={isLoading}
                                className='w-full h-12 mt-2 bg-linear-to-r from-[#19376D] to-indigo-500 text-white font-[Outfit] text-[15px] font-semibold rounded-[14px] hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/30 active:translate-y-0 transition-all duration-200 shadow-lg shadow-indigo-500/20 disabled:opacity-50 cursor-pointer'
                            >
                                {isLoading ? "Signing In..." : "SignIn"}
                            </Button>
                        </form>
                    </Form>
                </div>
            </div>
        </div>
    )
}
export default Login
