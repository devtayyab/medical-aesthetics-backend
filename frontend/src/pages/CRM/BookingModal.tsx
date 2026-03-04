import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store';
import { fetchLeads } from '@/store/slices/crmSlice';
import { searchClinics, fetchClinicServices } from '@/store/slices/clinicsSlice';
import { createAppointment } from '@/store/slices/bookingSlice';
import { X, Calendar, Clock, User, Scissors, Building2 } from 'lucide-react';
import { Button } from '@/components/atoms/Button/Button';
import { format, addMinutes } from 'date-fns';

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialDate?: Date;
    initialProviderId?: string;
    initialClinicId?: string;
    initialServiceId?: string;
}

export const BookingModal: React.FC<BookingModalProps> = ({
    isOpen,
    onClose,
    initialDate,
    initialProviderId,
    initialClinicId,
    initialServiceId
}) => {
    const dispatch = useDispatch<AppDispatch>();

    // Store states
    const { salespersons, leads } = useSelector((state: RootState) => state.crm);
    const { clinics, services } = useSelector((state: RootState) => state.clinics);
    const { isLoading } = useSelector((state: RootState) => state.booking);

    // Form state
    const [formData, setFormData] = useState({
        clientId: '',
        clinicId: initialClinicId || '',
        serviceId: initialServiceId || '',
        providerId: initialProviderId === 'all' ? '' : (initialProviderId || ''),
        date: format(initialDate || new Date(), 'yyyy-MM-dd'),
        time: '10:00',
        notes: '',
    });

    // Load initial data
    useEffect(() => {
        if (isOpen) {
            dispatch(fetchLeads({}));
            dispatch(searchClinics({}));
        }
    }, [isOpen, dispatch]);

    // When clinic changes, load its services
    useEffect(() => {
        if (formData.clinicId) {
            dispatch(fetchClinicServices(formData.clinicId));
        }
    }, [formData.clinicId, dispatch]);

    // Update time/date if initial changes
    useEffect(() => {
        if (isOpen) {
            setFormData(prev => ({
                ...prev,
                date: initialDate ? format(initialDate, 'yyyy-MM-dd') : prev.date,
                providerId: initialProviderId === 'all' ? '' : (initialProviderId || prev.providerId),
                clinicId: initialClinicId || prev.clinicId,
                serviceId: initialServiceId || prev.serviceId,
            }));
        }
    }, [initialDate, initialProviderId, initialClinicId, initialServiceId, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.clientId || !formData.clinicId || !formData.serviceId || !formData.date || !formData.time) {
            return alert('Please fill in all required fields');
        }

        const selectedService = services.find(s => s.id === formData.serviceId);
        const durationMinutes = selectedService?.durationMinutes || 60;

        // Combine date and time
        const startDateTimeObj = new Date(`${formData.date}T${formData.time}:00`);
        const endDateTimeObj = addMinutes(startDateTimeObj, durationMinutes);

        try {
            await dispatch(createAppointment({
                clinicId: formData.clinicId,
                serviceId: formData.serviceId,
                providerId: formData.providerId || undefined,
                clientId: formData.clientId,
                startTime: startDateTimeObj.toISOString(),
                endTime: endDateTimeObj.toISOString(),
                notes: formData.notes,
            })).unwrap();

            onClose();
            // Reset state or show success
        } catch (error: any) {
            console.error('Booking error:', error);
            alert(error?.message || 'Failed to book appointment');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-xl font-bold text-gray-900">New Appointment</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors bg-white hover:bg-gray-100 rounded-full p-2 border border-gray-200/50">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Client Selection */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                            <User className="w-4 h-4 text-indigo-500" /> Client
                        </label>
                        <select
                            required
                            value={formData.clientId}
                            onChange={e => setFormData({ ...formData, clientId: e.target.value })}
                            className="w-full h-10 px-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                        >
                            <option value="">Select a client...</option>
                            {leads.map(lead => (
                                <option key={lead.id} value={lead.id}>
                                    {lead.firstName} {lead.lastName} {lead.email ? `(${lead.email})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Clinic Selection */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                                <Building2 className="w-4 h-4 text-indigo-500" /> Clinic
                            </label>
                            <select
                                required
                                value={formData.clinicId}
                                onChange={e => setFormData({ ...formData, clinicId: e.target.value, serviceId: '' })}
                                className="w-full h-10 px-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                            >
                                <option value="">Select clinic...</option>
                                {clinics.map(clinic => (
                                    <option key={clinic.id} value={clinic.id}>{clinic.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Provider Selection */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                                <User className="w-4 h-4 text-indigo-500" /> Provider
                            </label>
                            <select
                                value={formData.providerId}
                                onChange={e => setFormData({ ...formData, providerId: e.target.value })}
                                className="w-full h-10 px-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                            >
                                <option value="">Any Provider</option>
                                {salespersons.map(s => (
                                    <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Service Selection */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                            <Scissors className="w-4 h-4 text-indigo-500" /> Service
                        </label>
                        <select
                            required
                            disabled={!formData.clinicId}
                            value={formData.serviceId}
                            onChange={e => setFormData({ ...formData, serviceId: e.target.value })}
                            className="w-full h-10 px-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm disabled:bg-gray-50 disabled:text-gray-400"
                        >
                            <option value="">Select service...</option>
                            {services.map(service => (
                                <option key={service.id} value={service.id}>
                                    {service.name} ({service.durationMinutes} min) - ${service.price}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Date */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                                <Calendar className="w-4 h-4 text-indigo-500" /> Date
                            </label>
                            <input
                                required
                                type="date"
                                value={formData.date}
                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                                className="w-full h-10 px-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                            />
                        </div>

                        {/* Time */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                                <Clock className="w-4 h-4 text-indigo-500" /> Time
                            </label>
                            <input
                                required
                                type="time"
                                value={formData.time}
                                onChange={e => setFormData({ ...formData, time: e.target.value })}
                                className="w-full h-10 px-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700">Notes (Optional)</label>
                        <textarea
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm min-h-[80px]"
                            placeholder="Add any specific notes for this appointment..."
                        />
                    </div>

                    {/* Actions */}
                    <div className="pt-4 flex justify-end gap-3 mt-6 border-t border-gray-100">
                        <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100 font-bold" disabled={isLoading}>
                            {isLoading ? 'Booking...' : 'Book Appointment'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
