import React from 'react';
import { ScanLine } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const SmartScan = () => {
    return (
        <div className="max-w-4xl mx-auto font-[Outfit]">
            <Card className="border bg-white dark:bg-transparent border-slate-200 dark:border-[#576CBC]/20 shadow-sm dark:shadow-none">
                <CardHeader className="text-center pt-12 pb-6">
                    <div className="w-16 h-16 mx-auto rounded-[14px] flex items-center justify-center mb-4"
                        style={{ background: 'linear-gradient(135deg, #0B2447, #19376D)' }}>
                        <ScanLine className="w-8 h-8 text-white" strokeWidth={1.8} />
                    </div>
                    <CardTitle className="text-[18px] font-semibold text-[#0B2447] dark:text-white font-[Outfit]">Smart Scan</CardTitle>
                    <CardDescription className="text-[13px] text-slate-500 dark:text-[#A5D7E8]/60 font-[Outfit] mt-2">
                        AI-powered passport scanning and data extraction
                    </CardDescription>
                </CardHeader>
                <CardContent className="pb-12 text-center">
                    <p className="text-[12.5px] text-slate-400 dark:text-[#A5D7E8]/50 font-[Outfit]">
                        This page will include:
                    </p>
                    <ul className="mt-4 space-y-2 text-[12px] text-slate-500 dark:text-[#A5D7E8]/60 font-[Outfit] text-left max-w-md mx-auto">
                        <li>• View Pending Scans button to retrieve scanned data from mobile</li>
                        <li>• Manual passport entry form</li>
                        <li>• Group Mode for batch processing tours</li>
                        <li>• AI auto-fill for passport fields</li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
};

export default SmartScan;
