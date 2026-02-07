import Link from "next/link";
import Image from "next/image";
import { Leaf } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-50 border-t border-slate-200 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand Column */}
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="mb-4 block">
              <Image 
                src="/logo/akuafi-logo.png" 
                alt="Akuafi" 
                width={120}
                height={40}
                className="h-8 w-auto object-contain" 
              />
            </Link>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
              Akuafi is India’s first QR-powered water bottle advertising platform that helps brands run offline marketing campaigns with real-time tracking. Our smart bottle ads convert physical impressions into digital leads, website visits, and sales. Whether you are a local business or a national brand, Akuafi offers a cost-effective and measurable offline advertising solution.
            </p>
          </div>

          {/* Links Column 1 */}
          <div>
            <h4 className="font-semibold text-slate-900 mb-4">Platform</h4>
            <ul className="space-y-3 text-sm text-slate-600">
              <li><Link href="/services" className="hover:text-primary transition-colors">Bottled Branding™</Link></li>
              <li><Link href="/services" className="hover:text-primary transition-colors">QR Engage™</Link></li>
              <li><Link href="/services" className="hover:text-primary transition-colors">Analytics</Link></li>
            </ul>
          </div>

          {/* Links Column 2 */}
          <div>
            <h4 className="font-semibold text-slate-900 mb-4">Company</h4>
            <ul className="space-y-3 text-sm text-slate-600">
              <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="/pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h4 className="font-semibold text-slate-900 mb-4">Get in Touch</h4>
            <ul className="space-y-3 text-sm text-slate-600">
              <li><a href="mailto:info@akuafi.com" className="font-bold text-slate-900 hover:text-primary transition-colors">info@akuafi.com</a></li>
              <li><a href="mailto:akuafiofficial@gmail.com" className="hover:text-primary transition-colors">akuafiofficial@gmail.com</a></li>
              <li><a href="tel:7522801110" className="hover:text-primary transition-colors">7522801110</a></li>
              <li className="text-slate-500 pt-2 leading-relaxed">
                AKUAFI PRIVATE LIMITED<br />
                4080/93, Pawan Villa,<br />
                Haridwarpuram, Basharatpur,<br />
                Gorakhpur – 273004,<br />
                Uttar Pradesh, India
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-400">
          <p>&copy; {new Date().getFullYear()} AKUAFI. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
