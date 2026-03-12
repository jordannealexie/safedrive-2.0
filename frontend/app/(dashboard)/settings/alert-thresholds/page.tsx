'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Save, Zap, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { settingsApi } from '@/lib/api';

export default function AlertThresholdsPage() {
    const [drowsinessConfidence, setDrowsinessConfidence] = useState(75);
    const [continuousDuration, setContinuousDuration] = useState(3);
    const [baselineDeviation, setBaselineDeviation] = useState(30);
    const [motionRequirement, setMotionRequirement] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        settingsApi.get().then(s => {
            setDrowsinessConfidence(s.alertThresholds.drowsinessConfidence);
            setContinuousDuration(s.alertThresholds.continuousDrowsinessDuration);
            setBaselineDeviation(s.alertThresholds.baselineDeviationThreshold);
            setMotionRequirement(s.alertThresholds.motionRequirement);
        }).catch(() => {});
    }, []);

    const save = async () => {
        setSaving(true);
        try {
            await settingsApi.updateSection('alertThresholds', {
                drowsinessConfidence,
                continuousDrowsinessDuration: continuousDuration,
                baselineDeviationThreshold: baselineDeviation,
                motionRequirement,
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
                    <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">Alert Thresholds</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Fine-tune AI detection sensitivity and escalation rules.</p>
                </div>
                <Button onClick={save} disabled={saving} className="bg-brand-red hover:bg-brand-red/90 h-10 px-6 font-bold shadow-lg shadow-brand-red/20 gap-2 text-white">
                    <Save className="w-4 h-4" /> {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Thresholds'}
                </Button>
            </div>

            <Card className="border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden ring-1 ring-slate-200 dark:ring-slate-800">
                <CardHeader className="p-8 border-b dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20">
                    <CardTitle className="text-xl font-black flex items-center gap-2 dark:text-white">
                        <Zap className="w-5 h-5 text-brand-yellow" />
                        Detection Sensitivity
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="font-bold text-slate-800 dark:text-slate-200">Drowsiness Confidence</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Minimum score from facial landmark analysis to trigger alert.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <Input type="number" value={drowsinessConfidence} onChange={e => setDrowsinessConfidence(Number(e.target.value))} className="w-20 font-bold text-center h-10 dark:bg-slate-800 dark:border-slate-700" />
                                <span className="text-sm font-bold text-slate-400">%</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="font-bold text-slate-800 dark:text-slate-200">Continuous Drowsiness Duration</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Consecutive seconds of drowsiness before escalating to buzzer/OLED alarm.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <Input type="number" value={continuousDuration} onChange={e => setContinuousDuration(Number(e.target.value))} className="w-20 font-bold text-center h-10 dark:bg-slate-800 dark:border-slate-700" />
                                <span className="text-sm font-bold text-slate-400">Sec</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="font-bold text-slate-800 dark:text-slate-200">Baseline Deviation Threshold</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">% deviation from session baseline behavior before flagging anomaly.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <Input type="number" value={baselineDeviation} onChange={e => setBaselineDeviation(Number(e.target.value))} className="w-20 font-bold text-center h-10 dark:bg-slate-800 dark:border-slate-700" />
                                <span className="text-sm font-bold text-slate-400">%</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="font-bold text-slate-800 dark:text-slate-200">Motion Requirement (MPU-6050)</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Only trigger alarms when accelerometer confirms vehicle is moving.</p>
                            </div>
                            <button onClick={() => setMotionRequirement(!motionRequirement)} className={cn(
                                "w-12 h-6 rounded-full relative cursor-pointer shadow-inner transition-colors",
                                motionRequirement ? "bg-brand-red" : "bg-slate-200 dark:bg-slate-700"
                            )}>
                                <div className={cn(
                                    "w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-md transition-all flex items-center justify-center",
                                    motionRequirement ? "right-0.5" : "left-0.5"
                                )}>
                                    {motionRequirement && <span className="text-[6px] font-black text-brand-red">ON</span>}
                                </div>
                            </button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden ring-1 ring-slate-200 dark:ring-slate-800">
                <CardHeader className="p-8 border-b dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20">
                    <CardTitle className="text-xl font-black flex items-center gap-2 dark:text-white">
                        <AlertTriangle className="w-5 h-5 text-brand-orange" />
                        Escalation Levels
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 space-y-4">
                            <div className="flex items-center justify-between">
                                <Badge className="bg-brand-yellow text-slate-900 font-black h-5 text-[10px] uppercase">Level 1: Warning</Badge>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right leading-none">Standard Protocol</span>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">Triggered upon initial drowsiness detection. OLED displays visual warning and dashboard logs the event.</p>
                        </div>

                        <div className="p-6 rounded-2xl bg-brand-red/5 dark:bg-brand-red/10 border border-brand-red/10 space-y-4">
                            <div className="flex items-center justify-between">
                                <Badge className="bg-brand-red text-white font-black h-5 text-[10px] uppercase">Level 2: Critical</Badge>
                                <span className="text-[10px] font-bold text-brand-red/60 uppercase tracking-widest text-right leading-none">Emergency Protocol</span>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium text-brand-red/90 dark:text-brand-red/80">Triggered if drowsiness persists beyond threshold. Activates buzzer alarm and OLED alert. Only triggers when MPU-6050 confirms vehicle is in motion.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
