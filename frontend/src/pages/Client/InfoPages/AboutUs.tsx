import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaChevronRight } from "react-icons/fa6";
import { Sparkles, Stethoscope, ArrowRight, HeartHandshake, Building2 } from "lucide-react";
import LayeredBG from "@/assets/LayeredBg.svg";
import { getPreferredLanguage } from "@/utils/language";

export const AboutUs: React.FC = () => {
  const [isGreek, setIsGreek] = useState<boolean>(() => getPreferredLanguage() === "el");

  useEffect(() => {
    const handleLang = () => setIsGreek(getPreferredLanguage() === "el");
    window.addEventListener("storage", handleLang);
    window.addEventListener("languagechange", handleLang);
    return () => {
      window.removeEventListener("storage", handleLang);
      window.removeEventListener("languagechange", handleLang);
    };
  }, []);

  const steps = isGreek
    ? [
        { step: "01", title: "Εξερευνήστε μια θεραπεία", desc: "Περιηγηθείτε σε επιλεγμένες κλινικές θεραπείες" },
        { step: "02", title: "Επιλέξτε ιατρό ή κλινική", desc: "Επιλέξτε πιστοποιημένους επαγγελματίες υγείας" },
        { step: "03", title: "Επιλέξτε ημερομηνία", desc: "Διαλέξτε διαθέσιμες ώρες που σας εξυπηρετούν" },
        { step: "04", title: "Ιατρική αξιολόγηση", desc: "Συμβουλευτείτε τον θεράποντα ιατρό σας" },
        { step: "05", title: "Τελικό πλάνο θεραπείας", desc: "Εξατομικευμένη εφαρμογή θεραπείας" },
      ]
    : [
        { step: "01", title: "Explore a treatment", desc: "Browse curated clinical procedures" },
        { step: "02", title: "Choose a doctor or clinic", desc: "Select verified healthcare professionals" },
        { step: "03", title: "Select a date", desc: "Pick convenient available slots" },
        { step: "04", title: "Medical assessment", desc: "Consult with your attending doctor" },
        { step: "05", title: "Final treatment plan", desc: "Personalised procedure execution" },
      ];

  return (
    <div
      className="relative min-h-screen bg-[#FDFDFD] py-12 px-4 sm:px-6 lg:px-8 bg-cover bg-center"
      style={{
        backgroundImage: `url(${LayeredBG})`,
        backgroundPosition: "center",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Breadcrumb */}
        <div className="flex items-center text-[#33373F] text-xs font-semibold uppercase tracking-wider mb-2">
          <Link to="/" className="hover:text-[#405C0B] transition-colors">
            {isGreek ? "Αρχική" : "Home"}
          </Link>
          <span className="px-3">
            <FaChevronRight size={10} className="text-[#767676]" />
          </span>
          <span className="text-lime-700">{isGreek ? "Σχετικά με εμάς" : "About Us"}</span>
        </div>

        {/* Hero Section */}
        <div className="bg-white p-6 sm:p-10 rounded-[32px] shadow-sm border border-gray-100 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-lime-50 border border-lime-200 text-lime-800 text-xs font-bold uppercase tracking-wider">
            <Sparkles size={14} className="text-lime-600" />
            {isGreek ? "Σχετικά με το Beauty Doctors" : "About Beauty Doctors"}
          </div>
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-[#1A1A1A] leading-tight">
            {isGreek ? (
              <>
                Ένας πιο ξεκάθαρος τρόπος να ανακαλύψετε{" "}
                <span className="text-[#84cc16]">αισθητική και ιατρική φροντίδα.</span>
              </>
            ) : (
              <>
                A clearer way to explore{" "}
                <span className="text-[#84cc16]">aesthetic and medical care.</span>
              </>
            )}
          </h1>
          <p className="text-base sm:text-lg text-gray-700 leading-relaxed font-normal">
            {isGreek ? (
              <>
                Το Beauty Doctors είναι μια ψηφιακή πλατφόρμα που λειτουργεί από την{" "}
                <strong>Beautydoctors O.E.</strong> και συνδέει τους χρήστες με συνεργαζόμενους ιατρούς,
                κλινικές και παρόχους υπηρεσιών αισθητικής.
              </>
            ) : (
              <>
                Beauty Doctors is a digital platform operated by <strong>Beautydoctors O.E.</strong> that
                connects users with participating doctors, clinics and aesthetic service providers.
              </>
            )}
          </p>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
            {isGreek
              ? "Μέσω του Beauty Doctors, οι χρήστες μπορούν να εξερευνήσουν διαθέσιμες θεραπείες και υπηρεσίες, να ανακαλύψουν συνεργαζόμενους παρόχους, να αιτηθούν ή να προγραμματίσουν ραντεβού, να επικοινωνήσουν με ιατρούς ή κλινικές μέσω της πλατφόρμας και να διαχειριστούν πληροφορίες σχετικά με τα ραντεβού και τη δραστηριότητά τους."
              : "Through Beauty Doctors, users can explore available treatments and services, discover participating providers, request or schedule appointments, communicate with doctors or clinics through the platform, and manage information related to their appointments and activity."}
          </p>
        </div>

        {/* Medical Assessment Diligence Box */}
        <div className="bg-amber-50/90 border border-amber-200/90 rounded-[28px] p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3 text-amber-900 font-black text-sm sm:text-base uppercase tracking-wide">
            <Stethoscope size={22} className="text-amber-700 shrink-0" />
            {isGreek
              ? "Ανεξάρτητη Ιατρική Αξιολόγηση & Ευθύνη"
              : "Independent Medical Assessment & Responsibility"}
          </div>
          <div className="space-y-3 text-xs sm:text-sm text-amber-950/90 leading-relaxed">
            <p>
              {isGreek
                ? "Το Beauty Doctors δεν αντικαθιστά τον θεράποντα ιατρό και δεν προβαίνει αυτοτελώς σε ιατρική διάγνωση, δεν καθορίζει την ιατρική καταλληλότητα μιας θεραπείας και δεν παρέχει ιατρικές υπηρεσίες."
                : "Beauty Doctors does not replace the treating physician and does not independently diagnose medical conditions, determine the medical suitability of a treatment, or provide medical treatment."}
            </p>
            <p>
              {isGreek
                ? "Η ιατρική αξιολόγηση, η διάγνωση, η καταλληλότητα της θεραπείας, ο σχεδιασμός του θεραπευτικού πλάνου και η παροχή ιατρικών υπηρεσιών παραμένουν αποκλειστική ευθύνη του αρμόδιου επαγγελματία υγείας ή της κλινικής."
                : "Medical assessment, diagnosis, treatment suitability, treatment planning, and the provision of medical services remain the responsibility of the relevant healthcare professional or clinic."}
            </p>
            <p>
              {isGreek
                ? "Όταν ένας χρήστης επιλέγει μια ιατρική θεραπεία μέσω της πλατφόρμας, η επιλογή αυτή εκφράζει τη θεραπεία για την οποία ενδιαφέρεται. Η τελική απόφαση και το θεραπευτικό πλάνο καθορίζονται από τον θεράποντα ιατρό κατόπιν κατάλληλης ιατρικής αξιολόγησης."
                : "When a user selects a medical treatment through the platform, that selection represents the treatment the user is interested in. The final treatment decision and treatment plan are determined by the treating physician following appropriate medical assessment."}
            </p>
            <p className="font-semibold pt-1">
              {isGreek
                ? "Στόχος μας είναι να κάνουμε την πρόσβαση σε πληροφορίες, επαγγελματίες και υπηρεσίες πιο εύκολη και διαφανή, διαφυλάσσοντας την ανεξάρτητη κλινική κρίση κάθε επαγγελματία υγείας."
                : "Our aim is to make access to information, professionals and services easier and more transparent while preserving the independent clinical judgment of each healthcare professional."}
            </p>
          </div>
        </div>

        {/* How It Works Flow */}
        <div className="bg-white p-6 sm:p-10 rounded-[32px] shadow-sm border border-gray-100 space-y-6">
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-gray-900 flex items-center gap-2">
            <HeartHandshake size={22} className="text-[#84cc16]" />{" "}
            {isGreek ? "Πώς Λειτουργεί" : "How It Works"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
            {steps.map((item, idx) => (
              <div
                key={idx}
                className="bg-gray-50/80 rounded-2xl p-4 border border-gray-100 flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] font-black text-lime-600 uppercase tracking-widest">
                    {item.step}
                  </span>
                  <h3 className="text-xs font-bold text-gray-900 mt-1 uppercase">{item.title}</h3>
                </div>
                <p className="text-[11px] text-gray-500 mt-2">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Official Legal & Company Identity Card */}
        <div className="bg-white p-6 sm:p-8 rounded-[32px] shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-lime-800 bg-lime-50 px-3.5 py-1.5 rounded-full w-fit border border-lime-200">
            <Building2 size={14} className="text-lime-600" />{" "}
            {isGreek ? "Νομική Οντότητα & Φορέας Λειτουργίας" : "Legal Entity & Operator"}
          </div>
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-gray-900">
            Beautydoctors O.E.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">
                {isGreek ? "Έδρα Εταιρείας" : "Registered Address"}
              </span>
              <p className="text-xs font-bold text-gray-900">
                {isGreek ? "Ξανθίππου 23" : "23 Xanthippou St."}
              </p>
              <p className="text-xs text-gray-600">
                {isGreek ? "Πικέρμι 19009, Ελλάδα" : "Pikermi 19009, Greece"}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">
                {isGreek ? "Μητρώο & Φορολογικά" : "Registration & Tax"}
              </span>
              <p className="text-xs font-bold text-gray-900">
                {isGreek ? "ΑΦΜ: 803040724" : "Tax ID (ΑΦΜ): 803040724"}
              </p>
              <p className="text-xs text-gray-600">
                {isGreek ? "ΓΕΜΗ: 188015103000" : "GEMI (ΓΕΜΗ): 188015103000"}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">
                {isGreek ? "Άμεσο Email" : "Direct Email"}
              </span>
              <a
                href="mailto:info@beautydoctors.gr"
                className="text-xs font-bold text-lime-700 hover:underline"
              >
                info@beautydoctors.gr
              </a>
              <p className="text-[11px] text-gray-500">
                {isGreek ? "Επίσημη Επικοινωνία" : "Official Communication"}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">
                {isGreek ? "Τηλέφωνο Επικοινωνίας" : "Telephone Contact"}
              </span>
              <a
                href="tel:2112184564"
                className="text-xs font-bold text-gray-900 hover:text-lime-700"
              >
                211 218 4564
              </a>
              <p className="text-[11px] text-gray-500">+30 211 218 4564</p>
            </div>
          </div>
        </div>

        {/* Contact & Support Notice */}
        <div className="bg-white p-6 sm:p-8 rounded-[32px] shadow-sm border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm sm:text-base font-black uppercase tracking-wide text-gray-900">
              {isGreek ? "Ερωτήσεις & Υποστήριξη Πλατφόρμας" : "Questions & Platform Support"}
            </h3>
            <p className="text-xs text-gray-600 max-w-xl">
              {isGreek ? (
                <>
                  Για ερωτήσεις σχετικά με τον λογαριασμό σας, τα ραντεβού ή τη χρήση της πλατφόρμας, μπορείτε να επικοινωνήσετε με την{" "}
                  <strong>Υποστήριξη Beauty Doctors</strong>. Ερωτήσεις που αφορούν διάγνωση, ιατρική καταλληλότητα, θεραπεία ή κλινική φροντίδα θα πρέπει να απευθύνονται στον αρμόδιο ιατρό ή την κλινική.
                </>
              ) : (
                <>
                  For questions regarding your account, appointments or use of the platform, you can contact{" "}
                  <strong>Beauty Doctors Support</strong>. Questions concerning diagnosis, medical suitability, treatment or clinical care should be addressed to the relevant doctor or clinic.
                </>
              )}
            </p>
          </div>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#CBFF38] hover:bg-lime-400 text-black text-xs font-black uppercase tracking-wider transition-colors shrink-0"
          >
            {isGreek ? "Επικοινωνία με Υποστήριξη" : "Contact Support"} <ArrowRight size={14} />
          </Link>
        </div>

        {/* Company Registration Details */}
        <div className="text-center text-[11px] text-gray-400 space-y-1">
          <p>
            {isGreek
              ? "© 2026 Beauty Doctors. Λειτουργεί από την Beautydoctors O.E. Με επιφύλαξη παντός δικαιώματος."
              : "© 2026 Beauty Doctors. Operated by Beautydoctors O.E. All rights reserved."}
          </p>
          <p>
            {isGreek
              ? "Beautydoctors O.E. · Ξανθίππου 23, Πικέρμι 19009, Ελλάδα · ΑΦΜ 803040724 · Αρ. ΓΕΜΗ 188015103000"
              : "Beautydoctors O.E. · 23 Xanthippou Street, Pikermi 19009, Greece · VAT No. 803040724 · G.E.MI. No. 188015103000"}
          </p>
        </div>
      </div>
    </div>
  );
};
export default AboutUs;
