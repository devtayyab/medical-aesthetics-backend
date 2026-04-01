import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../store";
import { fetchClients } from "../../store/slices/clinicSlice";
import clinicApi from "../../services/api/clinicApi";
import { Users, Search, Calendar, DollarSign, TrendingUp, X, Mail, Phone, ArrowUpRight, MoreVertical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ClinicBookingModal from "../../components/clinic/ClinicBookingModal";

const ClientsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { clients, isLoading, error } = useSelector(
    (state: RootState) => state.clinic
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [prefillForBooking, setPrefillForBooking] = useState<any>(null);

  const { profile } = useSelector((state: RootState) => state.clinic);
  const user = useSelector((state: RootState) => state.auth.user);
  
  const activeClinicId = profile?.id || (user as any)?.associatedClinicId || (user as any)?.ownedClinics?.[0]?.id;

  useEffect(() => {
    dispatch(fetchClients({}));
  }, [dispatch]);

  const filteredClients = clients.filter(
    (client) =>
      searchTerm === "" ||
      `${client.firstName} ${client.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewDetails = async (clientId: string) => {
    try {
      const details = await clinicApi.clients.getById(clientId);
      setSelectedClient(details);
      setShowDetailsModal(true);
    } catch (error) {
      console.error("Failed to fetch client details:", error);
    }
  };

  const totalRevenue = clients.reduce((sum, c) => sum + (Number(c.lifetimeValue) || 0), 0);
  const totalAppointments = clients.reduce((sum, c) => sum + (c.totalAppointments || 0), 0);
  const avgLTV = clients.length > 0 ? totalRevenue / clients.length : 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Premium Header */}
      <div className="bg-black text-white pt-16 pb-24 px-6 md:px-10 rounded-b-[48px] shadow-2xl relative overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] size-[500px] bg-[#CBFF38]/10 blur-[120px] rounded-full" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 backdrop-blur-md rounded-full border border-white/10">
                <div className="size-1.5 rounded-full bg-[#CBFF38] animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#CBFF38] italic">CRM Database</span>
              </div>
              <div className="space-y-1">
                <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter leading-none">Client Registry</h1>
                <p className="text-gray-400 font-medium max-w-md">Comprehensive database of your medical aesthetic patients and their treatment history.</p>
              </div>
            </div>
            
            <div className="relative w-full md:w-96">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-6 h-14 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl text-white font-bold text-sm focus:ring-2 focus:ring-[#CBFF38] transition-all outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-10 -mt-10 relative z-20 pb-20">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <StatCard title="Active Patients" value={clients.length.toString()} icon={<Users size={20} />} trend="+12%" highlight />
          <StatCard title="Total Revenue" value={`${totalRevenue.toLocaleString()}`} icon={<DollarSign size={20} />} trend="+5.4%" />
          <StatCard title="Clinical Visits" value={totalAppointments.toString()} icon={<Calendar size={20} />} trend="+18%" />
          <StatCard title="Avg Patient LTV" value={`${avgLTV.toFixed(0)}`} icon={<TrendingUp size={20} />} trend="+2.1%" />
        </div>

        {/* Clients Table/Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4 bg-white rounded-[48px] shadow-sm border border-gray-100">
             <div className="size-10 border-4 border-[#CBFF38] border-t-transparent rounded-full animate-spin" />
             <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 italic">Syncing patient records...</p>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="bg-white rounded-[40px] p-20 text-center border border-gray-100 shadow-sm">
            <Users className="w-16 h-16 text-gray-100 mx-auto mb-6" />
            <h3 className="text-xl font-black uppercase italic tracking-tighter text-gray-900 mb-2">Registry is Clear</h3>
            <p className="text-gray-400 font-medium max-w-sm mx-auto">No patients match your current search parameters in the database.</p>
          </div>
        ) : (
          <div className="bg-white rounded-[40px] shadow-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-50 bg-gray-50/50">
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Patient Ident</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Contact Vector</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Activity</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Total Value</th>
                    <th className="px-8 py-6 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">Operational Log</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredClients.map((client) => (
                    <tr key={client.id} className="group hover:bg-gray-50/80 transition-all cursor-pointer" onClick={() => handleViewDetails(client.id)}>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="size-12 rounded-2xl bg-black text-[#CBFF38] flex items-center justify-center font-black italic shadow-lg group-hover:rotate-6 transition-transform">
                            {client.firstName?.[0] || client.email?.[0] || "?"}
                          </div>
                          <div>
                            <p className="font-black uppercase italic tracking-tighter text-gray-900 leading-none mb-1">
                              {`${client.firstName} ${client.lastName}`.trim() || client.email || "ANONYMOUS PATIENT"}
                            </p>
                            <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">ID: {client.id.slice(0, 8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-gray-600">
                             <Mail size={12} className="text-[#CBFF38]" />
                             <span className="text-xs font-bold italic">{client.email || "N/A"}</span>
                          </div>
                          {client.phone && (
                            <div className="flex items-center gap-2 text-gray-600">
                               <Phone size={12} className="text-[#CBFF38]" />
                               <span className="text-[10px] font-bold italic">{client.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                           <Calendar size={12} className="text-gray-400" />
                           <span className="text-xs font-black italic text-gray-900">{client.totalAppointments || 0} Visits</span>
                        </div>
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-1">
                           Last: {client.lastAppointment ? new Date(client.lastAppointment).toLocaleDateString() : "Never"}
                        </p>
                      </td>
                      <td className="px-8 py-6">
                        <div className="inline-flex items-center gap-1 px-3 py-1 bg-[#CBFF38] text-black rounded-lg">
                           <span className="text-xs font-black italic">{(Number(client.lifetimeValue) || 0).toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                         <button className="size-10 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-black group-hover:text-[#CBFF38] transition-all group-hover:rotate-12">
                            <ArrowUpRight size={18} />
                         </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showDetailsModal && selectedClient && (
          <ClientDetailsModal
            client={selectedClient}
            onClose={() => {
              setShowDetailsModal(false);
              setSelectedClient(null);
            }}
            onBookAppointment={(clientData: any) => {
              setPrefillForBooking(clientData);
              setShowBookingModal(true);
            }}
          />
        )}
      </AnimatePresence>

      {showBookingModal && activeClinicId && (
        <ClinicBookingModal
          isOpen={showBookingModal}
          clinicId={activeClinicId}
          onClose={() => {
            setShowBookingModal(false);
            setPrefillForBooking(null);
          }}
          prefillClient={prefillForBooking}
          onSuccess={() => {
            setShowBookingModal(false);
            setPrefillForBooking(null);
            dispatch(fetchClients({}));
          }}
        />
      )}
    </div>
  );
};

const StatCard = ({ title, value, icon, trend, highlight }: any) => (
  <div className={`bg-white p-6 rounded-[32px] border transition-all duration-300 group relative overflow-hidden ${
    highlight ? 'border-[#CBFF38] shadow-lg shadow-lime-500/10' : 'border-gray-100 hover:border-black'
  }`}>
    <div className="flex items-start justify-between mb-6">
       <div className={`size-10 rounded-xl flex items-center justify-center transition-all bg-gray-50 group-hover:bg-black group-hover:text-[#CBFF38] ${highlight ? 'text-[#CBFF38] bg-black' : 'text-gray-400'}`}>
          {icon}
       </div>
       <div className="text-[10px] font-black text-[#CBFF38] bg-black px-2 py-0.5 rounded-full italic">{trend}</div>
    </div>
    <div>
       <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-black transition-colors mb-1">{title}</p>
       <h3 className="text-2xl font-black uppercase italic tracking-tighter text-gray-900">{value}</h3>
    </div>
  </div>
);

const ClientDetailsModal = ({ client, onClose, onBookAppointment }: any) => {
  const innerClient = client.client || client;
  const firstName = innerClient.firstName || "";
  const lastName = innerClient.lastName || "";
  const clientName = (firstName || lastName) 
    ? `${firstName} ${lastName}`.trim() 
    : (innerClient.email || "Patient Registry Detail");
  const appointments = client.appointments || [];

  const handleBook = () => {
    onBookAppointment({
      fullName: `${firstName} ${lastName}`.trim() || innerClient.email,
      phone: innerClient.phone || "",
      email: innerClient.email || ""
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="bg-white rounded-[48px] shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="bg-black text-white p-10 flex items-center justify-between relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-[#CBFF38]/20 to-transparent" />
          <div className="relative z-10 flex items-center justify-between w-full">
            <div className="flex items-center gap-6">
               <div className="size-20 rounded-[32px] bg-[#CBFF38] text-black flex items-center justify-center font-black text-3xl italic shadow-lg">
                  {innerClient.firstName?.[0] || "?"}
               </div>
               <div>
                  <h2 className="text-3xl font-black uppercase italic tracking-tighter leading-none mb-1">{clientName}</h2>
                  <div className="flex items-center gap-4 text-gray-400">
                     <div className="flex items-center gap-2">
                        <Mail size={12} className="text-[#CBFF38]" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{innerClient.email}</span>
                     </div>
                     {innerClient.phone && (
                        <div className="flex items-center gap-2">
                           <Phone size={12} className="text-[#CBFF38]" />
                           <span className="text-[10px] font-black uppercase tracking-widest">{innerClient.phone}</span>
                        </div>
                     )}
                  </div>
               </div>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={handleBook}
                className="px-6 py-3 bg-[#CBFF38] text-black rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-white transition-all flex items-center gap-2"
              >
                <Plus size={14} /> New Appointment
              </button>
              <button onClick={onClose} className="size-14 bg-white/10 hover:bg-[#CBFF38] text-white hover:text-black rounded-2xl flex items-center justify-center transition-all relative z-10">
                <X size={24} />
              </button>
            </div>
          </div>
        </div>

        <div className="p-10 flex-1 overflow-y-auto no-scrollbar grid grid-cols-1 lg:grid-cols-3 gap-10">
           <div className="lg:col-span-2 space-y-8">
              <section>
                 <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-black uppercase italic tracking-tighter text-gray-900 border-l-4 border-[#CBFF38] pl-4">Treatment History</h3>
                    <div className="px-4 py-1.5 bg-gray-50 rounded-full font-black text-[10px] uppercase tracking-widest">{appointments.length} Total Procedures</div>
                 </div>
                 
                 <div className="space-y-4">
                    {appointments.length > 0 ? appointments.map((apt: any) => (
                      <div key={apt.id} className="p-6 bg-gray-50/50 border border-gray-100 rounded-3xl group hover:border-black transition-all">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-5">
                             <div className="size-12 bg-black text-[#CBFF38] rounded-2xl flex flex-col items-center justify-center shadow-lg group-hover:rotate-3 transition-transform">
                                <span className="text-[8px] font-black uppercase">{new Date(apt.startTime).toLocaleDateString([], { month: 'short' })}</span>
                                <span className="text-xl font-black italic leading-none">{new Date(apt.startTime).getDate()}</span>
                             </div>
                             <div>
                                <h4 className="font-black uppercase italic tracking-tighter text-gray-900 leading-none mb-1">{apt.serviceName || "Clinical Service"}</h4>
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Practitioner: System Agent</p>
                             </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                               <div className="text-lg font-black text-gray-900 italic leading-none mb-1">€{Number(apt.totalAmount).toLocaleString()}</div>
                               <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${
                                 apt.status === 'completed' ? 'bg-lime-100 text-lime-700 border-lime-200' : 'bg-gray-200 text-gray-500 border-gray-300'
                               }`}>
                                 {apt.status}
                               </span>
                            </div>
                            <button 
                              onClick={handleBook}
                              className="size-10 rounded-xl bg-black text-[#CBFF38] flex items-center justify-center hover:scale-110 transition-transform"
                              title="Rebook / Follow-up"
                            >
                              <Plus size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="py-20 text-center bg-gray-50/30 rounded-[32px] border border-dashed border-gray-100">
                         <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 italic">No historical data records found.</p>
                      </div>
                    )}
                 </div>
              </section>
           </div>

           <div className="space-y-8">
              <section className="bg-gray-50 rounded-[32px] p-8 border border-gray-100">
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6 italic">Financial Metrics</h4>
                 <div className="space-y-6">
                    <div>
                       <p className="text-3xl font-black italic tracking-tighter text-gray-900 leading-none mb-2">
                          {(Number(client.summary?.totalSpent) || Number(client.lifetimeValue) || 0).toLocaleString()}
                       </p>
                       <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Lifetime Investment</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="p-4 bg-white rounded-2xl shadow-sm">
                          <p className="text-xl font-black italic text-gray-900 leading-none mb-1">{appointments.length}</p>
                          <p className="text-[8px] font-black uppercase text-gray-400">Total Logistics</p>
                       </div>
                       <div className="p-4 bg-white rounded-2xl shadow-sm">
                          <p className="text-xl font-black italic text-[#CBFF38] bg-black inline-block px-1 rounded leading-none mb-1">
                             {appointments.length > 0 ? `${((Number(client.summary?.totalSpent) || Number(client.lifetimeValue) || 0) / appointments.length).toFixed(0)}` : "0"}
                          </p>
                          <p className="text-[8px] font-black uppercase text-gray-400">Average Unit</p>
                       </div>
                    </div>
                 </div>
              </section>

              <section className="bg-black text-white rounded-[32px] p-8 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-10">
                    <TrendingUp size={60} className="text-[#CBFF38]" />
                 </div>
                 <div className="relative z-10">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-[#CBFF38] mb-4 italic">Actionable Insight</h4>
                    <p className="text-xs font-bold leading-relaxed opacity-60 italic">
                       Patient exhibits high retention velocity. Recommended protocol: VIP Loyalty Provisioning Level 2.
                    </p>
                    <button 
                      onClick={() => alert("Medical Record Export is being generated. You will be notified when the PDF is ready.")}
                      className="mt-6 w-full py-3 bg-white text-black rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-[#CBFF38] transition-all"
                    >
                       Export Medical Record
                    </button>
                 </div>
              </section>
           </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ClientsPage;
