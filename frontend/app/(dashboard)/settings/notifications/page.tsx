'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, Bell, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { settingsApi } from '@/lib/api';

export default function NotificationsSettingsPage() {
    const [vehicleBuzzer, setVehicleBuzzer] = useState(true);
    const [oledDisplay, setOledDisplay] = useState(true);
    const [previewMessage, setPreviewMessage] = useState('WAKE UP! TAKE A BREAK');
    const [browserAudio, setBrowserAudio] = useState(false);
    const [emailSummaries, setEmailSummaries] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        settingsApi.get().then(s => {
            setVehicleBuzzer(s.notifications.vehicleBuzzer);
            setOledDisplay(s.notifications.oledDisplay);
            setPreviewMessage(s.notifications.previewMessage);
            setBrowserAudio(s.notifications.browserAudio);
            setEmailSummaries(s.notifications.emailSummaries);
        }).catch(() => {});
    }, []);

    const save = async () => {
        setSaving(true);
        try {
            await settingsApi.updateSection('notifications', {
                vehicleBuzzer, oledDisplay, previewMessage,
                browserAudio, emailSummaries,
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (e) { console.error(e); }
        setSaving(false);
    };

    const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
        <button onClick={onChange} className={cn(
            "w-12 h-6 rounded-full relative cursor-pointer shadow-inner transition-colors",
            value ? "bg-brand-red" : "bg-slate-200 dark:bg-slate-700"
        )}>
            <div className={cn(
                "w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-md transition-all flex items-center justify-center",
                value ? "right-0.5" : "left-0.5"
            )}>
                {value && <span className="text-[6px] font-black text-brand-red">ON</span>}
            </div>
        </button>
    );

    return (
        <div className="space-y-8 pb-12">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">Notification Channels</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Manage how alerts are delivered to operators and drivers.</p>
                </div>
                <Button onClick={save} disabled={saving} className="bg-brand-red hover:bg-brand-red/90 h-10 px-6 font-bold shadow-lg shadow-brand-red/20 gap-2 text-white">
                    <Save className="w-4 h-4" /> {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Preferences'}
                </Button>
            </div>

            <Card className="border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden ring-1 ring-slate-200 dark:ring-slate-800">
                <CardHeader className="p-8 border-b dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20">
                    <CardTitle className="text-xl font-black flex items-center gap-2 dark:text-white">
                        <Smartphone className="w-5 h-5 text-brand-red" />
                        In-Device Hardware Alerts
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="font-bold text-slate-800 dark:text-slate-200">Vehicle Buzzer</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Physical haptic/audio feedback on the edge device.</p>
                        </div>
                        <Toggle value={vehicleBuzzer} onChange={() => setVehicleBuzzer(!vehicleBuzzer)} />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="font-bold text-slate-800 dark:text-slate-200">OLED Status Display</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Show warning messages on the device screen.</p>
                        </div>
                        <Toggle value={oledDisplay} onChange={() => setOledDisplay(!oledDisplay)} />
                    </div>

                    <div className="pt-4 border-t dark:border-slate-800">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Preview Message</p>
                        <Input value={previewMessage} onChange={e => setPreviewMessage(e.target.value)} className="max-w-md h-12 dark:bg-slate-900 dark:border-slate-800 font-mono text-sm font-bold uppercase border-slate-200" />
                    </div>
                </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden ring-1 ring-slate-200 dark:ring-slate-800">
                <CardHeader className="p-8 border-b dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20">
                    <CardTitle className="text-xl font-black flex items-center gap-2 dark:text-white">
                        <Bell className="w-5 h-5 text-brand-orange" />
                        Admin Dash Notifications
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="font-bold text-slate-800 dark:text-slate-200">Browser Audio Alerts</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Play siren sound on critical drowsiness detection.</p>
                        </div>
                        <Toggle value={browserAudio} onChange={() => setBrowserAudio(!browserAudio)} />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="font-bold text-slate-800 dark:text-slate-200">Email Summaries</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Daily digest of fleet security violations.</p>
                        </div>
                        <Toggle value={emailSummaries} onChange={() => setEmailSummaries(!emailSummaries)} />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
