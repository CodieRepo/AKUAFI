"use client";

import Link from "next/link";
import Image from "next/image";
import { 
  ArrowRight, 
  BarChart3, 
  Leaf, 
  QrCode, 
  Zap, 
  Globe, 
  Smartphone, 
  Play, 
  CheckCircle2, 
  MapPin, 
  MousePointerClick, 
  Megaphone,
  Store,
  Building2,
  GraduationCap,
  Stethoscope,
  Utensils,
  CalendarHeart,
  ShoppingBag,
  Vote
} from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Home() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.17, 0.55, 0.55, 1] as const,
      },
    },
  };

  return (
    <>
      <Navbar />
      <div className="overflow-hidden">
      {/* ────────────────────────
          HERO SECTION
      ──────────────────────── */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-12 pb-24 lg:pt-20 lg:pb-32 overflow-hidden">
        
        {/* Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-[800px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-light via-transparent to-transparent opacity-60 -z-10 blur-3xl" />
        <div className="absolute top-1/3 right-[-10%] w-[600px] h-[600px] bg-accent-cyan-light rounded-full opacity-40 blur-[120px] -z-10 animate-pulse" />
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
              <motion.h1 
                variants={itemVariants} 
                className="text-5xl lg:text-7xl font-bold tracking-tight text-slate-900 leading-[1.1] mb-6"
              >
                Transform <span className="text-gradient-primary">Offline Ads</span> into <span className="text-gradient-primary">Measurable Sales</span> with Akuafi
              </motion.h1>
              
              <motion.div variants={itemVariants} className="text-lg lg:text-xl text-slate-600 mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-medium">
                Turn every water bottle into a powerful customer acquisition channel.
                <br className="hidden lg:block"/>
                Our QR-powered bottle advertising platform helps brands track engagement, generate leads, and drive real ROI from offline campaigns.
              </motion.div>

              {/* Bullet Points */}
              <motion.ul variants={itemVariants} className="space-y-3 mb-10 text-left max-w-lg mx-auto lg:mx-0">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-success flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">Reach thousands of customers through branded water bottles</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-success flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">Smart dynamic QR codes with real-time redirection</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-success flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">Track scans, locations, and conversions instantly</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-success flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">Affordable offline advertising for local & national brands</span>
                </li>
              </motion.ul>
              
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
                  href="/contact"
                  className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-slate-700 bg-white border border-slate-200 rounded-full hover:bg-slate-50 hover:border-slate-300 transition-all shadow-soft-sm hover:shadow-soft-md"
                >
                  <Play className="mr-2 w-4 h-4 fill-slate-700" />
                  See How It Works
                </Link>
              </motion.div>
            </motion.div>

            {/* Right Visual - Same as before but updated context if needed */}
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
                 
                 {/* Floating Cards */}
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
                       <p className="text-sm font-bold text-slate-900">Eco-Friendly</p>
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
                        <p className="text-xs text-slate-500 font-semibold uppercase">Real-Time</p>
                       <p className="text-sm font-bold text-slate-900">Live Analytics</p>
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
          OUR ECOSYSTEM
      ──────────────────────── */}
      <section className="py-24 bg-white relative overflow-hidden">
        {/* Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
             <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">Our Ecosystem</h2>
             <p className="text-lg text-slate-600 max-w-2xl mx-auto">A complete physical-to-digital advertising platform designed to help brands convert offline visibility into online engagement.</p>
          </div>

          <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12">
             {/* Card 1 */}
             <div className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-soft-lg border border-slate-100 relative z-10 hover:-translate-y-2 transition-transform duration-300">
                <div className="text-4xl mb-6">💧</div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Bottled Branding™</h3>
                <p className="text-slate-600">Premium custom-labeled water bottles showcasing your brand at events, offices, hospitals, retail locations, and public spaces.</p>
             </div>
             
             {/* Connector */}
             <div className="hidden lg:block w-24 h-[2px] bg-gradient-to-r from-slate-200 to-primary/50 relative">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full animate-pulse"></div>
             </div>
             <div className="block lg:hidden h-12 w-[2px] bg-gradient-to-b from-slate-200 to-primary/50"></div>

             {/* Card 2 */}
             <div className="w-full max-w-sm bg-primary text-white p-8 rounded-3xl shadow-glow-blue relative z-10 scale-105 hover:scale-110 transition-transform duration-300">
                <div className="text-4xl mb-6 text-white">📱</div>
                <h3 className="text-2xl font-bold mb-3">QR Engage™</h3>
                <p className="text-primary-light">Dynamic QR codes that redirect users based on time, location, or campaign goals. Update offers without reprinting bottles.</p>
             </div>

             {/* Connector */}
             <div className="hidden lg:block w-24 h-[2px] bg-gradient-to-r from-primary/50 to-slate-200 relative">
                 <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full animate-pulse"></div>
             </div>
             <div className="block lg:hidden h-12 w-[2px] bg-gradient-to-b from-primary/50 to-slate-200"></div>

             {/* Card 3 */}
             <div className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-soft-lg border border-slate-100 relative z-10 hover:-translate-y-2 transition-transform duration-300">
                <div className="text-4xl mb-6">📊</div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Analytics Dashboard</h3>
                <p className="text-slate-600">Real-time analytics to track scans, locations, devices, and conversions. Measure the true ROI of your offline campaigns.</p>
             </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────
          HOW IT WORKS (NEW)
      ──────────────────────── */}
      <section className="py-24 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-slate-900 mb-6">How Akuafi Works</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="bg-white p-6 rounded-2xl shadow-soft-sm text-center relative">
              <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6 shadow-glow-blue/50">1</div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Design Your Bottle</h3>
              <p className="text-slate-600 font-medium">We create a custom bottle label with your brand message and QR code.</p>
            </div>
            
            {/* Step 2 */}
            <div className="bg-white p-6 rounded-2xl shadow-soft-sm text-center relative">
              <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6 shadow-glow-blue/50">2</div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Distribute Your Bottles</h3>
              <p className="text-slate-600 font-medium">Place bottles at events, malls, offices, gyms, hospitals, and public locations.</p>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-6 rounded-2xl shadow-soft-sm text-center relative">
               <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6 shadow-glow-blue/50">3</div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Engage Customers</h3>
              <p className="text-slate-600 font-medium">Users scan the QR code to access offers, websites, WhatsApp, or lead forms.</p>
            </div>

            {/* Step 4 */}
            <div className="bg-white p-6 rounded-2xl shadow-soft-sm text-center relative">
               <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6 shadow-glow-blue/50">4</div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Track & Optimize</h3>
              <p className="text-slate-600 font-medium">Monitor real-time performance and optimize campaigns for higher conversions.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────
          WHO IS IT FOR (NEW)
      ──────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-slate-900 mb-6">Who Can Use Akuafi?</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
             {[
               { icon: Store, label: "Local Businesses & Startups" },
               { icon: Building2, label: "Real Estate Developers" },
               { icon: GraduationCap, label: "Coaching Institutes" },
               { icon: Stethoscope, label: "Hospitals & Clinics" },
               { icon: Utensils, label: "Restaurants & Cafes" },
               { icon: CalendarHeart, label: "Event Organizers" },
               { icon: ShoppingBag, label: "D2C Brands" },
               { icon: Vote, label: "Political & Social Campaigns" },
             ].map((item, idx) => (
                <div key={idx} className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl hover:bg-white hover:shadow-soft-md transition-all border border-transparent hover:border-slate-100 text-center h-full">
                   <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-primary shadow-sm mb-4">
                      <item.icon size={24} />
                   </div>
                   <h3 className="font-bold text-slate-800">{item.label}</h3>
                </div>
             ))}
          </div>
        </div>
      </section>

      {/* ────────────────────────
          BENEFITS (REFRACTORED VALUE PROP)
      ──────────────────────── */}
      <section className="py-24 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6">Why Choose <span className="text-primary">AKUAFI</span>?</h2>
            <p className="text-lg text-slate-600">The first platform that combines offline reach with digital intelligence.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
             {/* Benefit 1 */}
             <div className="group bg-white p-8 rounded-2xl shadow-soft-md hover:shadow-soft-xl transition-all border border-slate-100 hover:border-primary/20">
                <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mb-6 group-hover:scale-110 transition-transform">
                   <Zap size={28} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Low-Cost Offline Ads</h3>
                <p className="text-slate-600">High-impact offline advertising with high visibility at an affordable price point.</p>
             </div>
             
             {/* Benefit 2 */}
             <div className="group bg-white p-8 rounded-2xl shadow-soft-md hover:shadow-soft-xl transition-all border border-slate-100 hover:border-primary/20">
                <div className="w-14 h-14 bg-primary-light rounded-xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                   <QrCode size={28} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Direct Engagement</h3>
                <p className="text-slate-600">Instant customer connection through advanced QR technology and digital redirect.</p>
             </div>

             {/* Benefit 3 */}
             <div className="group bg-white p-8 rounded-2xl shadow-soft-md hover:shadow-soft-xl transition-all border border-slate-100 hover:border-primary/20">
                 <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform">
                   <BarChart3 size={28} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Measurable Performance</h3>
                <p className="text-slate-600">Track every interaction and measure ROI with precision analytics.</p>
             </div>

              {/* Benefit 4 */}
              <div className="group bg-white p-8 rounded-2xl shadow-soft-md hover:shadow-soft-xl transition-all border border-slate-100 hover:border-primary/20">
                 <div className="w-14 h-14 bg-red-50 rounded-xl flex items-center justify-center text-red-600 mb-6 group-hover:scale-110 transition-transform">
                   <Megaphone size={28} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Zero Wastage</h3>
                <p className="text-slate-600">No wastage like pamphlets or banners—every bottle reaches a real person.</p>
             </div>

              {/* Benefit 5 */}
              <div className="group bg-white p-8 rounded-2xl shadow-soft-md hover:shadow-soft-xl transition-all border border-slate-100 hover:border-primary/20">
                 <div className="w-14 h-14 bg-success-light rounded-xl flex items-center justify-center text-success mb-6 group-hover:scale-110 transition-transform">
                   <Leaf size={28} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Eco-Friendly Solution</h3>
                <p className="text-slate-600">Responsible branding with bottle collection and recycling initiatives built-in.</p>
             </div>

             {/* Benefit 6 */}
              <div className="group bg-white p-8 rounded-2xl shadow-soft-md hover:shadow-soft-xl transition-all border border-slate-100 hover:border-primary/20">
                 <div className="w-14 h-14 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600 mb-6 group-hover:scale-110 transition-transform">
                   <MapPin size={28} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Hyper-Local Marketing</h3>
                <p className="text-slate-600">Ideal for targeted hyper-local marketing campaigns across India.</p>
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
           <h2 className="text-4xl lg:text-5xl font-bold mb-6">Ready to Revolutionize Your Offline Ads?</h2>
           <p className="text-slate-300 text-lg mb-10 max-w-2xl mx-auto">
              Start turning simple water bottles into powerful advertising tools.
           </p>
           <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                  href="/contact"
                  className="px-8 py-4 bg-primary text-white text-lg font-bold rounded-full shadow-glow-blue hover:bg-primary-light hover:text-primary transition-all"
                >
                  Get Started Today
              </Link>
              <Link
                  href="/contact"
                  className="px-8 py-4 bg-transparent border border-white/20 hover:bg-white/10 text-white text-lg font-bold rounded-full transition-all"
                >
                  Request a Free Demo
              </Link>
           </div>
        </div>
      </section>
      </div> 
      <Footer />
    </>
  );
}
