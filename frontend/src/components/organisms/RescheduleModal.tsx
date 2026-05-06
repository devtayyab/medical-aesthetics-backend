import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { format } from "date-fns";
import { X, Calendar, Clock } from "lucide-react";
import { AppDispatch, RootState } from "@/store";
import { fetchAvailability, rescheduleAppointment } from "@/store/slices/bookingSlice";
import { Button } from "@/components/atoms/Button/Button";
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
            // Reset state when opening
            setSelectedDate("");
            setSelectedSlot(null);
            setRescheduleNotes("");
            // Clear any previous errors
            dispatch({ type: 'booking/clearError' });
        }
    }, [isOpen, dispatch]);

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const date = e.target.value;
        setSelectedDate(date);
        setSelectedSlot(null);

        // More robust ID extraction
        const clinicId = appointment.clinicId || appointment.clinic?.id;
        const serviceId = appointment.serviceId || appointment.service?.id;
        const providerId = appointment.providerId || appointment.provider?.id;

        console.log("Rescheduling - Context Check:", { 
            clinicId, 
            serviceId, 
            providerId,
            appointmentId: appointment.id 
        });

        if (date && clinicId && serviceId) {
            dispatch(
                fetchAvailability({
                    clinicId,
                    serviceId,
                    providerId,
                    date: date,
                })
            );
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

            // Refresh the appointments list in the parent
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
            <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden border border-gray-100">
                {/* Header */}
                <div className="flex items-center justify-between p-8 border-b border-gray-50">
                    <div>
                        <h3 className="text-xl font-black uppercase italic text-gray-900 tracking-tight">Reschedule</h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Select your new time slot</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="size-10 rounded-full hover:bg-gray-50 flex items-center justify-center transition-all"
                    >
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 space-y-8">
                    {/* Current Appointment Info */}
                    <div className="bg-gray-50 p-6 rounded-[24px] border border-gray-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 italic">Current Slot</p>
                        <div className="space-y-1">
                            <p className="text-sm font-black text-gray-900 uppercase italic">
                                {format(new Date(appointment.startTime), "PPP")}
                            </p>
                            <p className="text-xs font-bold text-lime-600 uppercase tracking-widest">
                                {format(new Date(appointment.startTime), "p")}
                            </p>
                        </div>
                    </div>

                    {/* Date Selection */}
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 italic">
                            Select New Date
                        </label>
                        <div className="relative">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="date"
                                min={new Date().toISOString().split("T")[0]}
                                value={selectedDate}
                                onChange={handleDateChange}
                                className="w-full pl-12 pr-4 h-14 bg-gray-50 border border-gray-100 rounded-2xl focus:border-[#CBFF38] outline-none transition-all font-bold text-sm"
                            />
                        </div>
                    </div>

                    {/* Slots Selection */}
                    {selectedDate && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 italic">
                                Available Slots
                            </label>

                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-10 gap-4">
                                    <div className="size-10 border-2 border-[#CBFF38] border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Checking Availability</span>
                                </div>
                            ) : availableSlots.length > 0 ? (
                                <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-2 scrollbar-hide">
                                    {availableSlots.map((slot, index) => {
                                        const isSelected = selectedSlot?.startTime === slot.startTime;
                                        return (
                                            <button
                                                key={index}
                                                onClick={() => setSelectedSlot(slot)}
                                                className={`flex items-center justify-center gap-2 h-12 rounded-xl border text-[11px] font-black uppercase tracking-widest italic transition-all ${isSelected
                                                    ? "bg-black text-[#CBFF38] border-black shadow-xl scale-95"
                                                    : "bg-white border-gray-100 text-gray-400 hover:border-black hover:text-black"
                                                    }`}
                                            >
                                                <Clock size={12} />
                                                {format(new Date(slot.startTime), "p")}
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="bg-red-50 p-6 rounded-2xl border border-red-100 text-center">
                                    <p className="text-[10px] font-black text-red-600 uppercase tracking-widest italic">
                                        {bookingError || "No slots available for this date."}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Reschedule Notes */}
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 italic">
                            Reason for Rescheduling (Optional)
                        </label>
                        <textarea
                            value={rescheduleNotes}
                            onChange={(e) => setRescheduleNotes(e.target.value)}
                            placeholder="Please explain why you need to reschedule..."
                            className="w-full p-5 min-h-[100px] bg-gray-50 border border-gray-100 rounded-2xl focus:border-[#CBFF38] outline-none transition-all font-bold text-sm resize-none"
                        />
                    </div>

                    {/* Missing Data Errors */}
                    {(!appointment.clinicId && !appointment.clinic?.id) && (
                        <div className="p-4 bg-red-50 text-red-700 rounded-2xl text-[10px] font-black uppercase italic border border-red-100">
                            Error: Clinic context missing.
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-8 bg-gray-50 border-t border-gray-100 flex gap-4">
                    <button 
                        onClick={onClose}
                        className="flex-1 h-14 rounded-2xl text-[11px] font-black uppercase tracking-widest italic text-gray-400 hover:text-black transition-colors"
                    >
                        Discard
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!selectedSlot || isLoading}
                        className="flex-1 h-14 bg-[#CBFF38] disabled:bg-gray-100 disabled:text-gray-300 text-black rounded-2xl text-[11px] font-black uppercase tracking-widest italic shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
                    >
                        Confirm Slot
                    </button>
                </div>
            </div>
        </div>
    );
};
