import { Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function GreenCommitment() {
  return (
    <section className="py-24 bg-gradient-to-br from-[#F0FDF4] to-[#DCFCE7] relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-40" style={{ backgroundImage: "radial-gradient(#16A34A 0.5px, transparent 0.5px)", backgroundSize: "24px 24px" }}></div>
        
        <div className="container mx-auto px-6 relative z-10">
            <div className="max-w-4xl mx-auto glass-panel rounded-[2.5rem] p-12 lg:p-16 text-center shadow-soft-lg border-white/50">
                <div className="inline-flex items-center justify-center p-4 bg-success/10 rounded-full text-success mb-8">
                    <Leaf className="w-10 h-10" />
                </div>
                
                <h2 className="text-3xl lg:text-5xl font-bold text-[#14532D] mb-6 leading-tight">
                    Marketing that grows your brand—and the planet.
                </h2>
                
                <p className="text-lg lg:text-xl text-[#166534] mb-10 max-w-2xl mx-auto leading-relaxed">
                    Every Akuafi campaign includes responsible practices: recyclable materials, bottle collection, and tree plantation initiatives.
                </p>
                
                <Link href="/contact">
                    <Button 
                        size="lg" 
                        className="bg-[#16A34A] hover:bg-[#15803D] border-none shadow-lg shadow-success/20"
                    >
                        See Our Impact
                    </Button>
                </Link>
            </div>
        </div>
    </section>
  );
}
