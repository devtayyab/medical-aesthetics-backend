import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  addDays,
  eachDayOfInterval,
  endOfWeek,
  format,
  startOfWeek,
} from "date-fns";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  CheckCircle,
  MapPin,
  Check,
  XCircle,
  UserX,
  CalendarClock,
} from "lucide-react";
import { adminAPI, bookingAPI } from "@/services/api";
import { Button } from "@/components/atoms/Button/Button";
import { Card, CardContent } from "@/components/molecules/Card/Card";
import { RescheduleModal } from "@/components/organisms/RescheduleModal";
import { CRMBookingModal } from "@/components/crm/CRMBookingModal";
import { AppointmentStatus } from "@/types";
type GlobalCalendarAppointment = {
  id: string;
  clinicId: string;
  serviceId?: string;
  providerId?: string | null;
  clientId?: string | null;
  startTime: string;
  endTime: string;
  status: string;
  isBlocked: boolean;
  isBeautyDoctorsClient: boolean;
  serviceName?: string;
  providerName?: string;
  clientName?: string;
};

const STATUS_ACTIONS = [
  { key: "edit", label: "Edit", status: null, icon: CalendarIcon },
  { key: "confirmed", label: "Confirm", status: AppointmentStatus.CONFIRMED, icon: CheckCircle },
  { key: "arrived", label: "Arrived", status: AppointmentStatus.ARRIVED, icon: MapPin },
  { key: "completed", label: "Done", status: AppointmentStatus.COMPLETED, icon: Check },
  { key: "no_show", label: "No-show", status: AppointmentStatus.NO_SHOW, icon: UserX },
  { key: "reschedule", label: "Reschedule", status: null, icon: CalendarClock },
  { key: "cancelled", label: "Cancel", status: AppointmentStatus.CANCELLED, icon: XCircle },
] as const;

function canShowAction(
  actionKey: string,
  currentStatus: string,
  apt?: GlobalCalendarAppointment
): boolean {
  if (actionKey === "edit") return true;
  const s = currentStatus?.toLowerCase() || "";
  
  if (actionKey === "reschedule") {
    const canReschedule = !["completed", "cancelled", "no_show"].includes(s);
    return canReschedule && !!(apt?.clinicId && apt?.serviceId);
  }
  
  switch (actionKey) {
    case "confirmed":
      return s === "pending" || s === "pending_payment";
    case "arrived":
      return s === "confirmed";
    case "completed":
      return ["confirmed", "arrived", "in_progress"].includes(s);
    case "no_show":
      return ["confirmed", "arrived"].includes(s);
    case "cancelled":
      return !["completed", "cancelled", "no_show"].includes(s);
    default:
      return false;
  }
}

interface AppointmentCardActionsProps {
  apt: GlobalCalendarAppointment;
  onActionDone: () => void;
  onReschedule: () => void;
  onEdit?: () => void;
}

