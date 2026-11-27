import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Send, RefreshCcw } from 'lucide-react';
import { adminAPI } from '@/services/api';
import { confirmDialog } from '@/components/molecules/ConfirmDialog';

interface PendingAccount {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  invitationSentAt: string | null;
  appointmentCount: number;
  lastAppointmentAt: string | null;
  fromFresha: boolean;
  blockedReason: string | null;
}

type Mode = 'off' | 'test' | 'on';

const MAX_PER_SEND = 50;

const REASONS: Record<string, string> = {
  no_valid_email: 'No valid email',
  email_bounced: 'Email bounced',
  notifications_disabled: 'Notifications disabled',
  already_sent: 'Already sent',
  just_sent: 'Sent a moment ago',
  password_already_set: 'Password already set',
  not_an_active_customer: 'Not an active customer',
  send_failed: 'Email could not be sent',
  not_found: 'Customer not found',
};

const MODES: Array<{ value: Mode; label: string; hint: string }> = [
  { value: 'off', label: 'Off', hint: 'Nothing is sent automatically.' },
  { value: 'test', label: 'Test', hint: 'Only to the test addresses below.' },
  { value: 'on', label: 'On', hint: 'Every customer who has not set a password.' },
];

const fmt = (value: string | null) => (value ? new Date(value).toLocaleDateString('el-GR') : '-');
const fullName = (r: PendingAccount) => `${r.firstName || ''} ${r.lastName || ''}`.trim();
const errorText = (err: any, fallback: string) => err?.response?.data?.message || fallback;

