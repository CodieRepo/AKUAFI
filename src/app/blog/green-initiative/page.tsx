"use client";

import Link from "next/link";
import { ArrowLeft, Leaf, Recycle, TreePine, BarChart3, Globe } from "lucide-react";

export default function GreenInitiativePost() {
  return (
    <main className="min-h-screen pt-24 pb-20 bg-white">
      {/* Post Header */}
      <article className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <Link 
            href="/blog" 
            className="inline-flex items-center gap-2 text-slate-500 hover:text-green-600 transition-colors mb-8 font-medium"
          >
            <ArrowLeft size={18} /> Back to Blog
          </Link>
          
          <div className="flex items-center gap-2 text-green-600 font-semibold mb-4">
            <span className="bg-green-100 px-3 py-1 rounded-full text-sm">Green Initiative</span>
            <span className="text-slate-400 text-sm">•</span>
            <span className="text-slate-500 text-sm">5 min read</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight leading-tight mb-6">
            Sustainability at the Core of Connection: Our Commitment to a Greener Future
          </h1>
          
          <p className="text-xl text-slate-600 leading-relaxed">
            Advertising has historically been a wasteful industry. At AKUAFI, we're building a platform that doesn't just drive engagement—it drives responsibility.
          </p>
        </div>

        {/* Feature Image Placeholder */}
        <div className="w-full h-80 md:h-96 bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl mb-12 flex items-center justify-center border border-slate-100 relative overflow-hidden">
           <div className="absolute inset-0 opacity-10 pattern-grid-lg"></div>
           <div className="text-center z-10">
              <Leaf size={64} className="text-green-500 mx-auto mb-4 opacity-80" />
              <p className="text-slate-400 font-medium tracking-widest uppercase text-sm">Better for Brands • Better for the Planet</p>
           </div>
        </div>

        {/* Content Body */}
        <div className="prose prose-lg prose-slate max-w-none">
          <p>
            In a world increasingly conscious of environmental impact, businesses can no longer afford to view sustainability as an afterthought. For the advertising and branding sector, this challenge is particularly acute. Traditional marketing—flyers, billboards, single-use promotional materials—generates massive amounts of physical waste.
          </p>
          <p>
            AKUAFI was founded on a simple yet powerful premise: <strong>What if we could turn necessary physical objects into infinite digital canvases?</strong>
          </p>
          <p>
            Our "Green Initiative" isn't a marketing slogan. It's the foundational architecture of our platform. By leveraging the physical longevity of high-quality water bottles and the dynamic nature of QR technology, we are reducing the need for disjointed, disposable advertising materials.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-12 mb-6 flex items-center gap-3">
             <span className="p-2 bg-green-100 rounded-lg text-green-600"><Recycle size={24} /></span>
             Turning Physical Waste into Digital Value
          </h2>
          <p>
            Every year, billions of dollars are spent on printed marketing materials that end up in landfills within days. AKUAFI shifts this paradigm.
          </p>
          <ul className="space-y-4 my-8 list-none pl-0">
             <li className="flex gap-4 items-start">
                <div className="mt-1 min-w-[20px] text-green-500"><ChevronIcon /></div>
                <div>
                   <strong className="text-slate-900">Reduced Material Comsumption:</strong> One smart bottle serves as a permanent portal for endless campaigns. You don't need to reprint materials for a new season; you simply update the digital destination.
                </div>
             </li>
             <li className="flex gap-4 items-start">
                <div className="mt-1 min-w-[20px] text-green-500"><ChevronIcon /></div>
                <div>
                   <strong className="text-slate-900">Long-Lifespan Assets:</strong> We prioritize durable, high-quality materials that users want to keep and reuse, extending the brand impression timeline from seconds to years.
                </div>
             </li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-900 mt-12 mb-6 flex items-center gap-3">
             <span className="p-2 bg-green-100 rounded-lg text-green-600"><TreePine size={24} /></span>
             More Than Just Tech: Active Restoration
          </h2>
          <p>
            Reducing harm is only step one. We claim a responsibility to actively contribute to environmental restoration. That’s why we are committing a percentage of our profits to certified reforestation and ocean cleanup projects.
          </p>
          <p>
            When a brand chooses AKUAFI, they aren't just choosing a smarter ad platform; they are investing in a system that values the planet. We provide transparent reporting on the eco-impact of switching from traditional print to connected digital inventory.
          </p>

          <div className="bg-slate-50 border-l-4 border-green-500 p-8 my-10 rounded-r-xl">
             <h3 className="text-xl font-bold text-slate-900 mb-3">Our 2026 Pledge</h3>
             <p className="text-slate-700 m-0 italic">
                "To empower 500 brands to transition 30% of their print budget to sustainable, digital-physical connected assets, diverting an estimated 50 tons of marketing waste from landfills."
             </p>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mt-12 mb-6 flex items-center gap-3">
             <span className="p-2 bg-green-100 rounded-lg text-green-600"><BarChart3 size={24} /></span>
             Measurable Impact
          </h2>
          <p>
            Sustainability often feels abstract. We make it tangible. Our analytics dashboard doesn't just track clicks and conversions; future updates will help brands visualize their "Eco-Savings"—estimating the paper and plastic waste avoided by running campaigns digitally through our platform.
          </p>
          
          <hr className="my-12 border-slate-200" />
          
          <h3 className="text-3xl font-bold text-slate-900 mb-6 text-center">Join the Movement</h3>
          <p className="text-center text-lg mb-8">
            The future of advertising is clean, connected, and conscious. Ready to maximize your impact while minimizing your footprint?
          </p>
          
          <div className="text-center">
             <Link 
               href="/contact" 
               className="inline-flex items-center gap-2 px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-full shadow-lg hover:shadow-green-200/50 transition-all transform hover:-translate-y-1"
             >
                Start Your Green Campaign <Globe size={20} />
             </Link>
          </div>
        </div>
      </article>
    </main>
  );
}

// Simple helper for the custom list icon
function ChevronIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
