import React, { useState, useEffect } from 'react';
import { Settings, CreditCard, Calendar, MessageSquare, Save, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { adminSettingsAPI } from '@/services/api';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

interface IntegrationLog {
  id: string;
  action: string;
  resourceId: string;
  data: any;
  createdAt: string;
}

export const Integrations: React.FC = () => {
  const [settings, setSettings] = useState<any>({
    meta_ingestion_enabled: true,
    viva_stripe_mode: 'test',
    hubspot_sync_enabled: false,
    google_calendar_sync_enabled: false,
    payments_enabled: true,
    stripe_public_key: '',
    stripe_secret_key: '',
    viva_merchant_id: '',
    viva_api_key: '',
  });
  const [logs, setLogs] = useState<IntegrationLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeConfig, setActiveConfig] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [settingsRes, logsRes] = await Promise.all([
        adminSettingsAPI.getSettings(),
        adminSettingsAPI.getIntegrationLogs(),
      ]);
      setSettings(settingsRes.data);
      setLogs(logsRes.data);
    } catch (error) {
      toast.error('Failed to load integration data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (key: string) => {
    setSettings((prev: any) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleInputChange = (key: string, value: string) => {
    setSettings((prev: any) => ({ ...prev, [key]: value }));
  };

  const saveSettings = async () => {
    try {
      setIsSaving(true);
      await adminSettingsAPI.updateSettings(settings);
      toast.success('Settings updated successfully');
      setActiveConfig(null);
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const integrationList = [
    { 
      id: 'meta',
      title: 'Meta (Facebook / Instagram)', 
      icon: <MessageSquare className="w-8 h-8 text-blue-600" />, 
      desc: 'Sync leads to CRM and tracking pixels.', 
      enabledKey: 'meta_ingestion_enabled' 
    },
    { 
      id: 'payments',
      title: 'Viva Wallet / Stripe', 
      icon: <CreditCard className="w-8 h-8 text-violet-600" />, 
      desc: 'Process payments & handle refunds.', 
      enabledKey: 'payments_enabled' // Assuming we have a general enable for this
    },
    { 
      id: 'google',
      title: 'Google Calendar API', 
      icon: <Calendar className="w-8 h-8 text-red-500" />, 
      desc: 'Sync appointments for clinics and salespeople.', 
      enabledKey: 'google_calendar_sync_enabled' 
    },
    { 
      id: 'hubspot',
      title: 'HubSpot', 
      icon: <Settings className="w-8 h-8 text-orange-500" />, 
      desc: 'Sync global CRM details externally.', 
      enabledKey: 'hubspot_sync_enabled' 
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-[#CBFF38] animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Integrations</h1>
          <p className="text-sm text-gray-500 mt-1">Configure and monitor third-party connections & sync status</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Integrations Grid */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          {integrationList.map((intg) => (
            <div key={intg.id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-gray-50 rounded-xl">{intg.icon}</div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${settings[intg.enabledKey] ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                    {settings[intg.enabledKey] ? 'Active' : 'Inactive'}
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={!!settings[intg.enabledKey]} 
                      onChange={() => handleToggle(intg.enabledKey)}
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#CBFF38]"></div>
                  </label>
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900">{intg.title}</h3>
              <p className="text-sm text-gray-500 mt-1 mb-6 h-10">{intg.desc}</p>
              
              <button 
                onClick={() => setActiveConfig(intg.id)}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-50 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-100 transition-colors"
              >
                <Settings className="w-4 h-4" /> Configure Integration
              </button>
            </div>
          ))}
        </div>

        {/* Integration Status & Logs */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden h-fit">
          <div className="p-6 border-b border-gray-50 bg-gray-50/50">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" /> Recent Errors & Sync Logs
            </h2>
          </div>
          <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
            {logs.length === 0 ? (
              <div className="p-12 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-200 mx-auto mb-3" />
                <p className="text-sm text-gray-500 font-medium">No errors detected in the last 100 events</p>
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${log.action.includes('ERROR') ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                      {log.action}
                    </span>
                    <span className="text-[10px] text-gray-400">{format(new Date(log.createdAt), 'MMM d, HH:mm')}</span>
                  </div>
                  <p className="text-xs text-gray-700 font-medium mb-1 truncate">ID: {log.resourceId}</p>
                  {log.data && (
                    <div className="bg-gray-900 rounded p-2 text-[10px] font-mono text-gray-300 overflow-x-auto">
                      {JSON.stringify(log.data, null, 2)}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          <div className="p-4 bg-gray-50 border-t border-gray-100">
             <button 
              onClick={fetchData}
              className="w-full text-xs font-bold text-gray-500 flex items-center justify-center gap-2 hover:text-gray-900 transition-colors"
             >
               <RefreshCw className="w-3.5 h-3.5" /> Refresh Status Dashboard
             </button>
          </div>
        </div>
      </div>

      {/* Configuration Modal */}
      {activeConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-[#0B1120] text-white">
              <div>
                <h2 className="text-2xl font-bold">Configure {integrationList.find(i => i.id === activeConfig)?.title}</h2>
                <p className="text-sm text-gray-400 mt-1">Manage API keys and sync behavior</p>
              </div>
              <button 
                onClick={() => setActiveConfig(null)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <AlertCircle className="w-6 h-6 rotate-45" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              {activeConfig === 'payments' && (
                <>
                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-gray-700">Payment Gateway Mode</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                         onClick={() => handleInputChange('viva_stripe_mode', 'test')}
                         className={`py-3 rounded-2xl border-2 font-bold text-sm transition-all ${settings.viva_stripe_mode === 'test' ? 'border-[#CBFF38] bg-[#CBFF38]/5 text-gray-900' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}
                      >
                        Test / Sandbox
                      </button>
                      <button 
                        onClick={() => handleInputChange('viva_stripe_mode', 'live')}
                        className={`py-3 rounded-2xl border-2 font-bold text-sm transition-all ${settings.viva_stripe_mode === 'live' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}
                      >
                        Live Production
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase">Stripe Public Key</label>
                      <input 
                        type="password"
                        value={settings.stripe_public_key || ''}
                        onChange={(e) => handleInputChange('stripe_public_key', e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CBFF38]"
                        placeholder="pk_test_..."
                      />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-gray-500 uppercase">Stripe Secret Key</label>
                      <input 
                        type="password"
                        value={settings.stripe_secret_key || ''}
                        onChange={(e) => handleInputChange('stripe_secret_key', e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CBFF38]"
                        placeholder="sk_test_..."
                      />
                    </div>
                  </div>
                </>
              )}

              {activeConfig === 'meta' && (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex gap-4">
                     <Info className="w-5 h-5 text-blue-600 shrink-0" />
                     <p className="text-xs text-blue-800 leading-relaxed">
                       Meta leads are automatically ingested when a user submits a form on Facebook or Instagram. Ensure your App ID and Access Token are correctly configured in the system environment or below.
                     </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Meta Access Token</label>
                    <textarea 
                      value={settings.facebook_access_token || ''}
                      onChange={(e) => handleInputChange('facebook_access_token', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CBFF38] h-24 font-mono text-xs"
                      placeholder="Enter Permanent Page Access Token..."
                    />
                  </div>
                </div>
              )}

              {(activeConfig === 'google' || activeConfig === 'hubspot') && (
                <div className="p-12 text-center">
                  <AlertCircle className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">This integration requires an OAuth2 flow which is managed via the main system OAuth portal.</p>
                  <button className="mt-6 px-6 py-2 bg-[#CBFF38] text-gray-900 font-bold rounded-xl shadow-lg shadow-[#CBFF38]/20">
                    Initiate OAuth Handshake
                  </button>
                </div>
              )}
            </div>

            <div className="p-8 bg-gray-50 flex gap-4">
              <button 
                onClick={() => setActiveConfig(null)}
                className="flex-1 px-4 py-3 bg-white border border-gray-200 text-gray-600 font-bold rounded-2xl hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={saveSettings}
                disabled={isSaving}
                className="flex-1 px-4 py-3 bg-[#CBFF38] text-gray-900 font-bold rounded-2xl shadow-lg shadow-[#CBFF38]/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Info = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
  </svg>
);
