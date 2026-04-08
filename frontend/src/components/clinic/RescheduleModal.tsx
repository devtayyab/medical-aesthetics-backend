import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Appointment } from '../../types/clinic.types';
import { bookingAPI } from '../../services/api';

interface RescheduleModalProps {
    appointment: Appointment;
    onClose: () => void;
    onReschedule: (startTime: string, endTime: string, reason: string) => Promise<void>;
}

const RescheduleModal: React.FC<RescheduleModalProps> = ({ appointment, onClose, onReschedule }) => {
    const [newDate, setNewDate] = useState(appointment.startTime.split('T')[0]);
    const [selectedSlot, setSelectedSlot] = useState<any>(null);
    const [availableSlots, setAvailableSlots] = useState<any[]>([]);
    const [reason, setReason] = useState('');
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchSlots();
    }, [newDate]);

    const fetchSlots = async () => {
        if (!newDate) return;
        setIsLoadingSlots(true);
        setError(null);
        try {
            const response = await bookingAPI.getAvailability({
                clinicId: appointment.clinicId,
                serviceId: appointment.serviceId,
                providerId: appointment.providerId,
                date: newDate
            });
            setAvailableSlots(response.data.slots || []);
            setSelectedSlot(null); // Reset selection when date changes
        } catch (err: any) {
            console.error('Failed to fetch slots:', err);
            setError('Could not load available time slots for this date.');
        } finally {
            setIsLoadingSlots(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSlot) {
            setError('Please select an available time slot.');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            await onReschedule(selectedSlot.startTime, selectedSlot.endTime, reason);
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Failed to reschedule appointment');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border-t-8 border-blue-600 overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Reschedule Appointment</h2>
                        <p className="text-sm text-gray-500">Change date and time for #{appointment.id.slice(0, 8)}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6 text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto p-6 flex-1">
                    <div className="space-y-6">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl flex items-center gap-3 text-sm">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Select New Date</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="date"
                                        required
                                        min={new Date().toISOString().split('T')[0]}
                                        value={newDate}
                                        onChange={(e) => setNewDate(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 font-medium"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Available Slots</label>
                                {isLoadingSlots ? (
                                    <div className="flex justify-center py-8">
                                        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                                    </div>
                                ) : availableSlots.length > 0 ? (
                                    <div className="grid grid-cols-3 gap-2">
                                        {availableSlots.map((slot, index) => {
                                            const isSelected = selectedSlot?.startTime === slot.startTime;
                                            const timeStr = new Date(slot.startTime).toLocaleTimeString('en-US', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                hour12: true
                                            });

                                            return (
                                                <button
                                                    key={index}
                                                    type="button"
                                                    onClick={() => setSelectedSlot(slot)}
                                                    className={`p-3 text-sm font-bold border-2 rounded-xl transition-all flex flex-col items-center gap-1 ${isSelected
                                                            ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-100'
                                                            : 'border-gray-100 hover:border-blue-200 text-gray-600 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    <Clock className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                                                    {timeStr}
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-500 text-sm">
                                        No slots available for this date
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Reason (Optional)</label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Why is the appointment being rescheduled?"
                                    rows={2}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none bg-gray-50 text-sm"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="p-6 border-t border-gray-100 flex-shrink-0 bg-gray-50">
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-4 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-200 transition-all font-bold"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !selectedSlot}
                            className="flex-[2] px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:shadow-none transition-all font-bold shadow-lg shadow-blue-200 flex items-center justify-center gap-2 group"
                        >
                            {isSubmitting ? (
                                <RefreshCw className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Reschedule
                                    <CheckCircle2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RescheduleModal;
