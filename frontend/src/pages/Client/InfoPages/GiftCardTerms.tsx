import React from "react";
import { Link } from "react-router-dom";
import { FaChevronRight } from "react-icons/fa6";
import { Gift, ShieldCheck, AlertCircle, Calendar, Ban } from "lucide-react";
import LayeredBG from "@/assets/LayeredBg.svg";

export const GiftCardTerms: React.FC = () => {
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
          <span className="text-lime-700">Gift Card Terms</span>
        </div>

        {/* Header */}
        <div className="bg-white p-6 sm:p-10 rounded-[32px] shadow-sm border border-gray-100 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-lime-50 border border-lime-200 text-lime-800 text-xs font-bold uppercase tracking-wider">
            <Gift size={14} className="text-lime-600" />
            Voucher & Gift Card Policy
          </div>
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-[#1A1A1A]">
            Gift Card <span className="text-[#84cc16]">Terms</span>
          </h1>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Last Updated: September 2026 | Version 1.0 (Master English Copy)
          </p>
          <p className="text-sm text-gray-600 leading-relaxed pt-2">
            These terms govern the purchase, issuance, redemption, and validity of Beauty Doctors Gift Cards issued by <strong>Beautydoctors O.E.</strong>
          </p>
        </div>

        {/* Highlight Legal Notice */}
        <div className="bg-rose-50 border border-rose-200 rounded-[28px] p-6 sm:p-8 space-y-3">
          <div className="flex items-center gap-3 text-rose-950 font-black text-sm uppercase tracking-wide">
            <Ban size={20} className="text-rose-600 shrink-0" />
            Medical Exclusion Law & Restriction
          </div>
          <p className="text-xs sm:text-sm text-rose-900 leading-relaxed font-medium">
            Beauty Doctors Gift Cards cannot be redeemed for medical consultations, injectable medical treatments, medical procedures, surgery, or any other service classified as a medical act. Gift cards are available exclusively for selected non-medical aesthetic services.
          </p>
        </div>

        {/* Content Card with 11 Sections */}
        <div className="bg-white p-6 sm:p-10 rounded-[32px] shadow-sm border border-gray-100 divide-y divide-gray-100 space-y-8 text-gray-700 leading-relaxed text-sm">
          
          <div className="pt-6 first:pt-0 space-y-2">
            <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
              1. Issuer Information
            </h2>
            <p>
              Beauty Doctors Gift Cards are issued by <strong>Beautydoctors O.E.</strong>, with registered office at 23 Xanthippou Street, Pikermi 19009, Greece (VAT No. 803040724, G.E.MI. No. 188015103000).
            </p>
          </div>

          <div className="pt-6 space-y-2">
            <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
              2. Eligible Services & 3. Excluded Services
            </h2>
            <p>
              Beauty Doctors Gift Cards may be redeemed exclusively for services that are specifically marked within the platform as <strong>Gift Card Eligible</strong>. Gift Card eligibility is limited strictly to selected non-medical aesthetic services (such as aesthetic hair removal).
            </p>
            <p className="font-semibold text-gray-900">
              A Gift Card does not entitle its holder to obtain any medical treatment and cannot be converted into payment or credit for a medical service.
            </p>
          </div>

          <div className="pt-6 space-y-2">
            <h2 className="text-base font-black uppercase tracking-wide text-gray-900 flex items-center gap-2">
              <Calendar size={16} className="text-lime-600" /> 4. Validity Period
            </h2>
            <p>
              A Beauty Doctors Gift Card is valid for <strong>two (2) months from its date of issue</strong>. The expiry date is clearly displayed at the time of purchase and within the Gift Card voucher details in your account.
            </p>
          </div>

          <div className="pt-6 space-y-2">
            <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
              5. Gift Card Value & 6. Redemption
            </h2>
            <p>
              The available value of the Gift Card is the amount displayed at purchase. A Gift Card may only be used with participating providers for eligible services available through the Beauty Doctors Gift Card programme.
            </p>
            <p>
              The Gift Card code must be valid and unused at the time of redemption at checkout.
            </p>
          </div>

          <div className="pt-6 space-y-2">
            <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
              7. No Cash Redemption & 8. Statutory Consumer Rights
            </h2>
            <p>
              Gift Cards cannot be exchanged for cash, refunded, or used to obtain cash advances. Nothing in these Terms limits mandatory statutory rights of withdrawal granted to consumers under applicable Greek or EU consumer law.
            </p>
          </div>

          <div className="pt-6 space-y-2">
            <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
              9. Lost, Stolen Codes & 10. Provider Availability
            </h2>
            <p>
              Users should safeguard their Gift Card codes. Beauty Doctors may suspend or refuse a Gift Card where there are indications of fraud or unauthorized use. The availability of participating clinics and eligible non-medical services may change during the validity period.
            </p>
          </div>

          <div className="pt-6 space-y-2">
            <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
              11. Contact & Support
            </h2>
            <p>
              For questions concerning your Gift Card balance or redemption: Email: <a href="mailto:info@beautydoctors.gr" className="text-lime-700 underline font-bold">info@beautydoctors.gr</a> | Telephone: +30 211 218 4564.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default GiftCardTerms;
