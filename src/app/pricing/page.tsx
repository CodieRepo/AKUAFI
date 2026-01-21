"use client";

import { Check, Leaf } from "lucide-react";
import Link from "next/link";

export default function Pricing() {
  const plans = [
    {
      name: "Starter",
      description: "Perfect for local businesses and events.",
      features: [
        "1,000 - 5,000 Bottles",
        "Standard Label Customization",
        "Basic QR Landing Page",
        "Location Analytics",
        "50 Trees Planted",
      ],
      cta: "Get Quote",
      highlight: false
    },
    {
      name: "Growth",
      description: "For scaling brands and regional campaigns.",
      features: [
        "5,000 - 20,000 Bottles",
        "Premium Label Finishes",
        "Advanced QR (Video/Lead Form)",
        "Real-time Heatmap Analytics",
        "200 Trees Planted",
        "Bottle Collection Drive",
      ],
      cta: "Get Quote",
      highlight: true
    },
    {
      name: "Enterprise",
      description: "National coverage and corporate partnerships.",
      features: [
        "20,000+ Bottles",
        "Full Custom Bottle Shape Options",
        "API Integration for QR Data",
        "Dedicated Success Manager",
        "Custom Green Impact Project",
        "White-label Reports",
      ],
      cta: "Contact Sales",
      highlight: false
    }
  ];

  return (
    <div className="bg-surface min-h-screen py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-16">
          <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6">Simple, Transparent Scaling</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Choose the reach that fits your goals. All plans include our Green Impact commitment.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div 
              key={plan.name}
              className={`rounded-[2rem] p-8 relative flex flex-col ${
                plan.highlight 
                  ? 'bg-white shadow-xl shadow-primary/10 border-2 border-primary z-10 scale-105' 
                  : 'bg-white shadow-soft-lg border border-slate-100 text-slate-600'
              }`}
            >
              {plan.highlight && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white text-xs font-bold uppercase tracking-widest py-1 px-4 rounded-full shadow-lg">
                  Most Popular
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                <p className="text-sm text-slate-500">{plan.description}</p>
              </div>

              <div className="flex-grow">
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm font-medium">
                      <div className={`mt-0.5 rounded-full p-0.5 ${plan.highlight ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-500'}`}>
                        <Check size={14} strokeWidth={3} />
                      </div>
                      <span className="text-slate-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="mt-auto pt-6 border-t border-slate-100">
                <div className="flex items-center gap-2 text-success text-xs font-bold uppercase tracking-wider mb-4 justify-center">
                   <Leaf size={14} /> Green Impact Included
                </div>
                <Link
                  href="/contact"
                  className={`block w-full py-4 rounded-xl text-center font-bold transition-all ${
                    plan.highlight
                      ? 'bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/25'
                      : 'bg-slate-50 text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-20 text-center">
            <p className="text-slate-500 text-sm">
                Need a custom volume or specific distribution area? 
                <Link href="/contact" className="text-primary font-semibold hover:underline ml-2">
                    Let's talk.
                </Link>
            </p>
        </div>

      </div>
    </div>
  );
}
