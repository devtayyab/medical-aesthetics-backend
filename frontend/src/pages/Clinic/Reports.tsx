import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchReviewStatistics } from "@/store/slices/clinicSlice";
import { RootState, AppDispatch } from "@/store";
import { BarChart3, Star, TrendingUp, ShieldCheck, Mail, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";

export const Reports: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { reviewStats, isLoading, error } = useSelector(
    (state: RootState) => state.clinic
  );

  useEffect(() => {
    dispatch(fetchReviewStatistics());
  }, [dispatch]);

  if (isLoading && !reviewStats) {
     return (
       <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-4">
         <div className="size-10 border-4 border-[#CBFF38] border-t-transparent rounded-full animate-spin" />
         <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 italic">Compiling clinical reputation reports...</p>
       </div>
     );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Premium Header */}
      <div className="bg-black text-white pt-16 pb-24 px-6 md:px-10 rounded-b-[48px] shadow-2xl relative overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] size-[500px] bg-[#CBFF38]/10 blur-[120px] rounded-full" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 backdrop-blur-md rounded-full border border-white/10">
              <div className="size-1.5 rounded-full bg-[#CBFF38] animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#CBFF38] italic">Clinical Governance</span>
            </div>
            <div className="space-y-1">
              <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter leading-none">Operational Reports</h1>
              <p className="text-gray-400 font-medium max-w-md">Executive summary of clinical reputation, patient sentiment, and quality of care metrics.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 md:px-10 -mt-10 relative z-20 pb-20">
        {error ? (
          <div className="bg-white rounded-[40px] p-10 border border-red-100 shadow-xl flex items-center gap-6">
             <div className="size-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center">
                <ShieldCheck size={24} />
             </div>
             <div>
                <p className="text-xs font-black uppercase text-red-400 mb-1 italic">System Error Detected</p>
                <p className="text-sm font-bold text-red-600">{error}</p>
             </div>
          </div>
        ) : (
          <div className="space-y-8">
             {/* Stats Bento */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-10 rounded-[48px] shadow-xl border border-gray-100 group">
                   <div className="flex items-center justify-between mb-8">
                      <div className="size-12 bg-black text-[#CBFF38] rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
                         <Star size={24} />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-300 italic">Patient Trust Score</p>
                   </div>
                   <h3 className="text-6xl font-black italic tracking-tighter text-black leading-none mb-2">
                      {reviewStats?.averageRating?.toFixed(2) || "0.00"}
                   </h3>
                   <div className="flex gap-1 mb-4">
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} size={14} className={i <= (reviewStats?.averageRating || 0) ? 'fill-[#CBFF38] text-[#CBFF38]' : 'text-gray-100'} />
                      ))}
                   </div>
                   <p className="text-xs font-bold text-gray-400 italic">Aggregated from clinical data streams.</p>
                </div>

                <div className="bg-black text-white p-10 rounded-[48px] shadow-2xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-8 opacity-10">
                      <BarChart3 size={120} className="text-[#CBFF38]" />
                   </div>
                   <div className="relative z-10 h-full flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-8">
                         <div className="size-12 bg-[#CBFF38] text-black rounded-2xl flex items-center justify-center shadow-lg">
                            <TrendingUp size={24} />
                         </div>
                         <p className="text-[10px] font-black uppercase tracking-widest text-[#CBFF38] italic">Feedback Volume</p>
                      </div>
                      <div>
                         <h3 className="text-6xl font-black italic tracking-tighter text-white leading-none mb-2">
                            {reviewStats?.totalReviews || 0}
                         </h3>
                         <p className="text-xs font-bold text-gray-500 italic">Verified clinical testimonials.</p>
                      </div>
                   </div>
                </div>
             </div>

             {/* Distribution Analysis */}
             <div className="bg-white rounded-[48px] p-10 shadow-xl border border-gray-100">
                <h2 className="text-xl font-black uppercase italic tracking-tighter text-gray-900 border-l-4 border-[#CBFF38] pl-6 mb-10">Sentiment Distribution</h2>
                
                <div className="space-y-8">
                   {[5, 4, 3, 2, 1].map((rating) => {
                      const count = reviewStats?.distribution?.[rating] || 0;
                      const percentage = reviewStats?.totalReviews ? (count / reviewStats.totalReviews) * 100 : 0;
                      
                      return (
                        <div key={rating} className="group flex items-center gap-6">
                           <div className="flex items-center gap-2 w-12 shrink-0">
                              <span className="text-lg font-black italic">{rating}</span>
                              <Star size={12} className="fill-[#CBFF38] text-[#CBFF38]" />
                           </div>
                           <div className="flex-1 h-3 bg-gray-50 rounded-full overflow-hidden p-0.5">
                              <motion.div 
                                 initial={{ width: 0 }}
                                 animate={{ width: `${percentage}%` }}
                                 transition={{ duration: 1, delay: (5-rating) * 0.1 }}
                                 className="h-full bg-black rounded-full border-r-2 border-[#CBFF38]" 
                              />
                           </div>
                           <div className="w-10 text-right">
                              <span className="text-xs font-black italic text-gray-400 group-hover:text-black transition-colors">{count}</span>
                           </div>
                        </div>
                      )
                   })}
                </div>
             </div>

             <div className="bg-[#CBFF38] p-10 rounded-[48px] shadow-xl shadow-lime-500/10 flex flex-col md:flex-row items-center justify-between gap-8 group cursor-pointer hover:bg-black hover:text-[#CBFF38] transition-all">
                <div className="flex items-center gap-6">
                   <div className="size-14 bg-white text-black rounded-2xl flex items-center justify-center shadow-lg group-hover:bg-[#CBFF38]">
                      <ArrowUpRight size={24} />
                   </div>
                   <div>
                      <h4 className="text-lg font-black uppercase italic tracking-tighter leading-none mb-1">Export Executive Summary</h4>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Generate High-Fidelity PDF Protocol</p>
                   </div>
                </div>
                <div className="h-px w-20 bg-black/10 md:h-20 md:w-px group-hover:bg-white/10" />
                <div className="text-center md:text-right">
                   <p className="text-[10px] font-black uppercase tracking-widest opacity-40 italic">Last Sync Trace</p>
                   <p className="text-xs font-black italic">T-{new Date().toLocaleTimeString()}</p>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
