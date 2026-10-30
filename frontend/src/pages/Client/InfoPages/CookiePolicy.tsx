import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaChevronRight } from "react-icons/fa6";
import { Cookie, ShieldCheck, Globe } from "lucide-react";
import LayeredBG from "@/assets/LayeredBg.svg";
import { getPreferredLanguage, switchLanguage, type AppLanguage } from "@/utils/language";

export const CookiePolicy: React.FC = () => {
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
              {isEl ? "Πολιτική Cookies" : "Cookie Policy"}
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
            <Cookie size={14} className="text-lime-600" />
            {isEl ? "Απολύτως Απαραίτητα Cookies" : "Strictly Necessary Cookies Only"}
          </div>
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-[#1A1A1A]">
            {isEl ? (
              <>
                Πολιτική <span className="text-[#84cc16]">Cookies</span>
              </>
            ) : (
              <>
                Cookie <span className="text-[#84cc16]">Policy</span>
              </>
            )}
          </h1>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
            {isEl
              ? "Έκδοση 1.0 · Τελικό εγκεκριμένο κείμενο (Υπερισχύει το ελληνικό κείμενο)"
              : "Version 1.0 · Official English translation (Greek text prevails)"}
          </p>
          <div className="p-4 rounded-2xl bg-lime-50/80 border border-lime-200 text-xs text-lime-950 font-medium">
            <ShieldCheck size={16} className="inline mr-1 text-lime-600" />
            {isEl
              ? "Η BeautyDoctors χρησιμοποιεί μόνο τα απολύτως απαραίτητα cookies και τοπική αποθήκευση για τη λειτουργία της εφαρμογής. Δεν χρησιμοποιούνται cookies διαφήμισης, παρακολούθησης ή στατιστικών τρίτων."
              : "BeautyDoctors uses only strictly necessary cookies and local storage required for the application to function. No advertising, tracking or third-party analytics cookies are used."}
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-white p-6 sm:p-10 rounded-[32px] shadow-sm border border-gray-100 divide-y divide-gray-100 space-y-8 text-gray-700 leading-relaxed text-sm">
          {isEl ? (
            /* =================== GREEK VERSION (GR) =================== */
            <>
              {/* Section 1 */}
              <div className="pt-6 first:pt-0 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
                  1. Έννοια των cookies
                </h2>
                <p>
                  Τα cookies και η τοπική αποθήκευση (local storage) είναι μικρά αρχεία κειμένου που αποθηκεύονται στη συσκευή σας κατά τη χρήση της εφαρμογής και του ιστότοπου beautydoctors.gr. Η παρούσα Πολιτική εφαρμόζεται αναλόγως και σε παρόμοιες τεχνολογίες, όπως η τοπική αποθήκευση του προγράμματος περιήγησης.
                </p>
              </div>

              {/* Section 2 */}
              <div className="pt-6 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
                  2. Cookies που χρησιμοποιούνται
                </h2>
                <p>
                  Η BeautyDoctors χρησιμοποιεί <strong>μόνο τα απολύτως απαραίτητα cookies</strong>, τα οποία είναι αναγκαία για τη λειτουργία της εφαρμογής (σύνδεση, ασφάλεια, επιλογή γλώσσας). Για τη χρήση τους δεν απαιτείται η συγκατάθεσή σας, καθώς η χρήση της πλατφόρμας συνιστά συγκατάθεση.
                </p>
                <p className="font-semibold text-gray-900">
                  Δεν χρησιμοποιούνται cookies διαφήμισης, παρακολούθησης ή στατιστικών τρίτων (όπως Meta Pixel ή Google Analytics).
                </p>

                <div className="overflow-x-auto pt-2">
                  <table className="min-w-full text-xs text-left border border-gray-200 rounded-xl overflow-hidden">
                    <thead className="bg-gray-100 font-bold text-gray-900 uppercase">
                      <tr>
                        <th className="p-3 border-b border-gray-200">Ονομασία</th>
                        <th className="p-3 border-b border-gray-200">Είδος</th>
                        <th className="p-3 border-b border-gray-200">Σκοπός</th>
                        <th className="p-3 border-b border-gray-200">Διάρκεια</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700">
                      <tr>
                        <td className="p-3 font-semibold font-mono">accessToken, refreshToken</td>
                        <td className="p-3">Τοπική αποθήκευση</td>
                        <td className="p-3">Σύνδεση στον λογαριασμό και ασφάλεια</td>
                        <td className="p-3">30 ημέρες / Συνεδρία</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold font-mono">user, userRole</td>
                        <td className="p-3">Τοπική αποθήκευση</td>
                        <td className="p-3">Στοιχεία της τρέχουσας σύνδεσης και δικαιώματα χρήστη</td>
                        <td className="p-3">Έως την αποσύνδεση</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold font-mono">preferredLang</td>
                        <td className="p-3">Τοπική αποθήκευση</td>
                        <td className="p-3">Απομνημόνευση της επιλεγμένης γλώσσας (ΕΛ/EN)</td>
                        <td className="p-3">1 έτος</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold font-mono">activeClinicId</td>
                        <td className="p-3">Τοπική αποθήκευση</td>
                        <td className="p-3">Επιλεγμένη κλινική (μόνο για λογαριασμούς παρόχων)</td>
                        <td className="p-3">Έως την αποσύνδεση</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold font-mono">is_client_mobile_app</td>
                        <td className="p-3">Τοπική αποθήκευση</td>
                        <td className="p-3">Αναγνώριση της έκδοσης της εφαρμογής</td>
                        <td className="p-3">Μόνιμη</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 3 */}
              <div className="pt-6 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
                  3. Ηλεκτρονικές πληρωμές
                </h2>
                <p>
                  Κατά την ηλεκτρονική πληρωμή μεταφέρεστε στη σελίδα πληρωμής της Viva, η οποία ενδέχεται να χρησιμοποιεί δικά της cookies για την ασφάλεια της συναλλαγής. Τα cookies αυτά διέπονται από την πολιτική της Viva.
                </p>
              </div>

              {/* Section 4 */}
              <div className="pt-6 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
                  4. Διαχείριση cookies
                </h2>
                <p>
                  Μπορείτε να διαγράψετε τα cookies από τις ρυθμίσεις του προγράμματος περιήγησής σας. Σε αυτήν την περίπτωση θα απαιτηθεί νέα σύνδεση στον λογαριασμό σας.
                </p>
              </div>

              {/* Section 5 */}
              <div className="pt-6 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
                  5. Τροποποιήσεις
                </h2>
                <p>
                  Εφόσον στο μέλλον χρησιμοποιηθούν cookies που δεν είναι απολύτως απαραίτητα, θα ζητείται προηγουμένως η συγκατάθεσή σας και η παρούσα Πολιτική θα επικαιροποιείται αναλόγως.
                </p>
                <p>
                  Επικοινωνία: <a href="mailto:info@beautydoctors.gr" className="text-lime-700 underline font-semibold">info@beautydoctors.gr</a>. Σε περίπτωση απόκλισης μεταξύ του ελληνικού και του αγγλικού κειμένου υπερισχύει το ελληνικό.
                </p>
              </div>
            </>
          ) : (
            /* =================== ENGLISH VERSION (EN) =================== */
            <>
              {/* Section 1 */}
              <div className="pt-6 first:pt-0 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
                  1. What cookies are
                </h2>
                <p>
                  Cookies and local storage are small text files stored on your device when you use the application and the website beautydoctors.gr. This Policy also applies, mutatis mutandis, to similar technologies, such as the browser’s local storage.
                </p>
              </div>

              {/* Section 2 */}
              <div className="pt-6 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
                  2. Cookies used
                </h2>
                <p>
                  BeautyDoctors uses <strong>only strictly necessary cookies</strong>, which are required for the application to function (login, security, language selection). Your consent is not required for their use, as use of the Platform constitutes consent.
                </p>
                <p className="font-semibold text-gray-900">
                  No advertising, tracking or third-party analytics cookies (such as Meta Pixel or Google Analytics) are used.
                </p>

                <div className="overflow-x-auto pt-2">
                  <table className="min-w-full text-xs text-left border border-gray-200 rounded-xl overflow-hidden">
                    <thead className="bg-gray-100 font-bold text-gray-900 uppercase">
                      <tr>
                        <th className="p-3 border-b border-gray-200">Name</th>
                        <th className="p-3 border-b border-gray-200">Type</th>
                        <th className="p-3 border-b border-gray-200">Purpose</th>
                        <th className="p-3 border-b border-gray-200">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700">
                      <tr>
                        <td className="p-3 font-semibold font-mono">accessToken, refreshToken</td>
                        <td className="p-3">Local storage</td>
                        <td className="p-3">Account login and security</td>
                        <td className="p-3">30 days / Session</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold font-mono">user, userRole</td>
                        <td className="p-3">Local storage</td>
                        <td className="p-3">Current session data and user permissions</td>
                        <td className="p-3">Until logout</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold font-mono">preferredLang</td>
                        <td className="p-3">Local storage</td>
                        <td className="p-3">Remembering the selected language (EL/EN)</td>
                        <td className="p-3">1 year</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold font-mono">activeClinicId</td>
                        <td className="p-3">Local storage</td>
                        <td className="p-3">Selected clinic (provider accounts only)</td>
                        <td className="p-3">Until logout</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold font-mono">is_client_mobile_app</td>
                        <td className="p-3">Local storage</td>
                        <td className="p-3">Identifying the application version</td>
                        <td className="p-3">Persistent</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 3 */}
              <div className="pt-6 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
                  3. Electronic payments
                </h2>
                <p>
                  When paying electronically you are redirected to the Viva payment page, which may use its own cookies for the security of the transaction. These cookies are governed by Viva’s policy.
                </p>
              </div>

              {/* Section 4 */}
              <div className="pt-6 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
                  4. Managing cookies
                </h2>
                <p>
                  You can delete cookies from your browser settings. In that case you will need to log in to your account again.
                </p>
              </div>

              {/* Section 5 */}
              <div className="pt-6 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
                  5. Amendments
                </h2>
                <p>
                  If cookies that are not strictly necessary are used in the future, your consent will be requested beforehand and this Policy will be updated accordingly.
                </p>
                <p>
                  Contact: <a href="mailto:info@beautydoctors.gr" className="text-lime-700 underline font-semibold">info@beautydoctors.gr</a>. In the event of any discrepancy between the Greek and the English text, the Greek text prevails.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
