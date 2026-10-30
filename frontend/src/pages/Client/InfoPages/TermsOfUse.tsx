import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaChevronRight } from "react-icons/fa6";
import { FileText, Shield, Globe } from "lucide-react";
import LayeredBG from "@/assets/LayeredBg.svg";
import { getPreferredLanguage, switchLanguage, type AppLanguage } from "@/utils/language";

export const TermsOfUse: React.FC = () => {
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
              {isEl ? "Όροι Χρήσης" : "Terms of Use"}
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

        {/* Header */}
        <div className="bg-white p-6 sm:p-10 rounded-[32px] shadow-sm border border-gray-100 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-lime-50 border border-lime-200 text-lime-800 text-xs font-bold uppercase tracking-wider">
            <FileText size={14} className="text-lime-600" />
            {isEl ? "Επίσημοι Όροι Πλατφόρμας" : "Official Platform Terms"}
          </div>
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-[#1A1A1A]">
            {isEl ? (
              <>
                Όροι <span className="text-[#84cc16]">Χρήσης</span>
              </>
            ) : (
              <>
                Terms of <span className="text-[#84cc16]">Use</span>
              </>
            )}
          </h1>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
            {isEl
              ? "Έκδοση 1.0 · Τελικό εγκεκριμένο κείμενο (Υπερισχύει το ελληνικό κείμενο)"
              : "Version 1.0 · Official English translation (Greek text prevails)"}
          </p>
          <p className="text-sm text-gray-600 leading-relaxed pt-2">
            {isEl ? (
              <>
                Η εφαρμογή και ο ιστότοπος <strong>beautydoctors.gr</strong> (εφεξής η «Πλατφόρμα») παρέχονται από την εταιρεία <strong>Beautydoctors Ο.Ε.</strong>, με έδρα την οδό Ξανθίππου 23, Πικέρμι 19009, ΑΦΜ 803040724, αριθμό ΓΕΜΗ 188015103000, email info@beautydoctors.gr, τηλ. 211 218 4564 (εφεξής η «BeautyDoctors»).
              </>
            ) : (
              <>
                The application and the website <strong>beautydoctors.gr</strong> (hereinafter the “Platform”) are provided by the company <strong>Beautydoctors O.E.</strong>, with registered office at 23 Xanthippou Street, Pikermi 19009, Tax ID (AFM) 803040724, General Commercial Registry (GEMI) No. 188015103000, email info@beautydoctors.gr, tel. 211 218 4564 (hereinafter “BeautyDoctors”).
              </>
            )}
          </p>
        </div>

        {/* Content Card */}
        <div className="bg-white p-6 sm:p-10 rounded-[32px] shadow-sm border border-gray-100 divide-y divide-gray-100 space-y-8 text-gray-700 leading-relaxed text-sm">
          {isEl ? (
            /* =================== GREEK VERSION (GR) =================== */
            <>
              {/* Section 1 */}
              <div className="pt-6 first:pt-0 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900 flex items-center gap-2">
                  <Shield size={16} className="text-lime-600" /> 1. Πάροχος της Πλατφόρμας
                </h2>
                <p>
                  Η εφαρμογή και ο ιστότοπος beautydoctors.gr (εφεξής η «Πλατφόρμα») παρέχονται από την εταιρεία Beautydoctors Ο.Ε., με έδρα την οδό Ξανθίππου 23, Πικέρμι 19009, ΑΦΜ 803040724, αριθμό ΓΕΜΗ 188015103000, email info@beautydoctors.gr, τηλ. 211 218 4564 (εφεξής η «BeautyDoctors»).
                </p>
                <p>
                  Η δημιουργία λογαριασμού ή η χρήση της Πλατφόρμας συνεπάγεται την αποδοχή των παρόντων Όρων Χρήσης. Η επεξεργασία των προσωπικών δεδομένων του χρήστη διέπεται από την Πολιτική Απορρήτου.
                </p>
              </div>

              {/* Section 2 */}
              <div className="pt-6 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
                  2. Αντικείμενο των υπηρεσιών
                </h2>
                <p>Μέσω της Πλατφόρμας ο χρήστης μπορεί:</p>
                <ul className="list-disc list-inside space-y-1 pl-1">
                  <li>να ενημερώνεται για θεραπείες και υπηρεσίες και να εντοπίζει τους ιατρούς και τις κλινικές που τις παρέχουν·</li>
                  <li>να κλείνει, να τροποποιεί και να ακυρώνει ραντεβού·</li>
                  <li>να εξοφλεί ηλεκτρονικά τον ιατρό ή την κλινική·</li>
                  <li>να αξιολογεί την εμπειρία του μετά την ολοκλήρωση ραντεβού.</li>
                </ul>
                <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-950 font-medium">
                  Η BeautyDoctors δεν είναι πάροχος υπηρεσιών υγείας. Δεν διενεργεί διάγνωση, δεν προτείνει θεραπεία και δεν εγγυάται αποτέλεσμα. Η χρήση της Πλατφόρμας παρέχεται στους χρήστες χωρίς χρέωση.
                </div>
              </div>

              {/* Section 3 */}
              <div className="pt-6 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
                  3. Δικαίωμα χρήσης
                </h2>
                <p>
                  Η Πλατφόρμα απευθύνεται σε ενήλικα πρόσωπα (18 ετών και άνω) που κλείνουν ραντεβού για τον εαυτό τους. Δεν επιτρέπεται η κράτηση για λογαριασμό τρίτου προσώπου. Οι κρατήσεις αφορούν ιατρούς και κλινικές που δραστηριοποιούνται στην Ελλάδα και στην Κύπρο.
                </p>
              </div>

              {/* Section 4 */}
              <div className="pt-6 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
                  4. Ρόλος και ευθύνη του ιατρού
                </h2>
                <p>
                  Ο ιατρός ή η κλινική που επιλέγει ο χρήστης (εφεξής ο «Πάροχος») φέρει την αποκλειστική ευθύνη για την ιατρική αξιολόγηση, την επιλογή της θεραπείας, την ενημέρωση του ασθενούς για τους κινδύνους και τις εναλλακτικές επιλογές, τη λήψη της συναίνεσής του και την εκτέλεση της θεραπείας.
                </p>
                <p>
                  Η επιλογή θεραπείας στην Πλατφόρμα αποτελεί δήλωση ενδιαφέροντος και όχι ιατρική σύσταση. Μετά την αξιολόγηση, ο ιατρός δύναται να την επιβεβαιώσει, να προτείνει διαφορετική θεραπεία ή να κρίνει ότι δεν ενδείκνυται. Η κρίση αυτή δεν συνιστά άρνηση παροχής υπηρεσίας και οπωσδήποτε δεν σημαίνει ότι η υπηρεσία της πλατφόρμας δεν παρασχέθηκε.
                </p>
              </div>

              {/* Section 5 */}
              <div className="pt-6 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
                  5. Λογαριασμός χρήστη
                </h2>
                <p>
                  Ο χρήστης οφείλει να δηλώνει αληθή και επίκαιρα στοιχεία, να τηρεί απόρρητους τους κωδικούς πρόσβασής του και να ενημερώνει αμελλητί τη BeautyDoctors για κάθε υποψία μη εξουσιοδοτημένης χρήσης του λογαριασμού του.
                </p>
              </div>

              {/* Section 6 */}
              <div className="pt-6 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
                  6. Κρατήσεις
                </h2>
                <p>
                  Πριν από την υποβολή της κράτησης εμφανίζονται ο Πάροχος, ο χώρος, η ημερομηνία και η ώρα, η υπηρεσία, η τιμή ή η τιμή εκκίνησης και η πολιτική ακύρωσης του Παρόχου.
                </p>
                <p>
                  Το ραντεβού θεωρείται οριστικό μόνο μετά τη λήψη επιβεβαίωσης. Η επιβεβαίωση αφορά τη δέσμευση της ώρας και δεν σημαίνει ιατρική έγκριση της θεραπείας.
                </p>
              </div>

              {/* Section 7 */}
              <div className="pt-6 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
                  7. Τροποποίηση, ακύρωση και μη προσέλευση
                </h2>
                <p>
                  Ο χρήστης μπορεί να τροποποιήσει ή να ακυρώσει ραντεβού μέσω της Πλατφόρμας. Χρέωση για εκπρόθεσμη ακύρωση ή μη προσέλευση εφαρμόζεται μόνο εφόσον έχει γνωστοποιηθεί στον χρήστη πριν από την κράτηση, μέσω της πλατφόρμας και με οδηγίες του Ιατρού.
                </p>
                <p>
                  Σε περίπτωση ακύρωσης από τον Πάροχο, ο χρήστης ενημερώνεται και μπορεί να επιλέξει νέο ραντεβού. Κάθε ποσό που έχει καταβληθεί επιστρέφεται, εφόσον ο χρήστης δεν επιλέξει να κλείσει νέο ραντεβού και αιτηθεί την επιστροφή.
                </p>
              </div>

              {/* Section 8 */}
              <div className="pt-6 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
                  8. Τιμές και ηλεκτρονική πληρωμή
                </h2>
                <p>
                  Οι τιμές ορίζονται από τον Πάροχο. Η τιμή εκκίνησης ενδέχεται να μεταβληθεί μετά την ιατρική αξιολόγηση· ο χρήστης αποφασίζει ελεύθερα αν θα αποδεχθεί τη νέα πρόταση. Οι εμφανιζόμενες τιμές στην πλατφόρμα είναι ενδεικτικές, συμπεριλαμβανομένων των φόρων που εφαρμόζονται, και η τελική τιμολόγηση αφορά στην σχέση παρόχου-ασθενή/πελάτη.
                </p>
                <p>
                  Η ηλεκτρονική πληρωμή πραγματοποιείται μέσω της Viva, αδειοδοτημένου παρόχου υπηρεσιών πληρωμών, και το ποσό καταβάλλεται απευθείας στον Πάροχο. Η BeautyDoctors δεν εισπράττει, δεν διακρατεί και δεν λαμβάνει ποσοστό επί της πληρωμής, ούτε έχει πρόσβαση στα στοιχεία της κάρτας του χρήστη.
                </p>
                <p>
                  Το νόμιμο παραστατικό εκδίδεται από τον Πάροχο, στον οποίο απευθύνονται και τα αιτήματα επιστροφής χρημάτων. Το ιστορικό πληρωμών στον λογαριασμό του χρήστη έχει αποκλειστικά ενημερωτικό χαρακτήρα.
                </p>
              </div>

              {/* Section 9 */}
              <div className="pt-6 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
                  9. Ειδοποιήσεις και υποστήριξη
                </h2>
                <p>
                  Ο χρήστης λαμβάνει ειδοποιήσεις για την επιβεβαίωση, την υπενθύμιση, την τροποποίηση ή την ακύρωση ραντεβού, καθώς και για θέματα του λογαριασμού του. Οι ειδοποιήσεις δεν επιδέχονται απάντηση.
                </p>
                <p>
                  Για θέματα λογαριασμού, ραντεβού ή πληρωμών ο χρήστης απευθύνεται μέσω της φόρμας υποστήριξης. Η υποστήριξη δεν παρέχει ιατρικές συμβουλές.
                </p>
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-900 font-bold text-xs">
                  Σε επείγουσα περίπτωση καλέστε το 112. Η Πλατφόρμα δεν αποτελεί υπηρεσία επειγόντων περιστατικών.
                </div>
              </div>

              {/* Section 10 */}
              <div className="pt-6 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
                  10. Αξιολογήσεις
                </h2>
                <p>
                  Αξιολόγηση Παρόχου επιτρέπεται μόνο μετά από ραντεβού που κλείστηκε και ολοκληρώθηκε μέσω της Πλατφόρμας. Η αξιολόγηση πρέπει να αποτυπώνει την πραγματική εμπειρία του χρήστη και να μην περιέχει προσβλητικό, αναληθές ή παράνομο περιεχόμενο. Δεν επιτρέπεται η αναφορά σε δεδομένα υγείας του χρήστη ή τρίτων.
                </p>
                <p>
                  Η BeautyDoctors δεν παρέχει αντάλλαγμα για αξιολογήσεις. Οι Πάροχοι δεν έχουν δυνατότητα διαγραφής αξιολογήσεων. Η BeautyDoctors αφαιρεί μόνο αξιολογήσεις που παραβιάζουν τους παρόντες κανόνες.
                </p>
              </div>

              {/* Section 11 */}
              <div className="pt-6 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
                  11. Σειρά εμφάνισης ιατρών
                </h2>
                <p>
                  Οι ιατροί εμφανίζονται βάσει των φίλτρων που επιλέγει ο χρήστης (π.χ. θεραπεία, περιοχή) και, κατά προεπιλογή, με αλφαβητική σειρά. Δεν υφίσταται πληρωμένη προβολή Παρόχων. Η σειρά εμφάνισης δεν αποτελεί ιατρική σύσταση ούτε αξιολόγηση της ποιότητας των ιατρών.
                </p>
              </div>

              {/* Section 12 */}
              <div className="pt-6 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
                  12. Περιεχόμενο και πνευματική ιδιοκτησία
                </h2>
                <p>
                  Οι περιγραφές θεραπειών, τα άρθρα και οι φωτογραφίες έχουν γενικό ενημερωτικό χαρακτήρα και δεν υποκαθιστούν την αξιολόγηση από ιατρό (βλ. Ιατρική Επισήμανση). Η επωνυμία, το λογότυπο, το λογισμικό και το περιεχόμενο της Πλατφόρμας αποτελούν ιδιοκτησία της Beautydoctors Ο.Ε.
                </p>
              </div>

              {/* Section 13 */}
              <div className="pt-6 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
                  13. Απαγορευμένη χρήση
                </h2>
                <p>
                  Απαγορεύεται η χρήση λογαριασμού τρίτου, η υποβολή εικονικών κρατήσεων, η ανάρτηση παράνομου περιεχομένου και κάθε απόπειρα παραβίασης της ασφάλειας της Πλατφόρμας. Στις περιπτώσεις αυτές η BeautyDoctors δύναται να αναστείλει τον λογαριασμό, ενημερώνοντας τον χρήστη για τον λόγο.
                </p>
              </div>

              {/* Section 14 */}
              <div className="pt-6 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
                  14. Διαγραφή λογαριασμού
                </h2>
                <p>
                  Ο χρήστης μπορεί να διαγράψει τον λογαριασμό του από τις Ρυθμίσεις ή με αίτημα προς την υποστήριξη. Εφόσον υπάρχουν εκκρεμή ραντεβού, ο χρήστης ενημερώνεται πριν από τη διαγραφή. Ο Πάροχος διατηρεί το ιατρικό του αρχείο για το χρονικό διάστημα που ορίζει ο νόμος. Σε κάθε περίπτωση ισχύουν οι διατάξεις του ΓΚΠΔ.
                </p>
              </div>

              {/* Section 15 */}
              <div className="pt-6 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
                  15. Διαθεσιμότητα και ευθύνη
                </h2>
                <p>
                  Η BeautyDoctors καταβάλλει εύλογες προσπάθειες για την απρόσκοπτη λειτουργία της Πλατφόρμας, χωρίς να εγγυάται διαρκή και αδιάλειπτη λειτουργία. Η BeautyDoctors ευθύνεται για τις δικές της υπηρεσίες, ενώ ο Πάροχος για την ιατρική υπηρεσία. Οι παρόντες Όροι δεν περιορίζουν τα δικαιώματα που αναγνωρίζει ο νόμος στους καταναλωτές.
                </p>
              </div>

              {/* Section 16 */}
              <div className="pt-6 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
                  16. Παράπονα
                </h2>
                <p>
                  Τα παράπονα υποβάλλονται στο <a href="mailto:info@beautydoctors.gr" className="text-lime-700 underline font-semibold">info@beautydoctors.gr</a> ή μέσω της φόρμας υποστήριξης. Ο χρήστης διατηρεί το δικαίωμα να απευθυνθεί στον Συνήγορο του Καταναλωτή (Ελλάδα), στην Υπηρεσία Προστασίας Καταναλωτή (Κύπρος) ή στα αρμόδια δικαστήρια.
                </p>
              </div>

              {/* Section 17 */}
              <div className="pt-6 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
                  17. Τροποποίηση των Όρων
                </h2>
                <p>
                  Ο χρήστης θα λαμβάνει γνώση για κάθε ουσιώδη τροποποίησης των Όρων, από την ιστοσελίδα της εταιρείας και υπό τον όρο ανάρτησης τους σε αυτήν και από την ημερομηνία ανάρτησης. Οι τροποποιήσεις δεν επηρεάζουν ραντεβού που έχουν ήδη επιβεβαιωθεί.
                </p>
              </div>

              {/* Section 18 */}
              <div className="pt-6 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
                  18. Εφαρμοστέο δίκαιο και γλώσσα
                </h2>
                <p>
                  Οι παρόντες Όροι διέπονται από το ελληνικό και το ενωσιακό δίκαιο, με την επιφύλαξη των αναγκαστικών διατάξεων προστασίας που ισχύουν στη χώρα κατοικίας του καταναλωτή. Διατίθενται στην ελληνική και στην αγγλική γλώσσα· σε περίπτωση απόκλισης επικρατεί το ελληνικό κείμενο.
                </p>
              </div>
            </>
          ) : (
            /* =================== ENGLISH VERSION (EN) =================== */
            <>
              {/* Section 1 */}
              <div className="pt-6 first:pt-0 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900 flex items-center gap-2">
                  <Shield size={16} className="text-lime-600" /> 1. Platform Provider
                </h2>
                <p>
                  The application and the website beautydoctors.gr (hereinafter the “Platform”) are provided by the company Beautydoctors O.E., with registered office at 23 Xanthippou Street, Pikermi 19009, Tax ID (AFM) 803040724, General Commercial Registry (GEMI) No. 188015103000, email info@beautydoctors.gr, tel. 211 218 4564 (hereinafter “BeautyDoctors”).
                </p>
                <p>
                  Creating an account or using the Platform constitutes acceptance of these Terms of Use. The processing of the user’s personal data is governed by the Privacy Policy.
                </p>
              </div>

              {/* Section 2 */}
              <div className="pt-6 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
                  2. Scope of the services
                </h2>
                <p>Through the Platform the user may:</p>
                <ul className="list-disc list-inside space-y-1 pl-1">
                  <li>obtain information about treatments and services and find the doctors and clinics that provide them;</li>
                  <li>book, modify and cancel appointments;</li>
                  <li>pay the doctor or clinic electronically;</li>
                  <li>review their experience after an appointment has been completed.</li>
                </ul>
                <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-950 font-medium">
                  BeautyDoctors is not a healthcare provider. It does not make diagnoses, does not recommend treatment and does not guarantee results. Use of the Platform is provided to users free of charge.
                </div>
              </div>

              {/* Section 3 */}
              <div className="pt-6 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
                  3. Eligibility
                </h2>
                <p>
                  The Platform is intended for adults (18 years of age and over) who book appointments for themselves. Booking on behalf of another person is not permitted. Bookings concern doctors and clinics operating in Greece and Cyprus.
                </p>
              </div>

              {/* Section 4 */}
              <div className="pt-6 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
                  4. Role and responsibility of the doctor
                </h2>
                <p>
                  The doctor or clinic selected by the user (hereinafter the “Provider”) bears sole responsibility for the medical assessment, the choice of treatment, informing the patient of the risks and alternative options, obtaining the patient’s consent and performing the treatment.
                </p>
                <p>
                  Selecting a treatment on the Platform constitutes an expression of interest and not a medical recommendation. Following the assessment, the doctor may confirm it, propose a different treatment or decide that it is not indicated. Such a decision does not constitute a refusal to provide a service and in no way means that the Platform’s service was not provided.
                </p>
              </div>

              {/* Section 5 */}
              <div className="pt-6 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
                  5. User account
                </h2>
                <p>
                  The user must provide true and up-to-date information, keep their access credentials confidential and notify BeautyDoctors without delay of any suspected unauthorised use of their account.
                </p>
              </div>

              {/* Section 6 */}
              <div className="pt-6 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
                  6. Bookings
                </h2>
                <p>
                  Before a booking is submitted, the Provider, the location, the date and time, the service, the price or starting price and the Provider’s cancellation policy are displayed.
                </p>
                <p>
                  An appointment is considered final only after confirmation has been received. Confirmation concerns the reservation of the time slot and does not mean medical approval of the treatment.
                </p>
              </div>

              {/* Section 7 */}
              <div className="pt-6 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
                  7. Modification, cancellation and no-show
                </h2>
                <p>
                  The user may modify or cancel an appointment through the Platform. A charge for late cancellation or no-show applies only if it has been communicated to the user before the booking, through the Platform and in accordance with the Doctor’s instructions.
                </p>
                <p>
                  If the Provider cancels, the user is notified and may choose a new appointment. Any amount paid is refunded, provided that the user does not choose to book a new appointment and requests the refund.
                </p>
              </div>

              {/* Section 8 */}
              <div className="pt-6 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
                  8. Prices and electronic payment
                </h2>
                <p>
                  Prices are set by the Provider. The starting price may change after the medical assessment; the user freely decides whether to accept the new proposal. The prices displayed on the Platform are indicative, inclusive of applicable taxes, and final invoicing concerns the relationship between the provider and the patient/client.
                </p>
                <p>
                  Electronic payment is made through Viva, a licensed payment service provider, and the amount is paid directly to the Provider. BeautyDoctors does not collect, hold or take any percentage of the payment, nor does it have access to the user’s card details.
                </p>
                <p>
                  The legal receipt or invoice is issued by the Provider, to whom refund requests are also addressed. The payment history in the user’s account is for information purposes only.
                </p>
              </div>

              {/* Section 9 */}
              <div className="pt-6 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
                  9. Notifications and support
                </h2>
                <p>
                  The user receives notifications about the confirmation, reminder, modification or cancellation of appointments, as well as about matters relating to their account. Notifications cannot be replied to.
                </p>
                <p>
                  For matters relating to their account, appointments or payments, the user may contact us through the support form. Support does not provide medical advice.
                </p>
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-900 font-bold text-xs">
                  In an emergency, call 112. The Platform is not an emergency service.
                </div>
              </div>

              {/* Section 10 */}
              <div className="pt-6 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
                  10. Reviews
                </h2>
                <p>
                  A Provider may be reviewed only after an appointment that was booked and completed through the Platform. A review must reflect the user’s actual experience and must not contain offensive, untrue or unlawful content. References to health data of the user or of third parties are not permitted.
                </p>
                <p>
                  BeautyDoctors does not offer anything in return for reviews. Providers cannot delete reviews. BeautyDoctors removes only reviews that breach these rules.
                </p>
              </div>

              {/* Section 11 */}
              <div className="pt-6 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
                  11. Order in which doctors are displayed
                </h2>
                <p>
                  Doctors are displayed according to the filters selected by the user (e.g. treatment, area) and, by default, in alphabetical order. There is no paid placement of Providers. The display order does not constitute a medical recommendation or an assessment of the quality of the doctors.
                </p>
              </div>

              {/* Section 12 */}
              <div className="pt-6 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
                  12. Content and intellectual property
                </h2>
                <p>
                  Treatment descriptions, articles and photographs are for general information purposes and do not replace assessment by a doctor (see Medical Disclaimer). The name, logo, software and content of the Platform are the property of Beautydoctors O.E.
                </p>
              </div>

              {/* Section 13 */}
              <div className="pt-6 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
                  13. Prohibited use
                </h2>
                <p>
                  The use of another person’s account, the submission of fictitious bookings, the posting of unlawful content and any attempt to breach the security of the Platform are prohibited. In such cases BeautyDoctors may suspend the account, informing the user of the reason.
                </p>
              </div>

              {/* Section 14 */}
              <div className="pt-6 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
                  14. Account deletion
                </h2>
                <p>
                  The user may delete their account from Settings or by request to support. If there are pending appointments, the user is informed before deletion. The Provider retains its medical records for the period required by law. In all cases the provisions of the GDPR apply.
                </p>
              </div>

              {/* Section 15 */}
              <div className="pt-6 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
                  15. Availability and liability
                </h2>
                <p>
                  BeautyDoctors makes reasonable efforts to ensure the smooth operation of the Platform, without guaranteeing continuous and uninterrupted operation. BeautyDoctors is responsible for its own services, while the Provider is responsible for the medical service. These Terms do not limit the rights granted to consumers by law.
                </p>
              </div>

              {/* Section 16 */}
              <div className="pt-6 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
                  16. Complaints
                </h2>
                <p>
                  Complaints may be submitted to <a href="mailto:info@beautydoctors.gr" className="text-lime-700 underline font-semibold">info@beautydoctors.gr</a> or through the support form. The user retains the right to contact the Consumer Ombudsman (Greece), the Consumer Protection Service (Cyprus) or the competent courts.
                </p>
              </div>

              {/* Section 17 */}
              <div className="pt-6 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
                  17. Amendment of the Terms
                </h2>
                <p>
                  The user will be made aware of any material amendment to the Terms through the company’s website, subject to their being posted there, and from the date of posting. Amendments do not affect appointments that have already been confirmed.
                </p>
              </div>

              {/* Section 18 */}
              <div className="pt-6 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
                  18. Governing law and language
                </h2>
                <p>
                  These Terms are governed by Greek and European Union law, without prejudice to the mandatory protective provisions applicable in the consumer’s country of residence. They are available in Greek and in English; in the event of any discrepancy, the Greek text prevails.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
