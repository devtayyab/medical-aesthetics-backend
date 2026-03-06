import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, Calendar, Clock, ChevronRight, CheckCircle } from 'lucide-react';
import { clinicsAPI, bookingAPI } from '@/services/api';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { format } from 'date-fns';

interface ClinicBookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    clinicId: string;
}

const ClinicBookingModal: React.FC<ClinicBookingModalProps> = ({ isOpen, onClose, onSuccess, clinicId }) => {
    const { user } = useSelector((state: RootState) => state.auth);

    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form Data
    const [clientData, setClientData] = useState({
        fullName: '',
        phone: '',
        email: '',
    });

    const [services, setServices] = useState<any[]>([]);
    const [providers, setProviders] = useState<any[]>([]);
    const [selectedService, setSelectedService] = useState<string>('');
    const [selectedProvider, setSelectedProvider] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
    const [availableSlots, setAvailableSlots] = useState<any[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<any>(null);

    useEffect(() => {
        if (isOpen && clinicId) {
            fetchClinicData();
        }
    }, [isOpen, clinicId]);

    const fetchClinicData = async () => {
        setIsLoading(true);
        try {
            const [servicesRes, clinicRes] = await Promise.all([
                clinicsAPI.getServices(clinicId),
                clinicsAPI.getById(clinicId)
            ]);
            setServices(servicesRes.data || []);
            // Assuming staff is returned in clinic details
            setProviders(clinicRes.data.staff || []);
        } catch (err) {
            console.error('Failed to fetch clinic data', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (selectedService && selectedDate) {
            fetchSlots();
        }
    }, [selectedService, selectedDate, selectedProvider]);

    const fetchSlots = async () => {
        try {
            const res = await bookingAPI.getAvailability({
                clinicId,
                serviceId: selectedService,
                providerId: selectedProvider || undefined,
                date: selectedDate
            });
            setAvailableSlots(res.data.slots || res.data || []);
        } catch (err) {
            console.error('Failed to fetch slots', err);
        }
    };

    const handleSubmit = async () => {
        if (!selectedSlot || !clientData.fullName || !clientData.phone) {
            setError('Please fill required fields (Name, Phone and Time slot)');
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            await bookingAPI.createAppointment({
                clinicId,
                serviceId: selectedService,
                providerId: selectedSlot.providerId,
                clientId: '00000000-0000-0000-0000-000000000000', // Backend handles walk-in via clientDetails
                startTime: selectedSlot.startTime,
                endTime: selectedSlot.endTime,
                clientDetails: clientData,
            });
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create appointment');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b flex items-center justify-between bg-gray-50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Direct Booking</h2>
                        <p className="text-sm text-gray-500">Add a walk-in or phone appointment</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Progress Indicators */}
                    <div className="flex items-center justify-center gap-4">
                        {[1, 2, 3].map((s) => (
                            <div key={s} className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step === s ? 'bg-blue-600 text-white' : step > s ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                                    }`}>
                                    {step > s ? <CheckCircle className="w-5 h-5" /> : s}
                                </div>
                                {s < 3 && <div className={`w-12 h-0.5 ${step > s ? 'bg-green-500' : 'bg-gray-200'}`} />}
                            </div>
                        ))}
                    </div>

                    {/* Step 1: Client Info */}
                    {step === 1 && (
                        <div className="space-y-4 animate-in fade-in duration-300">
                            <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Client Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Full Name *</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="e.g. John Doe"
                                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={clientData.fullName}
                                            onChange={(e) => setClientData({ ...clientData, fullName: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Mobile Number *</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="tel"
                                            placeholder="+1 234..."
                                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={clientData.phone}
                                            onChange={(e) => setClientData({ ...clientData, phone: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="md:col-span-2 space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Email Address (Optional)</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="email"
                                            placeholder="john@example.com"
                                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={clientData.email}
                                            onChange={(e) => setClientData({ ...clientData, email: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Service & Staff */}
                    {step === 2 && (
                        <div className="space-y-4 animate-in fade-in duration-300">
                            <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Service & Selection</h3>
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Select Service *</label>
                                    <select
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                        value={selectedService}
                                        onChange={(e) => setSelectedService(e.target.value)}
                                    >
                                        <option value="">Choose a treatment...</option>
                                        {services.map(s => (
                                            <option key={s.id} value={s.id}>
                                                {s.treatment?.name || s.name || 'Unnamed Service'} - ${s.price}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Prefer Staff member (Optional)</label>
                                    <select
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                        value={selectedProvider}
                                        onChange={(e) => setSelectedProvider(e.target.value)}
                                    >
                                        <option value="">Any Staff Member</option>
                                        {providers.map(p => (
                                            <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Date & Time */}
                    {step === 3 && (
                        <div className="space-y-4 animate-in fade-in duration-300">
                            <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Schedule Time</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Select Date</label>
                                    <input
                                        type="date"
                                        min={format(new Date(), 'yyyy-MM-dd')}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Select Slot *</label>
                                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2">
                                        {availableSlots.map((slot, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setSelectedSlot(slot)}
                                                className={`p-2 text-xs font-bold border rounded-lg transition-all ${selectedSlot === slot ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-blue-50'
                                                    }`}
                                            >
                                                {format(new Date(slot.startTime), 'HH:mm')}
                                            </button>
                                        ))}
                                        {availableSlots.length === 0 && (
                                            <p className="col-span-2 text-center py-4 text-gray-400 text-sm">No slots available for this date.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t bg-gray-50 flex items-center justify-between">
                    <button
                        onClick={() => step > 1 ? setStep(step - 1) : onClose()}
                        className="px-6 py-2 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        {step === 1 ? 'Cancel' : 'Back'}
                    </button>

                    <button
                        onClick={() => {
                            if (step < 3) {
                                if (step === 1 && (!clientData.fullName || !clientData.phone)) {
                                    setError('Please provide Name and Phone number');
                                    return;
                                }
                                if (step === 2 && !selectedService) {
                                    setError('Please select a service');
                                    return;
                                }
                                setStep(step + 1);
                                setError(null);
                            } else {
                                handleSubmit();
                            }
                        }}
                        disabled={isLoading}
                        className="px-8 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm font-bold"
                    >
                        {isLoading ? 'Processing...' : step === 3 ? 'Confirm Booking' : 'Continue'}
                        {step < 3 && <ChevronRight className="w-4 h-4" />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ClinicBookingModal;
