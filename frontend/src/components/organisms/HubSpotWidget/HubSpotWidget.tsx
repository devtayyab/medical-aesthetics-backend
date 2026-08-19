import React, { useEffect, useState } from 'react';
import { RefreshCw, Briefcase, FileText, Calendar, DollarSign, User, CalendarDays } from 'lucide-react';
import { Badge } from '@/components/atoms/Badge';
import api from '@/services/api';

interface HubSpotDeal {
  id: string;
  name: string;
  amount: string;
  stage: string;
  pipeline: string;
  date: string;
}

interface HubSpotNote {
  id: string;
  title: string;
  body: string;
  date: string;
}

interface HubSpotData {
  contact: any;
  deals: HubSpotDeal[];
  summaryNotes: HubSpotNote[];
}

interface HubSpotWidgetProps {
  email?: string;
  phone?: string;
}

export const HubSpotWidget: React.FC<HubSpotWidgetProps> = ({ email, phone }) => {
  const [data, setData] = useState<HubSpotData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHubSpotData = async () => {
    if (!email && !phone) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/hubspot/contact-overview', {
        params: { email, phone }
      });
      if (res.data?.data) {
        setData(res.data.data);
      } else {
        setError('Contact not found in HubSpot');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch HubSpot data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHubSpotData();
  }, [email, phone]);

  if (!email && !phone) return null;

  return (
    <div className="bg-white rounded-xl border border-[#ff7a59]/20 shadow-sm overflow-hidden mt-4">
      {/* HubSpot Header */}
      <div className="bg-[#ff7a59]/10 border-b border-[#ff7a59]/20 px-5 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          {/* Simple HubSpot Logo placeholder */}
          <div className="w-6 h-6 rounded bg-[#ff7a59] text-white flex items-center justify-center font-black text-xs">
            HS
          </div>
          <h3 className="font-bold text-[#2e475d] text-sm">HubSpot CRM Sync</h3>
        </div>
        <button
          onClick={fetchHubSpotData}
          disabled={loading}
          className="text-[#ff7a59] hover:bg-[#ff7a59]/10 p-1.5 rounded-md transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="p-0">
        {loading ? (
          <div className="p-6 text-center text-sm font-medium text-slate-400">Syncing with HubSpot...</div>
        ) : error ? (
          <div className="p-6 text-center text-sm font-medium text-slate-400">{error}</div>
        ) : !data ? (
          <div className="p-6 text-center text-sm font-medium text-slate-400">No HubSpot data available.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {/* DEALS SECTION */}
            <div className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Briefcase className="w-4 h-4 text-[#ff7a59]" />
                <h4 className="font-bold text-slate-800 text-sm">Deals & Bookings</h4>
              </div>
              {data.deals.length === 0 ? (
                <div className="text-xs text-slate-400">No deals found.</div>
              ) : (
                <div className="space-y-3">
                  {data.deals.map(deal => (
                    <div key={deal.id} className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                      <div className="font-bold text-sm text-[#2e475d] mb-1">{deal.name}</div>
                      <div className="flex flex-wrap gap-2 text-[11px] font-medium text-slate-500 mb-2">
                        <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> {deal.amount || '0'}</span>
                        <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" /> {new Date(deal.date).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1 truncate max-w-[120px]" title={deal.pipeline}><Briefcase className="w-3 h-3" /> Clinic: {deal.pipeline}</span>
                      </div>
                      <Badge className="bg-[#eaf0f6] text-[#2e475d] hover:bg-[#cbd6e2] text-[10px] font-bold uppercase tracking-wider">
                        {deal.stage}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* NOTES / MEETINGS SECTION */}
            <div className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-4 h-4 text-[#ff7a59]" />
                <h4 className="font-bold text-slate-800 text-sm">Summary Notes</h4>
              </div>
              {data.summaryNotes.length === 0 ? (
                <div className="text-xs text-slate-400">No summary notes found.</div>
              ) : (
                <div className="relative pl-4 space-y-4 before:absolute before:inset-y-0 before:left-0 before:w-px before:bg-slate-200">
                  {data.summaryNotes.map(note => (
                    <div key={note.id} className="relative">
                      <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-[#ff7a59] border-2 border-white ring-2 ring-slate-50" />
                      <div className="text-[10px] font-bold text-slate-400 mb-1">
                        {new Date(note.date).toLocaleString()}
                      </div>
                      <div className="bg-[#f5f8fa] border border-[#cbd6e2] rounded-lg p-3">
                        <h5 className="font-bold text-sm text-[#2e475d] mb-1">{note.title}</h5>
                        {note.body ? (
                          <div 
                            className="text-xs text-slate-600 prose prose-sm max-w-none prose-p:my-1" 
                            dangerouslySetInnerHTML={{ __html: note.body }} 
                          />
                        ) : (
                          <div className="text-xs text-slate-400 italic">No detailed notes.</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
};
