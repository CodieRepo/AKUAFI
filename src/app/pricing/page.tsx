"use client";

import { Check, HelpCircle, ArrowRight, BarChart3, MapPin, Truck, Palette, Smartphone, Calendar, Search } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";

export default function Pricing() {
  // Animation variants
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
        ease: [0, 0, 0.58, 1] as const,
      },
    },
  };

  const pricingFactors = [
    {
      icon: <Truck size={24} />,
      title: "Quantity & Distribution",
      description: "Pricing varies based on volume and number of distribution points.",
    },
    {
      icon: <Palette size={24} />,
      title: "Bottle Customization",
      description: "Choose between rPET or Aluminum, plus label size and finishes.",
    },
    {
      icon: <Smartphone size={24} />,
      title: "QR Technology",
      description: "Basic redirection, lead forms, or full interactive video experiences.",
    },
    {
      icon: <Calendar size={24} />,
      title: "Campaign Duration",
      description: "Short-term event promotions vs. Always-on seasonal campaigns.",
    },
  ];

  const tiers = [
    {
      name: "Starter Campaign",
      description: "Ideal for local businesses, events, and short-term promotions.",
      features: [
        "Local distribution focus",
        "Standard label customization",
        "Basic QR landing page",
        "Core location analytics",
        "Standard green impact contribution"
      ],
      highlight: false
    },
    {
      name: "Growth Campaign",
      description: "Designed for scaling brands requiring multi-location reach.",
      features: [
        "Regional / Multi-city distribution",
        "Premium label finishes",
        "Advanced QR (Video / Lead Gen)",
        "Real-time heatmap analytics",
        "Enhanced recycling initiatives"
      ],
      highlight: true
    },
    {
      name: "Enterprise Campaign",
      description: "For national brands needing high volume and deep integration.",
      features: [
        "National coverage strategy",
        "Custom bottle shapes available",
        "API integration for data",
        "White-label analytic reports",
        "Dedicated success manager"
      ],
      highlight: false
    },
  ];

  const faqs = [
    {
      question: "Why don't you have fixed pricing packages?",
      answer: "Every brand's goals are different. A local cafe needs a different strategy than a national tech company. By customizing every campaign, we ensure you pay only for what you need—whether that's specific zip codes, premium bottle materials, or advanced digital features—without carrying the cost of unnecessary add-ons."
    },
    {
      question: "Is there a minimum order quantity?",
      answer: "We strive to be accessible. While we have operational minimums to ensure campaign effectiveness and distribution impact, we work with brands of various sizes. Contact us to discuss what makes sense for your budget."
    },
    {
      question: "What is included in the 'Green Impact'?",
      answer: "Responsible advertising is our core promise. Every campaign includes a contribution to our sustainability initiatives, such as plastic recycling drives and tree plantation projects. We handle the logistics of this so you can focus on your brand."
    },
    {
      question: "Can I choose exactly where my bottles are distributed?",
      answer: "Yes. Our 'Growth' and 'Enterprise' plans offer granular distribution targeting. We can focus on fitness centers, corporate offices, cafes, or specific events to ensure your brand reaches the right audience."
    }
  ];

  return (
    <div className="bg-surface min-h-screen">
      
      {/* ────────────────────────
          HERO SECTION
      ──────────────────────── */}
      <section className="pt-32 pb-20 lg:pt-40 lg:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <motion.div 
          initial="hidden" 
          animate="visible" 
          variants={containerVariants}
        >
          <motion.h1 variants={itemVariants} className="text-4xl lg:text-6xl font-bold text-slate-900 mb-6 tracking-tight">
            Flexible Pricing Plans for <br/> <span className="text-gradient-primary">Smart Offline Advertising</span>
          </motion.h1>
          <motion.p variants={itemVariants} className="text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            No fixed packages. No hidden costs. <br/>
            We design custom pricing based on your campaign size, location, and marketing goals.
          </motion.p>
          <motion.div variants={itemVariants}>
             <Link 
              href="/contact" 
              className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white bg-primary hover:bg-primary-dark rounded-full shadow-lg shadow-primary/25 hover:shadow-glow-blue transition-all transform hover:-translate-y-1"
            >
              Get a Free Quote
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ────────────────────────
          WHY CUSTOM PRICING?
      ──────────────────────── */}
      <section className="py-20 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-sm font-bold text-primary tracking-widest uppercase mb-2 block">Our Model</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900">Why Our Pricing Is Custom</h2>
            <p className="mt-4 text-lg text-slate-600 max-w-3xl mx-auto">
              Cookie-cutter plans don't work for physical advertising. Your costs are optimized based on these key factors:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {pricingFactors.map((factor, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm mb-4">
                  {factor.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{factor.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{factor.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────────────
          CAMPAIGN TIERS
      ──────────────────────── */}
      <section className="py-24 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
             <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">Choose Your Campaign Structure</h2>
             <p className="text-slate-600">Select the tier that matches your ambitions. We handle the rest.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {tiers.map((tier) => (
              <div 
                key={tier.name}
                className={`relative flex flex-col p-8 rounded-[2rem] transition-all duration-300 ${
                  tier.highlight 
                    ? 'bg-white shadow-xl shadow-primary/10 border-2 border-primary scale-105 z-10' 
                    : 'bg-white/50 border border-slate-200 hover:bg-white hover:shadow-lg'
                }`}
              >
                {tier.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold uppercase tracking-widest py-1.5 px-4 rounded-full shadow-lg">
                    Most Popular
                  </div>
                )}

                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">{tier.name}</h3>
                  <p className="text-sm text-slate-500 min-h-[40px]">{tier.description}</p>
                </div>

                <div className="flex-grow mb-8">
                  <ul className="space-y-4">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <div className={`mt-0.5 rounded-full p-0.5 shrink-0 ${tier.highlight ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-500'}`}>
                          <Check size={14} strokeWidth={3} />
                        </div>
                        <span className="text-slate-700 font-medium">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-auto">
                   <Link
                    href="/contact"
                    className={`block w-full py-4 rounded-xl text-center font-bold transition-all ${
                      tier.highlight
                        ? 'bg-primary text-white hover:bg-primary-dark shadow-md'
                        : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    Start {tier.name.split(' ')[0]}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────────────
          COMPARISON TABLE
      ──────────────────────── */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Why Smart Offline Ads Win</h2>
            <p className="text-slate-600">See how AKUAFI compares to traditional offline channels.</p>
          </div>

          <div className="rounded-3xl border border-slate-200 overflow-hidden shadow-soft-lg bg-surface">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="py-6 px-8 text-left text-sm font-semibold text-slate-500 uppercase tracking-wider w-1/3">Feature</th>
                    <th className="py-6 px-8 text-center text-sm font-bold text-primary uppercase tracking-wider w-1/3 bg-primary/5">AKUAFI</th>
                    <th className="py-6 px-8 text-center text-sm font-semibold text-slate-400 uppercase tracking-wider w-1/3">Traditional Ads<br/><span className="text-[10px] normal-case font-normal">(Hoardings, Pamphlets)</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="py-6 px-8 text-slate-900 font-bold">Real-Time Tracking</td>
                    <td className="py-6 px-8 text-center bg-primary/5 text-primary"><Check size={24} className="mx-auto" /></td>
                    <td className="py-6 px-8 text-center text-slate-300">-</td>
                  </tr>
                  <tr>
                    <td className="py-6 px-8 text-slate-900 font-bold">Engagement Guaranteed</td>
                    <td className="py-6 px-8 text-center bg-primary/5 text-slate-700 text-sm font-medium">100% (Bottle in hand)</td>
                    <td className="py-6 px-8 text-center text-slate-500 text-sm">Passive / Ignored</td>
                  </tr>
                  <tr>
                    <td className="py-6 px-8 text-slate-900 font-bold">Detailed Analytics</td>
                    <td className="py-6 px-8 text-center bg-primary/5 text-primary"><BarChart3 size={24} className="mx-auto" /></td>
                    <td className="py-6 px-8 text-center text-slate-300">-</td>
                  </tr>
                  <tr>
                    <td className="py-6 px-8 text-slate-900 font-bold">Environmental Impact</td>
                    <td className="py-6 px-8 text-center bg-primary/5 text-success font-bold text-sm">Net Positive</td>
                    <td className="py-6 px-8 text-center text-slate-500 text-sm">High Waste</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────
          FAQ SECTION
      ──────────────────────── */}
      <section className="py-24 bg-surface border-t border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900">Frequently Asked Questions</h2>
          </div>
          
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-start gap-3">
                  <HelpCircle size={20} className="text-primary mt-1 shrink-0" />
                  {faq.question}
                </h3>
                <p className="text-slate-600 leading-relaxed pl-8">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────────────
          FINAL CTA
      ──────────────────────── */}
      <section className="py-24 bg-slate-900 relative overflow-hidden text-center">
         {/* Background Elements */}
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary rounded-full opacity-20 blur-[120px] pointer-events-none" />
         <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary rounded-full opacity-10 blur-[100px] pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">Get Your Custom Pricing in 24 Hours</h2>
          <p className="text-slate-400 text-lg mb-10 max-w-2xl mx-auto">
            Ready to disrupt offline advertising? Let's build a campaign that fits your budget and amplifies your brand.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
             <Link
              href="/contact"
              className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-slate-900 bg-white hover:bg-slate-100 rounded-full shadow-lg transition-all transform hover:-translate-y-1"
            >
              Request a Free Quote
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white bg-transparent border border-slate-600 hover:bg-slate-800 rounded-full transition-all"
            >
              Book a Free Demo
            </Link>
          </div>
          
          <p className="mt-8 text-slate-500 text-sm">
            No spam. No obligation. 100% free consultation.
          </p>
        </div>
      </section>

    </div>
  );
}
