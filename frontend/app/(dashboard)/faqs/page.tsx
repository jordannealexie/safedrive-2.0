'use client';

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle, MessageSquare, Shield, Settings, Zap, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";

const FAQ_DATA = [
    {
        category: 'Getting Started',
        icon: BookOpen,
        questions: [
            {
                q: "What is SafeDrive 2.0?",
                a: "SafeDrive 2.0 is an advanced AI-powered driver drowsiness detection and management system. It uses computer vision and real-time monitoring to ensure operational safety."
            },
            {
                q: "How do I add a new bus to the fleet?",
                a: "Navigate to the 'Buses' page and click on 'Add Vehicle'. You will need to provide the VIN and the Serial Number of the SafeDrive hardware node installed."
            }
        ]
    },
    {
        category: 'Alerts & Safety',
        icon: Shield,
        questions: [
            {
                q: "What types of alerts are tracked?",
                a: "The system tracks Drowsiness, Distraction, Overspeeding, and Hardware Failures. High-severity alerts trigger an immediate notification to the dashboard and an optional buzzer on the vehicle."
            },
            {
                q: "How does the drowsiness detection work?",
                a: "The edge node analyzes facial landmarks in real-time. It monitors eye closure duration (PERCLOS) and yawning frequency to calculate a risk score."
            }
        ]
    },
    {
        category: 'Technical Support',
        icon: Settings,
        questions: [
            {
                q: "A device is showing as 'Offline', what should I do?",
                a: "Check the 'System Status' page to see if the gateway is online. If only one node is offline, it may be a power or network connectivity issue on the vehicle. Try restarting the node."
            },
            {
                q: "Can I export historical data?",
                a: "Yes, you can export reports and alert logs in PDF or CSV format from the 'Reports' and 'Alerts' pages respectively."
            }
        ]
    }
];

export default function FAQPage() {
    return (
        <div className="space-y-8 max-w-4xl mx-auto pb-12">
            <div className="text-center space-y-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-brand-red/10 rounded-full border border-brand-red/20 text-brand-red mb-4"
                >
                    <HelpCircle className="w-4 h-4" />
                    <span className="text-xs font-black uppercase tracking-widest">Support Core</span>
                </motion.div>
                <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Frequently Asked Questions</h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Documentation and troubleshooting for the SafeDrive ecosystem.</p>
            </div>

            <div className="space-y-12 mt-12">
                {FAQ_DATA.map((section, sIdx) => (
                    <motion.div
                        key={section.category}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: sIdx * 0.1 }}
                        className="space-y-4"
                    >
                        <div className="flex items-center gap-3 px-2">
                            <section.icon className="w-5 h-5 text-brand-red" />
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">{section.category}</h2>
                        </div>

                        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] overflow-hidden shadow-sm">
                            <Accordion type="single" collapsible className="w-full">
                                {section.questions.map((item, qIdx) => (
                                    <AccordionItem key={qIdx} value={`item-${sIdx}-${qIdx}`} className="border-b dark:border-slate-800 last:border-0 px-6">
                                        <AccordionTrigger className="text-left font-bold text-slate-700 dark:text-slate-300 hover:text-brand-red transition-colors py-6">
                                            {item.q}
                                        </AccordionTrigger>
                                        <AccordionContent className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed pb-6">
                                            {item.a}
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="mt-16 p-8 bg-slate-900 dark:bg-black rounded-[40px] text-center space-y-6 relative overflow-hidden group">
                <div className="absolute top-[-50px] left-[-50px] w-64 h-64 bg-brand-red/10 blur-[100px]" />
                <div className="relative z-10">
                    <h3 className="text-2xl font-black text-white">Still need assistance?</h3>
                    <p className="text-slate-400 font-medium max-w-md mx-auto">Our security team is available 24/7 for critical hardware intervention.</p>
                    <div className="flex flex-wrap justify-center gap-4 mt-8">
                        <Button className="bg-brand-red hover:bg-brand-red/90 text-white px-8 h-12 rounded-2xl font-bold shadow-xl shadow-brand-red/20">
                            Open Support Ticket
                        </Button>
                        <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 h-12 px-8 rounded-2xl font-bold">
                            Live Chat
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
