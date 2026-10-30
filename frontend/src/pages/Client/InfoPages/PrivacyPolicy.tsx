import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaChevronRight } from "react-icons/fa6";
import { ShieldCheck, Building2, Globe } from "lucide-react";
import LayeredBG from "@/assets/LayeredBg.svg";
import { getPreferredLanguage, switchLanguage, type AppLanguage } from "@/utils/language";

export const PrivacyPolicy: React.FC = () => {
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
              {isEl ? "Πολιτική Απορρήτου" : "Privacy Policy"}
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
            <ShieldCheck size={14} className="text-lime-600" />
            {isEl ? "Γενικός Κανονισμός Προστασίας Δεδομένων (ΓΚΠΔ)" : "GDPR Compliance & Data Protection"}
          </div>
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-[#1A1A1A]">
            {isEl ? (
              <>
                Πολιτική Προστασίας <span className="text-[#84cc16]">Προσωπικών Δεδομένων</span>
              </>
            ) : (
              <>
                Privacy <span className="text-[#84cc16]">Policy</span>
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
                Υπεύθυνος επεξεργασίας είναι η εταιρεία <strong>Beautydoctors Ο.Ε.</strong>, με έδρα την οδό Ξανθίππου 23, Πικέρμι 19009, ΑΦΜ 803040724, αριθμό ΓΕΜΗ 188015103000 (εφεξής η «BeautyDoctors»).
              </>
            ) : (
              <>
                The data controller is the company <strong>Beautydoctors O.E.</strong>, with registered office at 23 Xanthippou Street, Pikermi 19009, Tax ID (AFM) 803040724, General Commercial Registry (GEMI) No. 188015103000 (hereinafter “BeautyDoctors”).
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
                  <Building2 size={16} className="text-lime-600" /> 1. Υπεύθυνος επεξεργασίας
                </h2>
                <p>
                  Υπεύθυνος επεξεργασίας είναι η εταιρεία Beautydoctors Ο.Ε., με έδρα την οδό Ξανθίππου 23, Πικέρμι 19009, ΑΦΜ 803040724, αριθμό ΓΕΜΗ 188015103000 (εφεξής η «BeautyDoctors»). Για κάθε θέμα που αφορά τα προσωπικά σας δεδομένα μπορείτε να επικοινωνείτε στο <a href="mailto:info@beautydoctors.gr" className="text-lime-700 underline font-semibold">info@beautydoctors.gr</a> ή στο 211 218 4564.
                </p>
                <p>
                  Ο ιατρός ή η κλινική που επιλέγετε (εφεξής ο «Πάροχος») είναι αυτοτελής υπεύθυνος επεξεργασίας για την ιατρική φροντίδα, το ιατρικό αρχείο και τα παραστατικά που εκδίδει.
                </p>
              </div>

              {/* Section 2 */}
              <div className="pt-6 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
                  2. Κατηγορίες δεδομένων
                </h2>
                <ul className="list-disc list-inside space-y-1.5 pl-1">
                  <li><strong>Στοιχεία λογαριασμού:</strong> ονοματεπώνυμο, email, τηλέφωνο, κωδικός πρόσβασης (σε κρυπτογραφημένη μορφή), γλώσσα.</li>
                  <li><strong>Στοιχεία ραντεβού:</strong> Πάροχος, θεραπεία ενδιαφέροντος, ημερομηνία, ώρα, κατάσταση και ιστορικό ραντεβού.</li>
                  <li><strong>Στοιχεία πληρωμών:</strong> ποσό, ημερομηνία, κατάσταση πληρωμής και επιστροφής. Τα στοιχεία της κάρτας επεξεργάζεται αποκλειστικά η Viva και δεν είναι προσβάσιμα στη BeautyDoctors.</li>
                  <li><strong>Αιτήματα ενδιαφέροντος από διαφημίσεις (φόρμες Facebook/Instagram):</strong> ονοματεπώνυμο, τηλέφωνο, email, η θεραπεία ή η διαφήμιση που σας ενδιέφερε, καθώς και το ιστορικό της επικοινωνίας μαζί σας (κλήσεις, email, σημειώσεις).</li>
                  <li><strong>Αξιολογήσεις και αιτήματα υποστήριξης:</strong> το περιεχόμενο που υποβάλλετε.</li>
                  <li><strong>Τεχνικά δεδομένα:</strong> διεύθυνση IP, συσκευή, χρόνος σύνδεσης και τα απαραίτητα cookies.</li>
                </ul>
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-xs font-semibold text-gray-700">
                  Δεν ζητούμε ΑΜΚΑ, αριθμό ταυτότητας, ιατρικό ιστορικό, εξετάσεις ή φωτογραφίες.
                </div>
                <p>
                  Η παροχή των στοιχείων λογαριασμού και ραντεβού είναι απαραίτητη για την κράτηση ραντεβού μέσω της εφαρμογής· χωρίς αυτά η υπηρεσία δεν μπορεί να παρασχεθεί. Δεν λαμβάνονται αποφάσεις που σας αφορούν αποκλειστικά με αυτοματοποιημένα μέσα και δεν διενεργείται κατάρτιση προφίλ (profiling).
                </p>
              </div>

              {/* Section 3 */}
              <div className="pt-6 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
                  3. Δεδομένα υγείας
                </h2>
                <p>
                  Η κράτηση ραντεβού για συγκεκριμένη θεραπεία ενδέχεται να αποκαλύπτει πληροφορίες σχετικές με την υγεία σας. Για τον λόγο αυτό, πριν από την πρώτη κράτηση ζητούμε τη ρητή συγκατάθεσή σας, μέσω αυτοτελούς επιλογής.
                </p>
                <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-950">
                  Τα δεδομένα αυτά χρησιμοποιούνται αποκλειστικά για την οργάνωση του ραντεβού σας. <strong>Δεν χρησιμοποιούνται για διαφημιστικούς σκοπούς ή στόχευση, δεν πωλούνται και δεν γνωστοποιούνται σε άλλους ιατρούς.</strong> Εφόσον δεν επιθυμείτε να παράσχετε συγκατάθεση, μπορείτε να επικοινωνήσετε απευθείας με τον ιατρό.
                </div>
              </div>

              {/* Section 4 */}
              <div className="pt-6 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
                  4. Σκοποί και νομικές βάσεις επεξεργασίας
                </h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs text-left border border-gray-200 rounded-xl overflow-hidden">
                    <thead className="bg-gray-100 font-bold text-gray-900 uppercase">
                      <tr>
                        <th className="p-3 border-b border-gray-200">Σκοπός</th>
                        <th className="p-3 border-b border-gray-200">Νομική βάση (ΓΚΠΔ)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700">
                      <tr>
                        <td className="p-3 font-semibold">Διαχείριση λογαριασμού και λειτουργία της εφαρμογής</td>
                        <td className="p-3">Εκτέλεση σύμβασης (άρθρο 6 §1 β)</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold">Κράτηση ραντεβού και διαβίβαση στοιχείων στον Πάροχο</td>
                        <td className="p-3">Εκτέλεση σύμβασης (άρθρο 6 §1 β) και ρητή συγκατάθεση για δεδομένα υγείας (άρθρο 9 §2 α)</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold">Ειδοποιήσεις ραντεβού μέσω email και SMS</td>
                        <td className="p-3">Εκτέλεση σύμβασης (άρθρο 6 §1 β)</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold">Ηλεκτρονική πληρωμή και ιστορικό πληρωμών</td>
                        <td className="p-3">Εκτέλεση σύμβασης (άρθρο 6 §1 β)</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold">Επικοινωνία μετά από αίτημά σας σε φόρμα διαφήμισης</td>
                        <td className="p-3">Λήψη μέτρων πριν από τη σύναψη σύμβασης, κατόπιν αιτήματός σας (άρθρο 6 §1 β)</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold">Αποστολή newsletter</td>
                        <td className="p-3">Συγκατάθεση (άρθρο 6 §1 α και ν. 3471/2006)</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold">Δημοσίευση αξιολόγησης</td>
                        <td className="p-3">Συγκατάθεση (άρθρο 6 §1 α)</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold">Υποστήριξη και διαχείριση παραπόνων</td>
                        <td className="p-3">Εκτέλεση σύμβασης (άρθρο 6 §1 β)</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold">Ασφάλεια και πρόληψη κατάχρησης</td>
                        <td className="p-3">Έννομο συμφέρον (άρθρο 6 §1 στ)</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold">Συμμόρφωση με λογιστικές και νομικές υποχρεώσεις</td>
                        <td className="p-3">Νομική υποχρέωση (άρθρο 6 §1 γ)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 5 */}
              <div className="pt-6 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
                  5. Αποδέκτες των δεδομένων
                </h2>
                <ul className="list-disc list-inside space-y-1.5 pl-1">
                  <li><strong>Ο Πάροχος που επιλέγετε:</strong> μόνο τα δεδομένα που είναι αναγκαία για το ραντεβού σας. Τα δεδομένα σας δεν είναι προσβάσιμα σε άλλους ιατρούς.</li>
                  <li><strong>Εξουσιοδοτημένο προσωπικό της BeautyDoctors:</strong> για την εξυπηρέτηση, την οργάνωση ραντεβού και την υποστήριξη, υπό υποχρέωση εχεμύθειας.</li>
                  <li><strong>Εκτελούντες την επεξεργασία:</strong> Amazon Web Services (φιλοξενία, περιοχή ΕΕ eu-central-1), Viva (πληρωμές), πάροχος Email (AWS SES), SMS Gateway, HubSpot (διαχείριση αιτημάτων ενδιαφέροντος) και OpenStreetMap (εμφάνιση χαρτών).</li>
                  <li><strong>Meta (Facebook/Instagram):</strong> όταν συμπληρώνετε φόρμα διαφήμισης, η Meta μας διαβιβάζει τα στοιχεία της φόρμας. Η Meta επεξεργάζεται τα δικά της δεδομένα ως αυτοτελής υπεύθυνος, σύμφωνα με τη δική της πολιτική.</li>
                  <li><strong>Δημόσιες αρχές:</strong> μόνο όταν αυτό επιβάλλεται από τον νόμο.</li>
                  <li><strong>DPO:</strong> Η άσκηση των δικαιωμάτων προϋποθέτει την υποβολή, χωρίς κόστος, έγγραφης αίτησης στην Εταιρία, στην ηλεκτρονική διεύθυνση <a href="mailto:personaldata@beautydoctors.gr" className="text-lime-700 underline font-semibold">personaldata@beautydoctors.gr</a>.</li>
                </ul>
                <p className="font-semibold text-gray-900 text-xs">
                  Η BeautyDoctors δεν πωλεί προσωπικά δεδομένα και δεν χρησιμοποιεί εργαλεία διαφημιστικής παρακολούθησης στην εφαρμογή.
                </p>
              </div>

              {/* Section 6 */}
              <div className="pt-6 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
                  6. Διαβιβάσεις εκτός Ευρωπαϊκού Οικονομικού Χώρου
                </h2>
                <p>
                  Ορισμένοι αποδέκτες (όπως η HubSpot και η Meta) ενδέχεται να επεξεργάζονται δεδομένα στις Ηνωμένες Πολιτείες. Στις περιπτώσεις αυτές η διαβίβαση διενεργείται με τις κατάλληλες εγγυήσεις που προβλέπει ο ΓΚΠΔ, όπως το Πλαίσιο Προστασίας Δεδομένων ΕΕ-ΗΠΑ ή οι Τυποποιημένες Συμβατικές Ρήτρες.
                </p>
              </div>

              {/* Section 7 */}
              <div className="pt-6 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
                  7. Χρόνος διατήρησης
                </h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs text-left border border-gray-200 rounded-xl overflow-hidden">
                    <thead className="bg-gray-100 font-bold text-gray-900 uppercase">
                      <tr>
                        <th className="p-3 border-b border-gray-200">Κατηγορία δεδομένων</th>
                        <th className="p-3 border-b border-gray-200">Χρόνος διατήρησης</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700">
                      <tr>
                        <td className="p-3 font-semibold">Λογαριασμός</td>
                        <td className="p-3">Καθ’ όλη τη διάρκεια της ενεργού χρήσης. Μετά από τρία (3) έτη αδράνειας διαγράφεται, κατόπιν προηγούμενης ειδοποίησης</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold">Ιστορικό ραντεβού και πληρωμών</td>
                        <td className="p-3">Δέκα (10) έτη από το τελευταίο ραντεβού</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold">Αιτήματα ενδιαφέροντος που δεν οδήγησαν σε ραντεβού</td>
                        <td className="p-3">Είκοσι τέσσερις (24) μήνες</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold">Newsletter</td>
                        <td className="p-3">Έως την ανάκληση της συγκατάθεσης</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold">Αιτήματα υποστήριξης</td>
                        <td className="p-3">Δύο (2) έτη</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold">Τεχνικά αρχεία ασφαλείας</td>
                        <td className="p-3">Δώδεκα (12) μήνες</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-600">
                  Μετά τη λήξη του χρόνου διατήρησης τα δεδομένα διαγράφονται αυτομάτως ή ανωνυμοποιούνται, ώστε να μην συνδέονται πλέον με το πρόσωπό σας. Από τα αντίγραφα ασφαλείας διαγράφονται εντός 90 ημερών. Αιτήματα πρόωρης διαγραφής ικανοποιούνται εντός ενός μηνός, με εξαίρεση τα δεδομένα που η BeautyDoctors υποχρεούται εκ του νόμου να διατηρεί.
                </p>
              </div>

              {/* Section 8 */}
              <div className="pt-6 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
                  8. Ενημερωτικά Δελτία (Newsletter)
                </h2>
                <p>
                  Το newsletter αποστέλλεται μόνο εφόσον το επιλέξετε μέσω της αντίστοιχης επιλογής, η οποία δεν είναι προεπιλεγμένη. Η εγγραφή στο newsletter δεν αποτελεί προϋπόθεση για τη χρήση της εφαρμογής. Μπορείτε να διαγραφείτε οποτεδήποτε μέσω του συνδέσμου που περιέχεται σε κάθε email ή από τις Ρυθμίσεις.
                </p>
                <p>
                  Το περιεχόμενο του newsletter δεν διαμορφώνεται βάσει των θεραπειών που έχετε πραγματοποιήσει ή αναζητήσει.
                </p>
              </div>

              {/* Section 9 */}
              <div className="pt-6 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
                  9. Ασφάλεια δεδομένων
                </h2>
                <p>
                  Η BeautyDoctors εφαρμόζει κατάλληλα τεχνικά και οργανωτικά μέτρα, όπως κρυπτογράφηση των συνδέσεων, πρόσβαση ανά ρόλο και καταγραφή των προσβάσεων. Σε περίπτωση παραβίασης που σας αφορά, θα ενημερωθείτε σύμφωνα με τον νόμο.
                </p>
              </div>

              {/* Section 10 */}
              <div className="pt-6 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
                  10. Δικαιώματα των υποκειμένων
                </h2>
                <p>
                  Έχετε δικαίωμα πρόσβασης, διόρθωσης, διαγραφής, περιορισμού της επεξεργασίας, φορητότητας και εναντίωσης. Μπορείτε να ανακαλέσετε οποιαδήποτε συγκατάθεση οποτεδήποτε, χωρίς να θίγεται η νομιμότητα της επεξεργασίας που προηγήθηκε.
                </p>
                <p>
                  Για την άσκηση των δικαιωμάτων σας μπορείτε να απευθυνθείτε στο <a href="mailto:info@beautydoctors.gr" className="text-lime-700 underline font-semibold">info@beautydoctors.gr</a>. Η BeautyDoctors απαντά εντός ενός μηνός. Έχετε επίσης δικαίωμα υποβολής καταγγελίας στην Αρχή Προστασίας Δεδομένων Προσωπικού Χαρακτήρα (<a href="https://www.dpa.gr" target="_blank" rel="noreferrer" className="underline">www.dpa.gr</a>) ή, εφόσον κατοικείτε στην Κύπρο, στο Γραφείο του Επιτρόπου Προστασίας Δεδομένων Προσωπικού Χαρακτήρα (<a href="https://www.dataprotection.gov.cy" target="_blank" rel="noreferrer" className="underline">www.dataprotection.gov.cy</a>).
                </p>
              </div>

              {/* Section 11 */}
              <div className="pt-6 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
                  11. Ηλικία χρηστών
                </h2>
                <p>Η εφαρμογή απευθύνεται αποκλειστικά σε πρόσωπα ηλικίας 18 ετών και άνω.</p>
              </div>

              {/* Section 12 */}
              <div className="pt-6 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
                  12. Cookies, τροποποιήσεις και γλώσσα
                </h2>
                <p>
                  Η εφαρμογή χρησιμοποιεί μόνο τα απολύτως απαραίτητα cookies, όπως περιγράφεται στην Πολιτική Cookies. Σε περίπτωση ουσιώδους τροποποίησης της παρούσας Πολιτικής θα ενημερωθείτε έγκαιρα. Η Πολιτική διατίθεται στην ελληνική και στην αγγλική γλώσσα· σε περίπτωση απόκλισης υπερισχύει το ελληνικό κείμενο.
                </p>
              </div>
            </>
          ) : (
            /* =================== ENGLISH VERSION (EN) =================== */
            <>
              {/* Section 1 */}
              <div className="pt-6 first:pt-0 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900 flex items-center gap-2">
                  <Building2 size={16} className="text-lime-600" /> 1. Data controller
                </h2>
                <p>
                  The data controller is the company Beautydoctors O.E., with registered office at 23 Xanthippou Street, Pikermi 19009, Tax ID (AFM) 803040724, General Commercial Registry (GEMI) No. 188015103000 (hereinafter “BeautyDoctors”). For any matter concerning your personal data you may contact us at <a href="mailto:info@beautydoctors.gr" className="text-lime-700 underline font-semibold">info@beautydoctors.gr</a> or on 211 218 4564.
                </p>
                <p>
                  The doctor or clinic you choose (hereinafter the “Provider”) is an independent data controller for medical care, medical records and the receipts and invoices it issues.
                </p>
              </div>

              {/* Section 2 */}
              <div className="pt-6 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
                  2. Categories of data
                </h2>
                <ul className="list-disc list-inside space-y-1.5 pl-1">
                  <li><strong>Account data:</strong> full name, email, telephone number, password (in encrypted form), language.</li>
                  <li><strong>Appointment data:</strong> Provider, treatment of interest, date, time, appointment status and history.</li>
                  <li><strong>Payment data:</strong> amount, date, payment and refund status. Card details are processed exclusively by Viva and are not accessible to BeautyDoctors.</li>
                  <li><strong>Enquiries from advertisements (Facebook/Instagram forms):</strong> full name, telephone number, email, the treatment or advertisement you were interested in, and the history of our communication with you (calls, emails, notes).</li>
                  <li><strong>Reviews and support requests:</strong> the content you submit.</li>
                  <li><strong>Technical data:</strong> IP address, device, time of connection and the necessary cookies.</li>
                </ul>
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-xs font-semibold text-gray-700">
                  We do not ask for your social security number (AMKA), identity card number, medical history, test results or photographs.
                </div>
                <p>
                  Providing account and appointment data is necessary in order to book an appointment through the application; without it the service cannot be provided. No decisions concerning you are taken solely by automated means and no profiling is carried out.
                </p>
              </div>

              {/* Section 3 */}
              <div className="pt-6 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
                  3. Health data
                </h2>
                <p>
                  Booking an appointment for a specific treatment may reveal information relating to your health. For this reason, before your first booking we ask for your explicit consent, by means of a separate option.
                </p>
                <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-950">
                  This data is used exclusively to organise your appointment. <strong>It is not used for advertising or targeting purposes, is not sold and is not disclosed to other doctors.</strong> If you do not wish to give your consent, you may contact the doctor directly.
                </div>
              </div>

              {/* Section 4 */}
              <div className="pt-6 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
                  4. Purposes and legal bases of processing
                </h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs text-left border border-gray-200 rounded-xl overflow-hidden">
                    <thead className="bg-gray-100 font-bold text-gray-900 uppercase">
                      <tr>
                        <th className="p-3 border-b border-gray-200">Purpose</th>
                        <th className="p-3 border-b border-gray-200">Legal basis (GDPR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700">
                      <tr>
                        <td className="p-3 font-semibold">Account management and operation of the application</td>
                        <td className="p-3">Performance of a contract (Article 6(1)(b))</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold">Booking appointments and transmitting data to the Provider</td>
                        <td className="p-3">Performance of a contract (Article 6(1)(b)) and explicit consent for health data (Article 9(2)(a))</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold">Appointment notifications by email and SMS</td>
                        <td className="p-3">Performance of a contract (Article 6(1)(b))</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold">Electronic payment and payment history</td>
                        <td className="p-3">Performance of a contract (Article 6(1)(b))</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold">Contacting you following your request in an advertisement form</td>
                        <td className="p-3">Taking steps prior to entering into a contract, at your request (Article 6(1)(b))</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold">Sending the newsletter</td>
                        <td className="p-3">Consent (Article 6(1)(a) and Law 3471/2006)</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold">Publishing a review</td>
                        <td className="p-3">Consent (Article 6(1)(a))</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold">Support and complaint handling</td>
                        <td className="p-3">Performance of a contract (Article 6(1)(b))</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold">Security and prevention of misuse</td>
                        <td className="p-3">Legitimate interest (Article 6(1)(f))</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold">Compliance with accounting and legal obligations</td>
                        <td className="p-3">Legal obligation (Article 6(1)(c))</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 5 */}
              <div className="pt-6 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
                  5. Recipients of the data
                </h2>
                <ul className="list-disc list-inside space-y-1.5 pl-1">
                  <li><strong>The Provider you choose:</strong> only the data necessary for your appointment. Your data is not accessible to other doctors.</li>
                  <li><strong>Authorised BeautyDoctors staff:</strong> for customer service, organising appointments and support, subject to a duty of confidentiality.</li>
                  <li><strong>Processors providing technical services:</strong> Amazon Web Services (hosting, EU region eu-central-1), Viva (payments), email provider (AWS SES), SMS Gateway, HubSpot (management of enquiries), and OpenStreetMap (map display).</li>
                  <li><strong>Meta (Facebook/Instagram):</strong> when you fill in an advertisement form, Meta transmits the form data to us. Meta processes its own data as an independent controller, in accordance with its own policy.</li>
                  <li><strong>Public authorities:</strong> only where required by law.</li>
                  <li><strong>DPO:</strong> Rights may be exercised by submitting, free of charge, a written request to the Company at the email address <a href="mailto:personaldata@beautydoctors.gr" className="text-lime-700 underline font-semibold">personaldata@beautydoctors.gr</a>.</li>
                </ul>
                <p className="font-semibold text-gray-900 text-xs">
                  BeautyDoctors does not sell personal data and does not use advertising tracking tools in the application.
                </p>
              </div>

              {/* Section 6 */}
              <div className="pt-6 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
                  6. Transfers outside the European Economic Area
                </h2>
                <p>
                  Certain recipients (such as HubSpot and Meta) may process data in the United States. In such cases the transfer is carried out with the appropriate safeguards provided for by the GDPR, such as the EU-US Data Privacy Framework or the Standard Contractual Clauses.
                </p>
              </div>

              {/* Section 7 */}
              <div className="pt-6 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
                  7. Retention period
                </h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs text-left border border-gray-200 rounded-xl overflow-hidden">
                    <thead className="bg-gray-100 font-bold text-gray-900 uppercase">
                      <tr>
                        <th className="p-3 border-b border-gray-200">Data category</th>
                        <th className="p-3 border-b border-gray-200">Retention period</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700">
                      <tr>
                        <td className="p-3 font-semibold">Account</td>
                        <td className="p-3">For as long as the account is actively used. After three (3) years of inactivity it is deleted, following prior notice</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold">Appointment and payment history</td>
                        <td className="p-3">Ten (10) years from the last appointment</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold">Enquiries that did not lead to an appointment</td>
                        <td className="p-3">Twenty-four (24) months</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold">Newsletter</td>
                        <td className="p-3">Until consent is withdrawn</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold">Support requests</td>
                        <td className="p-3">Two (2) years</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold">Technical security logs</td>
                        <td className="p-3">Twelve (12) months</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-600">
                  After the retention period expires, data is automatically deleted or anonymised so that it can no longer be linked to you. It is deleted from backups within 90 days. Requests for early deletion are fulfilled within one month, except for data that BeautyDoctors is required by law to retain.
                </p>
              </div>

              {/* Section 8 */}
              <div className="pt-6 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
                  8. Newsletter
                </h2>
                <p>
                  The newsletter is sent only if you opt in through the relevant option, which is not pre-selected. Subscribing to the newsletter is not a condition for using the application. You may unsubscribe at any time through the link contained in every email or from Settings.
                </p>
                <p>
                  The content of the newsletter is not tailored on the basis of the treatments you have had or searched for.
                </p>
              </div>

              {/* Section 9 */}
              <div className="pt-6 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
                  9. Data security
                </h2>
                <p>
                  BeautyDoctors applies appropriate technical and organisational measures, such as encryption of connections, role-based access and logging of access. In the event of a breach that affects you, you will be informed in accordance with the law.
                </p>
              </div>

              {/* Section 10 */}
              <div className="pt-6 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
                  10. Data subject rights
                </h2>
                <p>
                  You have the right of access, rectification, erasure, restriction of processing, data portability and objection. You may withdraw any consent at any time, without affecting the lawfulness of processing carried out before its withdrawal.
                </p>
                <p>
                  To exercise your rights you may contact <a href="mailto:info@beautydoctors.gr" className="text-lime-700 underline font-semibold">info@beautydoctors.gr</a>. BeautyDoctors responds within one month. You also have the right to lodge a complaint with the Hellenic Data Protection Authority (<a href="https://www.dpa.gr" target="_blank" rel="noreferrer" className="underline">www.dpa.gr</a>) or, if you reside in Cyprus, with the Office of the Commissioner for Personal Data Protection (<a href="https://www.dataprotection.gov.cy" target="_blank" rel="noreferrer" className="underline">www.dataprotection.gov.cy</a>).
                </p>
              </div>

              {/* Section 11 */}
              <div className="pt-6 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
                  11. Age of users
                </h2>
                <p>The application is intended exclusively for persons aged 18 and over.</p>
              </div>

              {/* Section 12 */}
              <div className="pt-6 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
                  12. Cookies, amendments and language
                </h2>
                <p>
                  The application uses only strictly necessary cookies, as described in the Cookie Policy. In the event of a material amendment to this Policy, you will be informed in good time. The Policy is available in Greek and in English; in the event of any discrepancy, the Greek text prevails.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
