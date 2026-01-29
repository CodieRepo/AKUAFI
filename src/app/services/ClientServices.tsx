"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { 
  ArrowRight, 
  BarChart3, 
  CheckCircle2, 
  Clock, 
  Globe, 
  Leaf, 
  MapPin, 
  MousePointerClick, 
  QrCode, 
  Smartphone, 
  Zap,
  HelpCircle,
  Plus,
  Minus,
  Droplets,
  Layers,
  TrendingUp,
  Target
} from "lucide-react";

export default function ClientServices() {
  return (
    <div className="bg-surface min-h-screen">
      {/* ────────────────────────
          HERO SECTION
      ──────────────────────── */}
      <section className="bg-white pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary-light/20 to-transparent -z-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
           <h1 className="text-4xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight">
             Our Services – <span className="text-primary">Smart Offline Advertising</span> with Akuafi
           </h1>
           <p className="text-lg lg:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
             From premium bottle branding to QR-powered engagement and advanced analytics, Akuafi offers a complete offline-to-online marketing ecosystem.
           </p>
        </div>
      </section>

      {/* ────────────────────────
          SERVICE 1: BOTTLED BRANDING
      ──────────────────────── */}
      <section className="py-20 lg:py-28 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Image Side */}
            <div className="relative order-2 lg:order-1">
                <div className="absolute inset-0 bg-accent-cyan-light rounded-[3rem] rotate-3 scale-95 opacity-50 -z-10" />
                <div className="bg-slate-50 rounded-[2.5rem] p-12 flex items-center justify-center min-h-[400px]">
                   <span className="text-9xl">💧</span>
                </div>
            </div>
            
            {/* Content Side */}
            <div className="order-1 lg:order-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-primary text-sm font-bold mb-6">
                  <Droplets size={16} /> Physical touchpoint
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6">Bottled Branding™ – Premium Water Bottle Advertising</h2>
                <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                   Akuafi’s bottled branding service helps brands advertise on water bottles in high-footfall locations such as events, malls, offices, hospitals, gyms, and colleges. Our eco-friendly water bottle advertising solution ensures maximum brand exposure with long-lasting physical impressions.
                </p>
                <ul className="space-y-4 mb-10">
                   {[
                     "100% recyclable materials (rPET / aluminum)",
                     "Full-wrap HD printed labels",
                     "Custom cap colors",
                     "Food-grade, leak-proof bottles",
                     "Bulk production capabilities",
                     "Pan-India distribution logistics"
                   ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-slate-700 font-medium">
                         <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                         {item}
                      </li>
                   ))}
                </ul>
                <Link
                   href="/contact"
                   className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-full hover:bg-primary-dark transition-all shadow-md shadow-primary/20"
                >
                   Request a Sample Bottle <ArrowRight size={18} />
                </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────
          SERVICE 2: QR ENGAGE
      ──────────────────────── */}
      <section className="py-20 lg:py-28 bg-slate-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
             {/* Content Side */}
             <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-sm font-bold mb-6">
                  <QrCode size={16} /> Digital Bridge
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6">QR Engage™ – Dynamic QR Code Marketing Platform</h2>
                <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                   With Akuafi QR Engage™, brands can run QR code marketing campaigns on water bottles that convert offline traffic into digital engagement. The dynamic QR system allows complete flexibility without reprinting bottles.
                </p>
                <ul className="space-y-4 mb-10">
                   {[
                     "Dynamic URL redirection (change destination anytime)",
                     "Time-based routing (morning vs evening offers)",
                     "Location-based landing pages",
                     "A/B testing capabilities",
                     "WhatsApp / website / app / lead form redirects",
                     "Multi-campaign support on single QR"
                   ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-slate-700 font-medium">
                         <div className="bg-indigo-100 rounded-full p-0.5 mt-0.5">
                            <Zap className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                         </div>
                         {item}
                      </li>
                   ))}
                </ul>
                <Link
                   href="/contact"
                   className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-full hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20"
                >
                   See QR Demo <Smartphone size={18} />
                </Link>
            </div>

            {/* Image Side */}
            <div className="relative">
                <div className="absolute inset-0 bg-indigo-100 rounded-[3rem] -rotate-3 scale-95 opacity-50 -z-10" />
                <div className="bg-white rounded-[2.5rem] p-12 flex items-center justify-center min-h-[400px] shadow-soft-xl">
                   <span className="text-9xl">📱</span>
                </div>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────
          SERVICE 3: ANALYTICS
      ──────────────────────── */}
      <section className="py-20 lg:py-28 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Image Side */}
            <div className="relative order-2 lg:order-1">
                <div className="absolute inset-0 bg-primary-light rounded-[3rem] rotate-3 scale-95 opacity-30 -z-10" />
                <div className="bg-slate-900 rounded-[2.5rem] p-12 flex items-center justify-center min-h-[400px] shadow-soft-xl border border-slate-800">
                   <span className="text-9xl">📊</span>
                </div>
            </div>
            
            {/* Content Side */}
            <div className="order-1 lg:order-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 text-sky-600 text-sm font-bold mb-6">
                  <BarChart3 size={16} /> Measurable ROI
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6">Analytics Dashboard – Real-Time Offline Campaign Tracking</h2>
                <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                   Akuafi’s analytics dashboard helps brands measure the exact ROI of offline bottle advertising campaigns with real-time, location-based insights.
                </p>
                <ul className="space-y-4 mb-10">
                   {[
                     "Real-time scan counts",
                     "Location heatmaps & geographic data",
                     "Device type & OS analytics",
                     "Unique vs repeat scan tracking",
                     "Conversion tracking (Integrates with GA, Meta Pixel)",
                     "Exportable CSV/PDF reports"
                   ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-slate-700 font-medium">
                         <div className="bg-sky-100 rounded-full p-0.5 mt-0.5">
                            <TrendingUp className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
                         </div>
                         {item}
                      </li>
                   ))}
                </ul>
                <Link
                   href="/contact"
                   className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-full hover:bg-slate-50 transition-all shadow-sm"
                >
                   View Dashboard Sample <ArrowRight size={18} />
                </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────
          HOW IT WORKS
      ──────────────────────── */}
      <section className="py-24 bg-surface border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">How Our Services Work</h2>
              <p className="text-slate-600">A seamless process from concept to conversion.</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { title: "Consultation & Strategy", icon: HelpCircle, color: "bg-blue-100 text-blue-600" },
                { title: "Bottle Design & QR Setup", icon: Layers, color: "bg-purple-100 text-purple-600" },
                { title: "Production & Distribution", icon: MapPin, color: "bg-orange-100 text-orange-600" },
                { title: "Tracking & Optimization", icon: Target, color: "bg-green-100 text-green-600" }
              ].map((step, idx) => (
                 <div key={idx} className="bg-white p-8 rounded-2xl shadow-soft-sm border border-slate-100 hover:shadow-md transition-all text-center group">
                    <div className={`w-16 h-16 ${step.color} rounded-2xl mx-auto flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                       <step.icon size={32} />
                    </div>
                    <div className="text-lg font-bold text-slate-300 mb-2">0{idx + 1}</div>
                    <h3 className="text-lg font-bold text-slate-900">{step.title}</h3>
                 </div>
              ))}
           </div>
        </div>
      </section>

       {/* ────────────────────────
          WHY CHOOSE AKUAFI
      ──────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6">Why Choose Akuafi?</h2>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                  "India’s first QR-powered bottle advertising platform",
                  "End-to-end service: design, print, QR, analytics",
                  "Affordable offline marketing solution",
                  "Eco-friendly branding with sustainability focus",
                  "Hyperlocal & national reach capabilities",
                  "Measurable ROI vs traditional hoardings & flyers"
              ].map((item, i) => (
                 <div key={i} className="flex items-center gap-4 p-5 rounded-xl bg-slate-50 border border-slate-100">
                    <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0" />
                    <span className="font-semibold text-slate-700">{item}</span>
                 </div>
              ))}
           </div>
        </div>
      </section>

      {/* ────────────────────────
          FAQ SECTION
      ──────────────────────── */}
      <section className="py-24 bg-surface">
         <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-10 text-center">Frequently Asked Questions</h2>
            
            <div className="space-y-4">
               {[
                 { q: "What is water bottle advertising?", a: "Water bottle advertising turns everyday water bottles into mobile billboards. Your brand is placed on custom labels, putting your message directly into the hands of your target audience for extended periods." },
                 { q: "How does QR tracking work?", a: "Each bottle features a unique or campaign-specific QR code. When a user scans it, our system tracks the scan timestamp, location (city/region), and device type before redirecting them to your offer, ensuring you get real-time engagement data." },
                 { q: "Can offers be changed after printing?", a: "Yes! With our Dynamic QR Engage™ platform, you can change the redirection URL (like switching from a website to a WhatsApp chat) instantly from your dashboard without needing to reprint or redistribute bottles." },
                 { q: "Is it suitable for small businesses?", a: "Absolutely. We have flexible MOQs (Minimum Order Quantities) and pricing plans suitable for local startups, cafes, and small businesses looking for hyper-local visibility." }
               ].map((faq, i) => (
                  <FAQItem key={i} question={faq.q} answer={faq.a} />
               ))}
            </div>
         </div>
      </section>

      {/* ────────────────────────
          BOTTOM CTA
      ──────────────────────── */}
      <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
        {/* Abstract Background */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary rounded-full blur-[150px] opacity-20 -translate-y-1/2 translate-x-1/2" />
        
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
           <h2 className="text-4xl lg:text-5xl font-bold mb-6">Ready to Launch Your Bottle Ad Campaign?</h2>
           <p className="text-slate-300 text-lg mb-10">
              Turn simple water bottles into smart advertising tools.
           </p>
           <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                  href="/contact"
                  className="px-8 py-4 bg-primary text-white text-lg font-bold rounded-full shadow-lg hover:bg-primary-light hover:text-primary transition-all"
                >
                  Get Started Now
              </Link>
              <Link
                  href="/contact"
                  className="px-8 py-4 bg-transparent border border-white/20 hover:bg-white/10 text-white text-lg font-bold rounded-full transition-all"
                >
                  Request Pricing
              </Link>
           </div>
        </div>
      </section>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string, answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50 transition-colors"
      >
        <span className="font-bold text-slate-900 text-lg">{question}</span>
        {isOpen ? <Minus className="text-primary flex-shrink-0" /> : <Plus className="text-slate-400 flex-shrink-0" />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.42, 0, 0.58, 1] as const }}
          >
            <div className="px-6 pb-6 text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
