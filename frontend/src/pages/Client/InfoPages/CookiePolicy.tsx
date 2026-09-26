import React from "react";
import { Link } from "react-router-dom";
import { FaChevronRight } from "react-icons/fa6";
import { Cookie, Settings, ShieldCheck, Sliders } from "lucide-react";
import LayeredBG from "@/assets/LayeredBg.svg";

export const CookiePolicy: React.FC = () => {
  const openCookiePreferences = () => {
    localStorage.removeItem('cookiesAccepted');
    window.dispatchEvent(new Event('openCookieSettings'));
  };

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
          <span className="text-lime-700">Cookie Policy</span>
        </div>

        {/* Header */}
        <div className="bg-white p-6 sm:p-10 rounded-[32px] shadow-sm border border-gray-100 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-lime-50 border border-lime-200 text-lime-800 text-xs font-bold uppercase tracking-wider">
            <Cookie size={14} className="text-lime-600" />
            Cookie & Tracking Technologies
          </div>
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-[#1A1A1A]">
            Cookie <span className="text-[#84cc16]">Policy</span>
          </h1>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Last Updated: September 2026 | Version 1.0 (Master English Copy)
          </p>
          <p className="text-sm text-gray-600 leading-relaxed pt-2">
            Beauty Doctors uses cookies and similar technologies to operate the website and application, maintain user sessions, remember preferences, understand how the service is used and, where the user chooses, support analytics or marketing functionality.
          </p>
        </div>

        {/* Manage Preferences Action Card */}
        <div className="bg-white p-6 sm:p-8 rounded-[32px] shadow-sm border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm sm:text-base font-black uppercase tracking-wide text-gray-900 flex items-center gap-2">
              <Sliders size={18} className="text-lime-600" /> Manage Cookie Preferences
            </h3>
            <p className="text-xs text-gray-600 max-w-xl">
              You can accept, reject, or adjust optional cookie categories at any time through our interactive preference tool.
            </p>
          </div>
          <button 
            type="button"
            onClick={openCookiePreferences}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#CBFF38] hover:bg-lime-400 text-black text-xs font-black uppercase tracking-wider transition-colors shrink-0"
          >
            <Settings size={14} /> Open Cookie Settings
          </button>
        </div>

        {/* Content Card */}
        <div className="bg-white p-6 sm:p-10 rounded-[32px] shadow-sm border border-gray-100 divide-y divide-gray-100 space-y-8 text-gray-700 leading-relaxed text-sm">
          
          <div className="pt-6 first:pt-0 space-y-2">
            <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
              1. Necessary Cookies
            </h2>
            <p>
              Necessary cookies are required for core platform functions such as authentication, security, session management, cookie preferences, and other services requested by the user. These technologies operate without optional marketing or analytics consent where permitted by law.
            </p>
          </div>

          <div className="pt-6 space-y-2">
            <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
              2. Analytics Cookies
            </h2>
            <p>
              Analytics technologies help Beauty Doctors understand how users interact with the platform and improve performance and content. Where consent is required, analytics cookies remain disabled until the user chooses to enable them.
            </p>
          </div>

          <div className="pt-6 space-y-2">
            <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
              3. Preference Cookies
            </h2>
            <p>
              Preference technologies remember settings selected by the user, such as language (EN / EL) or interface choices. Their use depends on the nature of the relevant technology and applicable consent requirements.
            </p>
          </div>

          <div className="pt-6 space-y-2">
            <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
              4. Marketing Cookies & 5. Third-Party Technologies
            </h2>
            <p>
              Marketing and advertising technologies may be used to measure campaigns, understand advertising effectiveness, or provide relevant promotional communications. Where consent is required, these technologies remain disabled until the user actively enables them.
            </p>
          </div>

          <div className="pt-6 space-y-2">
            <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
              6. Managing Cookie Preferences
            </h2>
            <p>
              Users can accept, reject, or adjust optional cookie categories through the Beauty Doctors cookie preference tool. A permanent <strong>Cookie Settings</strong> link is always available in the footer so users can change or withdraw their choices later.
            </p>
          </div>

          {/* Section 7: Cookie Inventory Table */}
          <div className="pt-6 space-y-4">
            <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
              7. Active Cookie Inventory
            </h2>
            <div className="overflow-x-auto rounded-2xl border border-gray-100">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-100 text-[10px] font-black uppercase tracking-wider text-gray-700">
                  <tr>
                    <th className="p-3">Cookie Name</th>
                    <th className="p-3">Provider</th>
                    <th className="p-3">Purpose</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-600">
                  <tr>
                    <td className="p-3 font-mono font-bold text-gray-900">token</td>
                    <td className="p-3">Beauty Doctors</td>
                    <td className="p-3">User authentication & security</td>
                    <td className="p-3 font-semibold text-lime-700">Necessary</td>
                    <td className="p-3">Session / 30 days</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-gray-900">cookiesAccepted</td>
                    <td className="p-3">Beauty Doctors</td>
                    <td className="p-3">Stores user cookie consent choices</td>
                    <td className="p-3 font-semibold text-lime-700">Necessary</td>
                    <td className="p-3">1 year</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-gray-900">preferredLang</td>
                    <td className="p-3">Beauty Doctors</td>
                    <td className="p-3">Remembers language choice (EN / EL)</td>
                    <td className="p-3 font-semibold text-blue-700">Preferences</td>
                    <td className="p-3">1 year</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Footnote */}
          <div className="pt-6 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-400">
            <span>© 2026 Beauty Doctors. Operated by Beautydoctors O.E. All rights reserved.</span>
            <span>Beautydoctors O.E. · 23 Xanthippou Street, Pikermi 19009, Greece</span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default CookiePolicy;
