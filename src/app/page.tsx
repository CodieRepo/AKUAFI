"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BarChart3, Leaf, QrCode, Zap, Globe, Smartphone, Play } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.17, 0.55, 0.55, 1] as const,
      },
    },
  };

  return (
    <div className="overflow-hidden">
      {/* ────────────────────────
          HERO SECTION
      ──────────────────────── */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-12 pb-24 lg:pt-20 lg:pb-32 overflow-hidden">
        
        {/* Background Elements */}
        {/* Radial Gradient Top Center */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-[800px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-light via-transparent to-transparent opacity-60 -z-10 blur-3xl" />
        {/* Cyan Glow - Right */}
        <div className="absolute top-1/3 right-[-10%] w-[600px] h-[600px] bg-accent-cyan-light rounded-full opacity-40 blur-[120px] -z-10 animate-pulse" />
         {/* Blue Glow - Left */}
         <div className="absolute bottom-0 left-[-10%] w-[500px] h-[500px] bg-primary-light rounded-full opacity-40 blur-[100px] -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            
            {/* Left Content */}
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="text-center lg:text-left"
            >
              {/* Badge */}
              <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 border border-slate-200 backdrop-blur-sm shadow-soft-sm mb-8">
                <span className="flex h-2 w-2 rounded-full bg-accent-cyan animate-pulse"></span>
                <span className="text-sm font-semibold text-slate-600 tracking-wide uppercase">Get Your Brand Akuafied</span>
              </motion.div>

              <motion.h1 
                variants={itemVariants} 
                className="text-5xl lg:text-7xl font-bold tracking-tight text-slate-900 leading-[1.1] mb-6"
              >
                Transform <span className="text-gradient-primary">Offline Ads</span> into <span className="text-gradient-primary">Measurable Sales</span>
              </motion.h1>
              
              <motion.p 
                variants={itemVariants} 
                className="text-lg lg:text-xl text-slate-600 mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0"
              >
                Turn every water bottle into a smart advertising channel with real-time tracking and built-in green initiatives.
                <br className="hidden lg:block"/> We measure offline ads like digital ads — and we do it responsibly.
              </motion.p>
              
              <motion.div 
                variants={itemVariants} 
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              >
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white bg-primary hover:bg-primary-dark rounded-full shadow-lg shadow-primary/25 hover:shadow-glow-blue transition-all transform hover:-translate-y-1"
                >
                  Get a Free Quote
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
                <Link
                  href="/services"
                  className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-slate-700 bg-white border border-slate-200 rounded-full hover:bg-slate-50 hover:border-slate-300 transition-all shadow-soft-sm hover:shadow-soft-md"
                >
                  <Play className="mr-2 w-4 h-4 fill-slate-700" />
                  See How It Works
                </Link>
              </motion.div>

              {/* Trust indicators small */}
              <motion.div variants={itemVariants} className="mt-12 flex items-center justify-center lg:justify-start gap-8 text-slate-400 grayscale opacity-80">
                 {/* Placeholders for partner logos if needed, or simple text stats */}
                 <div className="flex items-center gap-2">
                    <Leaf size={18} className="text-success" />
                    <span className="text-sm font-medium">Eco-Friendly</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <BarChart3 size={18} className="text-primary" />
                    <span className="text-sm font-medium">Real-time Analytics</span>
                 </div>
              </motion.div>
            </motion.div>

            {/* Right Visual - Floating Elements */}
            <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ duration: 0.8, delay: 0.2 }}
               className="relative lg:h-[650px] flex items-center justify-center perspective-1000"
            >
              <div className="relative w-full aspect-square max-w-[550px] flex items-center justify-center">
                {/* Main Bottle Image */}
                 <motion.div 
                    animate={{ y: [-15, 15, -15], rotate: [0, 2, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: [0.42, 0, 0.58, 1] as const }}
                    className="relative z-10 w-full h-full flex items-center justify-center p-8"
                 >
                    <div className="relative w-full h-full filter drop-shadow-[0_20px_50px_rgba(6,182,212,0.3)]">
                      <Image 
                        src="/images/hero-bottle.png"
                        alt="Smart QR Water Bottle"
                        width={600}
                        height={800}
                        className="object-contain w-full h-full"
                        priority
                      />
                    </div>
                 </motion.div>
                 
                 {/* Floating Cards - Repositioned slightly for the image */}
                 <motion.div 
                    animate={{ y: [0, -20, 0], x: [0, 5, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: [0.42, 0, 0.58, 1] as const, delay: 0.5 }}
                    className="absolute top-[10%] -right-4 lg:right-0 z-20 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-soft-lg border border-white/50 flex items-center gap-3 w-52"
                 >
                    <div className="bg-success-light p-2 rounded-lg text-success">
                       <Leaf size={24} />
                    </div>
                    <div>
                       <p className="text-xs text-slate-500 font-semibold uppercase">Impact</p>
                       <p className="text-sm font-bold text-slate-900">100+ Trees Planted</p>
                    </div>
                 </motion.div>

                 <motion.div 
                    animate={{ y: [0, 20, 0], x: [0, -5, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: [0.42, 0, 0.58, 1] as const, delay: 1.5 }}
                    className="absolute bottom-[15%] -left-4 lg:left-0 z-20 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-soft-lg border border-white/50 flex items-center gap-3 w-60"
                 >
                    <div className="bg-primary-light p-2 rounded-lg text-primary">
                       <BarChart3 size={24} />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-semibold uppercase">Live Campaigns</p>
                       <p className="text-sm font-bold text-slate-900">24.5k Active Scans</p>
                    </div>
                 </motion.div>
                 
                  {/* Decorative Glows Behind */}
                  <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-primary/20 via-accent-cyan/10 to-transparent rounded-full blur-[80px]" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ────────────────────────
          VALUE PROPOSITION
      ──────────────────────── */}
      <section className="py-24 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6">Why Choose <span className="text-primary">AKUAFI</span>?</h2>
            <p className="text-lg text-slate-600">The first platform that combines offline reach with digital intelligence.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
             {/* Feature 1 */}
             <div className="group bg-white p-8 rounded-2xl shadow-soft-md hover:shadow-soft-xl transition-all border border-slate-100 hover:border-primary/20">
                <div className="w-14 h-14 bg-primary-light rounded-xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                   <QrCode size={28} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">QR-Powered Engagement</h3>
                <p className="text-slate-600">Smart labels that instantly connect offline consumers to your digital world.</p>
             </div>
             
             {/* Feature 2 */}
             <div className="group bg-white p-8 rounded-2xl shadow-soft-md hover:shadow-soft-xl transition-all border border-slate-100 hover:border-primary/20">
                <div className="w-14 h-14 bg-accent-cyan-light rounded-xl flex items-center justify-center text-accent-cyan mb-6 group-hover:scale-110 transition-transform">
                   <BarChart3 size={28} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Real-Time Analytics</h3>
                <p className="text-slate-600">Track scans, locations, and conversion rates just like a digital campaign.</p>
             </div>

             {/* Feature 3 */}
             <div className="group bg-white p-8 rounded-2xl shadow-soft-md hover:shadow-soft-xl transition-all border border-slate-100 hover:border-primary/20">
                 <div className="w-14 h-14 bg-success-light rounded-xl flex items-center justify-center text-success mb-6 group-hover:scale-110 transition-transform">
                   <Leaf size={28} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Green Campaigns</h3>
                <p className="text-slate-600">Built-in bottle collection and tree plantation drives with every campaign.</p>
             </div>

              {/* Feature 4 */}
              <div className="group bg-white p-8 rounded-2xl shadow-soft-md hover:shadow-soft-xl transition-all border border-slate-100 hover:border-primary/20">
                 <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mb-6 group-hover:scale-110 transition-transform">
                   <Globe size={28} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Hyperlocal & National</h3>
                <p className="text-slate-600">Target specific neighborhoods or launch nationwide with precise distribution.</p>
             </div>

              {/* Feature 5 */}
              <div className="group bg-white p-8 rounded-2xl shadow-soft-md hover:shadow-soft-xl transition-all border border-slate-100 hover:border-primary/20 md:col-span-2 lg:col-span-2">
                 <div className="w-14 h-14 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600 mb-6 group-hover:scale-110 transition-transform">
                   <Zap size={28} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Affordable Offline Marketing</h3>
                <p className="text-slate-600">High-impact physical branding at a fraction of the cost of traditional billboards or print.</p>
             </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────
          OUR ECOSYSTEM
      ──────────────────────── */}
      <section className="py-24 bg-white relative overflow-hidden">
        {/* Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
             <span className="text-sm font-bold text-primary tracking-widest uppercase mb-2 block">The Platform</span>
             <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">Our Ecosystem</h2>
             <p className="text-lg text-slate-600 max-w-2xl mx-auto">AKUAFI is not just a bottle service. It's a connected system for modern brand growth.</p>
          </div>

          <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12">
             {/* Card 1 */}
             <div className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-soft-lg border border-slate-100 relative z-10">
                <div className="text-4xl mb-4">💧</div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Bottled Branding™</h3>
                <p className="text-slate-600">Premium water bottles with your brand identity.</p>
             </div>
             
             {/* Connector */}
             <div className="hidden lg:block w-24 h-[2px] bg-gradient-to-r from-slate-200 to-primary/50 relative">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full animate-pulse"></div>
             </div>
             <div className="block lg:hidden h-12 w-[2px] bg-gradient-to-b from-slate-200 to-primary/50"></div>

             {/* Card 2 */}
             <div className="w-full max-w-sm bg-primary text-white p-8 rounded-3xl shadow-glow-blue relative z-10 scale-105">
                <div className="text-4xl mb-4 text-white">📱</div>
                <h3 className="text-2xl font-bold mb-2">QR Engage™</h3>
                <p className="text-primary-light">The digital bridge. Scan to unlock offers, videos, and rewards.</p>
                <div className="mt-6 flex items-center gap-2 text-xs font-bold uppercase tracking-wider bg-white/10 w-fit px-3 py-1 rounded-full">
                  <Smartphone size={14} /> Centerpiece
                </div>
             </div>

             {/* Connector */}
             <div className="hidden lg:block w-24 h-[2px] bg-gradient-to-r from-primary/50 to-slate-200 relative">
                 <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full animate-pulse"></div>
             </div>
             <div className="block lg:hidden h-12 w-[2px] bg-gradient-to-b from-primary/50 to-slate-200"></div>

             {/* Card 3 */}
             <div className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-soft-lg border border-slate-100 relative z-10">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Analytics Dashboard</h3>
                <p className="text-slate-600">Measure ROI, geolocation, and user behavior.</p>
                <span className="inline-block mt-4 text-xs font-bold text-primary bg-primary-light px-2 py-1 rounded">INCLUDED</span>
             </div>
          </div>
          
          <div className="mt-16 text-center">
             <div className="inline-flex items-center gap-3 bg-success-light px-6 py-3 rounded-full text-success-dark font-semibold border border-success/20">
                <Leaf size={20} className="fill-current" />
                <span>Green Impact Program Built-in to Every Campaign</span>
             </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────
          GREEN COMMITMENT (TRUST)
      ──────────────────────── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-success-light/30 to-white -z-20"></div>
        {/* Decorative Green Pattern */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-success-light/40 rounded-full blur-[100px] -z-10 translate-x-1/2 -translate-y-1/2"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                 <span className="text-sm font-bold text-success tracking-widest uppercase mb-2 block">Our Commitment</span>
                 <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6 font-serif-variation">
                    Marketing that grows your brand — and <span className="text-gradient-green">protects the planet.</span>
                 </h2>
                 <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                    We don’t just advertise on bottles. We turn campaigns into climate-positive actions. 
                    Every AKUAFI project supports sustainability initiatives to ensure a net-positive impact.
                 </p>
                 
                 <div className="space-y-6">
                    <div className="flex items-start gap-4">
                       <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-success shadow-sm">
                          <Leaf size={24} />
                       </div>
                       <div>
                          <h4 className="text-xl font-bold text-slate-900">Tree Plantation</h4>
                          <p className="text-slate-600">We plant trees for every campaign milestone reached.</p>
                       </div>
                    </div>
                    <div className="flex items-start gap-4">
                       <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-success shadow-sm">
                          <Globe size={24} />
                       </div>
                       <div>
                          <h4 className="text-xl font-bold text-slate-900">Bottle Collection Drives</h4>
                          <p className="text-slate-600">Active recycling programs to keep our cities clean.</p>
                       </div>
                    </div>
                 </div>

                 <div className="mt-10">
                    <Link
                      href="/about"
                      className="inline-flex items-center text-success-dark font-bold hover:underline decoration-2 underline-offset-4"
                    >
                      Read Our Green Policy <ArrowRight size={16} className="ml-2" />
                    </Link>
                 </div>
              </div>

               {/* Right Side Visual CTA */}
              <div className="relative">
                 <div className="bg-success text-white p-12 rounded-[2.5rem] shadow-soft-xl relative overflow-hidden">
                    {/* Texture */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
                    
                    <h3 className="text-3xl font-bold mb-4 relative z-10">Grow Your Brand. <br/>Grow the Planet.</h3>
                    <p className="text-success-light mb-8 relative z-10 text-lg">
                       Get your brand Akuafied the green way. Join the movement for responsible advertising.
                    </p>
                    <Link
                       href="/contact"
                       className="relative z-10 inline-block bg-white text-success-dark px-8 py-4 rounded-full font-bold shadow-soft-lg hover:shadow-xl transition-transform hover:-translate-y-1"
                    >
                       Get Started Now
                    </Link>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* ────────────────────────
          FINAL CTA
      ──────────────────────── */}
      <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800 to-slate-900"></div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
           <h2 className="text-4xl lg:text-5xl font-bold mb-6">Ready to Disrupt Offline Advertising?</h2>
           <p className="text-slate-300 text-lg mb-10 max-w-2xl mx-auto">
              Join the brands that are making a measurable impact.
           </p>
           <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                  href="/contact"
                  className="px-8 py-4 bg-primary text-white text-lg font-bold rounded-full shadow-glow-blue hover:bg-primary-light hover:text-primary transition-all"
                >
                  Get Your Brand Akuafied
              </Link>
           </div>
        </div>
      </section>
    </div>
  );
}
