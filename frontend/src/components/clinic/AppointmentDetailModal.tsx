
import React from 'react';
import { Appointment } from '../../types/clinic.types';
import { X, User, Calendar, Clock, DollarSign, FileText, Shield, Info, ExternalLink } from 'lucide-react';

interface AppointmentDetailModalProps {
  appointment: Appointment;
  onClose: () => void;
}

const AppointmentDetailModal: React.FC<AppointmentDetailModalProps> = ({ appointment, onClose }) => {
  const isPlatform = appointment.appointmentSource === 'platform_broker';
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString([], { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[40px] shadow-2xl max-w-2xl w-full overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
        
        {/* Visual Header */}
        <div className="h-32 bg-black relative overflow-hidden shrink-0">
          <div className="absolute top-[-50%] right-[-10%] size-64 bg-[#CBFF38]/20 blur-[80px] rounded-full" />
          <div className="absolute bottom-[-20%] left-[5%] size-32 bg-[#CBFF38]/10 blur-[40px] rounded-full" />
          
          <div className="absolute inset-0 p-8 flex items-end justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest italic ${
                  isPlatform ? 'bg-[#CBFF38] text-black' : 'bg-white/10 text-white border border-white/20'
                }`}>
                  {isPlatform ? 'Diamond Client' : 'Direct Booking'}
                </span>
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                  ID: {appointment.id}
                </span>
              </div>
              <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">
                Appointment Overview
              </h2>
            </div>
            <button 
              onClick={onClose}
              className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all border border-white/10 backdrop-blur-md"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
          {/* Status Banner */}
          <div className="flex items-center justify-between p-6 bg-gray-50 rounded-[32px] border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="size-12 bg-black rounded-2xl flex items-center justify-center text-[#CBFF38]">
                <Info size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Current Status</p>
                <p className="text-lg font-black text-black uppercase italic tracking-tighter">
                  {appointment.status.replace('_', ' ')}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Service Fee</p>
              <p className="text-2xl font-black text-[#CBFF38] bg-black px-3 py-1 rounded-xl italic">
                €{appointment.totalAmount || appointment.service?.price || '0.00'}
              </p>
            </div>
          </div>

          {/* Grid Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            
            {/* Client Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <User size={14} className="text-[#CBFF38]" />
                <h3 className="text-[10px] font-black text-black uppercase tracking-[0.2em]">Client Details</h3>
              </div>
              <div className="p-6 bg-white border border-gray-100 rounded-[32px] shadow-sm space-y-4">
                <div className="flex items-center gap-4">
                  <div className="size-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-500">
                    {appointment.client?.firstName?.charAt(0)}{appointment.client?.lastName?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-black text-gray-900 uppercase tracking-tighter">
                      {appointment.client?.firstName} {appointment.client?.lastName}
                    </p>
                    <p className="text-xs text-gray-400 font-medium">{appointment.client?.email}</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-50 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Phone</span>
                    <span className="text-gray-900 font-black">{appointment.client?.phone || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Source</span>
                    <span className="text-gray-900 font-black uppercase italic">{appointment.appointmentSource}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Schedule Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-[#CBFF38]" />
                <h3 className="text-[10px] font-black text-black uppercase tracking-[0.2em]">Schedule Details</h3>
              </div>
              <div className="p-6 bg-white border border-gray-100 rounded-[32px] shadow-sm space-y-4">
                <div className="flex items-center gap-4">
                  <div className="size-10 bg-black rounded-2xl flex items-center justify-center text-[#CBFF38]">
                    <Clock size={18} />
                  </div>
                  <div>
                    <p className="font-black text-gray-900 uppercase tracking-tighter">
                      {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                    </p>
                    <p className="text-xs text-gray-400 font-medium">{formatDate(appointment.startTime)}</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-50 space-y-2">
                   <div className="flex justify-between text-xs">
                    <span className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Provider</span>
                    <span className="text-gray-900 font-black italic uppercase">
                      {appointment.provider ? `${appointment.provider.firstName} ${appointment.provider.lastName}` : 'Not Assigned'}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Duration</span>
                    <span className="text-gray-900 font-black">60 mins</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Service Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Shield size={14} className="text-[#CBFF38]" />
              <h3 className="text-[10px] font-black text-black uppercase tracking-[0.2em]">Booked Service</h3>
            </div>
            <div className="p-6 bg-black text-white rounded-[32px] flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className="size-14 bg-white/10 rounded-2xl flex items-center justify-center text-[#CBFF38] border border-white/10">
                  <FileText size={28} />
                </div>
                <div>
                  <h4 className="text-xl font-black uppercase italic tracking-tighter leading-none">
                    {appointment.serviceName || appointment.service?.treatment?.name}
                  </h4>
                  <p className="text-xs text-gray-400 font-medium mt-1">Master Therapy Record Linked</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Price</p>
                <div className="flex items-center gap-2 text-[#CBFF38]">
                  <DollarSign size={20} />
                  <span className="text-3xl font-black italic tracking-tighter">
                    {appointment.totalAmount || appointment.service?.price}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info / Notes */}
          {(appointment.notes || appointment.treatmentDetails?.notes) && (
            <div className="space-y-4">
               <div className="flex items-center gap-2">
                <FileText size={14} className="text-[#CBFF38]" />
                <h3 className="text-[10px] font-black text-black uppercase tracking-[0.2em]">Notes & Special Instructions</h3>
              </div>
              <div className="p-6 bg-amber-50 border border-amber-100 rounded-[32px]">
                <p className="text-sm font-bold text-amber-900 leading-relaxed italic">
                  "{appointment.notes || appointment.treatmentDetails?.notes}"
                </p>
              </div>
            </div>
          )}

          {/* Action History / Metadata */}
          <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-400">
               <Shield size={12} />
               <span className="text-[9px] font-black uppercase tracking-widest">Data Secure • E2E Encrypted</span>
            </div>
            <div className="text-[9px] font-black text-gray-300 uppercase tracking-widest">
              Last Updated: {new Date(appointment.updatedAt).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-8 bg-gray-50 border-t border-gray-100 flex gap-4">
          <button 
            onClick={onClose}
            className="flex-1 h-16 bg-white text-black border border-gray-200 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-black hover:text-white transition-all shadow-sm"
          >
            Close Detail
          </button>
          <button 
             onClick={() => {
               window.print();
             }}
             className="px-8 h-16 bg-black text-[#CBFF38] rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-[#CBFF38] hover:text-black transition-all shadow-xl shadow-lime-500/10 flex items-center gap-2"
          >
            <ExternalLink size={18} />
            Print Report
          </button>
        </div>

      </div>
    </div>
  );
};

export default AppointmentDetailModal;
