"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { name: "Services", href: "/services" },
  { name: "About", href: "/about" },
  { name: "Pricing", href: "/pricing" },
  { name: "Blog", href: "/blog" },
  { name: "Contact", href: "/contact" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 glass-nav ${scrolled ? "scrolled" : ""}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ⬇️ NAVBAR HEIGHT FIXED HERE */}
        <div className={`flex justify-between items-center transition-all duration-300 ${scrolled ? "h-20" : "h-24"}`}>
          
          {/* Logo & Micro Branding */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 group">
              
              {/* ⬇️ LOGO UPDATED TO IMAGE */}
              <div className="navbar-logo relative flex items-center">
                 <Image 
                    src="/logo/akuafi-logo.png" 
                    alt="Akuafi" 
                    width={160}
                    height={56}
                    priority
                    className="h-14 w-auto object-contain" 
                 />
              </div>
            </Link>

            {/* Divider */}
            <div className="hidden md:block h-6 w-px bg-slate-300 mx-2"></div>

            {/* Micro branding text */}
            <span className="hidden md:block text-sm font-medium text-slate-500 uppercase tracking-wide mt-1">
              Get Your Brand Akuafied.
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <div className="flex items-center gap-8" onMouseLeave={() => setHoveredPath(null)}>
              {navLinks.map((link) => (
                <div 
                  key={link.name} 
                  className="relative"
                  onMouseEnter={() => setHoveredPath(link.href)}
                >
                  <Link
                    href={link.href}
                    className={`relative z-10 text-sm font-medium transition-colors ${
                      hoveredPath === link.href ? "text-primary" : "text-slate-600 hover:text-primary"
                    }`}
                  >
                    {link.name}
                  </Link>
                  {hoveredPath === link.href && (
                    <motion.span
                      className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-primary to-accent-cyan rounded-full"
                      layoutId="navbar-underline"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="pl-4 border-l border-slate-200">
              <Link
                href="/contact"
                className="relative inline-flex items-center justify-center overflow-hidden px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-full shadow-soft-md group hover:shadow-glow-blue transition-all duration-300 transform hover:-translate-y-0.5"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Get Started
                  <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary-dark to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-slate-600 hover:text-primary transition-colors"
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-slate-100 overflow-hidden"
          >
            <div className="px-4 pt-4 pb-6 space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="flex items-center gap-2 text-lg font-medium text-slate-700 hover:text-primary"
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </Link>
              ))}

              <div className="pt-4">
                <Link
                  href="/contact"
                  onClick={() => setIsOpen(false)}
                  className="block w-full text-center px-6 py-3 bg-primary text-white font-semibold rounded-lg shadow-soft-md"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
