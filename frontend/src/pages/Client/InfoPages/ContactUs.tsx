import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
 Mail,
 Phone,
 MapPin,
 Clock,
 Send,
 MessageCircle,
 LifeBuoy,
 CheckCircle2,
 ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/services/api";

const SUBJECTS = [
 "General inquiry",
 "Booking & appointments",
 "Treatments & services",
 "Payments & refunds",
 "Partner with us (clinics)",
 "Feedback & complaints",
 "Other",
];

const inputClass =
 "w-full h-12 px-4 bg-gray-50 border-2 border-transparent focus:border-[#CBFF38] focus:bg-white rounded-xl transition-all outline-none text-sm font-semibold text-gray-900 placeholder:text-gray-400 placeholder:font-medium";

export const ContactUs: React.FC = () => {
 const [form, setForm] = useState({
 name: "",
 email: "",
 phone: "",
 subject: SUBJECTS[0],
 message: "",
 website: "", // honeypot — hidden from real users
 });
 const [errors, setErrors] = useState<Record<string, string>>({});
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [sent, setSent] = useState(false);

 const set = (key: keyof typeof form) => (
 e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
 ) => {
 setForm((prev) => ({ ...prev, [key]: e.target.value }));
 if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
 };

 const validate = () => {
 const next: Record<string, string> = {};
 if (!form.name.trim()) next.name = "Please tell us your name";
 if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = "Please enter a valid email address";
 if (form.message.trim().length < 10) next.message = "Please write a few more details (at least 10 characters)";
 setErrors(next);
 return Object.keys(next).length === 0;
 };

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (isSubmitting || !validate()) return;
 setIsSubmitting(true);
 try {
 await api.post("/notifications/contact", {
 name: form.name.trim(),
 email: form.email.trim(),
 phone: form.phone.trim() || undefined,
 subject: form.subject,
 message: form.message.trim(),
 website: form.website,
 });
 setSent(true);
 } catch (err: any) {
 toast.error(err?.response?.data?.message || "Could not send your message. Please try again.");
 } finally {
 setIsSubmitting(false);
 }
 };

 return (
 <div className="min-h-screen bg-[#FDFDFD]">
 {/* Hero */}
 <header className="bg-[#121212] pt-14 pb-16 sm:pt-20 sm:pb-24 relative overflow-hidden">
 <div
 className="absolute -top-20 -right-20 w-96 h-96 rounded-full pointer-events-none"
 style={{ background: "radial-gradient(circle, rgba(203,255,56,0.15) 0%, transparent 70%)" }}
 />
 <div className="container mx-auto px-4 sm:px-8 relative z-10">
 <div className="flex items-center text-gray-500 text-xs font-bold uppercase tracking-widest mb-3">
 <Link to="/" className="hover:text-[#CBFF38] transition-colors">Home</Link>
 <ChevronRight size={12} className="mx-2" />
 <span className="text-gray-300">Contact</span>
 </div>
 <h1 className="text-white text-3xl sm:text-5xl font-black tracking-tighter">
 GET IN <span className="text-[#CBFF38]">TOUCH</span>
 </h1>
 <div className="h-1 w-20 bg-[#CBFF38] rounded-full my-5" />
 <p className="text-gray-400 text-sm sm:text-base max-w-xl font-medium">
 Questions about a treatment, your booking, or partnering with us?
 Send us a message — our team typically replies within one business day.
 </p>
 </div>
 </header>

 <main className="container mx-auto px-4 sm:px-8 -mt-8 pb-20 relative z-20">
 <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
 {/* Contact channels */}
 <div className="lg:col-span-2 space-y-4">
 <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 sm:p-8">
 <h2 className="text-sm font-black uppercase tracking-widest text-gray-900 mb-6">Contact Details</h2>
 <div className="space-y-5">
 <a href="mailto:info@beautydoctors.gr" className="flex items-start gap-4 group">
 <div className="size-11 shrink-0 rounded-2xl bg-[#CBFF38]/20 flex items-center justify-center">
 <Mail size={18} className="text-lime-700" />
 </div>
 <div>
 <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Email</p>
 <p className="text-sm font-bold text-gray-900 group-hover:text-lime-700 transition-colors break-all">info@beautydoctors.gr</p>
 </div>
 </a>
 <a href="tel:+306948880498" className="flex items-start gap-4 group">
 <div className="size-11 shrink-0 rounded-2xl bg-[#CBFF38]/20 flex items-center justify-center">
 <Phone size={18} className="text-lime-700" />
 </div>
 <div>
 <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Phone</p>
 <p className="text-sm font-bold text-gray-900 group-hover:text-lime-700 transition-colors">+30 694 888 0498</p>
 </div>
 </a>
 <div className="flex items-start gap-4">
 <div className="size-11 shrink-0 rounded-2xl bg-[#CBFF38]/20 flex items-center justify-center">
 <Clock size={18} className="text-lime-700" />
 </div>
 <div>
 <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Support hours</p>
 <p className="text-sm font-bold text-gray-900">Mon – Fri, 9:00 – 18:00 EET</p>
 </div>
 </div>
 <div className="flex items-start gap-4">
 <div className="size-11 shrink-0 rounded-2xl bg-[#CBFF38]/20 flex items-center justify-center">
 <MapPin size={18} className="text-lime-700" />
 </div>
 <div>
 <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Office</p>
 <p className="text-sm font-bold text-gray-900">Athens, Greece</p>
 </div>
 </div>
 </div>
 </div>

 {/* Quick help */}
 <div className="bg-[#0B1120] rounded-3xl shadow-lg p-6 sm:p-8 text-white">
 <h2 className="text-sm font-black uppercase tracking-widest mb-4">Need a faster answer?</h2>
 <div className="space-y-3">
 <Link to="/support" className="flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl px-4 py-3.5 transition-colors group">
 <span className="flex items-center gap-3 text-sm font-bold">
 <LifeBuoy size={16} className="text-[#CBFF38]" /> Browse the Help Center
 </span>
 <ChevronRight size={14} className="text-gray-500 group-hover:text-[#CBFF38] transition-colors" />
 </Link>
 <a href="mailto:info@beautydoctors.gr" className="flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl px-4 py-3.5 transition-colors group">
 <span className="flex items-center gap-3 text-sm font-bold">
 <MessageCircle size={16} className="text-[#CBFF38]" /> Email us directly
 </span>
 <ChevronRight size={14} className="text-gray-500 group-hover:text-[#CBFF38] transition-colors" />
 </a>
 </div>
 </div>
 </div>

 {/* Form */}
 <div className="lg:col-span-3">
 <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 sm:p-10">
 {sent ? (
 <div className="flex flex-col items-center justify-center text-center py-16">
 <div className="size-20 bg-[#CBFF38]/20 rounded-full flex items-center justify-center mb-6">
 <CheckCircle2 size={36} className="text-lime-600" />
 </div>
 <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900 mb-3">Message sent</h2>
 <p className="text-gray-500 font-medium max-w-sm mb-8">
 Thanks {form.name.split(" ")[0]} — we received your message and will get back to you at{" "}
 <span className="font-bold text-gray-800">{form.email}</span> within one business day.
 </p>
 <div className="flex gap-3">
 <Link to="/" className="px-6 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-black uppercase tracking-widest transition-colors">
 Back to Home
 </Link>
 <button
 onClick={() => { setSent(false); setForm((p) => ({ ...p, subject: SUBJECTS[0], message: "" })); }}
 className="px-6 py-3 rounded-xl bg-[#CBFF38] hover:bg-lime-400 text-black text-xs font-black uppercase tracking-widest transition-colors"
 >
 Send another
 </button>
 </div>
 </div>
 ) : (
 <>
 <h2 className="text-sm font-black uppercase tracking-widest text-gray-900 mb-1">Send us a message</h2>
 <p className="text-xs text-gray-400 font-medium mb-7">Fields marked * are required.</p>
 <form onSubmit={handleSubmit} noValidate>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div>
 <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5 pl-1">Full name *</label>
 <input className={inputClass} placeholder="Jane Doe" value={form.name} onChange={set("name")} autoComplete="name" />
 {errors.name && <p className="text-[11px] font-semibold text-red-500 mt-1 pl-1">{errors.name}</p>}
 </div>
 <div>
 <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5 pl-1">Email *</label>
 <input className={inputClass} type="email" placeholder="jane@example.com" value={form.email} onChange={set("email")} autoComplete="email" />
 {errors.email && <p className="text-[11px] font-semibold text-red-500 mt-1 pl-1">{errors.email}</p>}
 </div>
 <div>
 <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5 pl-1">Phone <span className="text-gray-300 normal-case font-semibold">(optional)</span></label>
 <input className={inputClass} type="tel" placeholder="+30 …" value={form.phone} onChange={set("phone")} autoComplete="tel" />
 </div>
 <div>
 <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5 pl-1">Subject *</label>
 <select className={`${inputClass} cursor-pointer`} value={form.subject} onChange={set("subject")}>
 {SUBJECTS.map((s) => (
 <option key={s} value={s}>{s}</option>
 ))}
 </select>
 </div>
 </div>
 <div className="mt-4">
 <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5 pl-1">Message *</label>
 <textarea
 className={`${inputClass} h-auto py-3 resize-none leading-relaxed`}
 rows={6}
 placeholder="Tell us how we can help…"
 value={form.message}
 onChange={set("message")}
 />
 {errors.message && <p className="text-[11px] font-semibold text-red-500 mt-1 pl-1">{errors.message}</p>}
 </div>

 {/* Honeypot — invisible to humans, catches bots */}
 <input
 type="text"
 value={form.website}
 onChange={set("website")}
 tabIndex={-1}
 autoComplete="off"
 aria-hidden="true"
 className="absolute opacity-0 h-0 w-0 pointer-events-none"
 />

 <div className="mt-7 flex flex-col sm:flex-row items-center gap-4">
 <button
 type="submit"
 disabled={isSubmitting}
 className="w-full sm:w-auto flex items-center justify-center gap-2 px-10 h-14 bg-[#CBFF38] hover:bg-lime-400 text-black font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl shadow-[#CBFF38]/30 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
 >
 <Send size={14} />
 {isSubmitting ? "Sending…" : "Send message"}
 </button>
 <p className="text-[11px] text-gray-400 font-medium text-center sm:text-left">
 By sending, you agree to our{" "}
 <Link to="/legal" className="underline hover:text-gray-600">privacy policy</Link>.
 </p>
 </div>
 </form>
 </>
 )}
 </div>
 </div>
 </div>
 </main>
 </div>
 );
};
