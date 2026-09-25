import React from "react";
import { Link } from "react-router-dom";
import { FaChevronRight } from "react-icons/fa6";
import { Sparkles, Stethoscope, ArrowRight, HeartHandshake } from "lucide-react";
import LayeredBG from "@/assets/LayeredBg.svg";

export const AboutUs: React.FC = () => {
  return (
    <div 
      className="relative min-h-screen bg-[#FDFDFD] py-12 px-4 sm:px-6 lg:px-8 bg-cover bg-center"
      style={{ backgroundImage: `url(${LayeredBG})`, backgroundPosition: "center", backgroundSize: "cover", backgroundRepeat: "no-repeat" }}
    >
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Breadcrumb */}
        <div className="flex items-center text-[#33373F] text-xs font-semibold uppercase tracking-wider mb-2">
          <Link to="/" className="hover:text-[#405C0B] transition-colors">Home</Link>
          <span className="px-3"><FaChevronRight size={10} className="text-[#767676]" /></span>
          <span className="text-lime-700">About Us</span>
        </div>

        {/* Hero Section */}
        <div className="bg-white p-6 sm:p-10 rounded-[32px] shadow-sm border border-gray-100 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-lime-50 border border-lime-200 text-lime-800 text-xs font-bold uppercase tracking-wider">
            <Sparkles size={14} className="text-lime-600" />
            About Beauty Doctors
          </div>
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-[#1A1A1A] leading-tight">
            A clearer way to explore <span className="text-[#84cc16]">aesthetic and medical care.</span>
          </h1>
          <p className="text-base sm:text-lg text-gray-700 leading-relaxed font-normal">
            Beauty Doctors is a digital platform operated by <strong>Beautydoctors O.E.</strong> that connects users with participating doctors, clinics and aesthetic service providers.
          </p>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
            Through Beauty Doctors, users can explore available treatments and services, discover participating providers, request or schedule appointments, communicate with doctors or clinics through the platform, and manage information related to their appointments and activity.
          </p>
        </div>

        {/* Medical Assessment Diligence Box */}
        <div className="bg-amber-50/90 border border-amber-200/90 rounded-[28px] p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3 text-amber-900 font-black text-sm sm:text-base uppercase tracking-wide">
            <Stethoscope size={22} className="text-amber-700 shrink-0" />
            Independent Medical Assessment & Responsibility
          </div>
          <div className="space-y-3 text-xs sm:text-sm text-amber-950/90 leading-relaxed">
            <p>
              Beauty Doctors does not replace the treating physician and does not independently diagnose medical conditions, determine the medical suitability of a treatment, or provide medical treatment.
            </p>
            <p>
              Medical assessment, diagnosis, treatment suitability, treatment planning, and the provision of medical services remain the responsibility of the relevant healthcare professional or clinic.
            </p>
            <p>
              When a user selects a medical treatment through the platform, that selection represents the treatment the user is interested in. The final treatment decision and treatment plan are determined by the treating physician following appropriate medical assessment.
            </p>
            <p className="font-semibold pt-1">
              Our aim is to make access to information, professionals and services easier and more transparent while preserving the independent clinical judgment of each healthcare professional.
            </p>
          </div>
        </div>

        {/* How It Works Flow */}
        <div className="bg-white p-6 sm:p-10 rounded-[32px] shadow-sm border border-gray-100 space-y-6">
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-gray-900 flex items-center gap-2">
            <HeartHandshake size={22} className="text-[#84cc16]" /> How It Works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
            {[
              { step: "01", title: "Explore a treatment", desc: "Browse curated clinical procedures" },
              { step: "02", title: "Choose a doctor or clinic", desc: "Select verified accredited providers" },
              { step: "03", title: "Select a date", desc: "Pick convenient available slots" },
              { step: "04", title: "Medical assessment", desc: "Consult with your attending doctor" },
              { step: "05", title: "Final treatment plan", desc: "Personalised procedure execution" },
            ].map((item, idx) => (
              <div key={idx} className="bg-gray-50/80 rounded-2xl p-4 border border-gray-100 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-black text-lime-600 uppercase tracking-widest">{item.step}</span>
                  <h3 className="text-xs font-bold text-gray-900 mt-1 uppercase">{item.title}</h3>
                </div>
                <p className="text-[11px] text-gray-500 mt-2">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact & Support Notice */}
        <div className="bg-white p-6 sm:p-8 rounded-[32px] shadow-sm border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm sm:text-base font-black uppercase tracking-wide text-gray-900">
              Questions & Platform Support
            </h3>
            <p className="text-xs text-gray-600 max-w-xl">
              For questions regarding your account, appointments or use of the platform, you can contact <strong>Beauty Doctors Support</strong>. Questions concerning diagnosis, medical suitability, treatment or clinical care should be addressed to the relevant doctor or clinic.
            </p>
          </div>
          <Link 
            to="/contact" 
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#CBFF38] hover:bg-lime-400 text-black text-xs font-black uppercase tracking-wider transition-colors shrink-0"
          >
            Contact Support <ArrowRight size={14} />
          </Link>
        </div>

        {/* Company Registration Details */}
        <div className="text-center text-[11px] text-gray-400 space-y-1">
          <p>© 2026 Beauty Doctors. Operated by Beautydoctors O.E. All rights reserved.</p>
          <p>Beautydoctors O.E. · 23 Xanthippou Street, Pikermi 19009, Greece · VAT No. 803040724 · G.E.MI. No. 188015103000</p>
        </div>
      </div>
    </div>
  );
};
export default AboutUs;
