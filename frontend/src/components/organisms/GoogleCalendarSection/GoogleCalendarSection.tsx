import React, { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  Calendar,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Link2,
  Unlink,
} from "lucide-react";
import {
  googleCalendarApi,
  GoogleCalendarStatus,
  GoogleCalendarItem,
} from "../../../services/api/clinicApi";

interface Props {
  clinicId?: string;
}

/**
 * Clinic settings card to connect/disconnect Google Calendar and choose which
 * calendar to two-way sync. Talks to the backend /google-calendar endpoints.
 */
const GoogleCalendarSection: React.FC<Props> = ({ clinicId }) => {
  const isGreek =
    typeof window !== "undefined" && localStorage.getItem("preferredLang") === "el";
  const t = (el: string, en: string) => (isGreek ? el : en);
  const [searchParams, setSearchParams] = useSearchParams();
  const [status, setStatus] = useState<GoogleCalendarStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [calendars, setCalendars] = useState<GoogleCalendarItem[]>([]);
  const [picking, setPicking] = useState(false);
  const [selectedCalendarId, setSelectedCalendarId] = useState("");

  const loadStatus = useCallback(async () => {
    if (!clinicId) return;
    setLoading(true);
    try {
      const s = await googleCalendarApi.getStatus(clinicId);
      setStatus(s);
      return s;
    } catch {
      // A 4xx here usually just means "not connected yet" — leave status null.
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  const loadCalendars = useCallback(async () => {
    if (!clinicId) return;
    setBusy(true);
    try {
      const list = await googleCalendarApi.listCalendars(clinicId);
      setCalendars(list);
      const primary = list.find((c) => c.primary) || list[0];
      setSelectedCalendarId((prev) => prev || primary?.id || "");
      setPicking(true);
    } catch {
      toast.error(t("Δεν ήταν δυνατή η φόρτωση των ημερολογίων Google. Συνδεθείτε ξανά.", "Could not load your Google calendars. Try reconnecting."));
    } finally {
      setBusy(false);
    }
  }, [clinicId]);

  // Initial load.
  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  // Handle the OAuth return (?google=connected|error, ?select=1).
  useEffect(() => {
    const google = searchParams.get("google");
    if (!google) return;
    if (google === "connected") {
      toast.success(t("Ο λογαριασμός Google συνδέθηκε. Επιλέξτε ημερολόγιο για συγχρονισμό.", "Google account connected. Now choose a calendar to sync."));
      if (searchParams.get("select") === "1") loadCalendars();
    } else if (google === "error") {
      toast.error(t("Η σύνδεση με το Google Calendar απέτυχε. Δοκιμάστε ξανά.", "Could not connect Google Calendar. Please try again."));
    }
    // Clean the query params so it doesn't re-fire on refresh.
    searchParams.delete("google");
    searchParams.delete("select");
    searchParams.delete("clinicId");
    setSearchParams(searchParams, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConnect = async () => {
    if (!clinicId) return;
    setBusy(true);
    try {
      const url = await googleCalendarApi.getConnectUrl(clinicId);
      window.location.assign(url); // hand off to Google's consent screen
    } catch {
      toast.error(t("Ο συγχρονισμός Google Calendar δεν είναι διαθέσιμος αυτή τη στιγμή.", "Google Calendar sync is not available right now."));
      setBusy(false);
    }
  };

  const handleSelectCalendar = async () => {
    if (!clinicId || !selectedCalendarId) return;
    setBusy(true);
    try {
      const s = await googleCalendarApi.selectCalendar(clinicId, {
        calendarId: selectedCalendarId,
      });
      setStatus(s);
      setPicking(false);
      toast.success(t("Το ημερολόγιο επιλέχθηκε, ο συγχρονισμός είναι ενεργός.", "Calendar selected, sync is now active."));
    } catch {
      toast.error(t("Δεν ήταν δυνατή η αποθήκευση του ημερολογίου.", "Could not save the selected calendar."));
    } finally {
      setBusy(false);
    }
  };

  const handleDisconnect = async () => {
    if (!clinicId) return;
    if (!window.confirm(t("Αποσύνδεση Google Calendar; Τα ραντεβού δεν θα συγχρονίζονται πλέον.", "Disconnect Google Calendar? Appointments will stop syncing."))) {
      return;
    }
    setBusy(true);
    try {
      await googleCalendarApi.disconnect(clinicId);
      setStatus(null);
      setPicking(false);
      setCalendars([]);
      toast.success(t("Το Google Calendar αποσυνδέθηκε.", "Google Calendar disconnected."));
    } catch {
      toast.error(t("Η αποσύνδεση απέτυχε. Δοκιμάστε ξανά.", "Could not disconnect. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  const connected = status?.connected;
  const needsSelection = status?.needsCalendarSelection || picking;

  return (
    <div className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-2xl bg-[#CBFF38] flex items-center justify-center">
          <Calendar className="w-6 h-6 text-black" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Google Calendar</h2>
          <p className="text-sm text-gray-500">
            {t(
              "Αμφίδρομος συγχρονισμός: τα ραντεβού της πλατφόρμας εμφανίζονται στο Google και τα γεγονότα του Google κλείνουν ώρες στο ημερολόγιό σας.",
              "Two-way sync: app bookings appear on Google, and events on Google block time in your calendar."
            )}
          </p>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <RefreshCw className="w-4 h-4 animate-spin" /> {t("Φόρτωση…", "Loading…")}
        </div>
      )}

      {/* Not configured on the server */}
      {!loading && status && status.enabled === false && (
        <div className="p-4 rounded-xl bg-yellow-50 text-yellow-800 text-sm flex gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {t(
            "Ο συγχρονισμός Google Calendar δεν έχει ενεργοποιηθεί ακόμη στον διακομιστή. Επικοινωνήστε με τον διαχειριστή.",
            "Google Calendar sync isn't enabled on the server yet. Contact your administrator."
          )}
        </div>
      )}

      {/* Not connected */}
      {!loading && !connected && (!status || status.enabled !== false) && (
        <div>
          <p className="text-sm text-gray-600 mb-4">
            {t(
              "Συνδέστε τον λογαριασμό Google σας ώστε το ημερολόγιο ραντεβού και το Google Calendar να συγχρονίζονται αυτόματα.",
              "Connect your Google account to keep your booking calendar and Google Calendar in sync automatically."
            )}
          </p>
          <button
            type="button"
            disabled={busy || !clinicId}
            onClick={handleConnect}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-black text-white font-medium hover:bg-gray-800 disabled:opacity-50"
          >
            <Link2 className="w-4 h-4" />
            {busy ? t("Ανακατεύθυνση…", "Redirecting…") : t("Σύνδεση Google Calendar", "Connect Google Calendar")}
          </button>
        </div>
      )}

      {/* Connected — needs (or is changing) calendar selection */}
      {!loading && connected && needsSelection && (
        <div className="space-y-4">
          {status?.googleAccountEmail && (
            <p className="text-sm text-gray-600">
              {t("Συνδεδεμένο ως", "Connected as")} <span className="font-medium">{status.googleAccountEmail}</span>.{" "}
              {t("Επιλέξτε ημερολόγιο για συγχρονισμό:", "Choose which calendar to sync:")}
            </p>
          )}
          <select
            value={selectedCalendarId}
            onChange={(e) => setSelectedCalendarId(e.target.value)}
            className="w-full md:w-96 border border-gray-300 rounded-xl px-4 py-3 text-sm"
          >
            {calendars.length === 0 && <option value="">{t("Φόρτωση ημερολογίων…", "Loading calendars…")}</option>}
            {calendars.map((c) => (
              <option key={c.id} value={c.id}>
                {c.summary}
                {c.primary ? t(" (κύριο)", " (primary)") : ""}
              </option>
            ))}
          </select>
          <div className="flex gap-3">
            <button
              type="button"
              disabled={busy || !selectedCalendarId}
              onClick={handleSelectCalendar}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#CBFF38] text-black font-medium hover:brightness-95 disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              {busy ? t("Αποθήκευση…", "Saving…") : t("Χρήση αυτού του ημερολογίου", "Use this calendar")}
            </button>
            {calendars.length === 0 && (
              <button
                type="button"
                disabled={busy}
                onClick={loadCalendars}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-300 text-gray-700"
              >
                <RefreshCw className="w-4 h-4" /> {t("Επαναφόρτωση", "Reload")}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Connected and fully set up */}
      {!loading && connected && !needsSelection && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-green-50 text-green-800 text-sm flex gap-2">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span>
              {t("Συγχρονισμένο με", "Synced with")} <span className="font-medium">{status?.calendarSummary || status?.calendarId}</span>
              {status?.googleAccountEmail ? ` (${status.googleAccountEmail})` : ""}.
            </span>
          </div>
          {status?.status === "error" && status?.lastError && (
            <div className="p-4 rounded-xl bg-red-50 text-red-800 text-sm flex gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {t("Ο συγχρονισμός χρειάζεται προσοχή. Συνδεθείτε ξανά.", "Sync needs attention, please reconnect.")}
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={loadCalendars}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <Calendar className="w-4 h-4" /> {t("Αλλαγή ημερολογίου", "Change calendar")}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={handleDisconnect}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-red-300 text-red-600 hover:bg-red-50"
            >
              <Unlink className="w-4 h-4" /> {t("Αποσύνδεση", "Disconnect")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleCalendarSection;
