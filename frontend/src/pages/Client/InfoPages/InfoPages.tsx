import React, { useState, useEffect } from "react";
import { MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { css } from "@emotion/css";
import LayeredBG from "@/assets/LayeredBg.svg";
import { FaChevronRight } from "react-icons/fa6";
import { Card } from "@/components/atoms/Card/Card";
import { getPreferredLanguage } from "@/utils/language";

const containerStyle = css`
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  padding: 0 16px;
`;

const useIsGreek = () => {
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
  return isGreek;
};

export const Legal: React.FC = () => {
  const isGreek = useIsGreek();
  return (
    <section
      className="relative bg-cover bg-center flex items-center justify-center px-4 py-[60px]"
      style={{
        backgroundImage: `url(${LayeredBG})`,
        backgroundPosition: "center",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className={containerStyle}>
        <div className="flex items-center text-[#33373F] text-[15px] font-medium mb-1">
          <Link to="/" className="hover:text-[#405C0B] transition-colors">
            {isGreek ? "Αρχική" : "Home"}
          </Link>
          <span className="px-3">
            <FaChevronRight size={11} className="pt-[1px] text-[#767676]" />
          </span>
          {isGreek ? "Νομικά" : "Legal"}
        </div>
        <h2 className="text-[#33373F] text-2xl sm:text-[30px] font-black uppercase mb-8">
          {isGreek ? (
            <>
              Νομικά & <span className="text-lime-700">Πολιτικές</span>
            </>
          ) : (
            <>
              Legal & <span className="text-lime-700">Policies</span>
            </>
          )}
        </h2>
        <Card className="bg-white p-5 sm:p-8 rounded-2xl shadow-lg border border-gray-100 space-y-6">
          <div>
            <h3 className="text-xl font-bold mb-2">
              {isGreek ? "Όροι Χρήσης" : "Terms of Service"}
            </h3>
            <p className="text-gray-600">
              {isGreek
                ? "Οι όροι χρήσης παρέχουν αναλυτικές πληροφορίες σχετικά με τη δέσμευσή μας για την προστασία των δεδομένων σας και τους κανόνες που διέπουν τη χρήση της πλατφόρμας μας."
                : "Our terms of service provide detailed information about our commitment to your privacy and the rules governing the use of our aesthetics platform."}
            </p>
          </div>
          <div className="border-t pt-6">
            <h3 className="text-xl font-bold mb-2">
              {isGreek ? "Πολιτική Απορρήτου" : "Privacy Policy"}
            </h3>
            <p className="text-gray-600">
              {isGreek
                ? "Η ασφάλεια των δεδομένων σας είναι προτεραιότητά μας. Διαχειριζόμαστε τις προσωπικές σας πληροφορίες με τα υψηλότερα πρότυπα εμπιστευτικότητας."
                : "Your data security is our priority. We treat your personal information with the highest standards of confidentiality."}
            </p>
          </div>
          <div className="border-t pt-6">
            <h3 className="text-xl font-bold mb-2">
              {isGreek ? "Πολιτική Cookies" : "Cookie Policy"}
            </h3>
            <p className="text-gray-600">
              {isGreek
                ? "Απολαύστε μια πιο εξατομικευμένη εμπειρία περιήγησης με τη διαφανή πολιτική cookies μας."
                : "Experience a more personalized browsing experience with our transparent cookie policy."}
            </p>
          </div>
        </Card>
      </div>
    </section>
  );
};

export const SupportCenter: React.FC = () => {
  const isGreek = useIsGreek();
  return (
    <section
      className="relative bg-cover bg-center flex items-center justify-center px-4 py-[60px]"
      style={{
        backgroundImage: `url(${LayeredBG})`,
        backgroundPosition: "center",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className={containerStyle}>
        <div className="flex items-center text-[#33373F] text-[15px] font-medium mb-1">
          <Link to="/" className="hover:text-[#405C0B] transition-colors">
            {isGreek ? "Αρχική" : "Home"}
          </Link>
          <span className="px-3">
            <FaChevronRight size={11} className="pt-[1px] text-[#767676]" />
          </span>
          {isGreek ? "Υποστήριξη" : "Support"}
        </div>
        <h2 className="text-[#33373F] text-2xl sm:text-[30px] font-black uppercase mb-8">
          {isGreek ? (
            <>
              Κέντρο <span className="text-lime-700">Βοήθειας</span>
            </>
          ) : (
            <>
              Help <span className="text-lime-700">Center</span>
            </>
          )}
        </h2>
        <Card className="bg-white p-5 sm:p-8 rounded-2xl shadow-lg border border-gray-100 space-y-6">
          <div>
            <h3 className="text-xl font-bold mb-2">
              {isGreek ? "Πώς μπορώ να κλείσω ένα ραντεβού;" : "How to Book an Appointment?"}
            </h3>
            <p className="text-gray-600">
              {isGreek
                ? "Η κράτηση είναι απλή! Μεταβείτε στη σελίδα αναζήτησης, επιλέξτε τη θεραπεία που επιθυμείτε και διαλέξτε την ημέρα και ώρα που σας εξυπηρετεί."
                : "Booking is easy! Simply navigate to the search page, select your preferred treatment, and choose a time slot that works for you."}
            </p>
          </div>
          <div className="border-t pt-6">
            <h3 className="text-xl font-bold mb-2">
              {isGreek ? "Αλλαγή & Ακυρώσεις Ραντεβού" : "Rescheduling & Cancellations"}
            </h3>
            <p className="text-gray-600">
              {isGreek
                ? "Μπορείτε να ζητήσετε αλλαγή ή ακύρωση του ραντεβού σας μέσω του BeautyDoctors. Οι προθεσμίες ακύρωσης και τυχόν χρεώσεις εξαρτώνται από την πολιτική του επιλεγμένου ιατρού ή κλινικής και εμφανίζονται κατά τη διάρκεια της κράτησης."
                : "You can request to reschedule or cancel your appointment through BeautyDoctors. Cancellation deadlines and any applicable charges depend on the policy of the selected doctor or clinic and are displayed during booking."}
            </p>
          </div>
          <div className="border-t pt-6">
            <h3 className="text-xl font-bold mb-2">
              {isGreek ? "Επιλογές Πληρωμής" : "Payment Options"}
            </h3>
            <p className="text-gray-600">
              {isGreek
                ? "Υποστηρίζονται ηλεκτρονικές πληρωμές με κάρτα μέσω Viva (όλες οι κύριες χρεωστικές και πιστωτικές κάρτες), καθώς και πληρωμή απευθείας στην κλινική (μετρητά ή κάρτα), ανάλογα με τις διαθέσιμες επιλογές κάθε συνεργαζόμενης κλινικής."
                : "We accept online card payments via Viva (all major credit and debit cards) as well as payment directly at the clinic (cash or card), depending on the participating clinic's available options."}
            </p>
          </div>
        </Card>
      </div>
    </section>
  );
};

export const ChatSupport: React.FC = () => {
  const isGreek = useIsGreek();
  return (
    <section
      className="relative bg-cover bg-center flex items-center justify-center px-4 py-[60px]"
      style={{
        backgroundImage: `url(${LayeredBG})`,
        backgroundPosition: "center",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className={containerStyle}>
        <div className="flex items-center text-[#33373F] text-[15px] font-medium mb-1">
          <Link to="/" className="hover:text-[#405C0B] transition-colors">
            {isGreek ? "Αρχική" : "Home"}
          </Link>
          <span className="px-3">
            <FaChevronRight size={11} className="pt-[1px] text-[#767676]" />
          </span>
          {isGreek ? "Συνομιλία" : "Chat"}
        </div>
        <h2 className="text-[#33373F] text-2xl sm:text-[30px] font-black uppercase mb-8">
          {isGreek ? (
            <>
              Ζωντανή <span className="text-lime-700">Συνομιλία</span>
            </>
          ) : (
            <>
              Live <span className="text-lime-700">Chat</span>
            </>
          )}
        </h2>
        <Card className="bg-white p-6 sm:p-12 rounded-2xl shadow-2xl border border-gray-100 text-center max-w-lg mx-auto">
          <div className="size-20 bg-lime-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageCircle size={32} className="text-lime-600 shrink-0" />
          </div>
          <h3 className="text-2xl font-black uppercase text-gray-900 mb-4">
            {isGreek ? "Συνδεθείτε με έναν Σύμβουλο" : "Connect with an Expert"}
          </h3>
          <p className="text-gray-500 mb-8">
            {isGreek
              ? "Η ομάδα υποστήριξής μας είναι στη διάθεσή σας για να σας βοηθήσει με το ραντεβού σας ή οποιαδήποτε ερώτηση σχετικά με τις θεραπείες."
              : "Our support specialists are available to help you with your booking or any questions about our treatments."}
          </p>
          <Link
            to="/contact"
            className="block w-full bg-[#CBFF38] hover:bg-lime-400 text-black font-black uppercase tracking-widest py-4 rounded-xl shadow-lg transition-transform active:scale-95"
          >
            {isGreek ? "Επικοινωνήστε Τώρα" : "Start Chat Now"}
          </Link>
        </Card>
      </div>
    </section>
  );
};
