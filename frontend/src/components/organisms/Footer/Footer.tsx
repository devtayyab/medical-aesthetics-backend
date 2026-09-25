import React from"react";
import { Link } from"react-router-dom";
import { FaFacebookF, FaLinkedinIn } from"react-icons/fa";
import { FaXTwitter } from"react-icons/fa6";
import { Phone, Mail } from"lucide-react";
import SiteLogo from"@/assets/SiteLogo.png";

export const Footer: React.FC = () => {
 return (
 <footer className="bg-[#2D3748]">
 <div className="mx-auto max-w-[1200px] px-4 pt-8 pb-16 sm:pb-8 sm:px-6 lg:px-8">
 {/* Middle Content */}
 <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
 {/* Left Side */}
 <div className="flex flex-col items-start max-w-sm lg:max-w-none">
 <Link
 to="/"
 className="inline-block"
 >
 <div className="w-[140px] sm:w-[160px] relative flex items-center justify-start">
 <img src={SiteLogo} alt="Site Logo" className="w-full h-auto object-contain drop-shadow-[0_0_15px_rgba(203,255,56,0.1)] pointer-events-none" />
 </div>
 </Link>
 <p className="mt-3 text-xs text-white text-left leading-relaxed max-w-sm opacity-90">
 Our aesthetics platform is dedicated to providing high-quality treatments and personalized care. Explore our range of services to find the perfect solution for your beauty and wellness needs.
 </p>
 </div>

 {/* Right Side */}
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 lg:gap-6 text-left w-full">
  {/* Overview */}
  <div>
    <strong className="font-semibold text-[11px] sm:text-[14px] text-[#CBFF38]">
      Overview
    </strong>
    <ul className="mt-2.5 space-y-[6px] text-[10px] sm:text-[12px]">
      <li>
        <Link to="/treatments" className="text-white transition hover:text-[#CBFF38]">
          Treatments
        </Link>
      </li>
      <li>
        <Link to="/services" className="text-white transition hover:text-[#CBFF38]">
          Privileges
        </Link>
      </li>
      <li>
        <Link to="/blog" className="text-white transition hover:text-[#CBFF38]">
          Latest Articles
        </Link>
      </li>
      <li>
        <Link to="/for-clinics" className="text-white transition hover:text-[#CBFF38]">
          For Clinics
        </Link>
      </li>
    </ul>
  </div>

  {/* Company */}
  <div>
    <strong className="font-semibold text-[11px] sm:text-[14px] text-[#CBFF38]">
      Company
    </strong>
    <ul className="mt-2.5 space-y-[6px] text-[10px] sm:text-[12px]">
      <li>
        <Link to="/about-us" className="text-white transition hover:text-[#CBFF38]">
          About Us
        </Link>
      </li>
      <li>
        <Link to="/contact" className="text-white transition hover:text-[#CBFF38]">
          Contact
        </Link>
      </li>
      <li>
        <Link to="/support" className="text-white transition hover:text-[#CBFF38]">
          Support
        </Link>
      </li>
    </ul>
  </div>

  {/* Legal */}
  <div>
    <strong className="font-semibold text-[11px] sm:text-[14px] text-[#CBFF38]">
      Legal
    </strong>
    <ul className="mt-2.5 space-y-[6px] text-[10px] sm:text-[12px]">
      <li>
        <Link to="/terms-of-use" className="text-white transition hover:text-[#CBFF38]">
          Terms of Use
        </Link>
      </li>
      <li>
        <Link to="/privacy-policy" className="text-white transition hover:text-[#CBFF38]">
          Privacy Policy
        </Link>
      </li>
      <li>
        <Link to="/cookie-policy" className="text-white transition hover:text-[#CBFF38]">
          Cookie Policy
        </Link>
      </li>
      <li>
        <Link to="/medical-disclaimer" className="text-white transition hover:text-[#CBFF38]">
          Medical Disclaimer
        </Link>
      </li>
      <li>
        <Link to="/gift-card-terms" className="text-white transition hover:text-[#CBFF38]">
          Gift Card Terms
        </Link>
      </li>
      <li>
        <button 
          type="button" 
          onClick={() => {
            localStorage.removeItem('cookiesAccepted');
            window.dispatchEvent(new Event('openCookieSettings'));
          }}
          className="text-[#CBFF38] hover:underline uppercase text-[9px] sm:text-[10px] font-black tracking-wider cursor-pointer bg-transparent border-0 p-0 text-left"
        >
          Cookie Settings
        </button>
      </li>
    </ul>
  </div>

  {/* Contact */}
  <div className="min-w-0">
    <strong className="font-semibold text-[11px] sm:text-[14px] text-[#CBFF38]">
      Contact Us
    </strong>
    <ul className="mt-2.5 space-y-[6px] text-[10px] sm:text-[12px]">
      <li>
        <a
          href="tel:6948880498"
          className="text-white transition hover:text-[#CBFF38] decoration-none no-underline"
          style={{ textDecoration: 'none' }}
        >
          <span className="flex items-center justify-start gap-1">
            <Phone size={10} className="text-[#CBFF38] shrink-0" /> 
            <span>6948880498 / 2112184564</span>
          </span>
        </a>
      </li>
      <li>
        <a
          href="mailto:info@beautydoctors.gr"
          className="text-white transition hover:text-[#CBFF38] decoration-none no-underline"
          style={{ textDecoration: 'none' }}
        >
          <span className="flex items-center justify-start gap-1">
            <Mail size={10} className="text-[#CBFF38] shrink-0" /> 
            <span className="truncate">info@beautydoctors.gr</span>
          </span>
        </a>
      </li>
      <li className="pt-1 text-[10px] text-gray-300">
        23 Xanthippou Street, Pikermi 19009, Greece
      </li>
    </ul>
  </div>
</div>
</div>

{/* Bottom */}
 <div className="mt-6 flex flex-col md:flex-row justify-center md:justify-between gap-4 items-center border-t border-[#586271] pt-4 w-full">
 <div className="flex space-x-[8px]">
 <a
 href="#"
 className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-white text-[#2D3748] transition hover:bg-blue-600 hover:text-white"
 >
 <FaFacebookF size={14} />
 </a>
 <a
 href="#"
 className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-white text-[#2D3748] transition hover:bg-black hover:text-white"
 >
 <FaXTwitter size={14} />
 </a>
 <a
 href="#"
 className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-white text-[#2D3748] transition hover:bg-blue-700 hover:text-white"
 >
 <FaLinkedinIn size={14} />
 </a>
 </div>
 <form onSubmit={(e) => e.preventDefault()} className="w-full sm:w-auto mt-2 sm:mt-0">
 <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-2 w-full">
 <label className="text-white text-[10px] font-bold uppercase tracking-wider mb-1 sm:mb-0" htmlFor="email">
 Newsletter
 </label>

 <div className="flex w-full sm:w-auto gap-2">
 <input
 className="w-full flex-1 sm:w-auto rounded-[8px] border focus:outline-none border-[#8B95A5] focus:border-white bg-transparent px-3 py-2 text-white text-xs font-medium"
 id="email"
 type="email"
 placeholder="john@doe.com"
 />

 <button
 type="submit"
 className="whitespace-nowrap rounded-[8px] bg-[#CBFF38] px-4 py-2 font-black text-[10px] uppercase tracking-widest text-[#2D3748] transition hover:bg-lime-400"
 >
 <span className="notranslate">{localStorage.getItem('preferredLang') === 'el' ? 'ΕΓΓΡΑΦΗ' : 'Subscribe'}</span>
 </button>
 </div>
 </div>
 </form>
 </div>
         {/* Bottom Legal / Copyright / Company Details */}
        <div className="mt-8 pt-6 border-t border-[#4A5568] flex flex-col md:flex-row items-center justify-between gap-3 text-[11px] text-gray-300 text-center md:text-left">
          <div className="space-y-1">
            <p className="font-semibold text-white">© 2026 Beauty Doctors. Operated by Beautydoctors O.E. All rights reserved.</p>
            <p className="text-[10px] text-gray-400">Beautydoctors O.E. · VAT 803040724 · G.E.MI. 188015103000 · 23 Xanthippou Street, Pikermi 19009, Greece</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-[10px] text-gray-300">
            <Link to="/terms-of-use" className="hover:text-[#CBFF38] transition-colors">Terms of Use</Link>
            <Link to="/privacy-policy" className="hover:text-[#CBFF38] transition-colors">Privacy Policy</Link>
            <Link to="/cookie-policy" className="hover:text-[#CBFF38] transition-colors">Cookie Policy</Link>
            <Link to="/medical-disclaimer" className="hover:text-[#CBFF38] transition-colors">Medical Disclaimer</Link>
            <Link to="/gift-card-terms" className="hover:text-[#CBFF38] transition-colors">Gift Card Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
