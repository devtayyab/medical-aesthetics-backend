import React from 'react';
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
  Sparkles
} from 'lucide-react';
import OnlineClinicHome from '@/assets/OnlineClinicHome.svg';

export const ForClinics: React.FC = () => {
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
              Grow Your Medical Practice With <span className="text-[#CBFF38]">Precision</span>
            </h1>
            
            <p className="text-gray-300 text-base sm:text-lg leading-relaxed max-w-xl">
              Connect with patients seeking specialized aesthetic and medical treatments. Manage appointments, consultations, and verified clinic credentials on one compliant platform.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-2 justify-center lg:justify-start">
              <Link
                to="/register?role=clinic"
                className="inline-flex items-center justify-center bg-[#CBFF38] text-black px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white transition-all shadow-xl hover:shadow-2xl"
              >
                Register Your Clinic <ArrowRight className="ml-2 size-4" />
              </Link>
              <a
                href="mailto:info@beautydoctors.gr?subject=Clinic%20Partnership%20Inquiry"
                className="inline-flex items-center justify-center border-2 border-white/20 text-white px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all"
              >
                Contact Partnership Team
              </a>
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
              <h3 className="text-xl font-bold text-gray-900 mb-3">Targeted Patient Inquiries</h3>
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
                All listings adhere strictly to medical ethics and European healthcare regulations, protecting practitioner reputation and patient privacy.
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
              <span className="text-xs font-black uppercase tracking-widest text-lime-600">Complete Clinic Toolkit</span>
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
                  'Direct secure messaging with inquiring patients',
                  'Automated appointment reminders via SMS & Email to reduce no-shows',
                  'Full GDPR patient consent tracking & audit logging'
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
                  Join The Medical Network
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
                <span>Verification typically completes within 24 to 48 business hours.</span>
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
            <a 
              href="mailto:info@beautydoctors.gr" 
              className="inline-flex items-center gap-2 text-white bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-colors"
            >
              <Mail className="size-4 text-[#CBFF38]" /> info@beautydoctors.gr
            </a>
            <a 
              href="tel:2112184564" 
              className="inline-flex items-center gap-2 text-white bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-colors"
            >
              <PhoneCall className="size-4 text-[#CBFF38]" /> +30 211 218 4564
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ForClinics;
