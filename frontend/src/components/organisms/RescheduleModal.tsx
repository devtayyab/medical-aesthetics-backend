import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { format } from "date-fns";
import { X, Calendar, Clock, ArrowRight, CheckCircle2 } from "lucide-react";
import { AppDispatch, RootState } from "@/store";
import { fetchAvailability, rescheduleAppointment, fetchUserAppointments } from "@/store/slices/bookingSlice";
import { Appointment } from "@/types";

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment;
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({
  isOpen,
  onClose,
  appointment,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<{ startTime: string; endTime: string } | null>(null);
  const [rescheduleNotes, setRescheduleNotes] = useState<string>("");
  const { availableSlots, isLoading, error: bookingError } = useSelector((state: RootState) => state.booking);

  useEffect(() => {
    if (isOpen) {
      setSelectedDate("");
      setSelectedSlot(null);
      setRescheduleNotes("");
      dispatch({ type: 'booking/clearError' });
    }
  }, [isOpen, dispatch]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    setSelectedDate(date);
    setSelectedSlot(null);

    const clinicId = appointment.clinicId || appointment.clinic?.id;
    const serviceId = appointment.serviceId || appointment.service?.id;
    const providerId = appointment.providerId || appointment.provider?.id;

    if (date && clinicId && serviceId) {
      dispatch(fetchAvailability({ clinicId, serviceId, providerId, date }));
    }
  };

  const handleConfirm = async () => {
    if (!selectedSlot) return;
    try {
      await dispatch(
        rescheduleAppointment({
          id: appointment.id,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          notes: rescheduleNotes,
        })
      ).unwrap();
      dispatch(fetchUserAppointments());
      alert("Appointment rescheduled successfully!");
      onClose();
    } catch (error) {
      alert("Failed to reschedule appointment. Please try again.");
      console.error("Reschedule Error:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)" }}
    >
      <div
        className="w-full max-w-md flex flex-col"
        style={{
          background: "#fff",
          borderRadius: 32,
          boxShadow: "0 40px 100px rgba(0,0,0,0.25)",
          border: "1px solid rgba(0,0,0,0.06)",
          maxHeight: "92vh",
          overflow: "hidden",
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            background: "linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)",
            padding: "28px 28px 24px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* decorative accent */}
          <div
            style={{
              position: "absolute",
              top: -40,
              right: -40,
              width: 140,
              height: 140,
              background: "radial-gradient(circle, rgba(203,255,56,0.18) 0%, transparent 70%)",
              borderRadius: "50%",
            }}
          />
          <div className="flex items-start justify-between relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Calendar size={14} color="#CBFF38" />
                <span style={{ fontSize: 10, fontWeight: 900, color: "#CBFF38", letterSpacing: "0.2em", textTransform: "uppercase" }}>
                  Appointment
                </span>
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 900, color: "#fff", textTransform: "uppercase", letterSpacing: "-0.5px", margin: 0 }}>
                Reschedule
              </h3>
              <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.2em", marginTop: 4 }}>
                Select a new date & time slot
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 36, height: 36,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
                transition: "background 0.2s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.16)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
            >
              <X size={16} color="rgba(255,255,255,0.6)" />
            </button>
          </div>

          {/* current slot pill */}
          <div
            style={{
              marginTop: 20,
              background: "rgba(203,255,56,0.1)",
              border: "1px solid rgba(203,255,56,0.25)",
              borderRadius: 16,
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              position: "relative",
              zIndex: 10,
            }}
          >
            <div>
              <p style={{ fontSize: 9, fontWeight: 900, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: 4 }}>
                Current Slot
              </p>
              <p style={{ fontSize: 13, fontWeight: 900, color: "#fff", textTransform: "uppercase", margin: 0 }}>
                {format(new Date(appointment.startTime), "PPP")}
              </p>
            </div>
            <div
              style={{
                background: "#CBFF38",
                borderRadius: 10,
                padding: "6px 12px",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Clock size={12} color="#000" />
              <span style={{ fontSize: 14, fontWeight: 900, color: "#000", letterSpacing: "0.05em" }}>
                {format(new Date(appointment.startTime), "HH:mm")}
              </span>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20, overflowY: "auto", flex: 1 }}>

          {/* Date picker */}
          <div>
            <label style={{ display: "block", fontSize: 9, fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: 8 }}>
              Select New Date
            </label>
            <div style={{ position: "relative" }}>
              <Calendar
                size={16}
                color="#9ca3af"
                style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
              />
              <input
                type="date"
                min={new Date().toISOString().split("T")[0]}
                value={selectedDate}
                onChange={handleDateChange}
                style={{
                  width: "100%",
                  height: 52,
                  paddingLeft: 42,
                  paddingRight: 16,
                  background: "#f9fafb",
                  border: "1.5px solid #f1f5f9",
                  borderRadius: 14,
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#111",
                  outline: "none",
                  transition: "border-color 0.2s",
                  boxSizing: "border-box",
                }}
                onFocus={e => (e.target.style.borderColor = "#CBFF38")}
                onBlur={e => (e.target.style.borderColor = "#f1f5f9")}
              />
            </div>
          </div>

          {/* Slots */}
          {selectedDate && (
            <div>
              <label style={{ display: "block", fontSize: 9, fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: 8 }}>
                Available Slots
              </label>

              {isLoading ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 0", gap: 12 }}>
                  <div
                    style={{
                      width: 36, height: 36,
                      border: "3px solid #CBFF38",
                      borderTopColor: "transparent",
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite",
                    }}
                  />
                  <span style={{ fontSize: 10, fontWeight: 900, color: "#d1d5db", textTransform: "uppercase", letterSpacing: "0.2em" }}>
                    Checking Availability
                  </span>
                </div>
              ) : availableSlots.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, maxHeight: 180, overflowY: "auto", paddingRight: 4 }}>
                  {availableSlots.map((slot, index) => {
                    const isSelected = selectedSlot?.startTime === slot.startTime;
                    return (
                      <button
                        key={index}
                        onClick={() => setSelectedSlot(slot)}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 4,
                          height: 56,
                          borderRadius: 12,
                          border: isSelected ? "2px solid #000" : "1.5px solid #f1f5f9",
                          background: isSelected ? "#000" : "#f9fafb",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                          transform: isSelected ? "scale(0.97)" : "scale(1)",
                        }}
                        onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.borderColor = "#000"; e.currentTarget.style.background = "#f1f5f9"; } }}
                        onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.borderColor = "#f1f5f9"; e.currentTarget.style.background = "#f9fafb"; } }}
                      >
                        {isSelected
                          ? <CheckCircle2 size={12} color="#CBFF38" />
                          : <Clock size={12} color="#9ca3af" />
                        }
                        <span style={{ fontSize: 12, fontWeight: 900, color: isSelected ? "#CBFF38" : "#374151", letterSpacing: "0.05em" }}>
                          {format(new Date(slot.startTime), "HH:mm")}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 14, padding: "16px", textAlign: "center" }}>
                  <p style={{ fontSize: 10, fontWeight: 900, color: "#dc2626", textTransform: "uppercase", letterSpacing: "0.15em", margin: 0 }}>
                    {bookingError || "No slots available for this date."}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label style={{ display: "block", fontSize: 9, fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: 8 }}>
              Reason for Rescheduling <span style={{ fontWeight: 600, textTransform: "none", color: "#d1d5db" }}>(optional)</span>
            </label>
            <textarea
              value={rescheduleNotes}
              onChange={(e) => setRescheduleNotes(e.target.value)}
              placeholder="Please explain why you need to reschedule..."
              rows={3}
              style={{
                width: "100%",
                padding: "14px 16px",
                background: "#f9fafb",
                border: "1.5px solid #f1f5f9",
                borderRadius: 14,
                fontSize: 13,
                fontWeight: 600,
                color: "#111",
                outline: "none",
                resize: "none",
                transition: "border-color 0.2s",
                boxSizing: "border-box",
                fontFamily: "inherit",
              }}
              onFocus={e => (e.target.style.borderColor = "#CBFF38")}
              onBlur={e => (e.target.style.borderColor = "#f1f5f9")}
            />
          </div>

          {/* Missing context error */}
          {(!appointment.clinicId && !appointment.clinic?.id) && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "12px 16px" }}>
              <p style={{ fontSize: 10, fontWeight: 900, color: "#dc2626", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>
                Error: Clinic context missing.
              </p>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div
          style={{
            display: "flex",
            gap: 12,
            padding: "16px 28px 28px",
            borderTop: "1px solid #f1f5f9",
            background: "#fff",
            flexShrink: 0,
          }}
        >
          <button
            onClick={onClose}
            style={{
              flex: 1,
              height: 52,
              borderRadius: 14,
              border: "1.5px solid #f1f5f9",
              background: "#f9fafb",
              fontSize: 11,
              fontWeight: 900,
              color: "#6b7280",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = "#111"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#f9fafb"; e.currentTarget.style.color = "#6b7280"; }}
          >
            Discard
          </button>

          <button
            onClick={handleConfirm}
            disabled={!selectedSlot || isLoading}
            style={{
              flex: 2,
              height: 52,
              borderRadius: 14,
              border: "none",
              background: !selectedSlot || isLoading ? "#f1f5f9" : "#CBFF38",
              fontSize: 11,
              fontWeight: 900,
              color: !selectedSlot || isLoading ? "#d1d5db" : "#000",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              cursor: !selectedSlot || isLoading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "all 0.2s",
              boxShadow: !selectedSlot || isLoading ? "none" : "0 8px 24px rgba(203,255,56,0.35)",
            }}
          >
            Confirm Slot
            {selectedSlot && !isLoading && <ArrowRight size={14} />}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};
