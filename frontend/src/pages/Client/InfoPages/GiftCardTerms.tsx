import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaChevronRight } from "react-icons/fa6";
import { Gift, Calendar, Ban, Globe } from "lucide-react";
import LayeredBG from "@/assets/LayeredBg.svg";
import { getPreferredLanguage, switchLanguage, type AppLanguage } from "@/utils/language";

export const GiftCardTerms: React.FC = () => {
  const [lang, setLang] = useState<AppLanguage>(() => getPreferredLanguage());

  useEffect(() => {
    const handleStorage = () => setLang(getPreferredLanguage());
    window.addEventListener("storage", handleStorage);
    window.addEventListener("languagechange", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("languagechange", handleStorage);
    };
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
              {isEl ? "Όροι Δωροκαρτών" : "Gift Card Terms"}
            </span>
          </div>

          <div className="inline-flex items-center bg-white border border-gray-200 rounded-full p-1 shadow-sm self-start sm:self-auto">
            <Globe size={14} className="text-gray-400 ml-2 mr-1" />
            <button
              type="button"
              onClick={() => handleToggleLang("el")}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                isEl ? "bg-[#CBFF38] text-black shadow-sm" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              ΕΛ
            </button>
            <button
              type="button"
              onClick={() => handleToggleLang("en")}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                !isEl ? "bg-[#CBFF38] text-black shadow-sm" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              EN
            </button>
          </div>
        </div>

        {/* Header */}
        <div className="bg-white p-6 sm:p-10 rounded-[32px] shadow-sm border border-gray-100 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-lime-50 border border-lime-200 text-lime-800 text-xs font-bold uppercase tracking-wider">
            <Gift size={14} className="text-lime-600" />
            {isEl ? "Πολιτική Κουπονιών & Δωροκαρτών" : "Voucher & Gift Card Policy"}
          </div>
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-[#1A1A1A]">
            {isEl ? (
              <>
                Όροι <span className="text-[#84cc16]">Δωροκαρτών</span>
              </>
            ) : (
              <>
                Gift Card <span className="text-[#84cc16]">Terms</span>
              </>
            )}
          </h1>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
            {isEl
              ? "Τελευταία ενημέρωση: Σεπτέμβριος 2026 | Έκδοση 1.0"
              : "Last Updated: September 2026 | Version 1.0"}
          </p>
          <p className="text-sm text-gray-600 leading-relaxed pt-2">
            {isEl ? (
              <>
                Οι παρόντες όροι διέπουν την αγορά, έκδοση, εξαργύρωση και ισχύ των Δωροκαρτών Beauty Doctors που εκδίδονται από την{" "}
                <strong>Beautydoctors O.E.</strong>
              </>
            ) : (
              <>
                These terms govern the purchase, issuance, redemption, and validity of Beauty Doctors Gift Cards issued by{" "}
                <strong>Beautydoctors O.E.</strong>
              </>
            )}
          </p>
        </div>

        {/* Highlight Legal Notice */}
        <div className="bg-rose-50 border border-rose-200 rounded-[28px] p-6 sm:p-8 space-y-3">
          <div className="flex items-center gap-3 text-rose-950 font-black text-sm uppercase tracking-wide">
            <Ban size={20} className="text-rose-600 shrink-0" />
            {isEl
              ? "Εξαίρεση Ιατρικών Πράξεων & Νομικοί Περιορισμοί"
              : "Medical Exclusion Law & Restriction"}
          </div>
          <p className="text-xs sm:text-sm text-rose-900 leading-relaxed font-medium">
            {isEl
              ? "Οι Δωροκάρτες Beauty Doctors δεν μπορούν να εξαργυρωθούν για ιατρικές επισκέψεις/συμβουλευτικές, ενέσιμες ιατρικές θεραπείες, ιατρικές πράξεις, χειρουργικές επεμβάσεις ή οποιαδήποτε άλλη υπηρεσία που χαρακτηρίζεται ως ιατρική πράξη. Οι δωροκάρτες διατίθενται αποκλειστικά για επιλεγμένες μη ιατρικές αισθητικές υπηρεσίες."
              : "Beauty Doctors Gift Cards cannot be redeemed for medical consultations, injectable medical treatments, medical procedures, surgery, or any other service classified as a medical act. Gift cards are available exclusively for selected non-medical aesthetic services."}
          </p>
        </div>

        {/* Content Card with 11 Sections */}
        <div className="bg-white p-6 sm:p-10 rounded-[32px] shadow-sm border border-gray-100 divide-y divide-gray-100 space-y-8 text-gray-700 leading-relaxed text-sm">
          <div className="pt-6 first:pt-0 space-y-2">
            <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
              {isEl ? "1. Στοιχεία Εκδότη" : "1. Issuer Information"}
            </h2>
            <p>
              {isEl ? (
                <>
                  Οι Δωροκάρτες Beauty Doctors εκδίδονται από την <strong>Beautydoctors O.E.</strong>, με έδρα στην οδό Ξανθίππου 23, Πικέρμι 19009, Ελλάδα (ΑΦΜ: 803040724, Αρ. ΓΕΜΗ: 188015103000).
                </>
              ) : (
                <>
                  Beauty Doctors Gift Cards are issued by <strong>Beautydoctors O.E.</strong>, with registered office at 23 Xanthippou Street, Pikermi 19009, Greece (VAT No. 803040724, G.E.MI. No. 188015103000).
                </>
              )}
            </p>
          </div>

          <div className="pt-6 space-y-2">
            <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
              {isEl
                ? "2. Επιλέξιμες Υπηρεσίες & 3. Εξαιρούμενες Υπηρεσίες"
                : "2. Eligible Services & 3. Excluded Services"}
            </h2>
            <p>
              {isEl ? (
                <>
                  Οι Δωροκάρτες Beauty Doctors μπορούν να εξαργυρωθούν αποκλειστικά για υπηρεσίες που φέρουν ειδική σήμανση εντός της πλατφόρμας ως{" "}
                  <strong>Επιλέξιμες για Δωροκάρτα (Gift Card Eligible)</strong>. Η επιλεξιμότητα περιορίζεται αυστηρά σε επιλεγμένες μη ιατρικές αισθητικές υπηρεσίες (όπως αισθητική αποτρίχωση).
                </>
              ) : (
                <>
                  Beauty Doctors Gift Cards may be redeemed exclusively for services that are specifically marked within the platform as{" "}
                  <strong>Gift Card Eligible</strong>. Gift Card eligibility is limited strictly to selected non-medical aesthetic services (such as aesthetic hair removal).
                </>
              )}
            </p>
            <p className="font-semibold text-gray-900">
              {isEl
                ? "Η Δωροκάρτα δεν παρέχει στον κάτοχό της δικαίωμα λήψης οποιασδήποτε ιατρικής θεραπείας και δεν μπορεί να μετατραπεί σε πληρωμή ή πίστωση για ιατρική υπηρεσία."
                : "A Gift Card does not entitle its holder to obtain any medical treatment and cannot be converted into payment or credit for a medical service."}
            </p>
          </div>

          <div className="pt-6 space-y-2">
            <h2 className="text-base font-black uppercase tracking-wide text-gray-900 flex items-center gap-2">
              <Calendar size={16} className="text-lime-600" />{" "}
              {isEl ? "4. Διάρκεια Ισχύος" : "4. Validity Period"}
            </h2>
            <p>
              {isEl ? (
                <>
                  Κάθε Δωροκάρτα Beauty Doctors ισχύει για <strong>δύο (2) μήνες από την ημερομηνία έκδοσής της</strong>. Η ημερομηνία λήξης εμφανίζεται ευκρινώς κατά τη στιγμή της αγοράς καθώς και στις λεπτομέρειες της δωροκάρτας στον λογαριασμό σας.
                </>
              ) : (
                <>
                  A Beauty Doctors Gift Card is valid for <strong>two (2) months from its date of issue</strong>. The expiry date is clearly displayed at the time of purchase and within the Gift Card voucher details in your account.
                </>
              )}
            </p>
          </div>

          <div className="pt-6 space-y-2">
            <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
              {isEl ? "5. Αξία Δωροκάρτας & 6. Εξαργύρωση" : "5. Gift Card Value & 6. Redemption"}
            </h2>
            <p>
              {isEl
                ? "Η διαθέσιμη αξία της Δωροκάρτας είναι το ποσό που εμφανίζεται κατά την αγορά. Η Δωροκάρτα μπορεί να χρησιμοποιηθεί μόνο σε συνεργαζόμενους παρόχους για επιλέξιμες υπηρεσίες που συμμετέχουν στο πρόγραμμα Δωροκαρτών του Beauty Doctors."
                : "The available value of the Gift Card is the amount displayed at purchase. A Gift Card may only be used with participating providers for eligible services available through the Beauty Doctors Gift Card programme."}
            </p>
            <p>
              {isEl
                ? "Ο κωδικός της Δωροκάρτας πρέπει να είναι έγκυρος και αχρησιμοποίητος κατά τη στιγμή της εξαργύρωσης στο ταμείο (checkout)."
                : "The Gift Card code must be valid and unused at the time of redemption at checkout."}
            </p>
          </div>

          <div className="pt-6 space-y-2">
            <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
              {isEl
                ? "7. Μη Εξαργύρωση σε Μετρητά & 8. Νόμιμα Δικαιώματα Καταναλωτή"
                : "7. No Cash Redemption & 8. Statutory Consumer Rights"}
            </h2>
            <p>
              {isEl
                ? "Οι Δωροκάρτες δεν ανταλλάσσονται με μετρητά, δεν επιστρέφονται χρηματικά και δεν μπορούν να χρησιμοποιηθούν για ανάληψη μετρητών. Κανένας από τους παρόντες Όρους δεν περιορίζει τα υποχρεωτικά εκ του νόμου δικαιώματα υπαναχώρησης που παρέχονται στους καταναλωτές βάσει της ισχύουσας ελληνικής και ενωσιακής νομοθεσίας."
                : "Gift Cards cannot be exchanged for cash, refunded, or used to obtain cash advances. Nothing in these Terms limits mandatory statutory rights of withdrawal granted to consumers under applicable Greek or EU consumer law."}
            </p>
          </div>

          <div className="pt-6 space-y-2">
            <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
              {isEl
                ? "9. Απώλεια ή Κλοπή Κωδικών & 10. Διαθεσιμότητα Παρόχων"
                : "9. Lost, Stolen Codes & 10. Provider Availability"}
            </h2>
            <p>
              {isEl
                ? "Οι χρήστες οφείλουν να διαφυλάσσουν τους κωδικούς των Δωροκαρτών τους. Το Beauty Doctors δύναται να αναστείλει ή να αρνηθεί την εξαργύρωση μιας Δωροκάρτας εφόσον υπάρχουν ενδείξεις απάτης ή μη εξουσιοδοτημένης χρήσης. Η διαθεσιμότητα των συνεργαζόμενων κλινικών και των επιλέξιμων μη ιατρικών υπηρεσιών ενδέχεται να μεταβάλλεται κατά τη διάρκεια ισχύος της Δωροκάρτας."
                : "Users should safeguard their Gift Card codes. Beauty Doctors may suspend or refuse a Gift Card where there are indications of fraud or unauthorized use. The availability of participating clinics and eligible non-medical services may change during the validity period."}
            </p>
          </div>

          <div className="pt-6 space-y-2">
            <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
              {isEl ? "11. Επικοινωνία & Υποστήριξη" : "11. Contact & Support"}
            </h2>
            <p>
              {isEl ? (
                <>
                  Για ερωτήσεις σχετικά με το υπόλοιπο ή την εξαργύρωση της Δωροκάρτας σας: Email:{" "}
                  <a href="mailto:info@beautydoctors.gr" className="text-lime-700 underline font-bold">
                    info@beautydoctors.gr
                  </a>{" "}
                  | Τηλέφωνο: +30 211 218 4564.
                </>
              ) : (
                <>
                  For questions concerning your Gift Card balance or redemption: Email:{" "}
                  <a href="mailto:info@beautydoctors.gr" className="text-lime-700 underline font-bold">
                    info@beautydoctors.gr
                  </a>{" "}
                  | Telephone: +30 211 218 4564.
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default GiftCardTerms;
