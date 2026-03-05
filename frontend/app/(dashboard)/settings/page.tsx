'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Save,
    Tv
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function GeneralSettingsPage() {
    return (
        <div className="space-y-8 pb-12">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">General Configuration</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Core system parameters and device behavior.</p>
                </div>
                <Button className="bg-brand-red hover:bg-brand-red/90 h-10 px-6 font-bold shadow-lg shadow-brand-red/20 gap-2 text-white">
                    <Save className="w-4 h-4" /> Save General
                </Button>
            </div>

            <Card className="border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden ring-1 ring-slate-200 dark:ring-slate-800">
                <CardHeader className="p-8 border-b dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20">
                    <CardTitle className="text-xl font-black dark:text-white">Regional Settings</CardTitle>
                    <CardDescription className="text-slate-500 dark:text-slate-400 font-medium">Adjust localization and display preferences.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                    <div className="space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-1">
                                <p className="font-bold text-slate-800 dark:text-slate-200">System Timezone</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Used for log timestamps and reporting periods.</p>
                            </div>
                            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                                {['UTC', 'Auto', 'Local'].map((v) => (
                                    <button key={v} className={cn(
                                        "px-4 py-1.5 rounded-lg text-xs font-black transition-all",
                                        v === 'Local' ? "bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-white" : "text-slate-400 dark:text-slate-500"
                                    )}>
                                        {v}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-1">
                                <p className="font-bold text-slate-800 dark:text-slate-200">Default Temperature Unit</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Shown in system status and device health.</p>
                            </div>
                            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                                {['Celsius', 'Fahrenheit'].map((v) => (
                                    <button key={v} className={cn(
                                        "px-4 py-1.5 rounded-lg text-xs font-black transition-all",
                                        v === 'Celsius' ? "bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-white" : "text-slate-400 dark:text-slate-500"
                                    )}>
                                        {v}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden ring-1 ring-slate-200 dark:ring-slate-800">
                <CardHeader className="p-8 border-b dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20">
                    <CardTitle className="text-xl font-black dark:text-white">Display Preferences</CardTitle>
                    <CardDescription className="text-slate-500 dark:text-slate-400 font-medium">Customize your administrative console experience.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="font-bold text-slate-800 dark:text-slate-200">Compact Dashboard View</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Reduces spacing between cards on the main overview.</p>
                        </div>
                        <div className="w-12 h-6 bg-slate-200 dark:bg-slate-700 rounded-full relative cursor-pointer shadow-inner">
                            <div className="w-5 h-5 bg-white dark:bg-slate-400 rounded-full absolute left-0.5 top-0.5 shadow-md" />
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="font-bold text-slate-800 dark:text-slate-200">High Contrast Text</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Bolder appearance for mission-critical metrics.</p>
                        </div>
                        <div className="w-12 h-6 bg-brand-red rounded-full relative cursor-pointer shadow-inner">
                            <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5 shadow-md flex items-center justify-center">
                                <span className="text-[6px] font-black text-brand-red">ON</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
