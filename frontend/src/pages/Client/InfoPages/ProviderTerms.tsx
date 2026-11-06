import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaChevronRight } from "react-icons/fa6";
import { ShieldCheck, Globe, Building2, Scale, AlertCircle } from "lucide-react";
import LayeredBG from "@/assets/LayeredBg.svg";
import { getPreferredLanguage, switchLanguage, type AppLanguage } from "@/utils/language";

export const ProviderTerms: React.FC = () => {
  const [lang, setLang] = useState<AppLanguage>(() => getPreferredLanguage());

  useEffect(() => {
    const handleStorage = () => setLang(getPreferredLanguage());
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const handleToggleLang = (newLang: AppLanguage) => {
    setLang(newLang);
    switchLanguage(newLang);
  };

  const isEl = lang === "el";

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
        {/* Breadcrumb + Language Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center text-[#33373F] text-xs font-semibold uppercase tracking-wider">
            <Link to="/" className="hover:text-[#405C0B] transition-colors">
              {isEl ? "Αρχική" : "Home"}
            </Link>
            <span className="px-3">
              <FaChevronRight size={10} className="text-[#767676]" />
            </span>
            <span>{isEl ? "Νομικά" : "Legal"}</span>
            <span className="px-3">
              <FaChevronRight size={10} className="text-[#767676]" />
            </span>
            <span className="text-lime-700">
              {isEl ? "Όροι Παρόχων (P2B)" : "Provider Terms"}
            </span>
          </div>

          <div className="inline-flex items-center bg-white border border-gray-200 rounded-full p-1 shadow-sm self-start sm:self-auto">
            <Globe size={14} className="text-gray-400 ml-2 mr-1" />
            <button
              type="button"
              onClick={() => handleToggleLang("el")}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                isEl
                  ? "bg-[#CBFF38] text-black shadow-sm"
                  : "text-gray-600 hover:text-black"
              }`}
            >
              Ελληνικά (GR)
            </button>
            <button
              type="button"
              onClick={() => handleToggleLang("en")}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                !isEl
                  ? "bg-[#CBFF38] text-black shadow-sm"
                  : "text-gray-600 hover:text-black"
              }`}
            >
              English (EN)
            </button>
          </div>
        </div>

        {/* Header Hero */}
        <div className="bg-black text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-xl border border-gray-800">
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-[#CBFF38] text-xs font-black uppercase tracking-wider">
              <ShieldCheck size={16} />
              <span>EU Regulation 2019/1150 (P2B) Compliance</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight">
              {isEl ? "Όροι Συνεργασίας Παρόχων" : "Provider Terms of Service"}
            </h1>
            <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
              {isEl
                ? "Γενικοί όροι και προϋποθέσεις για ιατρούς, κλινικές και επαγγελματίες υγείας/αισθητικής στην πλατφόρμα BeautyDoctors."
                : "Terms and conditions governing the relationship between medical aesthetics clinics/practitioners and the BeautyDoctors platform."}
            </p>
          </div>
        </div>

        {/* Legal Content Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-12 shadow-sm border border-gray-100 text-gray-800 space-y-8">
          {/* Section 1 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5">
              <Building2 className="text-[#405C0B] size-5" />
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-wide text-gray-900">
                {isEl ? "1. Σκοπός και Πεδίο Εφαρμογής" : "1. Scope and Eligibility"}
              </h2>
            </div>
            <p className="text-sm leading-relaxed text-gray-600">
              {isEl
                ? "Οι παρόντες όροι ρυθμίζουν την εγγραφή, προβολή και λειτουργία κλινικών και ιατρών (εφεξής «Πάροχοι») στην πλατφόρμα BeautyDoctors. Η εγγραφή επιτρέπεται αποκλειστικά σε νομίμως αδειοδοτημένους επαγγελματίες και κλινικές που πληρούν τα ιατρικά και ρυθμιστικά πρότυπα της Ελληνικής Δημοκρατίας."
                : "These terms govern the registration, listing, and interaction of licensed medical practitioners and clinics ('Providers') on the BeautyDoctors platform. Membership is restricted to certified entities complying with Hellenic health regulations."}
            </p>
          </section>

          {/* Section 2: Ranking & Display */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5">
              <Scale className="text-[#405C0B] size-5" />
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-wide text-gray-900">
                {isEl ? "2. Κριτήρια Κατάταξης και Προβολής (Κανονισμός P2B)" : "2. Ranking Criteria (P2B Transparency)"}
              </h2>
            </div>
            <p className="text-sm leading-relaxed text-gray-600">
              {isEl
                ? "Σύμφωνα με τον Κανονισμό (ΕΕ) 2019/1150 (P2B), η προβολή των ιατρών και κλινικών στα αποτελέσματα αναζήτησης βασίζεται αποκλειστικά σε αντικειμενικά φίλτρα χρήστη (όπως θεραπεία, γεωγραφική περιοχή/πόλη και διαθεσιμότητα) και εξ ορισμού σε αλφαβητική σειρά. Δεν παρέχεται αμειβόμενη προνομιακή κατάταξη (paid ranking) χωρίς ρητή επισήμανση διαφήμισης."
                : "Pursuant to EU Regulation 2019/1150, practitioner listings in search results are determined strictly by objective user search filters (treatment category, geographic location, and appointment availability) and sorted alphabetically by default. There is no paid prioritization of search results without explicit sponsored disclosure."}
            </p>
          </section>

          {/* Section 3: Financial & Invoicing */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="text-[#405C0B] size-5" />
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-wide text-gray-900">
                {isEl ? "3. Οικονομικοί Όροι και Τιμολόγηση" : "3. Fees, Payments and Direct Settlement"}
              </h2>
            </div>
            <p className="text-sm leading-relaxed text-gray-600">
              {isEl
                ? "Οι τιμές των θεραπειών καθορίζονται ελεύθερα από τον Πάροχο. Όλες οι ηλεκτρονικές προπληρωμές διεκπεραιώνονται απευθείας προς τον τραπεζικό λογαριασμό (IBAN) του Παρόχου μέσω αδειοδοτημένου ιδρύματος πληρωμών (Viva Wallet). Η νόμιμη απόδειξη παροχής υπηρεσιών ή τιμολόγιο εκδίδεται απευθείας από τον Πάροχο προς τον ασθενή/πελάτη."
                : "Treatment fees are determined autonomously by the Provider. Electronic payments and deposits are routed directly to the Provider's registered bank account (IBAN) via licensed payment processor Viva Wallet. Legal tax receipts and invoices are issued directly by the Provider to the client."}
            </p>
          </section>

          {/* Section 4: Data Access & Medical Secrecy */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="text-[#405C0B] size-5" />
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-wide text-gray-900">
                {isEl ? "4. Πρόσβαση σε Δεδομένα και Ιατρικό Απόρρητο" : "4. Data Access & Medical Confidentiality"}
              </h2>
            </div>
            <p className="text-sm leading-relaxed text-gray-600">
              {isEl
                ? "Ο Πάροχος έχει πλήρη πρόσβαση στα στοιχεία των ραντεβού και στο ιατρικό ιστορικό των ασθενών που τον επισκέπτονται, τηρώντας πιστά τις διατάξεις του GDPR και τον Κώδικα Ιατρικής Δεοντολογίας. Η πλατφόρμα BeautyDoctors δεν επεμβαίνει ούτε τροποποιεί το ιατρικό ιστορικό."
                : "Providers retain access to appointment logs and medical files of their direct patients, adhering strictly to GDPR compliance and Hellenic Medical Code of Ethics. BeautyDoctors operates solely as a technical platform intermediary."}
            </p>
          </section>

          {/* Section 5: Termination & Notice */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-black uppercase tracking-wide text-gray-900">
              {isEl ? "5. Τροποποίηση και Λύση Συνεργασίας" : "5. Modifications and Account Termination"}
            </h2>
            <p className="text-sm leading-relaxed text-gray-600">
              {isEl
                ? "Οποιαδήποτε τροποποίηση των παρόντων όρων κοινοποιείται στους Παρόχους τουλάχιστον 15 ημέρες πριν την έναρξη ισχύος της, όπως απαιτεί ο Κανονισμός P2B. Ο Πάροχος διατηρεί το δικαίωμα διαγραφής του λογαριασμού του ανά πάσα στιγμή κατόπιν ολοκλήρωσης των εκκρεμών ραντεβού."
                : "Any amendment to these provider terms will be notified with at least 15 days prior notice, compliant with P2B requirements. Providers may terminate their account at any time provided all scheduled patient appointments have been satisfied or properly rescheduled."}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ProviderTerms;
