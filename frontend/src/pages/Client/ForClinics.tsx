import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  CalendarCheck, 
  ShieldCheck, 
  Users, 
  TrendingUp, 
  ArrowRight, 
  CheckCircle2, 
  Mail, 
  PhoneCall, 
  Clock, 
  Award,
  Sparkles,
  X,
  Copy,
  Check,
  Send,
  Phone,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { api } from '@/services/api';
import OnlineClinicHome from '@/assets/OnlineClinicHome.svg';

export const ForClinics: React.FC = () => {
  const [isGreek, setIsGreek] = useState(
    () => typeof window !== 'undefined' && localStorage.getItem('preferredLang') === 'el'
  );
  const [showContactModal, setShowContactModal] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: '',
    clinicName: '',
    email: '',
    phone: '',
    message: '',
  });

  const handleCopyEmail = (email = "info@beautydoctors.gr") => {
    try {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(email);
        setCopiedEmail(true);
        toast.success(isGreek ? `Αντιγράφηκε: ${email}` : `Copied to clipboard: ${email}`);
        setTimeout(() => setCopiedEmail(false), 2500);
      }
    } catch {
      toast(email);
    }
  };

  const handleSubmitInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error(isGreek ? "Συμπληρώστε το όνομά σας" : "Please provide your name");
      return;
    }
    if (!form.email.trim() || !form.email.includes('@')) {
      toast.error(isGreek ? "Συμπληρώστε ένα έγκυρο email" : "Please provide a valid email");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/notifications/contact', {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        subject: `Partner with us (clinics): ${form.clinicName.trim() || form.name.trim()}`,
        message: `[Clinic Partnership Inquiry]\nClinic Name: ${form.clinicName || 'Not specified'}\nPhone: ${form.phone || 'Not specified'}\n\n${form.message.trim() || 'I am interested in partnering with BeautyDoctors.'}`,
      });
      setSubmitted(true);
      toast.success(isGreek ? "Το αίτημά σας στάλθηκε επιτυχώς!" : "Partnership inquiry submitted successfully!");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || (isGreek ? "Σφάλμα αποστολής. Δοκιμάστε ξανά." : "Could not send inquiry. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const handleLang = () => {
      setIsGreek(localStorage.getItem('preferredLang') === 'el');
    };
    window.addEventListener('storage', handleLang);
    window.addEventListener('languagechange', handleLang);
    return () => {
      window.removeEventListener('storage', handleLang);
      window.removeEventListener('languagechange', handleLang);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-[#0F172A] text-white py-20 lg:py-28 overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#CBFF38_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="max-w-[1200px] mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-[#CBFF38] text-xs font-black uppercase tracking-widest">
              <Sparkles className="size-3.5" /> For Medical Clinics & Doctors
            </div>
            
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-tight uppercase tracking-tight">
              {isGreek ? (
                <>Αναπτύξτε την ιατρική σας δραστηριότητα με <span className="text-[#CBFF38]">σιγουριά</span></>
              ) : (
                <>Grow Your Medical Practice With <span className="text-[#CBFF38]">Confidence</span></>
              )}
            </h1>
            
            <p className="text-gray-300 text-base sm:text-lg leading-relaxed max-w-xl">
              {isGreek ? "Συνδεθείτε με ενδιαφερόμενους ασθενείς που αναζητούν εξειδικευμένες υπηρεσίες αισθητικής ιατρικής. Διαχειριστείτε ραντεβού και πληροφορίες σε μία πλατφόρμα." : "Connect with patients interested in specialized aesthetic medicine services. Manage appointments, consultations, and verified clinic credentials on one compliant platform."}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-2 justify-center lg:justify-start">
              <Link
                to="/register?role=clinic"
                className="inline-flex items-center justify-center bg-[#CBFF38] text-black px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white transition-all shadow-xl hover:shadow-2xl"
              >
                {isGreek ? "Εγγραφή κλινικής / ιατρείου" : "Register Your Clinic"} <ArrowRight className="ml-2 size-4" />
              </Link>
              <button
                type="button"
                onClick={() => {
                  setShowContactModal(true);
                  handleCopyEmail("info@beautydoctors.gr");
                }}
                className="inline-flex items-center justify-center border-2 border-white/20 text-white px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white/10 hover:border-[#CBFF38] transition-all cursor-pointer"
              >
                <Mail className="mr-2 size-4 text-[#CBFF38]" />
                {isGreek ? "Επικοινωνήστε με την ομάδα συνεργατών μας" : "Contact Partnership Team"}
              </button>
            </div>

            <div className="pt-4 flex items-center gap-6 justify-center lg:justify-start text-xs font-bold text-gray-400">
              <span className="flex items-center gap-1.5"><ShieldCheck className="size-4 text-[#CBFF38]" /> GDPR & Ethics Compliant</span>
              <span className="flex items-center gap-1.5"><Award className="size-4 text-[#CBFF38]" /> Verified Clinics Only</span>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-[#CBFF38]/20 to-transparent blur-2xl -z-10 rounded-3xl" />
              <img
                src={OnlineClinicHome}
                alt="Clinic Partner Portal"
                className="w-full max-w-[540px] rounded-2xl shadow-2xl border-4 border-slate-800 bg-slate-900"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Value Pillars */}
      <section className="py-20 bg-gray-50 border-b border-gray-100">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-4xl font-black text-gray-900 uppercase tracking-tight mb-4">
              Designed For Specialized Medical Practices
            </h2>
            <p className="text-gray-600 text-sm sm:text-base">
              A comprehensive platform built specifically for medical aesthetics practitioners, dermatology clinics, and plastic surgeons.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all">
              <div className="size-12 rounded-xl bg-lime-50 text-lime-600 flex items-center justify-center mb-6">
                <CalendarCheck className="size-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{isGreek ? "Αιτήματα ενδιαφερόμενων ασθενών" : "Inquiries from Interested Patients"}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Receive inquiries from patients seeking verified medical aesthetic treatments in your area, with transparent consultation scheduling.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all">
              <div className="size-12 rounded-xl bg-lime-50 text-lime-600 flex items-center justify-center mb-6">
                <TrendingUp className="size-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Modern Practice Management</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Streamline appointments, sync Google Calendar schedules, manage doctors, treatments, and client histories seamlessly in one dashboard.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all">
              <div className="size-12 rounded-xl bg-lime-50 text-lime-600 flex items-center justify-center mb-6">
                <ShieldCheck className="size-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Ethical & Legal Compliance</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                All provider profiles are subject to BeautyDoctors onboarding and credential verification before activation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Breakdown */}
      <section className="py-20 bg-white">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <span className="text-xs font-black uppercase tracking-widest text-lime-600">{isGreek ? "Εργαλεία διαχείρισης κλινικής" : "Clinic Management Tools"}</span>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight leading-tight">
                Everything You Need To Manage Consultations & Treatments
              </h2>
              <p className="text-gray-600 text-base leading-relaxed">
                Our clinic portal gives doctors and administrators full control over their availability, treatment catalog, and patient communications.
              </p>

              <div className="space-y-4 pt-2">
                {[
                  'Automated Google Calendar two-way synchronization',
                  'Doctor profiles with verifiable medical credentials & specialties',
                  'Custom treatment pricing, durations, and protocol specifications',
                  'One-way operational platform notifications',
                  'Automated appointment reminders via SMS & Email to reduce no-shows',
                  'Consent and data-management tools designed to support GDPR-compliant workflows.'
                ].map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="size-5 text-lime-600 shrink-0 mt-0.5" />
                    <span className="text-sm font-semibold text-gray-800">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4">
                <Link
                  to="/register?role=clinic"
                  className="inline-flex items-center justify-center bg-black text-[#CBFF38] px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-900 transition-all shadow-lg"
                >
                  {isGreek ? "Εγγραφείτε στο δίκτυο συνεργατών" : "Join Our Partner Network"}
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-3xl p-8 sm:p-12 space-y-8">
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">How Onboarding Works</h3>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="size-10 rounded-full bg-black text-[#CBFF38] font-black text-sm flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Submit Clinic Details</h4>
                    <p className="text-gray-600 text-sm">Register your clinic profile, location, doctors, and medical license documentation.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="size-10 rounded-full bg-black text-[#CBFF38] font-black text-sm flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Medical Verification</h4>
                    <p className="text-gray-600 text-sm">Our medical advisory team verifies credentials to ensure platform standards and ethical compliance.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="size-10 rounded-full bg-black text-[#CBFF38] font-black text-sm flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Launch & Manage</h4>
                    <p className="text-gray-600 text-sm">Publish your treatment offerings, connect your schedule, and begin receiving patient consultations.</p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-lime-50 border border-lime-200 text-lime-900 text-xs font-semibold flex items-center gap-3">
                <Clock className="size-5 shrink-0 text-lime-700" />
                <span>Verification is typically completed within 24–48 business hours after all required documentation has been received.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Support & Contact Banner */}
      <section className="py-16 bg-[#0F172A] text-white">
        <div className="max-w-[1200px] mx-auto px-6 text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
            Have Questions About Partnering With Us?
          </h2>
          <p className="text-gray-400 text-sm sm:text-base max-w-xl mx-auto">
            Our clinic onboarding specialists are available to walk you through our tools, integration options, and compliance guidelines.
          </p>

          <div className="flex flex-wrap justify-center gap-6 pt-2">
            <button 
              type="button"
              onClick={() => {
                setShowContactModal(true);
                handleCopyEmail("info@beautydoctors.gr");
              }}
              className="inline-flex items-center gap-2 text-white bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
            >
              <Mail className="size-4 text-[#CBFF38]" /> info@beautydoctors.gr
            </button>
            <a 
              href="tel:2112184564" 
              className="inline-flex items-center gap-2 text-white bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-colors"
            >
              <PhoneCall className="size-4 text-[#CBFF38]" /> +30 211 218 4564
            </a>
          </div>
        </div>
      </section>

      {/* Partnership Inquiry Modal */}
      <AnimatePresence>
        {showContactModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowContactModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-lg bg-[#0F172A] border border-white/15 rounded-3xl shadow-2xl overflow-hidden z-10 text-white"
            >
              {/* Top Accent Bar */}
              <div className="h-1.5 w-full bg-gradient-to-r from-[#CBFF38] via-emerald-400 to-[#CBFF38]" />

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setShowContactModal(false)}
                className="absolute top-4 right-4 p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>

              <div className="p-6 sm:p-8 space-y-6">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[#CBFF38] text-[10px] font-black uppercase tracking-wider mb-2">
                    <Sparkles className="size-3" />
                    {isGreek ? "Συνεργασία με BeautyDoctors" : "Partner With BeautyDoctors"}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
                    {isGreek ? "Επικοινωνία Συνεργατών" : "Contact Partnership Team"}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-300 mt-1">
                    {isGreek
                      ? "Στείλτε μας μήνυμα ή επικοινωνήστε απευθείας μαζί μας για πληροφορίες ένταξης κλινικής."
                      : "Send us a message or reach out directly to discuss onboarding your clinic or practice."}
                  </p>
                </div>

                {/* Direct Contact Bar */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 text-gray-300">
                      <Mail className="size-4 text-[#CBFF38] shrink-0" />
                      <span className="font-bold text-white">info@beautydoctors.gr</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleCopyEmail("info@beautydoctors.gr")}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-[#CBFF38] hover:text-black text-[11px] font-bold text-white transition-all cursor-pointer"
                        title="Copy email"
                      >
                        {copiedEmail ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                        <span>{copiedEmail ? (isGreek ? "Αντιγράφηκε" : "Copied") : (isGreek ? "Αντιγραφή" : "Copy")}</span>
                      </button>
                      <a
                        href="mailto:info@beautydoctors.gr"
                        className="p-1 rounded-lg bg-white/10 hover:bg-[#CBFF38] hover:text-black text-gray-300 hover:text-black transition-colors"
                        title="Open mail client"
                      >
                        <ArrowRight className="size-3.5" />
                      </a>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400 pt-1 border-t border-white/5">
                    <div className="flex items-center gap-1.5">
                      <Phone className="size-3.5 text-[#CBFF38]" />
                      <a href="tel:6948880498" className="hover:text-[#CBFF38] transition-colors font-medium text-white">
                        +30 694 888 0498
                      </a>
                    </div>
                    <span>/</span>
                    <a href="tel:2112184564" className="hover:text-[#CBFF38] transition-colors font-medium text-white">
                      +30 211 218 4564
                    </a>
                  </div>
                </div>

                {/* Form or Submitted State */}
                {submitted ? (
                  <div className="py-6 text-center space-y-4">
                    <div className="size-14 rounded-2xl bg-[#CBFF38]/20 border border-[#CBFF38]/40 text-[#CBFF38] mx-auto flex items-center justify-center">
                      <CheckCircle2 className="size-8" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-lg font-bold text-white">
                        {isGreek ? "Ευχαριστούμε για το μήνυμα!" : "Thank You For Reaching Out!"}
                      </h4>
                      <p className="text-xs text-gray-300 max-w-sm mx-auto">
                        {isGreek
                          ? "Λάβαμε το αίτημά σας. Ένας εκπρόσωπος συνεργασιών θα επικοινωνήσει μαζί σας εντός 24 ωρών."
                          : "We have received your inquiry. A partnership specialist will get back to you within 24 business hours."}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSubmitted(false);
                        setShowContactModal(false);
                        setForm({ name: '', clinicName: '', email: '', phone: '', message: '' });
                      }}
                      className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      {isGreek ? "Κλείσιμο" : "Close"}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitInquiry} className="space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1">
                          {isGreek ? "Ονοματεπώνυμο *" : "Your Name *"}
                        </label>
                        <input
                          type="text"
                          required
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          placeholder={isGreek ? "π.χ. Δρ. Γεώργιος" : "e.g. Dr. John Smith"}
                          className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-xs placeholder-gray-500 focus:outline-none focus:border-[#CBFF38] transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1">
                          {isGreek ? "Όνομα Κλινικής / Ιατρείου" : "Clinic Name"}
                        </label>
                        <input
                          type="text"
                          value={form.clinicName}
                          onChange={(e) => setForm({ ...form, clinicName: e.target.value })}
                          placeholder={isGreek ? "π.χ. Athens Aesthetics" : "e.g. Athens Aesthetics Clinic"}
                          className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-xs placeholder-gray-500 focus:outline-none focus:border-[#CBFF38] transition-colors"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1">
                          {isGreek ? "Email *" : "Email Address *"}
                        </label>
                        <input
                          type="email"
                          required
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          placeholder="doctor@clinic.gr"
                          className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-xs placeholder-gray-500 focus:outline-none focus:border-[#CBFF38] transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1">
                          {isGreek ? "Τηλέφωνο" : "Phone Number"}
                        </label>
                        <input
                          type="tel"
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          placeholder="+30 69..."
                          className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-xs placeholder-gray-500 focus:outline-none focus:border-[#CBFF38] transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1">
                        {isGreek ? "Μήνυμα ή Ερώτηση" : "Message or Inquiries"}
                      </label>
                      <textarea
                        rows={3}
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        placeholder={
                          isGreek
                            ? "Ενημερώστε μας για την ειδικότητά σας ή ό,τι θα θέλατε να γνωρίζετε..."
                            : "Tell us about your specialties, treatments, or questions..."
                        }
                        className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-xs placeholder-gray-500 focus:outline-none focus:border-[#CBFF38] transition-colors resize-none"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 px-4 rounded-xl bg-[#CBFF38] text-black font-black text-xs uppercase tracking-widest hover:bg-white transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-lg hover:shadow-xl"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="size-4 animate-spin" />
                            <span>{isGreek ? "Αποστολή..." : "Sending..."}</span>
                          </>
                        ) : (
                          <>
                            <Send className="size-4" />
                            <span>{isGreek ? "Αποστολή Μηνύματος" : "Send Inquiry"}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ForClinics;
