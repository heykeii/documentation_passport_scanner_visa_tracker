import React from 'react'
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import AuthLeftPanel from "@/components/auth/AuthLeftPanel";
import { signupSchema, checkPasswordStrength } from "@/schemas/authSchema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
const Signup = () => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
        },
        mode: "onBlur",
    });

    const handlePasswordChange = (value) => {
        if (value) {
            setPasswordStrength(checkPasswordStrength(value));
        }
        else{
            setPasswordStrength(null);
        }
    };

    const onSubmit = async(data) => {
        setIsLoading(true);
        try {
            const response = await axios.post("http://localhost:3000/api/auth/signup", {
                email: data.email,
                password: data.password,
                name: data.name,
                role: "documentation",

            });

            //store token
            localStorage.setItem("authToken", response.data.token);
            localStorage.setItem("user", JSON.stringify(response.data.user));

            toast.success("Account Registered Successfully!");
            navigate("/dashboard");





        } catch (error) {
           const errorMessage = error.response?.data?.error || "Signup Failed. Please Try Again.";
           toast.error(errorMessage); 
        }
        finally{
            setIsLoading(false);
        }
    }

  return (
    <div className="flex min-h-screen overflow-hidden bg-slate-900">
      {/* Left Panel */}
      <AuthLeftPanel />

      {/* Right Panel */}
      <div className="flex-1 bg-white flex items-center justify-center px-8 py-10 relative overflow-y-auto">
        
        {/* Background decorative blobs */}
        <div className="absolute top-0 right-0 w-125 h-125 rounded-full bg-indigo-400/5 blur-[80px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-100 h-100 rounded-full bg-indigo-400/5 blur-[80px] pointer-events-none" />

        {/* Card */}
        <div className="w-full max-w-[520px] bg-white/90 backdrop-blur-sm rounded-[28px] p-10 shadow-[0_32px_80px_rgba(11,36,71,0.10),0_4px_24px_rgba(11,36,71,0.06)] border border-white relative z-10">
          
          {/* Step pills */}
          <div className="flex gap-1.5 mb-8">
            <div className="h-0.75 w-8 rounded-full bg-linear-to-r from-[#19376D] to-indigo-500" />
            <div className="h-0.75 w-5 rounded-full bg-slate-200" />
            <div className="h-0.75 w-5 rounded-full bg-slate-200" />
          </div>

          {/* Header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 text-[11px] font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              Documentation Portal
            </div>
            <h2 className="font-[Outfit] text-[28px] font-700 text-slate-900 leading-tight mb-2">
              Create Your Account
            </h2>
            <p className="text-[14px] text-slate-500 font-light leading-relaxed">
              Join the system to start tracking and documenting passenger records.
            </p>
          </div>

          {/* Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* Name Field */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11.5px] font-semibold text-slate-500 uppercase tracking-[0.08em]">
                      Full Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="e.g. Juan dela Cruz"
                        className="h-12 px-4 text-[14px] text-slate-800 placeholder:text-slate-400 border border-slate-200 rounded-[12px] bg-slate-50/80 focus-visible:bg-white focus-visible:border-indigo-400 focus-visible:ring-indigo-400/20 focus-visible:ring-[3px] transition-all"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-[11px]" />
                  </FormItem>
                )}
              />

              {/* Email Field */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11.5px] font-semibold text-slate-500 uppercase tracking-[0.08em]">
                      Email Address
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="name@organization.com"
                        className="h-12 px-4 text-[14px] text-slate-800 placeholder:text-slate-400 border border-slate-200 rounded-[12px] bg-slate-50/80 focus-visible:bg-white focus-visible:border-indigo-400 focus-visible:ring-indigo-400/20 focus-visible:ring-[3px] transition-all"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-[11px]" />
                  </FormItem>
                )}
              />

              {/* Password Field */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11.5px] font-semibold text-slate-500 uppercase tracking-[0.08em]">
                      Password
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a strong password"
                          className="h-12 px-4 pr-12 text-[14px] text-slate-800 placeholder:text-slate-400 border border-slate-200 rounded-[12px] bg-slate-50/80 focus-visible:bg-white focus-visible:border-indigo-400 focus-visible:ring-indigo-400/20 focus-visible:ring-[3px] transition-all w-full"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            handlePasswordChange(e.target.value);
                          }}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 text-slate-400 hover:text-indigo-500 hover:bg-transparent"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" strokeWidth={1.8} />
                          ) : (
                            <Eye className="w-4 h-4" strokeWidth={1.8} />
                          )}
                        </Button>
                      </div>
                    </FormControl>

                    {/* Strength bar */}
                    {field.value && (
                      <div className="mt-2">
                        <div className="flex gap-1.5">
                          <div className={`flex-1 h-1 rounded-full transition-colors duration-300 ${passwordStrength?.level === "weak" ? "bg-red-400" : passwordStrength?.level === "fair" ? "bg-amber-400" : "bg-emerald-400"}`} />
                          <div className={`flex-1 h-1 rounded-full transition-colors duration-300 ${["fair", "strong"].includes(passwordStrength?.level) ? passwordStrength?.level === "fair" ? "bg-amber-400" : "bg-emerald-400" : "bg-slate-200"}`} />
                          <div className={`flex-1 h-1 rounded-full transition-colors duration-300 ${passwordStrength?.level === "strong" ? "bg-emerald-400" : "bg-slate-200"}`} />
                        </div>
                        <p className="text-[11px] mt-1.5">
                          {passwordStrength?.level === "weak" && <span className="text-red-500">Weak — try adding uppercase letters, numbers, or symbols.</span>}
                          {passwordStrength?.level === "fair" && <span className="text-amber-500">Fair — getting stronger, keep going!</span>}
                          {passwordStrength?.level === "strong" && <span className="text-emerald-500">Strong password ✓</span>}
                        </p>
                      </div>
                    )}
                    <FormMessage className="text-[11px]" />
                  </FormItem>
                )}
              />

              {/* Role Badge */}
              <div>
                <p className="text-[11.5px] font-semibold text-slate-500 uppercase tracking-[0.08em] mb-2">
                  Role
                </p>
                <div className="flex items-center gap-3 bg-indigo-50/80 border border-indigo-100 rounded-[12px] px-4 h-12 text-indigo-600">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-current fill-none shrink-0" strokeWidth={1.8}>
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                  <span className="flex-1 text-[14px] font-medium text-indigo-700">
                    Documentation Officer
                  </span>
                  <span className="text-[10.5px] font-semibold bg-indigo-100 text-indigo-600 px-2.5 py-1 rounded-full tracking-wide">
                    FIXED
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 mt-2 bg-gradient-to-r from-[#19376D] to-indigo-500 text-white font-[Outfit] text-[15px] font-semibold rounded-[14px] hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/30 active:translate-y-0 transition-all duration-200 shadow-lg shadow-indigo-500/20 disabled:opacity-50"
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>

              {/* Divider */}
              <div className="flex items-center gap-3 text-slate-400 text-[12px]">
                <div className="flex-1 h-px bg-slate-200" />
                <span>OR</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* Sign in link */}
              <p className="text-center text-[13.5px] text-slate-500">
                Already have an account?{" "}
                <Link to="/login" className="text-indigo-500 font-semibold hover:underline">
                  Sign In
                </Link>
              </p>
            </form>
          </Form>
        </div>
      </div>
    </div>
  )
}

export default Signup
