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
                a: "SafeDrive 2.0 is an AI-powered drowsiness detection system that uses facial landmark analysis and eye/mouth behavior monitoring to prevent accidents. It features session-based monitoring, face-based driver differentiation, and work hour tracking."
            },
            {
                q: "How does driver identification work?",
                a: "The system uses face-based driver differentiation. When a new face is detected by the camera, a driver profile ID is automatically created. No pre-registration is required — drivers are recognized and tracked automatically."
            }
        ]
    },
    {
        category: 'Detection & Alerts',
        icon: Shield,
        questions: [
            {
                q: "How does drowsiness detection work?",
                a: "The camera module analyzes facial landmarks in real-time, monitoring eye closure duration and mouth behavior. Each driving session learns a behavioral baseline, and deviations from that baseline trigger alerts."
            },
            {
                q: "When does the alarm sound?",
                a: "The buzzer and OLED display activate only when the MPU-6050 accelerometer confirms the vehicle is in motion. If the vehicle is stationary, visual alerts are shown on the dashboard but the buzzer will not sound."
            },
            {
                q: "What are the work hour reminders?",
                a: "The system aggregates all driving sessions throughout the day for each driver. Visual reminders are produced at 4-hour, 6-hour, and 8-hour thresholds to encourage rest breaks and comply with fatigue regulations."
            }
        ]
    },
    {
        category: 'Hardware & Sensors',
        icon: Settings,
        questions: [
            {
                q: "What sensors does the system use?",
                a: "The edge device includes: NEO-6M GPS module for location tracking, MPU-6050 accelerometer to determine vehicle motion, a camera for facial analysis, buzzer for audio alarms, and an OLED display for visual notifications. A DC-DC buck converter handles power regulation."
            },
            {
                q: "What does session-based monitoring mean?",
                a: "Each driving instance is treated as a unique session with its own ID and timestamps. Behavioral baselines are learned per session and reset when a new session starts. This supports drivers who drive intermittently, swap shifts, or operate without pre-registration."
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

        </div>
    );
}
