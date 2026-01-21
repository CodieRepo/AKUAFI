import Link from "next/link";
import { GlassWater, QrCode, LineChart } from "lucide-react";

export function Ecosystem() {
  return (
    <section id="ecosystem" className="py-24 bg-surface relative overflow-hidden">
      {/* Decorative Dots */}
      <div className="absolute top-20 right-20 w-32 h-32 opacity-10" style={{ backgroundImage: "radial-gradient(#0A66C2 1px, transparent 1px)", backgroundSize: "16px 16px" }}></div>

      <div className="container mx-auto px-6">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">Our Ecosystem</h2>
          <p className="text-slate-600">A complete platform designed to turn offline visibility into online performance.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="group relative bg-white rounded-3xl p-8 border border-slate-100 shadow-soft-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-soft-xl hover:border-primary/20 overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-gradient opacity-0 group-hover:opacity-100 transition-opacity" />
             <div className="w-16 h-16 bg-surface rounded-2xl flex items-center justify-center mb-6 text-primary group-hover:bg-primary group-hover:text-white group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300">
                <GlassWater className="w-8 h-8" />
             </div>
             <h3 className="text-xl font-bold text-slate-900 mb-3">Bottled Branding™</h3>
             <p className="text-slate-600 leading-relaxed">
                Premium branded water bottles that carry your message into real-world, high-footfall locations.
             </p>
          </div>

          {/* Card 2 */}
          <div className="group relative bg-white rounded-3xl p-8 border border-slate-100 shadow-soft-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-soft-xl hover:border-primary/20 overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-gradient opacity-0 group-hover:opacity-100 transition-opacity" />
             <div className="w-16 h-16 bg-surface rounded-2xl flex items-center justify-center mb-6 text-primary group-hover:bg-primary group-hover:text-white group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <QrCode className="w-8 h-8" />
             </div>
             <h3 className="text-xl font-bold text-slate-900 mb-3">QR Engage™</h3>
             <p className="text-slate-600 leading-relaxed">
                Dynamic QR campaigns that convert offline attention into digital engagement.
             </p>
          </div>

          {/* Card 3 */}
          <div className="group relative bg-white rounded-3xl p-8 border border-slate-100 shadow-soft-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-soft-xl hover:border-primary/20 overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-gradient opacity-0 group-hover:opacity-100 transition-opacity" />
             <span className="absolute top-6 right-6 bg-success-light text-success text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                Built-in
             </span>
             <div className="w-16 h-16 bg-surface rounded-2xl flex items-center justify-center mb-6 text-primary group-hover:bg-primary group-hover:text-white group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300">
                <LineChart className="w-8 h-8" />
             </div>
             <h3 className="text-xl font-bold text-slate-900 mb-3">Real-Time Analytics</h3>
             <p className="text-slate-600 leading-relaxed">
                Track scans, locations, devices, and conversions instantly. No extra cost.
             </p>
          </div>
        </div>
        
        <div className="text-center mt-12">
            <Link href="/services" className="text-primary font-semibold hover:text-primary-dark transition-colors inline-flex items-center gap-2">
                Explore Our Platform <span aria-hidden="true">&rarr;</span>
            </Link>
        </div>
      </div>
    </section>
  );
}