const AppointmentCardActions: React.FC<AppointmentCardActionsProps> = ({
  apt,
  onActionDone,
  onReschedule,
  onEdit,
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleStatus = async (status: string) => {
    try {
      setLoading(status);
      await bookingAPI.updateStatus(apt.id, status);
      setOpen(false);
      onActionDone();
    } catch (e) {
      console.error("Status update failed:", e);
      alert("Failed to update status. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const handleCancel = async () => {
    try {
      setLoading("cancel");
      await bookingAPI.cancel(apt.id);
      setOpen(false);
      onActionDone();
    } catch (e) {
      console.error("Cancel failed:", e);
      alert("Failed to cancel. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const handleComplete = async () => {
    try {
      setLoading("complete");
      await bookingAPI.complete(apt.id);
      setOpen(false);
      onActionDone();
    } catch (e) {
      console.error("Complete failed:", e);
      alert("Failed to mark as done. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const handleReschedule = () => {
    setOpen(false);
    onReschedule();
  };

  const handleEdit = () => {
    setOpen(false);
    if (onEdit) onEdit();
  };

  const visibleActions = STATUS_ACTIONS.filter((a) =>
    a.key === "edit" ? true : a.key === "reschedule" ? canShowAction("reschedule", apt.status, apt) : a.status ? canShowAction(a.key, apt.status) : false
  );

  // Still check visibleActions, but since "edit" is always true, it will always show if not blocked
  if (visibleActions.length === 0) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="p-0.5 rounded hover:bg-emerald-200/60 text-emerald-800"
        aria-label="Actions"
      >
        <MoreVertical className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-0.5 z-20 bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-[140px]">
          {visibleActions.map((a) => {
            const Icon = a.icon;
            if (a.key === "edit") {
              return (
                <button
                  key={a.key}
                  type="button"
                  onClick={handleEdit}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-[11px] hover:bg-slate-100"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {a.label}
                </button>
              );
            }
            if (a.key === "reschedule") {
              return (
                <button
                  key={a.key}
                  type="button"
                  onClick={handleReschedule}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-[11px] hover:bg-slate-100"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {a.label}
                </button>
              );
            }
            if (a.key === "cancelled") {
              return (
                <button
                  key={a.key}
                  type="button"
                  onClick={handleCancel}
                  disabled={!!loading}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-[11px] hover:bg-slate-100 text-red-600 disabled:opacity-50"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {a.label}
                </button>
              );
            }
            if (a.key === "completed") {
              return (
                <button
                  key={a.key}
                  type="button"
                  onClick={handleComplete}
                  disabled={!!loading}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-[11px] hover:bg-slate-100 disabled:opacity-50"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {a.label}
                </button>
              );
            }
            return (
              <button
                key={a.key}
                type="button"
                onClick={() => a.status && handleStatus(a.status)}
                disabled={!!loading}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-[11px] hover:bg-slate-100 disabled:opacity-50"
              >
                <Icon className="h-3.5 w-3.5" />
                {a.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

interface GlobalCalendarProps {
  defaultWeekStart?: Date;
}

const fetchCalendar = async (
  currentWeekStart: Date,
  setAppointments: React.Dispatch<React.SetStateAction<GlobalCalendarAppointment[]>>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setError: React.Dispatch<React.SetStateAction<string | null>>
) => {
  try {
    setIsLoading(true);
    setError(null);
    const startDate = currentWeekStart.toISOString();
    const endDate = addDays(currentWeekStart, 7).toISOString();
    const res = await adminAPI.getGlobalCalendar({ startDate, endDate });
    setAppointments(res.data || []);
  } catch (e: any) {
    console.error("Failed to load global calendar:", e);
    setError("Failed to load global calendar. Please try again.");
  } finally {
    setIsLoading(false);
  }
};

export const GlobalCalendar: React.FC<GlobalCalendarProps> = ({ defaultWeekStart }) => {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(
    defaultWeekStart
      ? startOfWeek(defaultWeekStart, { weekStartsOn: 1 })
      : startOfWeek(new Date(), { weekStartsOn: 1 }),
  );
  const [appointments, setAppointments] = useState<GlobalCalendarAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rescheduleApt, setRescheduleApt] = useState<GlobalCalendarAppointment | null>(null);
  const [editApt, setEditApt] = useState<GlobalCalendarAppointment | null>(null);

  const refetch = useMemo(
    () => () =>
      fetchCalendar(currentWeekStart, setAppointments, setIsLoading, setError),
    [currentWeekStart]
  );

  const daysOfWeek = useMemo(
    () =>
      eachDayOfInterval({
        start: currentWeekStart,
        end: endOfWeek(currentWeekStart, { weekStartsOn: 1 }),
      }),
    [currentWeekStart],
  );

  useEffect(() => {
    fetchCalendar(currentWeekStart, setAppointments, setIsLoading, setError);
  }, [currentWeekStart]);

  const groupedByDay = useMemo(() => {
    const map: Record<string, GlobalCalendarAppointment[]> = {};
    for (const day of daysOfWeek) {
      map[day.toDateString()] = [];
    }
    for (const apt of appointments) {
      const d = new Date(apt.startTime);
      const key = d.toDateString();
      if (!map[key]) map[key] = [];
      map[key].push(apt);
    }
    return map;
  }, [appointments, daysOfWeek]);

  const handlePrevWeek = () => {
    setCurrentWeekStart((prev) => addDays(prev, -7));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart((prev) => addDays(prev, 7));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarIcon className="h-5 w-5 text-blue-600" />
          <div>
            <h2 className="text-xl font-bold">Global Calendar (All Clinics)</h2>
            <p className="text-xs text-slate-500">
              BeautyDoctors clients in highlight color, other clinic appointments as blocked time.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="px-3 text-sm font-semibold">
            {format(daysOfWeek[0], "MMM d")} - {format(daysOfWeek[6], "MMM d, yyyy")}
          </div>
          <Button variant="outline" size="icon" onClick={handleNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-lg">
        <CardContent className="p-0">
          {isLoading && (
            <div className="p-6 text-sm text-slate-500">Loading global calendar...</div>
          )}
          {error && !isLoading && (
            <div className="p-6 text-sm text-red-600">{error}</div>
          )}
          {!isLoading && !error && (
            <div className="grid grid-cols-7 gap-px bg-slate-200 text-xs">
              {daysOfWeek.map((day) => {
                const dayKey = day.toDateString();
                const items = (groupedByDay[dayKey] || []).sort(
                  (a, b) =>
                    new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
                );

                return (
                  <div key={dayKey} className="bg-white flex flex-col min-h-[160px]">
                    <div className="sticky top-0 z-10 bg-slate-50 border-b px-2 py-1.5 flex justify-between items-center">
                      <div className="font-semibold text-slate-700">
                        {format(day, "EEE")}
                      </div>
                      <div className="text-[11px] font-bold text-slate-500">
                        {format(day, "d MMM")}
                      </div>
                    </div>
                    <div className="flex-1 divide-y">
                      {items.length === 0 && (
                        <div className="px-2 py-3 text-[11px] text-slate-400">
                          No appointments
                        </div>
                      )}
                      {items.map((apt) => {
                        const start = new Date(apt.startTime);
                        const end = new Date(apt.endTime);
                        const timeLabel =
                          format(start, "HH:mm") + " - " + format(end, "HH:mm");

                        const baseColor = apt.isBlocked
                          ? "bg-slate-100 border-slate-200 text-slate-500"
                          : apt.isBeautyDoctorsClient
                          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                          : "bg-sky-50 border-sky-200 text-sky-800";

                        return (
                          <div
                            key={apt.id}
                            className={`m-1 rounded-md border px-1.5 py-1.5 space-y-0.5 ${baseColor}`}
                          >
                            <div className="flex justify-between items-center gap-1">
                              <span className="text-[10px] font-bold uppercase tracking-wide">
                                {apt.isBlocked
                                  ? "Blocked Time"
                                  : apt.serviceName || "Appointment"}
                              </span>
                              <div className="flex items-center gap-0.5">
                                {apt.isBeautyDoctorsClient && !apt.isBlocked && (
                                  <span className="text-[9px] font-black px-1.5 rounded-full bg-emerald-600 text-white">
                                    BD
                                  </span>
                                )}
                                {!apt.isBlocked && (
                                  <AppointmentCardActions
                                    apt={apt}
                                    onActionDone={refetch}
                                    onReschedule={() => setRescheduleApt(apt)}
                                    onEdit={() => setEditApt(apt)}
                                  />
                                )}
                              </div>
                            </div>
                            {!apt.isBlocked && (
                              <div className="text-[10px] truncate">
                                {apt.clientName || "Client"}{" "}
                                {apt.providerName && (
                                  <span className="text-[9px] text-slate-600">
                                    · {apt.providerName}
                                  </span>
                                )}
                              </div>
                            )}
                            <div className="text-[9px] text-slate-600">{timeLabel}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {rescheduleApt && (
        <RescheduleModal
          isOpen={!!rescheduleApt}
          onClose={() => {
            setRescheduleApt(null);
            refetch();
          }}
          appointment={{
            id: rescheduleApt.id,
            clinicId: rescheduleApt.clinicId,
            serviceId: rescheduleApt.serviceId || "",
            providerId: rescheduleApt.providerId || undefined,
            startTime: rescheduleApt.startTime,
            endTime: rescheduleApt.endTime,
            clinic: { id: rescheduleApt.clinicId, name: "Clinic" },
            service: { id: rescheduleApt.serviceId, name: rescheduleApt.serviceName },
          } as any}
        />
      )}

      {editApt && (
        <CRMBookingModal
          isOpen={!!editApt}
          customerId={editApt.clientId || undefined}
          customerName={editApt.clientName}
          onClose={() => {
            setEditApt(null);
            refetch();
          }}
          initialAppointment={editApt}
          onSuccess={() => {
            setEditApt(null);
            refetch();
          }}
        />
      )}
    </div>
  );
};

export default GlobalCalendar;
