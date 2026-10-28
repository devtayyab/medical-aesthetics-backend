import React, { useEffect, useState } from 'react';
import { Bell, Mail, Send, Users, ShieldCheck } from 'lucide-react';
import api from '@/services/api';

/**
 * Admin broadcast: push and/or email to every client who accepted marketing
 * communication (GDPR). The audience is decided on the server, not picked by hand.
 */
const BroadcastPage: React.FC = () => {
  const [audience, setAudience] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [push, setPush] = useState(true);
  const [email, setEmail] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get('/notifications/broadcast/audience')
      .then((res: any) => setAudience(Number(res?.data?.count ?? 0)))
      .catch(() => setAudience(null));
  }, []);

  const canSend = !!title.trim() && !!message.trim() && (push || email) && !isSending && (audience ?? 0) > 0;

  const handleSend = async () => {
    if (!canSend) return;
    const channels = [push ? 'push' : null, email ? 'email' : null].filter(Boolean).join(' + ');
    if (!window.confirm(`Αποστολή (${channels}) σε ${audience} πελάτες με συναίνεση marketing;`)) return;

    setIsSending(true);
    setError(null);
    setResult(null);
    try {
      const res: any = await api.post('/notifications/broadcast', { title: title.trim(), message: message.trim(), push, email });
      const r = res?.data || {};
      setResult(`Στάλθηκε σε ${r.recipients ?? 0} πελάτες (push: ${r.push ?? 0}, email: ${r.email ?? 0}).`);
      setTitle('');
      setMessage('');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Η αποστολή απέτυχε. Δοκιμάστε ξανά.');
    } finally {
      setIsSending(false);
    }
  };

  const channelButton = (active: boolean, onClick: () => void, icon: React.ReactNode, label: string, hint: string) => (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left ${
        active ? 'border-black bg-black text-[#CBFF38]' : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-300'
      }`}
    >
      <div className={`size-8 rounded-lg flex items-center justify-center ${active ? 'bg-[#CBFF38] text-black' : 'bg-white text-gray-400'}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-black uppercase leading-none mb-1">{label}</p>
        <p className={`text-[10px] font-bold ${active ? 'text-gray-400' : 'text-gray-400'}`}>{hint}</p>
      </div>
    </button>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-4xl mx-auto px-4 md:px-10 pt-8 pb-20">
        <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-none text-gray-900">Μαζικές ενημερώσεις</h1>
        <p className="text-gray-500 font-medium text-sm mt-3 max-w-xl">
          Η αποστολή γίνεται σε όλους τους πελάτες που έχουν αποδεχτεί την επικοινωνία marketing (GDPR).
        </p>

        <div className="mt-6 inline-flex items-center gap-3 px-4 py-3 bg-white border border-gray-100 rounded-2xl">
          <Users size={16} className="text-gray-400" />
          <span className="text-sm font-black text-gray-900">
            {audience === null ? '...' : audience} παραλήπτες
          </span>
          <ShieldCheck size={16} className="text-lime-600" />
          <span className="text-[11px] font-bold text-gray-500">με συναίνεση marketing</span>
        </div>

        <div className="mt-6 bg-white rounded-3xl p-5 md:p-8 border border-gray-100 shadow-sm space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {channelButton(push, () => setPush(!push), <Bell size={16} />, 'Push', 'Ειδοποίηση εφαρμογής / browser')}
            {channelButton(email, () => setEmail(!email), <Mail size={16} />, 'Email', 'Στο email του πελάτη')}
          </div>

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={150}
            placeholder="Τίτλος / θέμα email"
            className="w-full h-14 px-5 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-black outline-none"
          />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={8}
            maxLength={5000}
            placeholder="Κείμενο μηνύματος"
            className="w-full p-5 bg-gray-50 border border-gray-100 rounded-2xl font-medium text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-black outline-none resize-none"
          />

          {error && <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-bold">{error}</div>}
          {result && <div className="p-4 bg-lime-50 border border-lime-100 text-lime-800 rounded-xl text-sm font-bold">{result}</div>}

          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend}
            className="w-full h-14 bg-[#CBFF38] text-black rounded-xl font-black uppercase text-xs tracking-widest hover:bg-black hover:text-[#CBFF38] transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Send size={16} />
            {isSending ? 'Αποστολή...' : `Αποστολή σε ${audience ?? 0} πελάτες`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BroadcastPage;
