import React from 'react';
import { Settings as SettingsIcon, Moon, Sun, Monitor } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/contexts/ThemeContext';

const Settings = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <div className="max-w-4xl mx-auto font-[Outfit] space-y-6">
            {/* Appearance */}
            <Card className="border bg-white dark:bg-transparent border-slate-200 dark:border-[#576CBC]/20 shadow-sm dark:shadow-none">
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-[10px] flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, #0B2447, #19376D)' }}>
                            {theme === 'dark' ? <Moon className="w-5 h-5 text-white" strokeWidth={1.8} /> : <Sun className="w-5 h-5 text-white" strokeWidth={1.8} />}
                        </div>
                        <div>
                            <CardTitle className="text-[15px] font-semibold text-[#0B2447] dark:text-white font-[Outfit]">
                                Appearance
                            </CardTitle>
                            <CardDescription className="text-[12px] text-slate-500 dark:text-[#A5D7E8]/50 font-[Outfit]">
                                Customize how the dashboard looks
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <Separator className="bg-slate-200 dark:bg-[#A5D7E8]/10" />
                <CardContent className="pt-5 pb-6">
                    <div className="space-y-4">
                        <div>
                            <label className="text-[13px] font-medium text-[#0B2447] dark:text-white font-[Outfit] block mb-3">
                                Theme Mode
                            </label>
                            <div className="flex items-center gap-3">
                                <Button
                                    onClick={toggleTheme}
                                    variant={theme === 'light' ? 'default' : 'outline'}
                                    className={`cursor-pointer flex-1 h-auto py-3.5 px-4 rounded-[10px] font-[Outfit] text-[13px] font-medium transition-all ${
                                        theme === 'light'
                                            ? 'bg-gradient-to-r from-[#0B2447] to-[#19376D] text-white border-0'
                                            : 'border-[#576CBC]/25 dark:border-[#A5D7E8]/20 text-slate-500 dark:text-[#A5D7E8]/60 hover:bg-[#576CBC]/5 dark:hover:bg-white/5'
                                    }`}
                                >
                                    <Sun className="w-4 h-4 mr-2" strokeWidth={1.8} />
                                    Light Mode
                                    {theme === 'light' && <Badge className="ml-auto bg-white/20 text-white border-0 text-[10px] px-2 py-0">Active</Badge>}
                                </Button>
                                <Button
                                    onClick={toggleTheme}
                                    variant={theme === 'dark' ? 'default' : 'outline'}
                                    className={`cursor-pointer flex-1 h-auto py-3.5 px-4 rounded-[10px] font-[Outfit] text-[13px] font-medium transition-all ${
                                        theme === 'dark'
                                            ? 'bg-gradient-to-r from-[#0B2447] to-[#19376D] text-white border-0'
                                            : 'border-[#576CBC]/25 dark:border-[#A5D7E8]/20 text-slate-500 dark:text-[#A5D7E8]/60 hover:bg-[#576CBC]/5 dark:hover:bg-white/5'
                                    }`}
                                >
                                    <Moon className="w-4 h-4 mr-2" strokeWidth={1.8} />
                                    Dark Mode
                                    {theme === 'dark' && <Badge className="ml-auto bg-white/20 text-white border-0 text-[10px] px-2 py-0">Active</Badge>}
                                </Button>
                            </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-[#576CBC]/10 border border-slate-200 dark:border-[#576CBC]/20 rounded-[10px] p-4">
                            <p className="text-[12px] text-slate-600 dark:text-[#A5D7E8]/60 font-[Outfit]">
                                <strong className="font-semibold text-[#0B2447] dark:text-white">Current Theme:</strong> {theme === 'light' ? 'Light Mode' : 'Dark Mode'}
                            </p>
                            <p className="text-[11.5px] text-slate-500 dark:text-[#A5D7E8]/50 font-[Outfit] mt-1.5">
                                Your preference is saved locally and will persist across sessions.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Other Settings */}
            <Card className="border bg-white dark:bg-transparent border-slate-200 dark:border-[#576CBC]/20 shadow-sm dark:shadow-none">
                <CardHeader className="text-center pt-12 pb-6">
                    <div className="w-16 h-16 mx-auto rounded-[14px] flex items-center justify-center mb-4"
                        style={{ background: 'linear-gradient(135deg, #0B2447, #19376D)' }}>
                        <SettingsIcon className="w-8 h-8 text-white" strokeWidth={1.8} />
                    </div>
                    <CardTitle className="text-[18px] font-semibold text-[#0B2447] dark:text-white font-[Outfit]">Additional Settings</CardTitle>
                    <CardDescription className="text-[13px] text-slate-500 dark:text-[#A5D7E8]/60 font-[Outfit] mt-2">
                        More configuration options coming soon
                    </CardDescription>
                </CardHeader>
                <CardContent className="pb-12 text-center">
                    <p className="text-[12.5px] text-slate-400 dark:text-[#A5D7E8]/50 font-[Outfit]">
                        Future features:
                    </p>
                    <ul className="mt-4 space-y-2 text-[12px] text-slate-500 dark:text-[#A5D7E8]/60 font-[Outfit] text-left max-w-md mx-auto">
                        <li>• Profile management</li>
                        <li>• Password change</li>
                        <li>• Notification preferences</li>
                        <li>• Security settings</li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
};

export default Settings;
