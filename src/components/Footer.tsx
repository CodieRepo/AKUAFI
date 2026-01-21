import Link from "next/link";
import { Leaf } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-50 border-t border-slate-200 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand Column */}
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="text-2xl font-bold text-primary mb-4 block">
              AKUAFI
            </Link>
            <p className="text-slate-500 text-sm mb-6">
              Transforming everyday water bottles into smart, measurable advertising channels.
            </p>
            <div className="flex items-center gap-2 text-success font-medium text-sm">
              <Leaf size={16} />
              <span>Climate Positive Platform</span>
            </div>
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
              <li>hello@akuafi.com</li>
              <li>+1 (555) 123-4567</li>
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
