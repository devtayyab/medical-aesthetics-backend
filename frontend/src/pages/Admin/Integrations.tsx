import React from 'react';
import { Settings, ExternalLink, Calendar, MessageSquare, CreditCard } from 'lucide-react';

export const Integrations: React.FC = () => {
    const integrationList = [
        { title: 'Meta (Facebook / Instagram)', icon: <MessageSquare className="w-8 h-8 text-blue-600" />, desc: 'Sync leads to CRM and tracking pixels.', active: true },
        { title: 'Viva Wallet / Stripe', icon: <CreditCard className="w-8 h-8 text-violet-600" />, desc: 'Process payments & handle refunds.', active: true },
        { title: 'Google Calendar API', icon: <Calendar className="w-8 h-8 text-red-500" />, desc: 'Sync appointments for clinics and salespeople.', active: false },
        { title: 'HubSpot', icon: <Settings className="w-8 h-8 text-orange-500" />, desc: 'Sync global CRM details externally.', active: false },
    ];

    return (
        <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">System Integrations</h1>
                <p className="text-sm text-gray-500 mt-1">Configure and monitor third-party connections</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {integrationList.map((intg, i) => (
                    <div key={i} className={`p-6 bg-white border ${intg.active ? 'border-green-200 shadow-md shadow-green-100/50' : 'border-gray-200 shadow-sm'} rounded-xl`}>
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-gray-50 rounded-lg">{intg.icon}</div>
                            {intg.active ? (
                                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full border border-green-200">Connected</span>
                            ) : (
                                <span className="px-3 py-1 bg-gray-100 text-gray-500 text-xs font-bold rounded-full border border-gray-200">Not Connected</span>
                            )}
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{intg.title}</h3>
                        <p className="text-sm text-gray-500 mb-6">{intg.desc}</p>

                        <button className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                            <Settings className="w-4 h-4" /> Configure <ExternalLink className="w-3 h-3 ml-1" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};
