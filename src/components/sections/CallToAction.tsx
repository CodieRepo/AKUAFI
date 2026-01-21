import { Button } from "@/components/ui/button";
import Link from "next/link";

export function CallToAction() {
  return (
    <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
            <div className="bg-blue-gradient rounded-[2.5rem] p-12 lg:p-24 text-center relative overflow-hidden shadow-glow">
                {/* Decorative Circles */}
                <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
                
                <div className="relative z-10 max-w-3xl mx-auto">
                    <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
                        Ready to Launch?
                    </h2>
                    <p className="text-xl text-blue-50 mb-10">
                        Turn simple water bottles into smart, trackable advertising tools today.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/contact">
                            <Button size="lg" className="w-full sm:w-auto bg-white text-primary hover:bg-blue-50 shadow-lg">
                                Get Started
                            </Button>
                        </Link>
                        <Link href="/contact">
                             <Button variant="outline" size="lg" className="w-full sm:w-auto border-white text-white hover:bg-white/10 hover:border-white">
                                Request Demo
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    </section>
  );
}
