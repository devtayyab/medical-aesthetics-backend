import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store';
import { fetchClinicAppointments } from '@/store/slices/bookingSlice';
import { X, Calendar as CalendarIcon, Clock, TrendingUp, Plus } from 'lucide-react';
import { Button } from '@/components/atoms/Button/Button';
import { Card, CardContent } from '@/components/molecules/Card/Card';
import { format, isSameDay, isSameWeek, isSameMonth } from 'date-fns';
import { BookingModal } from '@/pages/CRM/BookingModal'; // The normal booking modal

interface SalesBookingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    salespersonId?: string;
}

export const SalesBookingsModal: React.FC<SalesBookingsModalProps> = ({ isOpen, onClose }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { user } = useSelector((state: RootState) => state.auth);
    const { appointments, isLoading } = useSelector((state: RootState) => state.booking);

    const [showNewBooking, setShowNewBooking] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Fetch appointments. The backend limits this based on who is logged in.
            // If we are a salesperson, we will automatically see our own bookings 
            // (or bookings where we are provider or client). 
            dispatch(fetchClinicAppointments({}));
        }
    }, [isOpen, dispatch]);

    if (!isOpen) return null;

    // Filter appointments for the targeted salesperson if supplied, otherwise use the fetched set
    // In many cases, the backend already filtered it to the logged-in user.
    const relevantAppointments = appointments;

    const today = new Date();
    const todayBookings = relevantAppointments.filter(apt => apt.startTime && isSameDay(new Date(apt.startTime), today));
    const weekBookings = relevantAppointments.filter(apt => apt.startTime && isSameWeek(new Date(apt.startTime), today, { weekStartsOn: 1 }));
    const monthBookings = relevantAppointments.filter(apt => apt.startTime && isSameMonth(new Date(apt.startTime), today));

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-blue-50/30">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600 rounded-xl shadow-sm">
                            <CalendarIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">My Bookings Overview</h2>
                            <p className="text-xs text-gray-500 font-medium">Track your appointment conversions</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={() => setShowNewBooking(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-200"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            New Booking
                        </Button>
                        <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <Card className="border-none shadow-sm shadow-blue-100/50 bg-white group hover:shadow-md transition-all">
                            <CardContent className="p-5 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                                    <Clock className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Today</p>
                                    <h3 className="text-2xl font-black text-gray-800">{todayBookings.length}</h3>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm shadow-indigo-100/50 bg-white group hover:shadow-md transition-all">
                            <CardContent className="p-5 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                                    <TrendingUp className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">This Week</p>
                                    <h3 className="text-2xl font-black text-gray-800">{weekBookings.length}</h3>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm shadow-purple-100/50 bg-white group hover:shadow-md transition-all">
                            <CardContent className="p-5 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                                    <CalendarIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">This Month</p>
                                    <h3 className="text-2xl font-black text-gray-800">{monthBookings.length}</h3>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recent Bookings List */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center bg-white sticky top-0">
                            <h3 className="font-bold text-gray-800">Recent Bookings Log</h3>
                        </div>
                        {isLoading ? (
                            <div className="py-12 flex flex-col items-center justify-center gap-3">
                                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Loading Records...</span>
                            </div>
                        ) : relevantAppointments.length > 0 ? (
                            <div className="divide-y divide-gray-50">
                                {relevantAppointments.slice().sort((a, b) => new Date(b.startTime as string).getTime() - new Date(a.startTime as string).getTime()).slice(0, 50).map(apt => (
                                    <div key={apt.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-900 text-sm">{apt.displayName || 'Appointment'}</span>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wider">
                                                    {apt.serviceName || 'Service'}
                                                </span>
                                                <span className="text-xs text-gray-500 font-medium">
                                                    {apt.startTime ? format(new Date(apt.startTime), 'MMM do, yyyy h:mm a') : 'Unknown time'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end">
                                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${(apt.status === 'COMPLETED' || apt.status === 'EXECUTED') ? 'bg-emerald-100 text-emerald-700' :
                                                apt.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                                                    'bg-amber-100 text-amber-700'
                                                }`}>
                                                {apt.status}
                                            </span>
                                            {apt.totalAmount && (
                                                <span className="text-sm font-bold text-gray-900 mt-1">€{apt.totalAmount}</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-16 text-center flex flex-col items-center">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center border border-dashed border-gray-200 mb-3">
                                    <CalendarIcon className="w-8 h-8 text-gray-300" />
                                </div>
                                <p className="text-gray-500 font-medium">No bookings found for this period.</p>
                                <Button
                                    variant="outline"
                                    className="mt-4 border-dashed border-2 text-blue-600 hover:bg-blue-50"
                                    onClick={() => setShowNewBooking(true)}
                                >
                                    Log Your First Booking
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Render New Booking Modal */}
            <BookingModal
                isOpen={showNewBooking}
                onClose={() => {
                    setShowNewBooking(false);
                    // refresh
                    dispatch(fetchClinicAppointments({}));
                }}
                initialProviderId={user?.id}
            />
        </div>
    );
};
