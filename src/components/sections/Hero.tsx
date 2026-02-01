"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden hero-gradient">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-sky-400/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center relative z-10">
        
        {/* Text Content */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.17, 0.55, 0.55, 1] as const }}
          className="text-center lg:text-left"
        >
          <div className="inline-block px-4 py-1.5 rounded-full bg-blue-50 text-primary font-bold text-sm mb-6 border border-blue-100 tracking-wide shadow-sm">
            Get Your Brand Akuafied.
          </div>
          <h1 className="text-4xl lg:text-6xl font-extrabold text-slate-900 leading-tight mb-6">
            Transform <span className="text-slate-600">Offline</span> Ads into <span className="text-gradient">Measurable Sales</span>
          </h1>
          <p className="text-lg text-slate-600 mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium">
            Turn every water bottle into a <span className="text-slate-900 font-semibold">smart advertising channel</span> with real-time tracking and built-in <span className="text-success font-semibold">green initiatives</span>.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Link href="/contact">
                <Button size="lg" className="w-full sm:w-auto text-base shadow-xl shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-1">
                    Get a Free Quote
                </Button>
            </Link>
            <Link href="#ecosystem">
                <Button variant="ghost" size="lg" className="w-full sm:w-auto gap-2 group">
                  See How It Works 
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
            </Link>
          </div>
        </motion.div>

        {/* Floating Image */}
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
        >
            <motion.div
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: [0.42, 0, 0.58, 1] as const }}
                className="relative z-10"
            >
                <img 
                    src="/images/hero-illustration.png" 
                    alt="AKUAFI Smart Water Bottle Analytics" 
                    className="w-full max-w-[550px] mx-auto drop-shadow-2xl"
                    style={{ mixBlendMode: "multiply" }} 
                />
            </motion.div>
            
            {/* Image Back Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-sky-500/30 blur-[80px] -z-10 rounded-full" />
        </motion.div>
      </div>
    </section>
  );
}
