import React from "react";
import { Link } from "react-router-dom";
import { FaChevronRight } from "react-icons/fa6";
import { ShieldCheck, Lock, HeartPulse, Building2 } from "lucide-react";
import LayeredBG from "@/assets/LayeredBg.svg";

export const PrivacyPolicy: React.FC = () => {
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
          <span className="text-lime-700">Privacy Policy</span>
        </div>

        {/* Header */}
        <div className="bg-white p-6 sm:p-10 rounded-[32px] shadow-sm border border-gray-100 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-lime-50 border border-lime-200 text-lime-800 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck size={14} className="text-lime-600" />
            GDPR Compliance & Data Protection
          </div>
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-[#1A1A1A]">
            Privacy <span className="text-[#84cc16]">Policy</span>
          </h1>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Last Updated: September 2026 | Version 1.0 (Master English Copy)
          </p>
          <p className="text-sm text-gray-600 leading-relaxed pt-2">
            <strong>Beautydoctors O.E.</strong> respects the privacy of users of the Beauty Doctors platform and processes personal data in accordance with applicable data protection legislation, including the <strong>General Data Protection Regulation (GDPR)</strong>.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            This Privacy Policy explains what information may be processed when you use Beauty Doctors, why it is used, with whom it may be shared, and what rights you have.
          </p>
        </div>

        {/* Policy Content */}
        <div className="bg-white p-6 sm:p-10 rounded-[32px] shadow-sm border border-gray-100 divide-y divide-gray-100 space-y-8 text-gray-700 leading-relaxed text-sm">
          
          {/* Section 1 */}
          <div className="pt-6 first:pt-0 space-y-3">
            <h2 className="text-base font-black uppercase tracking-wide text-gray-900 flex items-center gap-2">
              <Building2 size={16} className="text-lime-600" /> 1. Who We Are (Data Controller)
            </h2>
            <p>
              For personal data relating to the operation of the Beauty Doctors platform, the relevant entity is:
            </p>
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-xs space-y-1 text-gray-600">
              <p className="font-bold text-gray-900">Beautydoctors O.E.</p>
              <p>23 Xanthippou Street, Pikermi 19009, Greece</p>
              <p>VAT No.: 803040724 | G.E.MI. No.: 188015103000</p>
              <p>Email: info@beautydoctors.gr | Telephone: +30 211 218 4564</p>
            </div>
            <p className="text-xs text-gray-500">
              Participating healthcare providers may act independently in relation to medical care and medical records for which they are legally responsible.
            </p>
          </div>

          {/* Section 2 */}
          <div className="pt-6 space-y-3">
            <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
              2. Information We May Process
            </h2>
            <p>Depending on how you use Beauty Doctors, the information processed includes:</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600">
              <li className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">• Account details (name, email, phone)</li>
              <li className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">• Appointment details & history</li>
              <li className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">• Selected doctor or clinic</li>
              <li className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">• Communications and messages</li>
              <li className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">• Files uploaded by the user</li>
              <li className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">• Payment and invoice metadata</li>
              <li className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">• Gift Card information</li>
              <li className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">• Device, technical & cookie data</li>
            </ul>
          </div>

          {/* Section 3 & 4: Purpose & Health Information */}
          <div className="pt-6 space-y-3">
            <h2 className="text-base font-black uppercase tracking-wide text-gray-900 flex items-center gap-2">
              <HeartPulse size={16} className="text-rose-500" /> 3. Why We Use Personal Data & 4. Health Information
            </h2>
            <p>
              Personal data is processed for account administration, appointment scheduling, provider communication, customer support, and security.
            </p>
            <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200/70 text-xs text-rose-950 space-y-2">
              <p className="font-bold uppercase tracking-wider">Special Category Health Data Protection</p>
              <p>
                When communicating health information to a doctor or clinic through Beauty Doctors, information must be limited to what is reasonably relevant to your care.
              </p>
              <p>
                The treating healthcare professional processes health information under medical confidentiality and applicable healthcare legislation. Beauty Doctors processes health-related information only to the extent necessary to provide secure digital communication.
              </p>
            </div>
          </div>

          {/* Section 5, 6, 7 */}
          <div className="pt-6 space-y-3">
            <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
              5. Participating Providers & 6. Direct Payments
            </h2>
            <p>
              For medical services, payment is made directly to the relevant doctor or clinic. Beauty Doctors does not receive or hold payments for medical services. Information necessary for an appointment is made available only to the doctor or clinic selected by the user.
            </p>
          </div>

          <div className="pt-6 space-y-3">
            <h2 className="text-base font-black uppercase tracking-wide text-gray-900 flex items-center gap-2">
              <Lock size={16} className="text-lime-600" /> 7. Messages & 8. Marketing Preferences
            </h2>
            <p>
              Messages exchanged are securely stored to support communication. Users should not upload unnecessary sensitive financial or identity files.
            </p>
            <p>
              Marketing communications (newsletters/promotions) are completely optional and separate from essential service notifications. You can unsubscribe at any time.
            </p>
          </div>

          {/* Section 9, 10, 11, 12, 13 */}
          <div className="pt-6 space-y-3">
            <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
              9. Cookies & 10. Service Providers
            </h2>
            <p>
              Beauty Doctors uses necessary cookies and optional analytics/preference cookies as detailed in our <Link to="/cookie-policy" className="text-lime-700 underline font-bold">Cookie Policy</Link>. Optional cookies require explicit consent.
            </p>
            <p>
              Personal data is shared only with authorized service providers (hosting, IT, security, payment processors) bound by strict GDPR data processing agreements.
            </p>
          </div>

          {/* Section 14: User Rights */}
          <div className="pt-6 space-y-3">
            <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
              14. Your GDPR Rights
            </h2>
            <p>Under GDPR, you have the right to:</p>
            <ul className="list-disc list-inside space-y-1 text-xs text-gray-600 pl-1">
              <li>Access your personal data;</li>
              <li>Correct inaccurate or incomplete data;</li>
              <li>Request erasure (Right to be forgotten);</li>
              <li>Restrict or object to processing;</li>
              <li>Data portability;</li>
              <li>Withdraw consent at any time without penalty.</li>
            </ul>
            <p className="text-xs pt-1">
              To exercise any of these rights, contact us at <a href="mailto:info@beautydoctors.gr" className="text-lime-700 underline font-bold">info@beautydoctors.gr</a>. You also have the right to lodge a complaint with the Hellenic Data Protection Authority (HDPA).
            </p>
          </div>

          {/* Section 15, 16, 17 */}
          <div className="pt-6 space-y-3">
            <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
              15. Account Deletion & Contact
            </h2>
            <p>
              You can delete your account via your settings dashboard. Account deletion does not override legal retention requirements for medical records held by independent clinics.
            </p>
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-xs text-gray-600 space-y-1">
              <p className="font-bold text-gray-900">Privacy Inquiries:</p>
              <p>Beautydoctors O.E. · Email: info@beautydoctors.gr · Telephone: +30 211 218 4564</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
export default PrivacyPolicy;
