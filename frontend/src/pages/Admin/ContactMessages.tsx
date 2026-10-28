import React, { useCallback, useEffect, useState } from 'react';
import { Mail, Phone, MailOpen, Inbox } from 'lucide-react';
import api from '@/services/api';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

const formatAthens = (value: string) =>
  new Date(value).toLocaleString('el-GR', {
    timeZone: 'Europe/Athens',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

/** Admin inbox for messages sent through the public contact form. */
const ContactMessages: React.FC = () => {
  const [items, setItems] = useState<ContactMessage[]>([]);
  const [unread, setUnread] = useState(0);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res: any = await api.get('/notifications/contact-messages', { params: { limit: 100, unreadOnly } });
      setItems(res?.data?.items || []);
      setUnread(Number(res?.data?.unread || 0));
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Δεν ήταν δυνατή η φόρτωση των μηνυμάτων.');
    } finally {
      setIsLoading(false);
    }
  }, [unreadOnly]);

  useEffect(() => {
    load();
  }, [load]);

  const setRead = async (msg: ContactMessage, isRead: boolean) => {
    try {
      await api.patch(`/notifications/contact-messages/${msg.id}/read`, { isRead });
      setItems((prev) => prev.map((m) => (m.id === msg.id ? { ...m, isRead } : m)));
      setUnread((u) => Math.max(0, u + (isRead ? -1 : 1)));
    } catch {
      // keep current state
    }
  };

  const toggleOpen = (msg: ContactMessage) => {
    const next = openId === msg.id ? null : msg.id;
    setOpenId(next);
    if (next && !msg.isRead) setRead(msg, true);
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 uppercase tracking-tight">Μηνύματα επικοινωνίας</h1>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">
            Από τη φόρμα επικοινωνίας της ιστοσελίδας · {unread} μη αναγνωσμένα
          </p>
        </div>
        <label className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-600 cursor-pointer">
          <input type="checkbox" checked={unreadOnly} onChange={(e) => setUnreadOnly(e.target.checked)} />
          Μόνο μη αναγνωσμένα
        </label>
      </div>

      {error && <div className="mb-4 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-bold">{error}</div>}

      {isLoading ? (
        <div className="p-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100">
          <Inbox className="mx-auto h-10 w-10 text-gray-300 mb-3" />
          <p className="text-sm font-black uppercase text-gray-500">Δεν υπάρχουν μηνύματα</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((msg) => (
            <div key={msg.id} className={`bg-white rounded-2xl border shadow-sm ${msg.isRead ? 'border-gray-100' : 'border-lime-300'}`}>
              <button type="button" onClick={() => toggleOpen(msg)} className="w-full text-left p-4 md:p-5 flex items-start gap-3">
                <div className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${msg.isRead ? 'bg-gray-50 text-gray-400' : 'bg-black text-[#CBFF38]'}`}>
                  {msg.isRead ? <MailOpen size={16} /> : <Mail size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className={`text-sm truncate ${msg.isRead ? 'font-bold text-gray-600' : 'font-black text-gray-900'}`}>{msg.subject}</p>
                    <span className="text-[11px] font-bold text-gray-400 shrink-0">{formatAthens(msg.createdAt)}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{msg.name} · {msg.email}</p>
                </div>
              </button>
              {openId === msg.id && (
                <div className="px-4 md:px-5 pb-5 border-t border-gray-50 pt-4 space-y-3">
                  <p className="text-sm text-gray-700 whitespace-pre-line break-words">{msg.message}</p>
                  <div className="flex flex-wrap gap-3 text-xs font-bold">
                    <a href={`mailto:${msg.email}?subject=${encodeURIComponent('Re: ' + msg.subject)}`} className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-black text-[#CBFF38]">
                      <Mail size={14} /> Απάντηση με email
                    </a>
                    {msg.phone && (
                      <a href={`tel:${msg.phone}`} className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-gray-100 text-gray-800">
                        <Phone size={14} /> {msg.phone}
                      </a>
                    )}
                    <button type="button" onClick={() => setRead(msg, !msg.isRead)} className="px-3 py-2 rounded-xl border border-gray-200 text-gray-600">
                      {msg.isRead ? 'Σήμανση ως μη αναγνωσμένο' : 'Σήμανση ως αναγνωσμένο'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContactMessages;
