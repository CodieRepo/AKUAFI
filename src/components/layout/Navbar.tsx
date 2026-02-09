import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";

export function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 h-20">
      <div className="container mx-auto px-6 h-full flex items-center justify-between">
        {/* Logo & Tagline */}
        <div className="flex items-center">
            <Link href="/" className="flex items-center">
                <Image 
                   src="/images/Akuafi-08 (1).png" 
                   alt="Akuafi" 
                   width={160} 
                   height={56} 
                   priority
                   className="h-14 w-auto object-contain" 
                />
            </Link>
        </div>
        
        {/* Nav Links */}
        <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-primary font-medium">Home</Link>
            <Link href="/services" className="text-slate-600 hover:text-primary transition-colors font-medium">Services</Link>
            <Link href="/pricing" className="text-slate-600 hover:text-primary transition-colors font-medium">Pricing</Link>
            <Link href="/about" className="text-slate-600 hover:text-primary transition-colors font-medium">About</Link>
        </nav>
        
        {/* CTA - Fixed Style */}
        <div className="hidden md:flex">
            <Link href="/contact">
                <Button size="default" className="shadow-lg shadow-primary/20 hover:shadow-primary/40 font-bold px-8 h-11 tracking-wide">
                    Get Started
                </Button>
            </Link>
        </div>
      </div>
    </header>
  );
}
