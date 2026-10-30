import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaChevronRight } from "react-icons/fa6";
import { Stethoscope, AlertTriangle, Globe } from "lucide-react";
import LayeredBG from "@/assets/LayeredBg.svg";
import { getPreferredLanguage, switchLanguage, type AppLanguage } from "@/utils/language";

export const MedicalDisclaimer: React.FC = () => {
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
              {isEl ? "Ιατρική Επισήμανση" : "Medical Disclaimer"}
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
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold uppercase tracking-wider">
            <Stethoscope size={14} className="text-amber-700" />
            {isEl ? "Κλινική και Ιατρική Ενημέρωση" : "Clinical & Medical Notice"}
          </div>
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-[#1A1A1A]">
            {isEl ? (
              <>
                Ιατρική <span className="text-[#84cc16]">Επισήμανση</span>
              </>
            ) : (
              <>
                Medical <span className="text-[#84cc16]">Disclaimer</span>
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
                Το περιεχόμενο της BeautyDoctors έχει γενικό ενημερωτικό χαρακτήρα και δεν υποκαθιστά την ιατρική εξέταση, διάγνωση ή συμβουλή.
              </>
            ) : (
              <>
                BeautyDoctors content is for general information purposes only. It does not replace medical examination, diagnosis or advice.
              </>
            )}
          </p>
        </div>

        {/* Emergency Alert Box */}
        <div className="p-4 sm:p-6 bg-red-50 border border-red-200 rounded-[24px] flex items-start gap-3.5 text-red-950">
          <AlertTriangle size={20} className="text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold uppercase tracking-wide text-red-900">
              {isEl ? "5. Επείγοντα περιστατικά" : "5. Emergencies"}
            </h3>
            <p className="text-xs text-red-800 leading-relaxed font-semibold">
              {isEl ? (
                <>
                  Η BeautyDoctors δεν παρέχει υπηρεσίες επειγόντων περιστατικών. Η εφαρμογή και οι ειδοποιήσεις της δεν πρέπει να χρησιμοποιούνται όταν απαιτείται άμεση ιατρική βοήθεια. <strong>Σε επείγουσα περίπτωση καλέστε το 112 ή απευθυνθείτε στο πλησιέστερο νοσοκομείο.</strong>
                </>
              ) : (
                <>
                  BeautyDoctors does not provide emergency services. The application and its notifications must not be used when immediate medical assistance is required. <strong>In an emergency, call 112 or go to the nearest hospital.</strong>
                </>
              )}
            </p>
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
                  1. Ενημερωτικός χαρακτήρας περιεχομένου
                </h2>
                <p>
                  Το περιεχόμενο της BeautyDoctors (περιγραφές θεραπειών, άρθρα, φωτογραφίες, ενδεικτικοί χρόνοι) έχει γενικό ενημερωτικό χαρακτήρα. Δεν υποκαθιστά την ιατρική εξέταση, διάγνωση ή συμβουλή και δεν σημαίνει ότι μια θεραπεία είναι κατάλληλη για συγκεκριμένο πρόσωπο.
                </p>
              </div>

              {/* Section 2 */}
              <div className="pt-6 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
                  2. Ιατρική κρίση
                </h2>
                <p>
                  Η καταλληλότητα μιας θεραπείας κρίνεται αποκλειστικά από τον θεράποντα ιατρό, κατόπιν εξέτασης του ιατρικού ιστορικού και των αναγκών κάθε ασθενούς.
                </p>
              </div>

              {/* Section 3 */}
              <div className="pt-6 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
                  3. Θεραπεία ενδιαφέροντος
                </h2>
                <p>
                  Η θεραπεία που επιλέγετε στην εφαρμογή αποτελεί δήλωση ενδιαφέροντος. Δεν αποτελεί διάγνωση, συνταγή, ούτε βεβαίωση ότι η θεραπεία θα πραγματοποιηθεί.
                </p>
              </div>

              {/* Section 4 */}
              <div className="pt-6 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
                  4. Αποτελέσματα
                </h2>
                <p>
                  Το αποτέλεσμα, η διάρκειά του, ο χρόνος αποθεράπευσης και οι πιθανές παρενέργειες διαφέρουν από ασθενή σε ασθενή, και εκτείνονται πέραν της ευθύνης και γνώσης μας, η οποία περιορίζεται στην σύσταση. Το τυχόν αποτέλεσμα και η αποδοχή ή μη αυτού, ως και οι τυχόν επιπλοκές και ιατρικά λάθη αφορούν αποκλειστικά στην εκτέλεση της ιατρικής πράξης και δεν σχετίζονται με την σύσταση και την πλατφόρμα εν γένει. Οι φωτογραφίες απεικονίζουν τη θεραπεία ενδεικτικά και δεν αποτελούν δέσμευση για συγκεκριμένο αποτέλεσμα.
                </p>
              </div>

              {/* Language Clause */}
              <div className="pt-6 space-y-2 text-xs text-gray-500">
                <p>
                  Σε περίπτωση απόκλισης μεταξύ του ελληνικού και του αγγλικού κειμένου υπερισχύει το ελληνικό.
                </p>
              </div>
            </>
          ) : (
            /* =================== ENGLISH VERSION (EN) =================== */
            <>
              {/* Section 1 */}
              <div className="pt-6 first:pt-0 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
                  1. Informational nature of the content
                </h2>
                <p>
                  BeautyDoctors content (treatment descriptions, articles, photographs, indicative timeframes) is for general information purposes. It does not replace medical examination, diagnosis or advice and does not mean that a treatment is suitable for a particular person.
                </p>
              </div>

              {/* Section 2 */}
              <div className="pt-6 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
                  2. Medical judgement
                </h2>
                <p>
                  The suitability of a treatment is determined exclusively by the treating doctor, following examination of each patient’s medical history and needs.
                </p>
              </div>

              {/* Section 3 */}
              <div className="pt-6 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
                  3. Treatment of interest
                </h2>
                <p>
                  The treatment you select in the application constitutes an expression of interest. It does not constitute a diagnosis or a prescription, nor confirmation that the treatment will be carried out.
                </p>
              </div>

              {/* Section 4 */}
              <div className="pt-6 space-y-3">
                <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
                  4. Results
                </h2>
                <p>
                  The result, its duration, the recovery time and any possible side effects vary from patient to patient and lie beyond our responsibility and knowledge, which is limited to the referral. Any result and its acceptance or otherwise, as well as any complications and medical errors, relate exclusively to the performance of the medical procedure and are not connected with the referral or with the Platform in general. Photographs depict the treatment indicatively and do not constitute a commitment to a specific result.
                </p>
              </div>

              {/* Language Clause */}
              <div className="pt-6 space-y-2 text-xs text-gray-500">
                <p>
                  In the event of any discrepancy between the Greek and the English text, the Greek text prevails.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
