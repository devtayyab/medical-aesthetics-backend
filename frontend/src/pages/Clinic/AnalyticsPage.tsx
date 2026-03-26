import React, { useEffect, useState } from 'react';
import clinicApi from '../../services/api/clinicApi';
import { TrendingUp, DollarSign, Calendar, Users, Award, Repeat, ArrowUpRight, BarChart3, Filter } from 'lucide-react';
import { motion } from 'framer-motion';

const AnalyticsPage: React.FC = () => {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const [appointmentAnalytics, setAppointmentAnalytics] = useState<any>(null);
  const [revenueAnalytics, setRevenueAnalytics] = useState<any>(null);
  const [loyaltyAnalytics, setLoyaltyAnalytics] = useState<any>(null);
  const [repeatForecast, setRepeatForecast] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const [appointments, revenue, loyalty, repeat] = await Promise.all([
        clinicApi.analytics.getAppointmentAnalytics(dateRange),
        clinicApi.analytics.getRevenueAnalytics(dateRange),
        clinicApi.analytics.getLoyaltyAnalytics(dateRange),
        clinicApi.analytics.getRepeatForecast(dateRange),
      ]);

      setAppointmentAnalytics(appointments);
      setRevenueAnalytics(revenue);
      setLoyaltyAnalytics(loyalty);
      setRepeatForecast(repeat);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !appointmentAnalytics) {
     return (
       <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-4">
         <div className="size-10 border-4 border-[#CBFF38] border-t-transparent rounded-full animate-spin" />
         <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 italic">Synthesizing clinical data metrics...</p>
       </div>
     );
  }

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
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#CBFF38] italic">Operational Intelligence</span>
              </div>
              <div className="space-y-1">
                <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter leading-none">Analysis & Insights</h1>
                <p className="text-gray-400 font-medium max-w-md">Real-time performance telemetry for treatment volume, revenue scaling, and patient retention.</p>
              </div>
            </div>
            
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 flex flex-col sm:flex-row items-center gap-4">
               <div className="flex items-center gap-2">
                  <Filter size={14} className="text-[#CBFF38]" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 italic mr-2">Timeline Filter</span>
               </div>
               <div className="flex items-center gap-3">
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                    className="bg-black/40 border-none text-white font-black uppercase text-[10px] tracking-widest rounded-xl px-4 py-2 focus:ring-1 focus:ring-[#CBFF38] outline-none"
                  />
                  <div className="h-px w-4 bg-white/20" />
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                    className="bg-black/40 border-none text-white font-black uppercase text-[10px] tracking-widest rounded-xl px-4 py-2 focus:ring-1 focus:ring-[#CBFF38] outline-none"
                  />
               </div>
               <button
                  onClick={fetchAnalytics}
                  className="size-10 bg-[#CBFF38] rounded-xl flex items-center justify-center text-black hover:bg-white transition-all shadow-lg"
               >
                  <ArrowUpRight size={18} />
               </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-10 -mt-10 relative z-20 pb-20">
        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
           <PremiumStatCard title="Throughput" value={appointmentAnalytics?.totalAppointments || 0} subValue="Total Appts" icon={<Calendar size={20} />} highlight />
           <PremiumStatCard title="Conversion" value={appointmentAnalytics?.completedAppointments || 0} subValue="Completed" icon={<BarChart3 size={20} />} />
           <PremiumStatCard title="Yield" value={`£${(revenueAnalytics?.totalRevenue || 0).toLocaleString()}`} subValue="Gross Revenue" icon={<DollarSign size={20} />} />
           <PremiumStatCard title="Efficiency" value={`£${(revenueAnalytics?.averageAppointmentValue || 0).toFixed(0)}`} subValue="Avg Ticket" icon={<TrendingUp size={20} />} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           {/* Revenue Stream Analysis */}
           <div className="lg:col-span-8 bg-white rounded-[40px] p-8 md:p-10 shadow-xl border border-gray-100 relative overflow-hidden">
              <div className="flex items-center gap-4 mb-10">
                 <div className="size-12 bg-black rounded-2xl flex items-center justify-center text-[#CBFF38]">
                    <TrendingUp size={22} />
                 </div>
                 <h2 className="text-xl font-black uppercase italic tracking-tighter text-gray-900">Yield by Service Category</h2>
              </div>
              
              <div className="space-y-6">
                 {revenueAnalytics?.revenueByService?.map((item: any, index: number) => (
                    <div key={index} className="group flex flex-col gap-3">
                       <div className="flex items-center justify-between px-2">
                          <div>
                             <p className="font-black uppercase italic tracking-tighter text-gray-900 leading-none mb-1">{item.serviceName}</p>
                             <p className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-400">{item.count} Processed Events</p>
                          </div>
                          <div className="text-right">
                             <p className="text-lg font-black italic tracking-tighter text-black leading-none mb-1">£{item.revenue.toLocaleString()}</p>
                             <p className="text-[8px] font-black uppercase text-[#CBFF38] bg-black px-1.5 py-0.5 rounded italic inline-block">Top Performer</p>
                          </div>
                       </div>
                       <div className="h-4 w-full bg-gray-50 rounded-full overflow-hidden p-1">
                          <motion.div 
                             initial={{ width: 0 }}
                             animate={{ width: `${(item.revenue / revenueAnalytics.totalRevenue) * 100}%` }}
                             transition={{ duration: 1, delay: 0.2 * index }}
                             className="h-full bg-black rounded-full shadow-[0_0_10px_rgba(203,255,56,0.3)] border-r-2 border-[#CBFF38]" 
                          />
                       </div>
                    </div>
                 ))}
              </div>
           </div>

           {/* Loyalty Integration */}
           <div className="lg:col-span-4 space-y-8">
              <section className="bg-black text-white rounded-[40px] p-10 shadow-2xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-6 opacity-10">
                    <Award size={100} className="text-[#CBFF38]" />
                 </div>
                 <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-8">
                       <div className="size-10 bg-[#CBFF38] rounded-xl flex items-center justify-center text-black shadow-lg">
                          <Award size={18} />
                       </div>
                       <h2 className="text-[15px] font-black uppercase italic tracking-tighter text-white">Loyalty Ecosystem</h2>
                    </div>

                    <div className="space-y-8">
                       <div>
                          <p className="text-4xl font-black italic tracking-tighter text-[#CBFF38] leading-none mb-1">
                             {(loyaltyAnalytics?.totalPoints || 0).toLocaleString()}
                          </p>
                          <p className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-500 italic">Total Protocol Credit Issued</p>
                       </div>
                       <div className="h-px bg-white/10 w-full" />
                       <div className="grid grid-cols-2 gap-4">
                          <div>
                             <p className="text-xl font-black italic text-white leading-none mb-1">{loyaltyAnalytics?.uniqueClients || 0}</p>
                             <p className="text-[8px] font-black uppercase text-gray-500">Active Nodes</p>
                          </div>
                          <div>
                             <p className="text-xl font-black italic text-[#CBFF38] leading-none mb-1">{(loyaltyAnalytics?.avgPointsPerTransaction || 0).toFixed(0)}</p>
                             <p className="text-[8px] font-black uppercase text-gray-500">Avg Credit/Ops</p>
                          </div>
                       </div>
                    </div>
                 </div>
              </section>

              <div className="bg-[#CBFF38] p-10 rounded-[40px] shadow-xl shadow-lime-500/10">
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-black mb-4 italic">Optimization Pulse</h4>
                 <p className="text-xs font-bold text-black leading-tight italic opacity-70">
                    Current resource throughput is suboptimal for category 'Injectables'. Consider increasing protocol velocity.
                 </p>
              </div>
           </div>

           {/* Repeat Forecast */}
           <div className="lg:col-span-12 bg-[#0D0D0D] rounded-[40px] p-10 border border-white/5 shadow-2xl relative overflow-hidden">
              <div className="absolute top-[-50px] right-[-50px] size-[300px] bg-[#CBFF38]/5 blur-[80px] rounded-full" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-10">
                  <div className="size-12 bg-[#CBFF38] rounded-[20px] flex items-center justify-center text-black">
                    <Repeat size={22} />
                  </div>
                  <h2 className="text-xl font-black uppercase italic tracking-tighter text-white">Retention Velocity Forecast</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
                   <ForecastStat label="Predicted Traffic" value={repeatForecast?.customersExpectedNextMonth || 0} unit="Patients" />
                   <ForecastStat label="Revenue Projection" value={`£${(repeatForecast?.estimatedRevenue || 0).toLocaleString()}`} unit="Projected" />
                   <ForecastStat label="Retention Rate" value={`${(repeatForecast?.repeatRate || 0).toFixed(1)}%`} unit="System Static" />
                </div>

                <div className="bg-white/5 rounded-[32px] border border-white/10 p-8">
                   <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#CBFF38] mb-6 italic">Priority Retention Nodes (Next 30 Days)</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {repeatForecast?.customers?.slice(0, 6).map((customer: any) => (
                         <div key={customer.id} className="flex items-center justify-between p-5 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5 hover:border-[#CBFF38]/30 group">
                            <div className="flex items-center gap-4">
                               <div className="size-10 rounded-xl bg-[#CBFF38] text-black flex items-center justify-center font-black italic scale-90 group-hover:scale-100 transition-transform">
                                  {customer.name[0]}
                               </div>
                               <div>
                                  <p className="text-[11px] font-black uppercase italic text-white leading-none mb-1">{customer.name}</p>
                                  <p className="text-[8px] font-black uppercase text-gray-500">Last: {new Date(customer.lastVisit).toLocaleDateString()}</p>
                               </div>
                            </div>
                            <div className="text-right">
                               <div className="text-[9px] font-black text-[#CBFF38] italic">{new Date(customer.expectedNextVisit).toLocaleDateString()}</div>
                               <p className="text-[7px] font-black uppercase text-gray-600">Expected Vector</p>
                            </div>
                         </div>
                      ))}
                   </div>
                </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const PremiumStatCard = ({ title, value, subValue, icon, highlight }: any) => (
  <div className={`bg-white p-8 rounded-[40px] border transition-all duration-300 group relative overflow-hidden ${
    highlight ? 'border-[#CBFF38] shadow-xl shadow-lime-500/10' : 'border-gray-100 hover:border-black'
  }`}>
    <div className="flex items-center justify-between mb-8">
       <div className={`size-12 rounded-2xl flex items-center justify-center transition-all bg-gray-50 group-hover:bg-black group-hover:text-[#CBFF38] ${highlight ? 'text-[#CBFF38] bg-black shadow-lg shadow-lime-500/20' : 'text-gray-400'}`}>
          {icon}
       </div>
       <div className="bg-gray-50 h-px w-10 flex-1 mx-4" />
       <div className="text-[8px] font-black text-gray-300 uppercase italic tracking-widest">{title}</div>
    </div>
    <div>
       <h3 className="text-3xl font-black uppercase italic tracking-tighter text-gray-900 leading-none mb-1 transition-all group-hover:translate-x-1">{value}</h3>
       <p className="text-[9px] font-black uppercase tracking-[0.1em] text-gray-400">{subValue}</p>
    </div>
  </div>
);

const ForecastStat = ({ label, value, unit }: any) => (
   <div className="relative group">
      <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-1 h-12 bg-[#CBFF38] rounded-full scale-y-0 group-hover:scale-y-100 transition-transform duration-500" />
      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2 italic">{label}</p>
      <div className="flex items-baseline gap-2">
         <span className="text-4xl font-black italic tracking-tighter text-white leading-none">{value}</span>
         <span className="text-[10px] font-black uppercase tracking-widest text-[#CBFF38] italic">{unit}</span>
      </div>
   </div>
);

export default AnalyticsPage;
