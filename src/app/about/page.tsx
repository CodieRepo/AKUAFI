"use client";

import { motion } from "framer-motion";
import { Lightbulb, Leaf, Target, Users } from "lucide-react";

export default function About() {
  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <section className="relative py-24 lg:py-32 overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-primary-light/30 skew-x-12 translate-x-1/3 -z-10"></div>
        <div className="absolute bottom-0 left-0 w-1/3 h-2/3 bg-accent-cyan-light/30 -skew-x-12 -translate-x-1/4 -z-10 rounded-full blur-3xl"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center lg:text-left">
          <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.8 }}
          >
            <span className="inline-block px-4 py-2 bg-slate-100 rounded-full text-slate-500 font-semibold uppercase tracking-wide text-xs mb-6">
              Our Story
            </span>
            <h1 className="text-4xl lg:text-6xl font-bold text-slate-900 mb-8 leading-tight">
              We Don't Just Print Logos.<br />
              <span className="text-gradient-primary">We Akuafy Brands.</span>
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl leading-relaxed">
              Turning everyday water bottles into measurable marketing channels. At AKUAFI, we believe offline advertising should be as smart, trackable, and impactful as digital ads.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="bg-white p-8 rounded-3xl shadow-soft-md border border-slate-100">
                 <div className="w-12 h-12 bg-primary-light text-primary rounded-xl flex items-center justify-center mb-6">
                    <Lightbulb size={24} />
                 </div>
                 <h3 className="text-xl font-bold text-slate-900 mb-4">The Vision</h3>
                 <p className="text-slate-600">
                    To revolutionize offline marketing by making it connected, interactive, and data-driven.
                 </p>
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-soft-md border border-slate-100">
                 <div className="w-12 h-12 bg-success-light text-success rounded-xl flex items-center justify-center mb-6">
                    <Leaf size={24} />
                 </div>
                 <h3 className="text-xl font-bold text-slate-900 mb-4">The Responsibility</h3>
                 <p className="text-slate-600">
                    We ensure every campaign gives back to the planet through verified tree plantation and clean-up drives.
                 </p>
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-soft-md border border-slate-100">
                 <div className="w-12 h-12 bg-accent-cyan-light text-accent-cyan rounded-xl flex items-center justify-center mb-6">
                    <Target size={24} />
                 </div>
                 <h3 className="text-xl font-bold text-slate-900 mb-4">The Precision</h3>
                 <p className="text-slate-600">
                    Delivering your message exactly where it matters—from corporate boardrooms to fitness centers.
                 </p>
              </div>
           </div>
        </div>
      </section>

      {/* Narrative Section */}
      <section className="py-24">
         <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-slate-900 mb-8">Why "Akuafi"?</h2>
            <div className="prose prose-lg mx-auto text-slate-600">
               <p className="mb-6">
                  Water is essential. It's everywhere. By integrating branding into such a fundamental part of daily life, we create interactions that are natural, not intrusive.
               </p>
               <p className="mb-6">
                  But we took it a step further. We added a <strong>digital brain</strong> to the bottle. With our proprietary QR technology, a simple water bottle becomes a portal to your brand's digital world—whether it's a video, a discount coupon, or a lead generation form.
               </p>
               <p>
                  And most importantly, we did it with a conscience. We realized that physical advertising creates waste. That's why we built the <strong>Green Impact Program</strong> directly into our business model.
               </p>
            </div>
         </div>
      </section>

      {/* Team CTA */}
      <section className="py-24 bg-slate-900 text-white text-center">
          <div className="max-w-7xl mx-auto px-4">
             <div className="mb-8 flex justify-center">
                <Users size={48} className="text-slate-400" />
             </div>
             <h2 className="text-3xl font-bold mb-6">Join the Revolution</h2>
             <p className="text-slate-400 mb-10 max-w-xl mx-auto">
                Whether you're a brand looking to advertise or a partner looking to distribute, there is a place for you in the AKUAFI ecosystem.
             </p>
          </div>
      </section>
    </div>
  );
}
