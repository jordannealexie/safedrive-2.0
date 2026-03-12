'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, Bell, Smartphone, Mail, ShieldAlert } from "lucide-react";

export default function NotificationsSettingsPage() {
    return (
        <div className="space-y-8 pb-12">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">Notification Channels</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Manage how alerts are delivered to operators and drivers.</p>
                </div>
                <Button className="bg-brand-red hover:bg-brand-red/90 h-10 px-6 font-bold shadow-lg shadow-brand-red/20 gap-2 text-white">
                    <Save className="w-4 h-4" /> Save Preferences
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
                        <div className="w-12 h-6 bg-brand-red rounded-full relative cursor-pointer shadow-inner">
                            <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5 shadow-md flex items-center justify-center">
                                <span className="text-[6px] font-black text-brand-red">ON</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="font-bold text-slate-800 dark:text-slate-200">OLED Status Display</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Show warning messages on the device screen.</p>
                        </div>
                        <div className="w-12 h-6 bg-brand-red rounded-full relative cursor-pointer shadow-inner">
                            <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5 shadow-md flex items-center justify-center">
                                <span className="text-[6px] font-black text-brand-red">ON</span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t dark:border-slate-800">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Preview Message</p>
                        <Input defaultValue="WAKE UP! TAKE A BREAK" className="max-w-md h-12 dark:bg-slate-900 dark:border-slate-800 font-mono text-sm font-bold uppercase border-slate-200" />
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
                        <div className="w-12 h-6 bg-slate-200 dark:bg-slate-700 rounded-full relative cursor-pointer shadow-inner">
                            <div className="w-5 h-5 bg-white dark:bg-slate-500 rounded-full absolute left-0.5 top-0.5 shadow-md" />
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="font-bold text-slate-800 dark:text-slate-200">Email Summaries</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Daily digest of fleet security violations.</p>
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
