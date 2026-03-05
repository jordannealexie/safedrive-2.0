'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Lock, User, Info, AlertTriangle, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import Image from 'next/image';

import { useUIStore } from '@/store/useUIStore';

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const login = useUIStore((state) => state.login);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate secure authentication protocol
        setTimeout(() => {
            login();
            router.push('/');
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 relative overflow-hidden font-sans">
            {/* Ambient Background Elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-red/5 rounded-full blur-[120px] -mr-64 -mt-64" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand-orange/5 rounded-full blur-[120px] -ml-64 -mb-64" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="w-full max-w-md relative z-10"
            >
                {/* Brand Logo Section */}
                <div className="text-center mb-10">
                    <motion.div
                        initial={{ scale: 0.8, rotate: -10 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{
                            type: "spring",
                            stiffness: 260,
                            damping: 20,
                            delay: 0.2
                        }}
                        className="mx-auto mb-6"
                    >
                        <Image
                            src="/images/safedrive-logo.png"
                            alt="SafeDrive Logo"
                            width={80}
                            height={80}
                            className="mx-auto"
                            priority
                        />
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-4xl font-black text-slate-900 tracking-tighter"
                    >
                        SAFEDRIVE<span className="text-brand-red italic">ADMIN</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="text-slate-400 font-bold text-[10px] mt-2 tracking-[0.3em] uppercase"
                    >
                        AI-Powered Driver Monitoring and Accident Prevention System
                    </motion.p>
                </div>

                {/* Login Card */}
                <Card className="border border-slate-200/60 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] bg-white/80 backdrop-blur-xl overflow-hidden rounded-[32px]">
                    <CardHeader className="pt-10 pb-2 text-center">
                        <CardTitle className="text-2xl font-extrabold text-slate-800">Operator Login</CardTitle>
                        <CardDescription className="text-slate-500 font-medium">Access your secure monitoring workstation.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-10 space-y-6">
                        <form onSubmit={handleLogin} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                                <div className="group relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-300 group-focus-within:text-brand-red transition-colors" />
                                    <Input
                                        type="email"
                                        placeholder="email@example.com"
                                        required
                                        className="pl-12 h-14 bg-slate-50/50 border-slate-100 rounded-2xl focus:bg-white focus:border-brand-red/30 focus:ring-[6px] focus:ring-brand-red/5 transition-all text-slate-800 font-semibold"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                                <div className="group relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-300 group-focus-within:text-brand-red transition-colors" />
                                    <Input
                                        type="password"
                                        placeholder="••••••••••••"
                                        required
                                        className="pl-12 h-14 bg-slate-50/50 border-slate-100 rounded-2xl focus:bg-white focus:border-brand-red/30 focus:ring-[6px] focus:ring-brand-red/5 transition-all text-slate-800 font-semibold"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between px-1">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input type="checkbox" className="w-4 h-4 rounded-md border-slate-200 accent-brand-red" />
                                    <span className="text-xs font-bold text-slate-500 group-hover:text-slate-700 transition-colors">Trust device for 30 days</span>
                                </label>
                                <button type="button" className="text-xs font-black text-brand-red/80 hover:text-brand-red uppercase tracking-widest transition-colors">Recover Key</button>
                            </div>

                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-slate-900 hover:bg-black text-white h-16 rounded-[20px] text-lg font-black shadow-xl transition-all active:scale-[0.98] group overflow-hidden relative"
                            >
                                <AnimatePresence mode="wait">
                                    {isLoading ? (
                                        <motion.div
                                            key="loading"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="flex items-center gap-2"
                                        >
                                            <div className="w-5 h-5 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                                            LOGGING IN...
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="ready"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="flex items-center justify-center gap-2"
                                        >
                                            LOG IN
                                            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
                            </Button>
                        </form>

                        <div className="pt-4 border-t border-slate-100 flex flex-col items-center">
                            <div className="flex items-center gap-2.5 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                                <AlertTriangle className="w-3.5 h-3.5 text-brand-orange" />
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Encrypted Connection Active • AES-256</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="mt-12 text-center"
                >
                    <p className="text-[10px] font-black text-slate-300 tracking-[0.4em] uppercase leading-relaxed">
                        <br />

                    </p>
                </motion.div>
            </motion.div>
        </div>
    );
}
