import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchClients } from '../../store/slices/clinicSlice';
import clinicApi from '../../services/api/clinicApi';
import { NotificationType } from '../../types/clinic.types';
import { Bell, Send, Mail, Search, Check, X, Users, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NotificationsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { clients } = useSelector((state: RootState) => state.clinic);

  const [notificationType, setNotificationType] = useState<NotificationType>(NotificationType.PUSH);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    dispatch(fetchClients({}));
  }, [dispatch]);

  const filteredClients = clients.filter(c => 
    `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSend = async () => {
    if (!title || !message) {
      alert('Please fill in title and message');
      return;
    }

    if (selectedClients.length === 0) {
      alert('Please select at least one recipient');
      return;
    }

    setIsSending(true);
    try {
      if (selectedClients.length === 1) {
        await clinicApi.notifications.send({
          recipientId: selectedClients[0],
          type: notificationType,
          title,
          message,
        });
      } else {
        await clinicApi.notifications.sendBulk({
          recipientIds: selectedClients,
          type: notificationType,
          title,
          message,
        });
      }

      alert('Notification sent successfully!');
      setTitle('');
      setMessage('');
      setSelectedClients([]);
    } catch (error) {
      console.error('Failed to send notification:', error);
      alert('Failed to send notification. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const toggleClient = (clientId: string) => {
    setSelectedClients((prev) =>
      prev.includes(clientId) ? prev.filter((id) => id !== clientId) : [...prev, clientId]
    );
  };

  const selectAll = () => {
    setSelectedClients(filteredClients.map((c) => c.id));
  };

  const deselectAll = () => {
    setSelectedClients([]);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Premium Header */}
      <div className="bg-black text-white pt-16 pb-24 px-6 md:px-10 rounded-b-[48px] shadow-2xl relative overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] size-[500px] bg-[#CBFF38]/10 blur-[120px] rounded-full" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 backdrop-blur-md rounded-full border border-white/10">
              <div className="size-1.5 rounded-full bg-[#CBFF38] animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#CBFF38] italic">Communication Hub</span>
            </div>
            <div className="space-y-1">
              <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter leading-none">Campaign Outreach</h1>
              <p className="text-gray-400 font-medium max-w-md">Broadcast treatment updates, loyalty rewards, and clinical protocols to your patient base.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-10 -mt-10 relative z-20 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Compose Area */}
          <div className="lg:col-span-8 space-y-8">
            <div className="bg-white rounded-[40px] p-8 md:p-10 shadow-xl border border-gray-100 relative overflow-hidden">
              <div className="flex items-center gap-4 mb-10">
                <div className="size-12 bg-black rounded-2xl flex items-center justify-center text-[#CBFF38]">
                  <MessageSquare size={22} />
                </div>
                <h2 className="text-xl font-black uppercase italic tracking-tighter text-gray-900">Message Architect</h2>
              </div>

              <div className="space-y-8">
                {/* Method Selection */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 ml-1 italic">Select Delivery Vector</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      onClick={() => setNotificationType(NotificationType.PUSH)}
                      className={`group flex items-center gap-4 p-6 rounded-[32px] border-2 transition-all ${
                        notificationType === NotificationType.PUSH 
                        ? 'border-black bg-black text-[#CBFF38] shadow-xl' 
                        : 'border-gray-50 bg-gray-50/50 hover:border-gray-200'
                      }`}
                    >
                      <div className={`size-10 rounded-xl flex items-center justify-center ${notificationType === NotificationType.PUSH ? 'bg-[#CBFF38] text-black' : 'bg-white text-gray-400'}`}>
                        <Bell size={18} />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-black uppercase italic leading-none mb-1">Push System</p>
                        <p className={`text-[8px] font-black uppercase tracking-widest ${notificationType === NotificationType.PUSH ? 'text-gray-400' : 'text-gray-300'}`}>Direct App Alert</p>
                      </div>
                    </button>

                    <button
                      onClick={() => setNotificationType(NotificationType.EMAIL)}
                      className={`group flex items-center gap-4 p-6 rounded-[32px] border-2 transition-all ${
                        notificationType === NotificationType.EMAIL 
                        ? 'border-black bg-black text-[#CBFF38] shadow-xl' 
                        : 'border-gray-50 bg-gray-50/50 hover:border-gray-200'
                      }`}
                    >
                      <div className={`size-10 rounded-xl flex items-center justify-center ${notificationType === NotificationType.EMAIL ? 'bg-[#CBFF38] text-black' : 'bg-white text-gray-400'}`}>
                        <Mail size={18} />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-black uppercase italic leading-none mb-1">Email Vector</p>
                        <p className={`text-[8px] font-black uppercase tracking-widest ${notificationType === NotificationType.EMAIL ? 'text-gray-400' : 'text-gray-300'}`}>Legacy Inbox Transmission</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Content Fields */}
                <div className="space-y-6">
                  <div className="relative group">
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Protocol Subject / Campaign Title"
                      className="w-full h-16 px-6 bg-gray-50 border-none rounded-2xl font-bold text-gray-900 placeholder:text-gray-300 focus:ring-2 focus:ring-black transition-all"
                    />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-black transition-colors">
                       <Check size={18} />
                    </div>
                  </div>

                  <div className="relative group">
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Enter detailed transmission payload here..."
                      rows={8}
                      className="w-full p-6 bg-gray-50 border-none rounded-[32px] font-bold text-gray-900 placeholder:text-gray-300 focus:ring-2 focus:ring-black transition-all resize-none"
                    />
                    <div className="absolute bottom-6 right-8">
                       <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic">{message.length} Characters Transmitted</p>
                    </div>
                  </div>
                </div>

                {/* Action */}
                <button
                  onClick={handleSend}
                  disabled={isSending || selectedClients.length === 0}
                  className="w-full h-16 bg-[#CBFF38] text-black rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-lime-500/10 hover:bg-black hover:text-[#CBFF38] transition-all flex items-center justify-center gap-4 disabled:opacity-20 disabled:cursor-not-allowed group"
                >
                  <span className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform">
                    <Send size={18} />
                  </span>
                  {isSending ? 'Initiating Broadcast...' : `Transmit to ${selectedClients.length} Recipient(s)`}
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm flex flex-col h-[700px] overflow-hidden">
               <div className="p-8 border-b border-gray-50 shrink-0">
                  <div className="flex items-center justify-between mb-6">
                     <div className="flex items-center gap-3">
                        <Users size={18} className="text-gray-400" />
                        <h3 className="font-black uppercase italic tracking-tighter text-gray-900">Patient Database</h3>
                     </div>
                     <div className="flex items-center gap-3">
                        <button onClick={selectAll} className="text-[8px] font-black text-blue-500 uppercase tracking-widest italic hover:underline">All</button>
                        <button onClick={deselectAll} className="text-[8px] font-black text-gray-400 uppercase tracking-widest italic hover:underline">None</button>
                     </div>
                  </div>
                  
                  <div className="relative">
                     <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={14} />
                     <input
                        type="text"
                        placeholder="Search Registry..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-11 pl-10 pr-4 bg-gray-50 border-none rounded-xl text-[10px] font-bold text-gray-900 placeholder:text-gray-300 focus:ring-1 focus:ring-black outline-none"
                     />
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
                  {filteredClients.map((client) => {
                     const isSelected = selectedClients.includes(client.id);
                     return (
                        <div
                           key={client.id}
                           onClick={() => toggleClient(client.id)}
                           className={`flex items-center gap-4 p-4 rounded-3xl cursor-pointer transition-all border group relative overflow-hidden ${
                              isSelected ? 'bg-black border-black text-white' : 'bg-gray-50/50 border-gray-50 hover:border-gray-200'
                           }`}
                        >
                           <div className={`size-10 rounded-2xl flex items-center justify-center font-black italic shadow-md transition-all ${
                              isSelected ? 'bg-[#CBFF38] text-black scale-90' : 'bg-white text-gray-900'
                           }`}>
                              {client.firstName?.[0] || '?' }
                           </div>
                           <div className="flex-1 min-w-0">
                              <p className={`text-[11px] font-black uppercase italic tracking-tighter truncate ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                                 {client.firstName} {client.lastName}
                              </p>
                              <p className={`text-[8px] font-black uppercase tracking-widest truncate ${isSelected ? 'text-gray-500' : 'text-gray-400'}`}>
                                 {client.email}
                              </p>
                           </div>
                           <div className={`size-6 rounded-lg flex items-center justify-center transition-all ${
                              isSelected ? 'bg-[#CBFF38] text-black scale-100 rotate-0' : 'bg-gray-200 text-transparent scale-50 rotate-45'
                           }`}>
                              <Check size={12} strokeWidth={4} />
                           </div>
                        </div>
                     );
                  })}
               </div>

               <div className="p-6 bg-gray-50 shrink-0 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                     <p className="text-[10px] font-black uppercase text-gray-400 italic">Queue Weight</p>
                     <p className="text-lg font-black italic tracking-tighter text-black">
                        {selectedClients.length} / {clients.length}
                     </p>
                  </div>
               </div>
            </div>

            <div className="bg-[#CBFF38] p-8 rounded-[40px] shadow-xl shadow-lime-500/20 relative overflow-hidden">
               <div className="absolute -right-4 -bottom-4 opacity-10">
                  <Bell size={120} className="text-black" />
               </div>
               <div className="relative z-10">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-black mb-2 italic">Broadcast Safe-Checks</h4>
                  <p className="text-xs font-bold text-black leading-tight opacity-70 italic">
                     Notifications are immutable once transmitted. Ensure all clinical data is verified before execution.
                  </p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
