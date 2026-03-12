'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Save, Clock, Coffee, AlertCircle } from "lucide-react";
import { settingsApi } from '@/lib/api';

export default function DriverRulesPage() {
    const [maxDriving, setMaxDriving] = useState(4);
    const [restBlock, setRestBlock] = useState(15);
    const [gracePeriod, setGracePeriod] = useState(10);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        settingsApi.get().then(s => {
            setMaxDriving(s.driverRules.maxContinuousDriving);
            setRestBlock(s.driverRules.mandatoryRestingBlock);
            setGracePeriod(s.driverRules.alertGracePeriod);
        }).catch(() => {});
    }, []);

    const save = async () => {
        setSaving(true);
        try {
            await settingsApi.updateSection('driverRules', {
                maxContinuousDriving: maxDriving,
                mandatoryRestingBlock: restBlock,
                alertGracePeriod: gracePeriod,
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
                    <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">Driver Safety Rules</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Compliance parameters for operational endurance and rest.</p>
                </div>
                <Button onClick={save} disabled={saving} className="bg-brand-red hover:bg-brand-red/90 h-10 px-6 font-bold shadow-lg shadow-brand-red/20 gap-2 text-white">
                    <Save className="w-4 h-4" /> {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Rules'}
                </Button>
            </div>

            <Card className="border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden ring-1 ring-slate-200 dark:ring-slate-800">
                <CardHeader className="p-8 border-b dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20">
                    <CardTitle className="text-xl font-black flex items-center gap-2 dark:text-white">
                        <Clock className="w-5 h-5 text-brand-orange" />
                        Shift Duration Limits
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="font-bold text-slate-800 dark:text-slate-200">Max Continuous Driving</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Hours of operation allowed before mandatory rest.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <Input type="number" value={maxDriving} onChange={e => setMaxDriving(Number(e.target.value))} className="w-20 font-bold text-center h-10 dark:bg-slate-800 dark:border-slate-700" />
                                <span className="text-sm font-bold text-slate-400">Hrs</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="font-bold text-slate-800 dark:text-slate-200">Mandatory Resting Block</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Consecutive minutes of rest required between shifts.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <Input type="number" value={restBlock} onChange={e => setRestBlock(Number(e.target.value))} className="w-20 font-bold text-center h-10 dark:bg-slate-800 dark:border-slate-700" />
                                <span className="text-sm font-bold text-slate-400">Min</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden ring-1 ring-slate-200 dark:ring-slate-800">
                <CardHeader className="p-8 border-b dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20">
                    <CardTitle className="text-xl font-black flex items-center gap-2 dark:text-white">
                        <AlertCircle className="w-5 h-5 text-brand-red" />
                        Compliance Escalation
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                Alert Grace Period
                                <Badge className="bg-red-100 text-brand-red border-none h-5 text-[10px] font-black tracking-widest uppercase">Safety Override</Badge>
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Minutes allowed to find parking after violation occurs.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Input type="number" value={gracePeriod} onChange={e => setGracePeriod(Number(e.target.value))} className="w-20 font-bold text-center h-10 dark:bg-slate-800 dark:border-slate-700" />
                            <span className="text-sm font-bold text-slate-400">Min</span>
                        </div>
                    </div>

                    <div className="pt-6 border-t dark:border-slate-800">
                        <div className="p-5 rounded-2xl bg-slate-900 text-white flex items-start gap-4 shadow-xl">
                            <Coffee className="w-6 h-6 text-brand-yellow shrink-0 mt-1" />
                            <div className="space-y-1">
                                <p className="font-black text-sm uppercase tracking-tight">System Enforcement: Active</p>
                                <p className="text-[10px] text-slate-400 font-bold leading-relaxed uppercase tracking-widest">
                                    Exceeding grace period will trigger automatic &quot;Rest Mandatory&quot; message to vehicle display and notify administrative supervisors immediately.
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
