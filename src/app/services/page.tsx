"use client";

import { motion } from "framer-motion";
import { BarChart3, QrCode, Smartphone, Leaf, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Services() {
  const services = [
    {
      id: "bottled-branding",
      icon: <span className="text-4xl">💧</span>,
      title: "Bottled Branding™",
      description: "Premium water bottles customized with your brand identity. High-quality labeling and sustainable materials options.",
      features: ["Custom Label Design", "Premium Water Quality", "Sustainable Bottle Options", "Nationwide Distribution"],
      color: "bg-white",
      border: "border-slate-100"
    },
    {
      id: "qr-engage",
      icon: <span className="text-4xl">📱</span>,
      title: "QR Engage™",
      description: "The digital bridge. Smart QR codes that connect offline consumers to your digital ecosystem instantly.",
      features: ["Dynamic QR Codes", "Custom Landing Pages", "Video & Offer Integration", "Retargeting Capabilities"],
      color: "bg-primary text-white",
      textColor: "text-white",
      border: "border-primary",
      highlight: true
    },
    {
      id: "analytics",
      icon: <span className="text-4xl">📊</span>,
      title: "Analytics Dashboard",
      description: "Measure the unmeasurable. Track scans, location data, and user engagement in real-time.",
      features: ["Real-time Scan Tracking", "Geolocation Heatmaps", "Conversion Analytics", "ROI Calculation"],
      color: "bg-white",
      border: "border-slate-100"
    },
    {
      id: "green-impact",
      icon: <span className="text-4xl">🌱</span>,
      title: "Green Impact Program",
      description: "Built-in sustainability. Every campaign contributes to environmental initiatives automatically.",
      features: ["Tree Plantation per Milestone", "Bottle Collection Drives", "Recycling Partners", "Impact Certifications"],
      color: "bg-success-light/30",
      border: "border-success/20"
    }
  ];

  return (
    <div className="bg-surface min-h-screen py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-20">
          <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6">Our Services</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            A complete ecosystem designed to turn physical products into powerful marketing channels.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {services.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`p-8 rounded-[2rem] shadow-soft-lg border ${service.border} ${service.color} relative overflow-hidden group hover:shadow-soft-xl transition-all`}
            >
              <div className="relative z-10">
                <div className="mb-6">{service.icon}</div>
                <h3 className={`text-2xl font-bold mb-4 ${service.highlight ? 'text-white' : 'text-slate-900'}`}>{service.title}</h3>
                <p className={`mb-8 text-lg ${service.highlight ? 'text-primary-light' : 'text-slate-600'}`}>{service.description}</p>
                
                <ul className="space-y-3 mb-8">
                  {service.features.map((feature, i) => (
                    <li key={i} className={`flex items-center gap-3 ${service.highlight ? 'text-white' : 'text-slate-700'}`}>
                      <div className={`w-2 h-2 rounded-full ${service.highlight ? 'bg-accent-cyan' : 'bg-primary'}`}></div>
                      {feature}
                    </li>
                  ))}
                </ul>

                {service.feature_tag && (
                    <span className="inline-block px-3 py-1 bg-white/20 rounded text-xs font-bold uppercase tracking-wider text-white mb-4">
                        {service.feature_tag}
                    </span>
                )}
              </div>
              
              {/* Decorative Blur */}
              <div className={`absolute -bottom-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-20 ${service.highlight ? 'bg-white' : 'bg-primary'}`}></div>
            </motion.div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-24 text-center">
          <div className="bg-white p-12 rounded-[2.5rem] shadow-soft-xl inline-block max-w-4xl w-full border border-slate-100">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">Ready to Launch Your Campaign?</h2>
            <p className="text-slate-600 mb-8 max-w-2xl mx-auto">
              Get a custom quote based on your distribution needs and sustainability goals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="px-8 py-4 bg-primary text-white font-bold rounded-full shadow-lg shadow-primary/25 hover:shadow-glow-blue hover:-translate-y-1 transition-all"
              >
                Launch My Campaign
              </Link>
              <Link
                href="/contact"
                className="px-8 py-4 bg-success-light text-success-dark font-bold rounded-full hover:bg-success hover:text-white transition-all"
              >
                Get Green Quote
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
