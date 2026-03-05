'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    HelpCircle,
    MessageCircle,
    BookOpen,
    LifeBuoy,
    ChevronDown,
    Search,
    ExternalLink,
    ShieldCheck,
    Zap
} from "lucide-react";
import { motion } from "framer-motion";

const FAQS = [
    { q: 'How does drowsiness detection work?', a: 'The system uses AI-powered computer vision to monitor facial landmarks, blink rate, and head position in real-time. If it detects signs of fatigue, it triggers immediate alerts.' },
    { q: 'What do the alert levels mean?', a: 'Level 1: Suggestion to take a break. Level 2: Intense haptic feedback and audible alert. Level 3: Dispatch center notification and emergency protocol.' },
    { q: 'How to troubleshoot device offline status?', a: 'Check local LTE/WiFi connectivity, ensure the power cable is firmly connected, and check for any hardware damage on the camera module.' },
];

export default function HelpSupportPage() {
    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div className="text-center space-y-4 py-8">
                <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">How can we help?</h1>
                <p className="text-slate-500 font-medium max-w-lg mx-auto">Find answers to common questions or contact our support team for technical assistance.</p>
                <div className="relative max-w-xl mx-auto mt-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input placeholder="Search documentation, guides, and FAQs..." className="pl-12 h-14 rounded-2xl border-slate-200 shadow-xl shadow-slate-900/5 bg-white text-lg font-medium" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Documentation', icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-50' },
                    { label: 'Contact Support', icon: MessageCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                    { label: 'System Guide', icon: ShieldCheck, color: 'text-brand-red', bg: 'bg-brand-red/5' },
                ].map((item) => (
                    <Card key={item.label} className="border-none shadow-sm bg-white hover:shadow-md transition-all cursor-pointer group">
                        <CardContent className="p-6 text-center">
                            <div className={cn("w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform", item.bg, item.color)}>
                                <item.icon className="w-7 h-7" />
                            </div>
                            <h3 className="font-black text-slate-800">{item.label}</h3>
                            <p className="text-xs text-slate-400 font-bold mt-1">LEARN MORE</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="space-y-6">
                <h2 className="text-2xl font-black text-slate-800">Frequently Asked Questions</h2>
                <div className="space-y-4">
                    {FAQS.map((faq, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white border rounded-2xl p-6 shadow-sm"
                        >
                            <div className="flex items-center justify-between cursor-pointer group">
                                <h3 className="font-extrabold text-slate-800 group-hover:text-brand-red transition-colors">{faq.q}</h3>
                                <ChevronDown className="w-5 h-5 text-slate-300 group-hover:text-slate-500" />
                            </div>
                            <div className="mt-4 text-slate-500 font-medium text-sm leading-relaxed border-t pt-4 border-slate-50">
                                {faq.a}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            <Card className="border-none shadow-xl bg-slate-900 text-white overflow-hidden relative">
                <div className="absolute right-[-40px] bottom-[-40px] opacity-10">
                    <LifeBuoy className="w-64 h-64" />
                </div>
                <CardContent className="p-10 flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                    <div className="space-y-2 text-center md:text-left">
                        <h2 className="text-2xl font-black italic tracking-tighter">STILL HAVE QUESTIONS?</h2>
                        <p className="text-white/60 font-medium">Our senior engineers are available for 1-on-1 technical support.</p>
                    </div>
                    <Button className="bg-brand-red hover:bg-brand-red/90 h-14 px-10 font-black rounded-2xl shadow-2xl shadow-brand-red/40 text-lg">
                        LIVE CHAT NOW
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}
