import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="bg-surface pt-20 pb-10 border-t border-slate-200">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-12 mb-16 text-center md:text-left">
          {/* Brand */}
          <div className="flex flex-col items-center md:items-start">
            <Image 
               src="/logo/akuafi-logo.png" 
               alt="Akuafi" 
               width={160} 
               height={56} 
               className="h-[60px] mb-6 object-contain" 
            />
            <p className="text-slate-400 text-sm">Smart Offline Advertising Platform.</p>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-bold text-slate-900 mb-6">Company</h4>
            <ul className="space-y-4 text-slate-500">
              <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">Careers</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-bold text-slate-900 mb-6">Services</h4>
            <ul className="space-y-4 text-slate-500">
              <li><Link href="/services" className="hover:text-primary transition-colors">Bottled Branding™</Link></li>
              <li><Link href="/services" className="hover:text-primary transition-colors">QR Engage™</Link></li>
              <li><Link href="/services" className="hover:text-primary transition-colors">Analytics</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-slate-900 mb-6">Contact</h4>
            <ul className="space-y-4 text-slate-500">
              <li><a href="mailto:info@akuafi.com" className="font-bold hover:text-primary transition-colors">info@akuafi.com</a></li>
              <li><a href="mailto:akuafiofficial@gmail.com" className="hover:text-primary transition-colors">akuafiofficial@gmail.com</a></li>
              <li><a href="tel:7522801110" className="hover:text-primary transition-colors">7522801110</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-8 text-center text-slate-400 text-sm">
          <p>&copy; 2026 AKUAFI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
