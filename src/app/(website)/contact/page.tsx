"use client";

import { Mail, MapPin, Phone, ArrowRight } from "lucide-react";

export default function Contact() {
  return (
    <div className="bg-surface min-h-screen py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
          
          {/* Left Column: Info */}
          <div>
            <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6">Let&apos;s Get Your Brand <span className="text-primary">Akuafied</span>.</h1>
            <p className="text-lg text-slate-600 mb-12">
              Ready to launch a campaign that is measurable, memorable, and responsible? Fill out the form and our team will get back to you within 24 hours.
            </p>

            <div className="space-y-8">
              <div className="flex items-start gap-4 p-6 bg-white rounded-2xl shadow-soft-sm border border-slate-100">
                <div className="bg-primary-light text-primary p-3 rounded-full">
                  <Mail size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">Email Us</h3>
                  <p className="text-slate-600 mb-1">
                    <a href="mailto:info@akuafi.com" className="font-bold text-lg text-primary hover:underline">info@akuafi.com</a>
                  </p>
                  <p className="text-slate-600">
                    <a href="mailto:akuafiofficial@gmail.com" className="hover:text-primary transition-colors">akuafiofficial@gmail.com</a>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-6 bg-white rounded-2xl shadow-soft-sm border border-slate-100">
                 <div className="bg-primary-light text-primary p-3 rounded-full">
                  <Phone size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">Call Us</h3>
                  <p className="text-slate-600">
                    <a href="tel:7522801110" className="hover:text-primary transition-colors">7522801110</a>
                  </p>
                  <p className="text-sm text-slate-400 mt-1">Mon-Fri from 9am to 6pm EST.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-6 bg-white rounded-2xl shadow-soft-sm border border-slate-100">
                 <div className="bg-primary-light text-primary p-3 rounded-full">
                  <MapPin size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">HQ</h3>
                  <p className="text-slate-600">
                    AKUAFI PRIVATE LIMITED<br />
                    4080/93, Pawan Villa,<br />
                    Haridwarpuram, Basharatpur,<br />
                    Gorakhpur – 273004,<br />
                    Uttar Pradesh, India
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Form */}
          <div className="bg-white p-8 lg:p-12 rounded-[2.5rem] shadow-soft-xl border border-slate-100">
            <h2 className="text-2xl font-bold text-slate-900 mb-8">Send us a message</h2>
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-semibold text-slate-700">Full Name</label>
                    <input type="text" id="name" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="John Doe" />
                 </div>
                 <div className="space-y-2">
                    <label htmlFor="company" className="text-sm font-semibold text-slate-700">Company</label>
                    <input type="text" id="company" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="Brand Inc." />
                 </div>
              </div>

               <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-semibold text-slate-700">Email Address</label>
                  <input type="email" id="email" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="john@company.com" />
               </div>

                <div className="space-y-2">
                  <label htmlFor="interest" className="text-sm font-semibold text-slate-700">I&apos;m interested in...</label>
                  <select id="interest" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all">
                     <option>Launching a Campaign</option>
                     <option>Becoming a Distribution Partner</option>
                     <option>General Inquiry</option>
                  </select>
               </div>

               <div className="space-y-2">
                  <label htmlFor="message" className="text-sm font-semibold text-slate-700">Message</label>
                  <textarea id="message" rows={4} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="Tell us about your project or goals..."></textarea>
               </div>

               <button type="submit" className="w-full py-4 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/25 hover:bg-primary-dark hover:shadow-xl transition-all flex items-center justify-center gap-2 group">
                  Send Message
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
               </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
