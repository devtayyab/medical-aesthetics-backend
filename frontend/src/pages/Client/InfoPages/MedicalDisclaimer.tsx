import React from "react";
import { Link } from "react-router-dom";
import { FaChevronRight } from "react-icons/fa6";
import { Shield, AlertTriangle, Stethoscope, PhoneCall } from "lucide-react";
import LayeredBG from "@/assets/LayeredBg.svg";

export const MedicalDisclaimer: React.FC = () => {
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
          <span>Legal</span>
          <span className="px-3"><FaChevronRight size={10} className="text-[#767676]" /></span>
          <span className="text-lime-700">Medical Disclaimer</span>
        </div>

        {/* Header */}
        <div className="bg-white p-6 sm:p-10 rounded-[32px] shadow-sm border border-gray-100 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold uppercase tracking-wider">
            <Stethoscope size={14} className="text-amber-600" />
            Clinical Notice & Policy
          </div>
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-[#1A1A1A]">
            Medical <span className="text-[#84cc16]">Disclaimer</span>
          </h1>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Last Updated: September 2026 | Version 1.0 (Master English Copy)
          </p>
        </div>

        {/* Detailed Medical Disclaimer Content */}
        <div className="bg-white p-6 sm:p-10 rounded-[32px] shadow-sm border border-gray-100 space-y-6 text-gray-700 leading-relaxed text-sm">
          
          <div className="p-5 sm:p-6 rounded-2xl bg-amber-50/90 border border-amber-200/90 flex items-start gap-4">
            <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={24} />
            <div className="space-y-2">
              <h2 className="text-sm sm:text-base font-black uppercase tracking-wide text-amber-950">
                Informational Purposes Only
              </h2>
              <p className="text-xs sm:text-sm text-amber-900 leading-relaxed font-medium">
                The content available through Beauty Doctors is provided for general informational purposes and does not replace individual medical assessment, diagnosis, medical advice, or treatment by an appropriately qualified healthcare professional.
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <p>
              Treatment descriptions, articles, photographs, expected timelines, and other information describe treatments or services in general terms. They do not establish that a particular treatment is appropriate for a specific individual.
            </p>
            <p>
              The suitability of any medical treatment, procedure, or treatment plan is determined by the treating physician following appropriate assessment of the patient's medical history, individual characteristics, needs, and other clinically relevant factors.
            </p>
            
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 flex items-center gap-2">
                <Shield size={14} className="text-lime-600" /> Treatment of Interest
              </h3>
              <p className="text-xs text-gray-600">
                Selecting a treatment through Beauty Doctors represents the user's <strong>Treatment of Interest</strong>. It does not constitute a medical diagnosis, prescription, or confirmation that the treatment will be performed.
              </p>
            </div>

            <p>
              Individual response to a treatment may vary. Expected results, duration of results, recovery time, side effects, and other outcomes may differ between patients, and no specific medical or aesthetic result is guaranteed.
            </p>
          </div>

          {/* Emergency Warning */}
          <div className="p-5 sm:p-6 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-4">
            <PhoneCall className="text-rose-600 shrink-0 mt-0.5" size={22} />
            <div className="space-y-1">
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-wide text-rose-950">
                No Emergency Medical Services
              </h3>
              <p className="text-xs text-rose-900 leading-relaxed font-medium">
                Beauty Doctors does not provide emergency medical services. The platform and its messaging functions must not be used where urgent or emergency medical assistance is required. In an emergency, please immediately call local emergency services (112 / 166 in Greece) or visit the nearest hospital.
              </p>
            </div>
          </div>

          {/* Footnote */}
          <div className="pt-6 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-400">
            <span>© 2026 Beauty Doctors. Operated by Beautydoctors O.E. All rights reserved.</span>
            <span>Beautydoctors O.E. · VAT 803040724</span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default MedicalDisclaimer;
