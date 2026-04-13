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
            {/* Minimal Header */}
            <div className="relative pt-8 pb-16 px-6 md:px-10 border-b border-gray-100 bg-white">
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                        <div className="space-y-3">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-full border border-gray-100">
                                <div className="size-1.5 rounded-full bg-green-500" />
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 italic">Communication Hub</span>
                            </div>
                            <div className="space-y-1">
                                <h1 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter leading-none text-gray-900">Campaign Outreach</h1>
                                <p className="text-gray-500 font-medium max-w-md text-sm">Broadcast treatment updates and clinical protocols to your patient base.</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            <div className="px-5 py-2.5 bg-gray-50 border border-gray-100 rounded-xl flex items-center gap-3">
                                <div className="size-2 bg-[#CBFF38] rounded-full animate-pulse" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 italic">Antenna Uplink Live</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 md:px-10 mt-8 relative z-20 pb-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Main Compose Area */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-gray-100 flex flex-col">
                            <div className="flex items-center gap-4 mb-10">
                                <div className="size-10 bg-black rounded-xl flex items-center justify-center text-[#CBFF38]">
                                    <MessageSquare size={20} />
                                </div>
                                <h2 className="text-lg font-black uppercase italic tracking-tighter text-gray-900">Message Architect</h2>
                            </div>

                            <div className="space-y-8">
                                {/* Method Selection */}
                                <div>
                                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4 ml-1 italic">Delivery Vector</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <button
                                            onClick={() => setNotificationType(NotificationType.PUSH)}
                                            className={`group flex items-center gap-4 p-5 rounded-2xl border-2 transition-all ${
                                                notificationType === NotificationType.PUSH 
                                                ? 'border-black bg-black text-[#CBFF38]' 
                                                : 'border-gray-50 bg-gray-50/50 hover:border-gray-100'
                                            }`}
                                        >
                                            <div className={`size-8 rounded-lg flex items-center justify-center ${notificationType === NotificationType.PUSH ? 'bg-[#CBFF38] text-black' : 'bg-white text-gray-400 shadow-sm'}`}>
                                                <Bell size={16} />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-[10px] font-black uppercase italic leading-none mb-1">Push System</p>
                                                <p className={`text-[7px] font-black uppercase tracking-widest ${notificationType === NotificationType.PUSH ? 'text-gray-500' : 'text-gray-300'}`}>Direct App Alert</p>
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => setNotificationType(NotificationType.EMAIL)}
                                            className={`group flex items-center gap-4 p-5 rounded-2xl border-2 transition-all ${
                                                notificationType === NotificationType.EMAIL 
                                                ? 'border-black bg-black text-[#CBFF38]' 
                                                : 'border-gray-50 bg-gray-50/50 hover:border-gray-100'
                                            }`}
                                        >
                                            <div className={`size-8 rounded-lg flex items-center justify-center ${notificationType === NotificationType.EMAIL ? 'bg-[#CBFF38] text-black' : 'bg-white text-gray-400 shadow-sm'}`}>
                                                <Mail size={16} />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-[10px] font-black uppercase italic leading-none mb-1">Email Vector</p>
                                                <p className={`text-[7px] font-black uppercase tracking-widest ${notificationType === NotificationType.EMAIL ? 'text-gray-500' : 'text-gray-300'}`}>Legacy Transmission</p>
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                {/* Content Fields */}
                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Protocol Subject / Campaign Title"
                                        className="w-full h-14 px-5 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm text-gray-900 placeholder:text-gray-300 focus:bg-white focus:border-black transition-all outline-none"
                                    />

                                    <div className="relative">
                                        <textarea
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            placeholder="Enter transmission payload here..."
                                            rows={8}
                                            className="w-full p-5 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm text-gray-900 placeholder:text-gray-300 focus:bg-white focus:border-black transition-all outline-none resize-none"
                                        />
                                        <div className="absolute bottom-4 right-5">
                                            <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest italic">{message.length} Characters</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Action */}
                                <button
                                    onClick={handleSend}
                                    disabled={isSending || selectedClients.length === 0}
                                    className="w-full h-14 bg-[#CBFF38] text-black rounded-xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-lime-500/10 hover:bg-black hover:text-[#CBFF38] transition-all flex items-center justify-center gap-4 disabled:opacity-20 disabled:cursor-not-allowed group"
                                >
                                    <Send size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                    {isSending ? 'Initiating Broadcast...' : `Transmit to ${selectedClients.length} Recipient(s)`}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Area */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col h-[650px] overflow-hidden">
                            <div className="p-6 border-b border-gray-50 shrink-0">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <Users size={16} className="text-gray-400" />
                                        <h3 className="text-sm font-black uppercase italic tracking-tighter text-gray-900">Patient Database</h3>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button onClick={selectAll} className="text-[7px] font-black text-blue-500 uppercase tracking-widest italic hover:underline">All</button>
                                        <button onClick={deselectAll} className="text-[7px] font-black text-gray-400 uppercase tracking-widest italic hover:underline">None</button>
                                    </div>
                                </div>
                                
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={12} />
                                    <input
                                        type="text"
                                        placeholder="Search Registry..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full h-10 pl-9 pr-4 bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-bold text-gray-900 placeholder:text-gray-300 focus:bg-white focus:border-black outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-3 space-y-1.5 no-scrollbar">
                                {filteredClients.map((client) => {
                                    const isSelected = selectedClients.includes(client.id);
                                    return (
                                        <div
                                            key={client.id}
                                            onClick={() => toggleClient(client.id)}
                                            className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all border group relative overflow-hidden ${
                                                isSelected ? 'bg-black border-black text-white' : 'bg-white border-gray-50 hover:border-gray-100'
                                            }`}
                                        >
                                            <div className={`size-9 rounded-xl flex items-center justify-center font-black italic shadow-sm transition-all ${
                                                isSelected ? 'bg-[#CBFF38] text-black scale-90' : 'bg-gray-50 text-gray-900'
                                            }`}>
                                                {client.firstName?.[0] || '?' }
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-[10px] font-black uppercase italic tracking-tighter truncate ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                                                    {client.firstName} {client.lastName}
                                                </p>
                                                <p className={`text-[7px] font-black uppercase tracking-widest truncate ${isSelected ? 'text-gray-500' : 'text-gray-400'}`}>
                                                    {client.email}
                                                </p>
                                            </div>
                                            <div className={`size-5 rounded-md flex items-center justify-center transition-all ${
                                                isSelected ? 'bg-[#CBFF38] text-black scale-100' : 'bg-gray-100 text-transparent scale-50'
                                            }`}>
                                                <Check size={10} strokeWidth={4} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="p-5 bg-gray-50 shrink-0 border-t border-gray-100 italic">
                                <div className="flex items-center justify-between">
                                    <p className="text-[9px] font-black uppercase text-gray-400">Queue Capacity</p>
                                    <p className="text-base font-black tracking-tighter text-black">
                                        {selectedClients.length} <span className="opacity-20">/</span> {clients.length}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#CBFF38] p-6 rounded-3xl shadow-lg shadow-lime-500/10 border border-lime-400/20">
                            <h4 className="text-[8px] font-black uppercase tracking-widest text-black mb-1.5 italic">Safety Protocol</h4>
                            <p className="text-[10px] font-bold text-black leading-tight opacity-70 italic">
                                Broadcast operations are final. Verify clinical payload integrity before execution.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotificationsPage;
