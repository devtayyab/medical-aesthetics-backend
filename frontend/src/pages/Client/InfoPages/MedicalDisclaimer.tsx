import React from "react";
import { Link } from "react-router-dom";
import { css } from "@emotion/css";
import { FaChevronRight } from "react-icons/fa6";
import { Shield, AlertCircle, FileText, CheckCircle2 } from "lucide-react";
import LayeredBG from "@/assets/LayeredBg.svg";

const containerStyle = css`
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  padding: 0 16px;
`;

export const MedicalDisclaimer: React.FC = () => {
  return (
    <section 
      className="relative bg-cover bg-center flex items-center justify-center px-4 py-16 min-h-screen bg-[#FDFDFD]"
      style={{ 
        backgroundImage: `url(${LayeredBG})`, 
        backgroundPosition: "center", 
        backgroundSize: "cover", 
        backgroundRepeat: "no-repeat" 
      }}
    >
      <div className={containerStyle}>
        {/* Breadcrumb */}
        <div className="flex items-center text-[#33373F] text-xs font-semibold uppercase tracking-wider mb-3">
          <Link to="/" className="hover:text-[#405C0B] transition-colors">Home</Link>
          <span className="px-3"><FaChevronRight size={10} className="text-[#767676]" /></span>
          <span>Legal</span>
          <span className="px-3"><FaChevronRight size={10} className="text-[#767676]" /></span>
          <span className="text-lime-700">Medical Disclaimer</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-[#1A1A1A] mb-8">
          Full Medical <span className="text-[#84cc16]">Disclaimer</span>
        </h1>

        <div className="bg-white p-6 sm:p-10 rounded-[32px] shadow-xl border border-gray-100 space-y-8 text-gray-700 leading-relaxed">
          {/* Important Highlight Box */}
          <div className="p-5 sm:p-6 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-4">
            <AlertCircle className="text-amber-600 shrink-0 mt-1" size={24} />
            <div className="space-y-1">
              <h2 className="text-sm sm:text-base font-black uppercase tracking-wide text-amber-950">
                Medical Assessment Prerequisite
              </h2>
              <p className="text-xs sm:text-sm text-amber-900 leading-relaxed font-medium">
                All content, descriptions, and treatment options provided on Beauty Doctors are strictly for educational and informational purposes. Treatment suitability and the final personalized treatment plan are exclusively determined by the licensed treating physician following a comprehensive individual clinical assessment.
              </p>
            </div>
          </div>

          {/* Section 1 */}
          <div className="space-y-3">
            <h3 className="text-lg font-black uppercase tracking-tight text-gray-900 flex items-center gap-2">
              <Shield className="text-[#84cc16]" size={18} /> 1. No Medical Advice or Doctor-Patient Relationship
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Browsing our catalog, reading treatment guides, or scheduling an appointment through this platform does not constitute or replace personalized medical advice, diagnosis, or treatment. A formal physician-patient relationship is established solely at the physical clinic during your consultation with the attending physician.
            </p>
          </div>

          {/* Section 2 */}
          <div className="space-y-3">
            <h3 className="text-lg font-black uppercase tracking-tight text-gray-900 flex items-center gap-2">
              <CheckCircle2 className="text-[#84cc16]" size={18} /> 2. Clinical Discretion & Pricing Variations
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Listed treatment protocols, session counts, and estimates are standard baselines. Final treatment cost and individual protocols may vary depending on the specialized medical assessment conducted by your physician. Your physician reserves the right to decline or recommend alternative treatments if clinically indicated for your health and safety.
            </p>
          </div>

          {/* Section 3 */}
          <div className="space-y-3">
            <h3 className="text-lg font-black uppercase tracking-tight text-gray-900 flex items-center gap-2">
              <FileText className="text-[#84cc16]" size={18} /> 3. Non-Medical Aesthetic Services & Vouchers
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              In strict accordance with healthcare regulations, promotional vouchers and gift cards are exclusively restricted to designated non-medical aesthetic services (such as cosmetic hair removal). Under no circumstances may gift cards or promotional credits be redeemed for regulated medical procedures, prescription therapies, or physician consultations.
            </p>
          </div>

          {/* Section 4 */}
          <div className="space-y-3">
            <h3 className="text-lg font-black uppercase tracking-tight text-gray-900 flex items-center gap-2">
              <Shield className="text-[#84cc16]" size={18} /> 4. Emergency Situations
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Beauty Doctors is not an emergency medical service. If you are experiencing a medical emergency, adverse medical reaction, or acute discomfort, please immediately contact your local emergency services (112 / 166 in Greece) or proceed to the nearest emergency hospital.
            </p>
          </div>

          {/* Legal Footnote */}
          <div className="pt-6 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-400">
            <span>© 2026 Beauty Doctors. All rights reserved.</span>
            <span>Last Updated: September 2026</span>
          </div>
        </div>
      </div>
    </section>
  );
};
export default MedicalDisclaimer;
