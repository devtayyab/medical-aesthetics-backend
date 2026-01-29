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
    const { availableSlots, isLoading } = useSelector((state: RootState) => state.booking);

    useEffect(() => {
        if (isOpen) {
            // Reset state when opening
            setSelectedDate("");
            setSelectedSlot(null);
        }
    }, [isOpen]);

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const date = e.target.value;
        setSelectedDate(date);
        setSelectedSlot(null);

        const clinicId = appointment.clinicId || appointment.clinic?.id;
        const serviceId = appointment.serviceId || appointment.service?.id;
        const providerId = appointment.providerId || appointment.provider?.id;

        console.log("Date selected:", date);
        console.log("Appointment Context:", { clinicId, serviceId, providerId });

        if (date && clinicId && serviceId) {
            dispatch(
                fetchAvailability({
                    clinicId,
                    serviceId,
                    providerId,
                    date: date,
                })
            );
        } else {
            console.warn("Missing clinicId or serviceId for availability check");
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
                })
            ).unwrap();

            alert("Appointment rescheduled successfully!");
            onClose();
        } catch (error) {
            alert("Failed to reschedule appointment. Please try again.");
            console.error(error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900">Reschedule Appointment</h3>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Current Appointment Info */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-blue-800 font-medium">Current Appointment</p>
                        <p className="text-sm text-blue-600 mt-1">
                            {format(new Date(appointment.startTime), "PPP")} at{" "}
                            {format(new Date(appointment.startTime), "p")}
                        </p>
                        <p className="text-sm text-blue-600">
                            {appointment.service?.name} with {appointment.clinic?.name}
                        </p>
                    </div>

                    {/* Date Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select New Date
                        </label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="date"
                                min={new Date().toISOString().split("T")[0]}
                                value={selectedDate}
                                onChange={handleDateChange}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Slots Selection */}
                    {selectedDate && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Available Time Slots
                            </label>

                            {isLoading ? (
                                <div className="flex justify-center py-4">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                </div>
                            ) : availableSlots.length > 0 ? (
                                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                                    {availableSlots.map((slot, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setSelectedSlot(slot)}
                                            className={`flex items-center justify-center gap-2 p-2 rounded-lg border text-sm transition-all ${selectedSlot === slot
                                                ? "border-blue-500 bg-blue-50 text-blue-700 font-medium ring-1 ring-blue-500"
                                                : "border-gray-200 hover:border-blue-300 hover:bg-gray-50 text-gray-700"
                                                }`}
                                        >
                                            <Clock size={14} />
                                            {format(new Date(slot.startTime), "p")}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 text-center py-4">
                                    No slots available for this date.
                                </p>
                            )}
                        </div>
                    )}

                    {/* Context Error */}
                    {(!appointment.clinicId && !appointment.clinic) && (
                        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                            Error: Clinic information is missing for this appointment. Cannot reschedule.
                        </div>
                    )}
                    {(!appointment.serviceId && !appointment.service) && (
                        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm mt-2">
                            Error: Service information is missing for this appointment. Cannot reschedule.
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                    <Button variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={!selectedSlot || isLoading}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        Confirm Reschedule
                    </Button>
                </div>
            </div>
        </div>
    );
};
