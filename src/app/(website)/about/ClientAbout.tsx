"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Lightbulb,
  Leaf,
  Target,
  Users,
  AlertCircle,
  TrendingDown,
  Megaphone,
  CheckCircle2,
  Map,
  Rocket,
  Store,
  Building2,
  GraduationCap,
  Stethoscope,
  Utensils,
  CalendarHeart,
  ShoppingBag,
  Vote,
  Sparkles,
  Search,
  MessageSquare,
  Gift,
  Languages,
  UserPlus,
} from "lucide-react";

export default function ClientAbout() {
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
      },
    },
  };

  return (
    <div className="bg-white min-h-screen">
      {/* ────────────────────────
          HERO SECTION
      ──────────────────────── */}
      <section className="relative py-24 lg:py-32 overflow-hidden bg-slate-50">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-primary-light/10 skew-x-12 translate-x-1/3 -z-10"></div>
        <div className="absolute bottom-0 left-0 w-1/3 h-2/3 bg-accent-cyan-light/10 -skew-x-12 -translate-x-1/4 -z-10 rounded-full blur-3xl"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight">
              About Akuafi –{" "}
              <span className="text-primary">
                Where Offline Meets Online Marketing
              </span>
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              We help brands transform everyday water bottles into powerful
              advertising tools that generate real engagement, real data, and
              real sales.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ────────────────────────
          BRAND STORY
      ──────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1 rounded-full bg-blue-50 text-primary font-bold text-sm uppercase tracking-wide mb-4">
              Our Story
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900">
              Revolutionizing the Simplest Medium
            </h2>
          </div>

          <div className="prose prose-lg mx-auto text-slate-600 leading-relaxed">
            <p className="mb-6">
              It started with a simple observation:{" "}
              <strong>traditional offline advertising is broken.</strong>{" "}
              Billboards are ignored, pamphlets are discarded, and brands spend
              millions without knowing if anyone actually saw their ad.
            </p>
            <p className="mb-6">
              Meanwhile, water is essential. It&apos;s everywhere—in hands, on
              desks, at events. We realized that the humble water bottle
              wasn&apos;t just a container; it was untapped &quot;real
              estate.&quot; But placing a logo on a bottle wasn&apos;t enough.
              It needed to be <strong>smart</strong>.
            </p>
            <p>
              That’s how <strong>Akuafi</strong> was born. As India’s first
              QR-powered bottle advertising platform, we bridged the gap between
              the physical and digital worlds. We turned a passive object into
              an interactive experience, giving brands the power to track
              engagement, generate leads, and measure ROI like never
              before—while ensuring every campaign gives back to the planet.
            </p>
          </div>
        </div>
      </section>

      {/* ────────────────────────
          THE PROBLEM & SOLUTION
      ──────────────────────── */}
      <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary rounded-full blur-[120px] opacity-10 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* The Problem */}
            <div>
              <div className="flex items-center gap-3 mb-6 text-red-400">
                <AlertCircle size={28} />
                <h2 className="text-3xl font-bold text-white">The Problem</h2>
              </div>
              <h3 className="text-xl text-slate-300 mb-6">
                Traditional Offline Advertising is Blind & Costly
              </h3>
              <ul className="space-y-4">
                {[
                  "No tracking or real ROI measurement",
                  "High cost with unpredictable results",
                  "Low customer engagement & recall",
                  "Often ignored or discarded immediately",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-300">
                    <TrendingDown className="w-5 h-5 text-red-500 flex-shrink-0 mt-1" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* The Solution */}
            <div className="bg-white/5 p-8 rounded-3xl border border-white/10 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-6 text-success-light">
                <CheckCircle2 size={28} />
                <h2 className="text-3xl font-bold text-white">Our Solution</h2>
              </div>
              <h3 className="text-xl text-slate-300 mb-6 font-semibold">
                Smart Bottle Advertising Ecosystem
              </h3>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center text-primary-light flex-shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">
                      Bottled Branding™
                    </h4>
                    <p className="text-sm text-slate-400">
                      Premium physical visibility.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center text-primary-light flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">
                      QR Engage™ Technology
                    </h4>
                    <p className="text-sm text-slate-400">
                      Interactive digital bridge.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center text-primary-light flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">
                      Analytics Dashboard
                    </h4>
                    <p className="text-sm text-slate-400">
                      Real-time data & insights.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────
          MISSION, VISION & VALUES
      ──────────────────────── */}
      <section className="py-24 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
            <div className="bg-white p-8 rounded-2xl shadow-soft-sm border border-slate-100">
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Target className="text-primary" /> Our Mission
              </h2>
              <p className="text-slate-600 leading-relaxed text-lg">
                To empower brands with traceable, high-impact offline
                advertising solutions that connect physical impressions to
                digital actions.
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-soft-sm border border-slate-100">
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Lightbulb className="text-accent-cyan" /> Our Vision
              </h2>
              <p className="text-slate-600 leading-relaxed text-lg">
                To become India’s leading smart offline media network, turning
                everyday objects into intelligent communication channels.
              </p>
            </div>
          </div>

          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-slate-900">
              Our Core Values
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {[
              {
                icon: Sparkles,
                label: "Innovation",
                desc: "Always rethinking traditional media.",
              },
              {
                icon: Search,
                label: "Transparency",
                desc: "Data you can trust, fully open.",
              },
              {
                icon: Leaf,
                label: "Sustainability",
                desc: "Advertising that gives back.",
              },
              {
                icon: Users,
                label: "Customer Success",
                desc: "Your growth is our goal.",
              },
              {
                icon: Gift,
                label: "Affordability",
                desc: "Accessible for all businesses.",
              },
            ].map((val, i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-xl border border-slate-100 text-center hover:shadow-soft-md transition-all"
              >
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-700">
                  <val.icon size={20} />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{val.label}</h3>
                <p className="text-xs text-slate-500">{val.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────────────
          WHY AKUAFI IS DIFFERENT
      ──────────────────────── */}
      <section className="py-24 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6">
              Why Choose Akuafi?
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
            {[
              "India’s first QR-powered bottle advertising platform",
              "Real-time analytics & scan tracking",
              "Dynamic QR codes (editable anytime)",
              "Eco-friendly branding (recyclable)",
              "End-to-end execution support",
              "Hyperlocal & national scalability",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <div className="w-8 h-8 rounded-full bg-primary-light/20 flex items-center justify-center text-primary flex-shrink-0">
                  <CheckCircle2 size={16} />
                </div>
                <span className="text-slate-700 font-semibold">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────────────
          WHO WE SERVE
      ──────────────────────── */}
      <section className="py-24 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6">
              Who We Serve
            </h2>
            <p className="text-lg text-slate-600">
              From local startups to national giants, we have a solution for
              everyone.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
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
              <div
                key={idx}
                className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-sm border border-slate-100 hover:border-primary/30 transition-all text-center h-full"
              >
                <div className="mb-4 text-slate-400">
                  <item.icon size={32} />
                </div>
                <h3 className="font-bold text-slate-700">{item.label}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────────────
          FUTURE ROADMAP
      ──────────────────────── */}
      <section className="py-24 bg-slate-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-primary font-bold uppercase tracking-wider text-sm">
              Future Direction
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mt-2 mb-6">
              Our Roadmap
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              We are constantly innovating to bring you better tools.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Rocket,
                title: "AI Campaign Optimization",
                desc: "Automated insights to improve scan rates.",
              },
              {
                icon: MessageSquare,
                title: "WhatsApp Automation",
                desc: "Direct-to-chat redirections & bots.",
              },
              {
                icon: Users,
                title: "CRM Integrations",
                desc: "Sync leads directly to your sales pipeline.",
              },
              {
                icon: Gift,
                title: "Loyalty Systems",
                desc: "Scan-to-earn rewards & couponing.",
              },
              {
                icon: Languages,
                title: "Regional Support",
                desc: "Multilingual ad campaigns for deeper reach.",
              },
              {
                icon: UserPlus,
                title: "Reseller Programs",
                desc: "Franchising opportunities across states.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="flex gap-4 p-6 bg-white rounded-xl border border-slate-200/60 items-start"
              >
                <div className="text-primary mt-1">
                  <item.icon size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────────────
          FINAL CTA
      ──────────────────────── */}
      <section className="py-24 bg-slate-900 text-white relative text-center">
        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Ready to Transform Your Offline Ads?
          </h2>
          <p className="text-slate-300 text-lg mb-10">
            Join the future of offline marketing with Akuafi.
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
              Request a Free Demo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
