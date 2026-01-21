import { XCircle, CheckCircle } from "lucide-react";
import Link from "next/link";

export function Comparison() {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">Why Traditional Offline Ads Fail</h2>
          <p className="text-slate-600">Stop wasting budget on ads you can't track.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Old Way */}
          <div className="p-10 rounded-[2rem] bg-red-50/50 border border-red-100">
            <div className="flex items-center gap-3 text-2xl font-bold text-secondary mb-8">
                <XCircle className="w-8 h-8" />
                The Old Way
            </div>
            <div className="space-y-6">
                <div className="flex items-center gap-4 text-slate-600">
                    <XCircle className="w-5 h-5 text-secondary flex-shrink-0" />
                    <span><strong>Hoardings:</strong> Expensive & Untrackable</span>
                </div>
                <div className="flex items-center gap-4 text-slate-600">
                    <XCircle className="w-5 h-5 text-secondary flex-shrink-0" />
                    <span><strong>Pamphlets:</strong> Ignored & Wasted</span>
                </div>
                <div className="flex items-center gap-4 text-slate-600">
                    <XCircle className="w-5 h-5 text-secondary flex-shrink-0" />
                    <span><strong>Events:</strong> No Measurable ROI</span>
                </div>
                <div className="flex items-center gap-4 text-slate-600">
                    <XCircle className="w-5 h-5 text-secondary flex-shrink-0" />
                    <span><strong>Reach:</strong> Limited & Static</span>
                </div>
            </div>
          </div>

          {/* Akuafi Way */}
          <div className="relative p-10 rounded-[2rem] bg-gradient-to-br from-white to-surface border-2 border-primary shadow-soft-lg overflow-hidden">
             {/* Glow Effect */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
             
             <div className="relative z-10">
                <div className="flex items-center gap-3 text-2xl font-bold text-success mb-8">
                    <CheckCircle className="w-8 h-8" />
                    The Akuafi Way
                </div>
                <div className="space-y-6">
                    <div className="flex items-center gap-4 text-slate-700">
                        <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                        <span><strong>Bottles:</strong> High Engagement & Utility</span>
                    </div>
                    <div className="flex items-center gap-4 text-slate-700">
                        <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                        <span><strong>QR Tech:</strong> Instant Digital Conversion</span>
                    </div>
                    <div className="flex items-center gap-4 text-slate-700">
                        <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                        <span><strong>Analytics:</strong> Real-Time ROI Tracking</span>
                    </div>
                    <div className="flex items-center gap-4 text-slate-700">
                        <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                        <span><strong>Placement:</strong> Hyperlocal Targeting</span>
                    </div>
                </div>
             </div>
          </div>
        </div>
        
        <div className="text-center mt-12">
            <Link href="/contact" className="text-slate-500 font-semibold hover:text-primary transition-colors inline-flex items-center gap-2">
                See Real Use Cases <span aria-hidden="true">&rarr;</span>
            </Link>
        </div>
      </div>
    </section>
  );
}
