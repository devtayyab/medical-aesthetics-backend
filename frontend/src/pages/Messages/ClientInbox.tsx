import React, { useEffect, useState } from 'react';
import { Inbox, MessageSquare, Megaphone } from 'lucide-react';
import api from '@/services/api';

interface InboxItem {
  id: string;
  source: 'conversation' | 'announcement';
  from: string;
  title: string | null;
  content: string;
  createdAt: string;
}

const formatAthens = (value: string) => {
  try {
    return new Date(value).toLocaleString('el-GR', {
      timeZone: 'Europe/Athens',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return '';
  }
};

/**
 * Client "Your inbox": read-only list of messages from BeautyDoctors and the clinic.
 * Clients do not start conversations.
 */
export const ClientInbox: React.FC = () => {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const isGreek = typeof window === 'undefined' || localStorage.getItem('preferredLang') !== 'en';

  useEffect(() => {
    let cancelled = false;
    api
      .get('/messages/inbox')
      .then((res: any) => {
        if (cancelled) return;
        setItems(Array.isArray(res?.data) ? res.data : []);
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-gray-900">
      <div className="max-w-3xl w-full mx-auto px-4 sm:px-8 pt-8 sm:pt-14 pb-16">
        <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight leading-none">
          {isGreek ? 'Τα μηνύματά σας' : 'Your inbox'}
        </h1>
        <p className="text-gray-600 mt-3 font-bold text-sm max-w-xl">
          {isGreek
            ? 'Εδώ βλέπετε τα μηνύματα από την ομάδα Beauty Doctors και την κλινική σας.'
            : 'Messages from the Beauty Doctors team and your clinic.'}
        </p>

        <div className="mt-8 space-y-3">
          {status === 'loading' && (
            <div className="flex items-center justify-center p-12">
              <div className="size-8 border-2 border-[#CBFF38] border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {status === 'error' && (
            <div className="p-6 bg-white rounded-2xl border border-gray-100 text-sm font-bold text-gray-500 text-center">
              {isGreek ? 'Δεν ήταν δυνατή η φόρτωση των μηνυμάτων. Δοκιμάστε ξανά αργότερα.' : 'Could not load your messages. Please try again later.'}
            </div>
          )}

          {status === 'ready' && items.length === 0 && (
            <div className="p-12 bg-white rounded-3xl border border-gray-100 text-center">
              <div className="size-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3 text-gray-300">
                <Inbox className="size-7" />
              </div>
              <p className="text-sm font-black uppercase tracking-wider text-gray-500">
                {isGreek ? 'Δεν έχετε μηνύματα' : 'You have no messages'}
              </p>
            </div>
          )}

          {status === 'ready' &&
            items.map((item) => (
              <div key={`${item.source}-${item.id}`} className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="size-10 rounded-xl bg-black text-[#CBFF38] flex items-center justify-center shrink-0">
                    {item.source === 'announcement' ? <Megaphone size={16} /> : <MessageSquare size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-sm font-black text-gray-900 truncate">{item.title || item.from}</p>
                      <span className="text-[11px] font-bold text-gray-400 shrink-0">{formatAthens(item.createdAt)}</span>
                    </div>
                    {item.title && <p className="text-[11px] font-bold text-gray-400">{item.from}</p>}
                    <p className="text-sm text-gray-700 mt-2 whitespace-pre-line break-words">{item.content}</p>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default ClientInbox;
