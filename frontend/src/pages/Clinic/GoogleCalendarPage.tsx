import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../store";
import { fetchClinicProfile, fetchAppointments } from "../../store/slices/clinicSlice";
import GoogleCalendarSection from "../../components/organisms/GoogleCalendarSection/GoogleCalendarSection";
import { clinicProfileApi } from "../../services/api/clinicApi";
import type { ClinicProfile } from "../../types/clinic.types";

/**
 * Clinic portal page where the owner, doctor or secretariat connects the
 * clinic's own Google Calendar. Also the landing page of the OAuth callback.
 */
const GoogleCalendarPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { profile } = useSelector((state: RootState) => state.clinic);
  const [isGreek, setIsGreek] = useState<boolean>(
    () => typeof window !== "undefined" && localStorage.getItem("preferredLang") === "el"
  );
  const [clinics, setClinics] = useState<ClinicProfile[]>([]);
  const [clinicId, setClinicId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleLang = () => setIsGreek(localStorage.getItem("preferredLang") === "el");
    window.addEventListener("storage", handleLang);
    window.addEventListener("languagechange", handleLang);
    return () => {
      window.removeEventListener("storage", handleLang);
      window.removeEventListener("languagechange", handleLang);
    };
  }, []);

  useEffect(() => {
    const fromCallback = new URLSearchParams(window.location.search).get("clinicId");
    const saved = localStorage.getItem("activeClinicId");
    const load = async () => {
      try {
        const list = await clinicProfileApi.getMyClinics().catch(() => [] as ClinicProfile[]);
        if (Array.isArray(list) && list.length > 0) {
          setClinics(list);
          const wanted = fromCallback || profile?.id || saved;
          const match = wanted && list.find((c) => c.id === wanted);
          setClinicId(match ? match.id : list[0].id);
          return;
        }
        const p = await clinicProfileApi.getProfile();
        if (p?.id) {
          setClinics([p]);
          setClinicId(p.id);
        }
      } catch {
        // No clinic assigned: the section below shows nothing to connect.
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Sync whenever user switches clinic from the ClinicLayout top bar
  useEffect(() => {
    if (profile?.id && clinics.some((c) => c.id === profile.id)) {
      setClinicId((prev) => (prev === profile.id ? prev : profile.id));
    }
  }, [profile?.id, clinics]);

  const handleClinicSelect = (nextId: string) => {
    setClinicId(nextId);
    localStorage.setItem("activeClinicId", nextId);
    if (nextId && nextId !== profile?.id) {
      dispatch(fetchClinicProfile(nextId));
      dispatch(fetchAppointments({ clinicId: nextId }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-10 space-y-6">
      <div>
        <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tighter text-gray-900">
          Google Calendar
        </h1>
        <p className="text-sm text-gray-500 mt-2">
          {isGreek
            ? "Συνδέστε το δικό σας Google Calendar. Τα ραντεβού της πλατφόρμας εμφανίζονται στο Google και οι δεσμευμένες ώρες σας στο Google κλείνουν τις online ώρες."
            : "Connect your own Google Calendar. Platform appointments appear in Google, and busy times in Google block online booking slots."}
        </p>
      </div>

      {clinics.length > 1 && (
        <select
          value={clinicId}
          onChange={(e) => handleClinicSelect(e.target.value)}
          className="w-full md:w-96 border border-gray-300 rounded-xl px-4 py-3 text-sm"
        >
          {clinics.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      )}

      {!loading && !clinicId && (
        <div className="p-4 rounded-xl bg-yellow-50 text-yellow-800 text-sm">
          {isGreek
            ? "Ο λογαριασμός σας δεν έχει συνδεθεί με κλινική. Επικοινωνήστε με τον διαχειριστή."
            : "Your account is not linked to a clinic. Please contact the administrator."}
        </div>
      )}

      {clinicId && <GoogleCalendarSection key={clinicId} clinicId={clinicId} />}
    </div>
  );
};

export default GoogleCalendarPage;
