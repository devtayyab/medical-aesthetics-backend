import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { css } from "@emotion/css";
import { FaChevronRight, FaArrowRight } from "react-icons/fa6";
import { FaGift, FaWallet, FaHeadset, FaShieldAlt } from "react-icons/fa";
import HeroBg from "@/assets/explore_services_bg.png";
import { motion } from "framer-motion";

const containerStyle = css`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
  @media (min-width: 640px) {
    padding: 0 32px;
  }
`;

export const Services: React.FC = () => {
  const navigate = useNavigate();

  const [isGreek, setIsGreek] = useState<boolean>(
    () => typeof window !== 'undefined' && localStorage.getItem('preferredLang') === 'el'
  );

  useEffect(() => {
    const handleLang = () => {
      setIsGreek(localStorage.getItem('preferredLang') === 'el');
    };
    window.addEventListener('storage', handleLang);
    const interval = setInterval(handleLang, 1000);
    return () => {
      window.removeEventListener('storage', handleLang);
      clearInterval(interval);
    };
  }, []);

  const extraServices = [
    {
      id: "gift-cards",
      name: isGreek ? "Δωροκάρτες" : "Gift Cards",
      description: isGreek
        ? "«Οι δωροκάρτες BeautyDoctors χρησιμοποιούνται αποκλειστικά για επιλεγμένες μη ιατρικές υπηρεσίες αισθητικής με την ένδειξη “Δέχεται δωροκάρτα”, σε συμμετέχοντες παρόχους. Δεν χρησιμοποιούνται για ιατρικές επισκέψεις ή ιατρικές πράξεις.»"
        : "BeautyDoctors Gift Cards are available exclusively for selected non-medical aesthetic services marked as Gift Card Eligible, at participating providers. They cannot be used for medical consultations or procedures.",
      icon: <FaGift size={30} />,
      link: "/gift-card",
      btnText: isGreek ? "Δείτε τις δωροκάρτες" : "Explore Gift Cards",
    },
    {
      id: "wallet",
      name: isGreek ? "Πληροφορίες πληρωμών" : "Payment Information",
      description: isGreek
        ? "«Δείτε τις διαθέσιμες πληροφορίες πληρωμών στον λογαριασμό σας. Οι ιατρικές υπηρεσίες πληρώνονται απευθείας στον θεράποντα ιατρό ή στην κλινική, που εκδίδει την αντίστοιχη απόδειξη ή το τιμολόγιο.»"
        : "View available payment information in your account. Medical services are paid directly to the treating doctor or clinic, which issues the relevant receipt or invoice.",
      icon: <FaWallet size={30} />,
      link: "/payments",
      btnText: isGreek ? "Πληροφορίες πληρωμών" : "Payment Information",
    },
    {
      id: "support",
      name: isGreek ? "Υποστήριξη πλατφόρμας" : "Platform Support",
      description: isGreek
        ? "«Επικοινωνήστε με την υποστήριξη BeautyDoctors για βοήθεια με τον λογαριασμό σας, τα ραντεβού και τη χρήση της πλατφόρμας. Για ιατρικές συμβουλές ή την καταλληλότητα μιας θεραπείας, απευθυνθείτε στον θεράποντα ιατρό σας. Ωράριο υποστήριξης: Δευτέρα–Παρασκευή, 09:00–18:00, ώρα Ελλάδας.»"
        : "Contact BeautyDoctors Support for help with your account, appointments and platform use. For medical advice or treatment suitability, contact your treating doctor. Support hours: Monday–Friday, 09:00–18:00, Greece local time.",
      icon: <FaHeadset size={30} />,
      link: "/contact",
      btnText: isGreek ? "Επικοινωνία με την υποστήριξη" : "Contact Support",
    },
    {
      id: "gdpr",
      name: isGreek ? "Προστασία Δεδομένων" : "Data Privacy",
      description: isGreek
        ? "«Διαβάστε την Πολιτική Απορρήτου για να ενημερωθείτε πώς η BeautyDoctors επεξεργάζεται προσωπικά δεδομένα, για ποιους σκοπούς και πώς μπορείτε να ασκήσετε τα δικαιώματά σας.»"
        : "Read our Privacy Policy to learn how BeautyDoctors processes personal data, why it is used and how to exercise your privacy rights.",
      icon: <FaShieldAlt size={30} />,
      link: "/privacy-policy",
      btnText: isGreek ? "Πολιτική Απορρήτου" : "Read Privacy Policy",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FDFDFD] pb-24">
      {/* Hero Header */}
      <div className="bg-[#1A1A1A] text-white pt-16 pb-28 px-4 sm:px-6 relative overflow-hidden min-h-[420px] md:min-h-0 md:h-[500px] flex items-center">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src={HeroBg}
            className="w-full h-full object-cover opacity-40"
            alt="Services Background"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-[#FDFDFD]" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60" />
        </div>

        <div className="max-w-6xl mx-auto relative z-10 text-center w-full">
          <div className="flex items-center justify-center gap-4 mb-6 text-[#CBFF38] text-[10px] font-black uppercase tracking-[0.2em]">
            <Link to="/" className="hover:opacity-80 transition-opacity">
              {isGreek ? "Αρχική" : "Home"}
            </Link>
            <FaChevronRight size={10} />
            <span>{isGreek ? "Προνόμια" : "Privileges"}</span>
          </div>
          <h1 className="text-3xl sm:text-6xl md:text-8xl font-black uppercase tracking-tighter leading-tight mb-6">
            {isGreek ? "Εξερευνήστε" : "Explore"}
            <br />
            <span className="text-[#CBFF38]">{isGreek ? "Προνόμια" : "Privileges"}</span>
          </h1>
          <p className="text-gray-200 font-bold max-w-2xl mx-auto text-base sm:text-xl leading-relaxed">
            {isGreek
              ? "Ανακαλύψτε υπηρεσίες και προνόμια σχεδιασμένα για να κάνουν την εμπειρία σας στη Beauty Doctors ευκολότερη, πιο άνετη και καλύτερα συνδεδεμένη."
              : "Discover services and benefits designed to make your Beauty Doctors experience easier, more convenient and better connected."}
          </p>
        </div>
      </div>

      <div className={containerStyle + " -mt-16 relative z-20"}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-8">
          {extraServices.map((service, idx) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-[2rem] sm:rounded-[40px] p-6 sm:p-10 border border-gray-100 shadow-xl hover:shadow-2xl hover:border-[#CBFF38] transition-all group flex flex-col h-full"
            >
              <div className="size-16 bg-black text-[#CBFF38] rounded-full flex items-center justify-center mb-8 group-hover:scale-105 transition-transform">
                {service.icon}
              </div>
              <h3 className="text-2xl font-black tracking-tight text-gray-900 mb-4 group-hover:text-black">
                {service.name}
              </h3>
              <p className="text-gray-600 font-medium text-sm sm:text-base mb-8 flex-1 leading-relaxed">
                {service.description}
              </p>
              <button
                onClick={() => navigate(service.link)}
                className="w-fit max-w-full h-12 bg-gray-50 text-black px-5 sm:px-8 rounded-full flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest hover:bg-[#CBFF38] hover:text-black transition-all active:scale-95 shadow-xs"
              >
                {service.btnText} <FaArrowRight size={10} />
              </button>
            </motion.div>
          ))}
        </div>

        {/* Bottom Call-To-Action Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mt-16 bg-[#1A1A1A] text-[#FDFDFD] rounded-[2rem] sm:rounded-[48px] p-8 sm:p-12 md:p-16 text-center shadow-2xl relative overflow-hidden"
        >
          <div className="relative z-10 max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight mb-8 leading-tight">
              {isGreek ? (
                <>
                  Εργαλεία για τη διαχείριση της εμπειρίας σας{" "}
                  <span className="text-[#CBFF38]">στη BeautyDoctors</span>
                </>
              ) : (
                <>
                  Tools to Manage Your{" "}
                  <span className="text-[#CBFF38]">BeautyDoctors Experience</span>
                </>
              )}
            </h2>
            <button
              onClick={() => navigate('/treatments')}
              className="px-8 md:px-12 h-14 bg-[#CBFF38] text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white transition-all shadow-xl active:scale-95 cursor-pointer"
            >
              {isGreek ? "Δείτε θεραπείες" : "Explore Treatments"}
            </button>
          </div>
          {/* Background decorative elements */}
          <div className="absolute top-0 right-0 size-60 bg-[#CBFF38]/5 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 size-80 bg-white/5 rounded-full -ml-30 -mb-30 blur-2xl pointer-events-none" />
        </motion.div>
      </div>
    </div>
  );
};
