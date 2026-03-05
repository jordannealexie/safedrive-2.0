'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle2, UserCheck, ShieldAlert, Key } from "lucide-react";

const PERMISSIONS = [
    { label: 'View Live Monitoring', allowed: true },
    { label: 'Access Analytics & Reports', allowed: true },
    { label: 'Modify Alert Thresholds', allowed: true },
    { label: 'Manage Device Hardware', allowed: true },
    { label: 'Create New Users', allowed: false },
    { label: 'System Configuration', allowed: true },
];

export default function UserRolesPage() {
    return (
        <div className="space-y-8 pb-12">
            <div>
                <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">Access Control</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">RBAC configuration and administrative permissions.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-1 border-none shadow-sm bg-slate-900 text-white overflow-hidden relative group">
                    <div className="absolute right-[-20px] top-[-20px] opacity-10 group-hover:scale-110 transition-transform duration-500">
                        <Shield className="w-32 h-32 text-brand-red" />
                    </div>
                    <CardHeader className="p-8 pb-4">
                        <Badge className="bg-brand-red text-white border-none font-black h-5 text-[10px] uppercase w-fit tracking-widest">Active Role</Badge>
                        <CardTitle className="text-2xl font-black mt-4">Super Admin</CardTitle>
                        <CardDescription className="text-slate-400 font-medium leading-relaxed">System-wide ownership with full override capabilities.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 pt-0">
                        <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Security Clearance</span>
                            <span className="text-xs font-black text-brand-red underline">Lvl-4</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2 border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden ring-1 ring-slate-200 dark:ring-slate-800">
                    <CardHeader className="p-8 border-b dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-xl font-black dark:text-white">Permissions Ledger</CardTitle>
                                <CardDescription className="text-slate-500 dark:text-slate-400 font-medium">Detailed breakdown of active capabilities for current seat.</CardDescription>
                            </div>
                            <Key className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y dark:divide-slate-800">
                            {PERMISSIONS.map((perm) => (
                                <div key={perm.label} className="p-6 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                                    <span className="font-bold text-slate-700 dark:text-slate-300 tracking-tight">{perm.label}</span>
                                    {perm.allowed ? (
                                        <div className="flex items-center gap-2 text-emerald-500">
                                            <span className="text-[10px] font-black uppercase tracking-widest">Authorized</span>
                                            <CheckCircle2 className="w-4 h-4" />
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-slate-300 dark:text-slate-600">
                                            <span className="text-[10px] font-black uppercase tracking-widest">Restricted</span>
                                            <ShieldAlert className="w-4 h-4" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            <div className="p-6 bg-brand-orange/5 border border-brand-orange/20 rounded-3xl flex items-start gap-4">
                <ShieldAlert className="w-6 h-6 text-brand-orange shrink-0 mt-1" />
                <div className="space-y-1">
                    <p className="font-black text-brand-orange text-sm uppercase tracking-tight">Security Protocol Enforcement</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                        Role modifications are currently locked to BIOS-level hardware keys. Please contact the security alliance for seat escalation or new operator provisioning.
                    </p>
                </div>
            </div>
        </div>
    );
}