export const AccountInvitations: React.FC = () => {
  const [rows, setRows] = useState<PendingAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [freshaOnly, setFreshaOnly] = useState(true);
  const [show, setShow] = useState<'unsent' | 'sent' | 'all'>('unsent');
  const [savedMode, setSavedMode] = useState<Mode | null>(null);
  const [mode, setMode] = useState<Mode>('off');
  const [testEmails, setTestEmails] = useState('');

  const loadRows = useCallback(async () => {
    setIsLoading(true);
    try {
      setRows((await adminAPI.getPendingAccounts()).data || []);
    } catch (err) {
      toast.error(errorText(err, 'Failed to load the customers'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRows();
    adminAPI
      .getInvitationSettings()
      .then((res: any) => {
        setMode(res.data.mode);
        setSavedMode(res.data.mode);
        setTestEmails((res.data.testEmails || []).join('\n'));
      })
      .catch((err: any) => toast.error(errorText(err, 'Failed to load the settings')));
  }, [loadRows]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter(r => {
      if (freshaOnly && !r.fromFresha) return false;
      if (show === 'unsent' && r.invitationSentAt) return false;
      if (show === 'sent' && !r.invitationSentAt) return false;
      return !q || `${fullName(r)} ${r.email || ''} ${r.phone || ''}`.toLowerCase().includes(q);
    });
  }, [rows, search, freshaOnly, show]);

  // Customers ticked while searching stay selected; they are all named before sending.
  const chosen = rows.filter(r => selected.has(r.id) && !r.blockedReason);

  const toggle = (id: string) =>
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const handleSend = async () => {
    if (chosen.length === 0 || chosen.length > MAX_PER_SEND) return;
    const again = chosen.filter(r => r.invitationSentAt).length;
    const ok = await confirmDialog({
      message: `Send the invitation email to ${chosen.length} customer(s)?${
        again ? ` ${again} of them already received one.` : ''
      }\n\n${chosen.map(r => fullName(r) || r.email).join(', ')}`,
    });
    if (!ok) return;
    setIsSending(true);
    try {
      const { data } = await adminAPI.sendAccountInvitations(chosen.map(r => r.id), again > 0);
      const failed = (data.results || []).filter((r: any) => !r.sent);
      if (data.sent > 0) toast.success(`${data.sent} invitation(s) sent`);
      if (failed.length > 0) {
        const reasons = [...new Set(failed.map((f: any) => REASONS[f.reason] || f.reason))].join(', ');
        toast.error(`${failed.length} not sent: ${reasons}`);
      }
      setSelected(new Set());
    } catch (err) {
      toast.error(errorText(err, 'Failed to send'));
    } finally {
      setIsSending(false);
      loadRows();
    }
  };

  const handleSaveMode = async () => {
    if (mode === 'on' && savedMode !== 'on') {
      const ok = await confirmDialog({
        message: 'Switch automatic invitations ON for every customer without a password?',
        danger: true,
      });
      if (!ok) return;
    }
    try {
      const { data } = await adminAPI.updateInvitationSettings({
        mode,
        testEmails: testEmails.split(/[\s,;]+/).filter(Boolean),
      });
      setSavedMode(data.mode);
      setTestEmails(data.testEmails.join('\n'));
      toast.success('Saved');
    } catch (err) {
      toast.error(errorText(err, 'Failed to save'));
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Account Invitations</h1>
        <p className="text-gray-500 mt-1">Customers who have an account but have not set a password yet.</p>
      </div>

      <section className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
        <div>
          <h2 className="font-bold text-gray-900">Automatic invitations</h2>
          <p className="text-sm text-gray-500">
            At the bottom of confirmation, day-before and same-day emails, and when someone registers with the email of an
            account without a password.
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          {MODES.map(m => (
            <label key={m.value} className="flex items-start gap-2 cursor-pointer">
              <input
                type="radio"
                name="mode"
                className="mt-1"
                disabled={savedMode === null}
                checked={mode === m.value}
                onChange={() => setMode(m.value)}
              />
              <span>
                <span className="block text-sm font-semibold text-gray-800">{m.label}</span>
                <span className="block text-xs text-gray-500">{m.hint}</span>
              </span>
            </label>
          ))}
        </div>
        {mode === 'test' && (
          <textarea
            value={testEmails}
            onChange={e => setTestEmails(e.target.value)}
            rows={3}
            placeholder="Test addresses, one per line"
            className="w-full max-w-md border border-gray-200 rounded-xl px-3 py-2 text-sm block"
          />
        )}
        <button
          type="button"
          onClick={handleSaveMode}
          disabled={savedMode === null}
          className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-semibold disabled:opacity-50"
        >
          Save
        </button>
      </section>

      <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="p-4 flex flex-wrap items-center gap-3 border-b border-gray-100">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, email, phone"
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-60"
          />
          <select
            value={show}
            onChange={e => setShow(e.target.value as 'unsent' | 'sent' | 'all')}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
          >
            <option value="unsent">Not invited yet</option>
            <option value="sent">Already invited</option>
            <option value="all">All</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={freshaOnly} onChange={e => setFreshaOnly(e.target.checked)} /> Fresha customers only
          </label>
          <button type="button" onClick={loadRows} aria-label="Refresh" className="p-2 text-gray-500 hover:text-gray-800">
            <RefreshCcw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <span className="text-sm text-gray-500">{visible.length} customers</span>
          <div className="ml-auto flex items-center gap-3">
            {chosen.length > MAX_PER_SEND && <span className="text-sm text-red-600">Up to {MAX_PER_SEND} at a time</span>}
            {chosen.length > 0 && (
              <button type="button" onClick={() => setSelected(new Set())} className="text-sm text-gray-500 underline">
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={handleSend}
              disabled={isSending || isLoading || chosen.length === 0 || chosen.length > MAX_PER_SEND}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold disabled:opacity-50"
            >
              <Send size={16} />
              {isSending ? 'Sending...' : `Send invitation (${chosen.length})`}
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                {['', 'Customer', 'Email', 'Phone', 'Appointments', 'Last appointment', 'Invitation'].map(h => (
                  <th key={h} className="px-4 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {!isLoading && visible.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">No customers found</td>
                </tr>
              )}
              {visible.map(r => (
                <tr key={r.id} className={r.blockedReason ? 'text-gray-400' : 'text-gray-800'}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label={`Select ${fullName(r)}`}
                      disabled={!!r.blockedReason}
                      checked={selected.has(r.id) && !r.blockedReason}
                      onChange={() => toggle(r.id)}
                    />
                  </td>
                  <td className="px-4 py-3 font-medium notranslate">{fullName(r) || '-'}</td>
                  <td className="px-4 py-3 notranslate">{r.email || '-'}</td>
                  <td className="px-4 py-3 notranslate">{r.phone || '-'}</td>
                  <td className="px-4 py-3">{r.appointmentCount}</td>
                  <td className="px-4 py-3">{fmt(r.lastAppointmentAt)}</td>
                  <td className="px-4 py-3">
                    {r.blockedReason
                      ? REASONS[r.blockedReason] || r.blockedReason
                      : r.invitationSentAt
                      ? `Sent ${fmt(r.invitationSentAt)}`
                      : 'Not sent'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
