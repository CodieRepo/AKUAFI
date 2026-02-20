"use client";

import { useState } from "react";
import { Mail, MapPin, Phone, ArrowRight, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

// ── Types ──────────────────────────────────────────────────────────────────────
type FormState = {
  full_name: string;
  company: string;
  email: string;
  interest: string;
  message: string;
};

type Toast = { type: "success" | "error"; text: string } | null;

const EMPTY: FormState = {
  full_name: "",
  company: "",
  email: "",
  interest: "Launching a Campaign",
  message: "",
};

// ── Helpers ────────────────────────────────────────────────────────────────────
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function Contact() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<Toast>(null);

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const showToast = (toast: Toast) => {
    setToast(toast);
    setTimeout(() => setToast(null), 6000);
  };

  const validate = (): boolean => {
    const errs: Partial<FormState> = {};
    if (!form.full_name.trim())  errs.full_name = "Full name is required.";
    if (!form.email.trim())      errs.email = "Email is required.";
    else if (!isValidEmail(form.email)) errs.email = "Enter a valid email address.";
    if (!form.message.trim())    errs.message = "Please include a message.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("contact_queries").insert({
        full_name: form.full_name.trim(),
        company:   form.company.trim() || null,
        email:     form.email.trim().toLowerCase(),
        interest:  form.interest,
        message:   form.message.trim(),
      });

      if (error) throw error;

      setForm(EMPTY);
      setErrors({});
      showToast({ type: "success", text: "Thanks! Our team will contact you within 24 hours." });
    } catch (err: any) {
      console.error("[Contact] insert error:", err);
      showToast({ type: "error", text: err?.message || "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  // ── Input style helper ──────────────────────────────────────────────────────
  const inputCls = (field: keyof FormState) =>
    `w-full px-4 py-3 rounded-xl bg-slate-50 border outline-none transition-all focus:ring-2 ${
      errors[field]
        ? "border-red-400 focus:ring-red-200 focus:border-red-500"
        : "border-slate-200 focus:border-primary focus:ring-primary/20"
    }`;

  return (
    <div className="bg-surface min-h-screen py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Toast ─────────────────────────────────────────────────────── */}
        {toast && (
          <div className={`fixed top-5 right-5 z-50 flex items-start gap-3 max-w-sm px-5 py-4 rounded-2xl shadow-xl border text-sm font-medium animate-in slide-in-from-top-2 fade-in duration-300 ${
            toast.type === "success"
              ? "bg-emerald-50 border-emerald-100 text-emerald-800"
              : "bg-red-50 border-red-100 text-red-800"
          }`}>
            {toast.type === "success"
              ? <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              : <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />}
            <span>{toast.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">

          {/* ── Left Column: Info ────────────────────────────────────────── */}
          <div>
            <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
              Let&apos;s Get Your Brand <span className="text-primary">Akuafied</span>.
            </h1>
            <p className="text-lg text-slate-600 mb-12">
              Ready to launch a campaign that is measurable, memorable, and responsible?
              Fill out the form and our team will get back to you within 24 hours.
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
                  <p className="text-sm text-slate-400 mt-1">Mon-Fri from 9am to 6pm IST.</p>
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

          {/* ── Right Column: Form ───────────────────────────────────────── */}
          <div className="bg-white p-8 lg:p-12 rounded-[2.5rem] shadow-soft-xl border border-slate-100">
            <h2 className="text-2xl font-bold text-slate-900 mb-8">Send us a message</h2>

            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label htmlFor="full_name" className="text-sm font-semibold text-slate-700">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="full_name"
                    type="text"
                    className={inputCls("full_name")}
                    placeholder="John Doe"
                    value={form.full_name}
                    onChange={set("full_name")}
                  />
                  {errors.full_name && <p className="text-xs text-red-500 mt-0.5">{errors.full_name}</p>}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="company" className="text-sm font-semibold text-slate-700">
                    Company <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <input
                    id="company"
                    type="text"
                    className={inputCls("company")}
                    placeholder="Brand Inc."
                    value={form.company}
                    onChange={set("company")}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-semibold text-slate-700">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  className={inputCls("email")}
                  placeholder="john@company.com"
                  value={form.email}
                  onChange={set("email")}
                />
                {errors.email && <p className="text-xs text-red-500 mt-0.5">{errors.email}</p>}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="interest" className="text-sm font-semibold text-slate-700">
                  I&apos;m interested in…
                </label>
                <select
                  id="interest"
                  className={inputCls("interest")}
                  value={form.interest}
                  onChange={set("interest")}
                >
                  <option>Launching a Campaign</option>
                  <option>Becoming a Distribution Partner</option>
                  <option>General Inquiry</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="message" className="text-sm font-semibold text-slate-700">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="message"
                  rows={4}
                  className={inputCls("message")}
                  placeholder="Tell us about your project or goals…"
                  value={form.message}
                  onChange={set("message")}
                />
                {errors.message && <p className="text-xs text-red-500 mt-0.5">{errors.message}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/25 hover:bg-primary-dark hover:shadow-xl transition-all flex items-center justify-center gap-2 group disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <><Loader2 className="h-5 w-5 animate-spin" /> Sending…</>
                ) : (
                  <>Send Message <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /></>
                )}
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
