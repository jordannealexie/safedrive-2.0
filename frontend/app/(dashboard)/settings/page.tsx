'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { settingsApi } from '@/lib/api';

export default function GeneralSettingsPage() {
    const [timezone, setTimezone] = useState('Local');
    const [tempUnit, setTempUnit] = useState('Celsius');
    const [compact, setCompact] = useState(false);
    const [highContrast, setHighContrast] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        settingsApi.get().then(s => {
            setTimezone(s.general.timezone);
            setTempUnit(s.general.temperatureUnit);
            setCompact(s.general.compactDashboard);
            setHighContrast(s.general.highContrast);
        }).catch(() => {});
    }, []);

    const save = async () => {
        setSaving(true);
        try {
            await settingsApi.updateSection('general', {
                timezone, temperatureUnit: tempUnit,
                compactDashboard: compact, highContrast,
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (e) { console.error(e); }
        setSaving(false);
    };

    return (
        <div className="space-y-8 pb-12">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">General Configuration</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Core system parameters and device behavior.</p>
                </div>
                <Button onClick={save} disabled={saving} className="bg-brand-red hover:bg-brand-red/90 h-10 px-6 font-bold shadow-lg shadow-brand-red/20 gap-2 text-white">
                    <Save className="w-4 h-4" /> {saved ? 'Saved!' : saving ? 'Saving...' : 'Save General'}
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
                                    <button key={v} onClick={() => setTimezone(v)} className={cn(
                                        "px-4 py-1.5 rounded-lg text-xs font-black transition-all",
                                        v === timezone ? "bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-white" : "text-slate-400 dark:text-slate-500"
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
                                    <button key={v} onClick={() => setTempUnit(v)} className={cn(
                                        "px-4 py-1.5 rounded-lg text-xs font-black transition-all",
                                        v === tempUnit ? "bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-white" : "text-slate-400 dark:text-slate-500"
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
                        <button onClick={() => setCompact(!compact)} className={cn(
                            "w-12 h-6 rounded-full relative cursor-pointer shadow-inner transition-colors",
                            compact ? "bg-brand-red" : "bg-slate-200 dark:bg-slate-700"
                        )}>
                            <div className={cn(
                                "w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-md transition-all flex items-center justify-center",
                                compact ? "right-0.5" : "left-0.5"
                            )}>
                                {compact && <span className="text-[6px] font-black text-brand-red">ON</span>}
                            </div>
                        </button>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="font-bold text-slate-800 dark:text-slate-200">High Contrast Text</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Bolder appearance for mission-critical metrics.</p>
                        </div>
                        <button onClick={() => setHighContrast(!highContrast)} className={cn(
                            "w-12 h-6 rounded-full relative cursor-pointer shadow-inner transition-colors",
                            highContrast ? "bg-brand-red" : "bg-slate-200 dark:bg-slate-700"
                        )}>
                            <div className={cn(
                                "w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-md transition-all flex items-center justify-center",
                                highContrast ? "right-0.5" : "left-0.5"
                            )}>
                                {highContrast && <span className="text-[6px] font-black text-brand-red">ON</span>}
                            </div>
                        </button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
