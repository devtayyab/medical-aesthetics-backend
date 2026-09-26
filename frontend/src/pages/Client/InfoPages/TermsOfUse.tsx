import React from "react";
import { Link } from "react-router-dom";
import { FaChevronRight } from "react-icons/fa6";
import { FileText, Shield, AlertCircle, Building2 } from "lucide-react";
import LayeredBG from "@/assets/LayeredBg.svg";

export const TermsOfUse: React.FC = () => {
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
          <span className="text-lime-700">Terms of Use</span>
        </div>

        {/* Header */}
        <div className="bg-white p-6 sm:p-10 rounded-[32px] shadow-sm border border-gray-100 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-lime-50 border border-lime-200 text-lime-800 text-xs font-bold uppercase tracking-wider">
            <FileText size={14} className="text-lime-600" />
            Official Platform Terms
          </div>
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-[#1A1A1A]">
            Terms of <span className="text-[#84cc16]">Use</span>
          </h1>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Last Updated: September 2026 | Version 1.0 (Master English Copy)
          </p>
          <p className="text-sm text-gray-600 leading-relaxed pt-2">
            These Terms of Use govern access to and use of the Beauty Doctors website, application and related digital services operated by <strong>Beautydoctors O.E.</strong>, with registered office at <strong>23 Xanthippou Street, Pikermi, 19009, Greece</strong>, VAT No. <strong>803040724</strong> and G.E.MI. No. <strong>188015103000</strong>.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            By creating an account or using the Beauty Doctors platform, you agree to these Terms of Use. If you do not agree with these Terms, you should not use the platform.
          </p>
        </div>

        {/* Content Card with 19 Sections */}
        <div className="bg-white p-6 sm:p-10 rounded-[32px] shadow-sm border border-gray-100 divide-y divide-gray-100 space-y-8 text-gray-700 leading-relaxed text-sm">
          
          {/* Section 1 */}
          <div className="pt-6 first:pt-0 space-y-3">
            <h2 className="text-base font-black uppercase tracking-wide text-gray-900 flex items-center gap-2">
              <Shield size={16} className="text-lime-600" /> 1. Role of Beauty Doctors
            </h2>
            <p>
              Beauty Doctors operates a digital platform that facilitates access to information and interaction between users and participating doctors, clinics and other eligible service providers.
            </p>
            <p>
              Beauty Doctors provides the digital infrastructure for functions such as treatment discovery, provider discovery, appointment management, communication and account management.
            </p>
            <p className="font-semibold text-gray-900">
              Beauty Doctors is not, solely by reason of operating the platform, the healthcare professional providing a medical service.
            </p>
          </div>

          {/* Section 2 */}
          <div className="pt-6 space-y-3">
            <h2 className="text-base font-black uppercase tracking-wide text-gray-900 flex items-center gap-2">
              <AlertCircle size={16} className="text-amber-600" /> 2. Medical Services and Clinical Decisions
            </h2>
            <p>
              Medical assessment, diagnosis, determination of treatment suitability, prescription, treatment planning and the provision of medical procedures are performed by the relevant healthcare professional or clinic.
            </p>
            <p>
              Information displayed on the platform does not constitute a diagnosis and does not mean that a particular treatment is medically suitable for a specific user.
            </p>
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/70 text-xs text-amber-950 space-y-2">
              <p className="font-bold uppercase tracking-wider">Treatment of Interest</p>
              <p>
                Selecting a treatment through Beauty Doctors indicates a <strong>Treatment of Interest</strong>. The treating physician may:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-1">
                <li>Confirm the proposed treatment;</li>
                <li>Recommend a different treatment;</li>
                <li>Recommend a different treatment plan; or</li>
                <li>Decide that the treatment is not appropriate,</li>
              </ul>
              <p>following the appropriate medical assessment.</p>
            </div>
          </div>

          {/* Section 3 */}
          <div className="pt-6 space-y-3">
            <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
              3. Participating Doctors and Clinics
            </h2>
            <p>
              Doctors and clinics available through Beauty Doctors are responsible for the healthcare services they provide, their clinical judgment, professional obligations and compliance with applicable healthcare legislation and professional standards.
            </p>
            <p>
              Beauty Doctors may provide information supplied by participating providers, including availability, locations, services and indicative or starting prices. Where information changes, the information confirmed by the provider at the time of the appointment or medical assessment shall prevail.
            </p>
          </div>

          {/* Section 4 */}
          <div className="pt-6 space-y-3">
            <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
              4. User Accounts
            </h2>
            <p>
              Users are responsible for providing accurate and current account information and for maintaining the confidentiality of their login credentials. You must notify Beauty Doctors without undue delay if you believe that your account has been accessed or used without authorization.
            </p>
            <p>You may not: use another person's account; impersonate another person; use the platform for unlawful purposes; or use the platform for abusive, fraudulent or misleading activities.</p>
          </div>

          {/* Section 5 */}
          <div className="pt-6 space-y-3">
            <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
              5. Appointments
            </h2>
            <p>
              Beauty Doctors allows users to request, schedule, manage or cancel appointments with participating doctors and clinics.
            </p>
            <p>
              An appointment confirmation confirms the appointment, not the medical suitability or final approval of a treatment.
            </p>
            <p>
              Appointment availability, rescheduling, cancellation and no-show policies may vary by provider. Any provider-specific policy that creates a financial obligation must be clearly disclosed to the user before the relevant booking or transaction.
            </p>
          </div>

          {/* Section 6 */}
          <div className="pt-6 space-y-3">
            <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
              6. Payments for Medical Services
            </h2>
            <p>
              Payments for medical services are made directly to the doctor or clinic providing the relevant service. Beauty Doctors does not receive or hold the payment made for the medical service itself.
            </p>
            <p>
              The doctor or clinic is responsible for the provision of the service and for issuing the applicable receipt, invoice or other fiscal document. Where Beauty Doctors displays payment history or related transaction information in a user's account, such display is provided for convenience and does not change the identity of the provider receiving the payment.
            </p>
          </div>

          {/* Section 7 */}
          <div className="pt-6 space-y-3">
            <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
              7. Gift Cards
            </h2>
            <p>
              Beauty Doctors may issue Beauty Doctors Gift Cards under separate Gift Card Terms. Gift Cards are available exclusively for eligible non-medical aesthetic services that are specifically identified as <strong>Gift Card Eligible</strong> within the platform.
            </p>
            <p>
              Gift Cards may not be redeemed for: medical consultations, injectable medical treatments, medical procedures, surgical procedures, or any other service classified as a medical act. The purchase and use of Gift Cards are governed by the separate <Link to="/gift-card-terms" className="text-lime-700 underline font-bold">Gift Card Terms</Link>.
            </p>
          </div>

          {/* Section 8 */}
          <div className="pt-6 space-y-3">
            <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
              8. Messaging
            </h2>
            <p>
              Beauty Doctors may enable users to communicate with participating doctors or clinics and, separately, with Beauty Doctors Support.
            </p>
            <p>
              Beauty Doctors Support provides assistance relating to the platform, accounts, appointments and other administrative matters. Beauty Doctors Support does not provide medical diagnosis or medical treatment.
            </p>
            <p className="text-amber-900 font-semibold text-xs">
              The messaging function is not an emergency medical service and must not be used when immediate medical assistance is required.
            </p>
          </div>

          {/* Section 9 */}
          <div className="pt-6 space-y-3">
            <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
              9. Feedback and Reviews
            </h2>
            <p>
              Beauty Doctors may allow users to provide feedback following a completed appointment. Feedback must reflect the user's genuine experience and must not contain unlawful, abusive, defamatory, discriminatory or intentionally misleading material.
            </p>
            <p>
              Publication of medical testimonials, treatment results or other health-related user content may be subject to additional legal and professional restrictions.
            </p>
          </div>

          {/* Section 10 */}
          <div className="pt-6 space-y-3">
            <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
              10. Information and Content
            </h2>
            <p>
              Treatment descriptions, articles and other informational content available through Beauty Doctors are provided for general informational purposes and do not replace individual medical assessment, diagnosis or medical advice.
            </p>
          </div>

          {/* Section 11 to 19 */}
          <div className="pt-6 space-y-3">
            <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
              11. Acceptable Use
            </h2>
            <p>
              Users must not attempt to interfere with the security or operation of the Beauty Doctors platform, gain unauthorized access, upload malicious code, scrape restricted data, or circumvent access controls.
            </p>
          </div>

          <div className="pt-6 space-y-3">
            <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
              12. Account Deletion
            </h2>
            <p>
              Users may request deletion of their account through settings or by contacting support. Deletion of a Beauty Doctors account does not necessarily result in deletion of medical records independently held by a doctor or clinic where required by law.
            </p>
          </div>

          <div className="pt-6 space-y-3">
            <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
              13. Platform Availability
            </h2>
            <p>
              Beauty Doctors aims to provide reliable access but does not guarantee uninterrupted availability. Temporary maintenance or technical failures may occur.
            </p>
          </div>

          <div className="pt-6 space-y-3">
            <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
              14. Intellectual Property
            </h2>
            <p>
              The Beauty Doctors name, branding, software, interface, databases and original content belong to <strong>Beautydoctors O.E.</strong> or are used under authorization.
            </p>
          </div>

          <div className="pt-6 space-y-3">
            <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
              15. Responsibility for Medical Services & 16. Consumer Rights
            </h2>
            <p>
              The healthcare professional or clinic providing a medical service remains responsible for the professional and clinical aspects of that service. These Terms do not limit mandatory rights granted to consumers under applicable Greek or European Union law.
            </p>
          </div>

          <div className="pt-6 space-y-3">
            <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
              17. Changes to the Terms & 18. Applicable Law
            </h2>
            <p>
              Beauty Doctors may update these Terms where reasonably necessary. These Terms are governed by applicable Greek law and European Union law.
            </p>
          </div>

          {/* Section 19: Contact */}
          <div className="pt-6 space-y-2">
            <h2 className="text-base font-black uppercase tracking-wide text-gray-900 flex items-center gap-2">
              <Building2 size={16} className="text-lime-600" /> 19. Contact & Company Details
            </h2>
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-xs space-y-1 text-gray-600">
              <p className="font-bold text-gray-900">Beautydoctors O.E.</p>
              <p>23 Xanthippou Street, Pikermi 19009, Greece</p>
              <p>VAT No.: 803040724 | G.E.MI. No.: 188015103000</p>
              <p>Email: <a href="mailto:info@beautydoctors.gr" className="text-lime-700 underline">info@beautydoctors.gr</a> | Telephone: +30 211 218 4564</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default TermsOfUse;
