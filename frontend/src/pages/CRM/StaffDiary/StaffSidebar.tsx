import React from 'react';
import { Users, Stethoscope } from 'lucide-react';
import { PROVIDER_COLORS } from './constants';
import type { ProviderResource } from './types';

interface StaffSidebarProps {
  providers: ProviderResource[];
  selectedId: string;
  currentUserId?: string;
  currentUserName?: string;
  isManager: boolean;
  onSelect: (id: string) => void;
  // Clinic selector props
  clinics: any[];
  selectedClinicId: string;
  onClinicChange: (clinicId: string) => void;
}

export const StaffSidebar: React.FC<StaffSidebarProps> = ({
  providers,
  selectedId,
  currentUserId,
  currentUserName,
  isManager,
  onSelect,
  clinics,
  selectedClinicId,
  onClinicChange,
}) => {
  return (
    <div className="hidden lg:flex w-52 flex-shrink-0 bg-white border-r border-gray-100 flex-col h-full">
      {/* Clinic Selector Header */}
      <div className="p-4 border-b border-gray-100 bg-gradient-to-b from-slate-50 to-white">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
          Select Clinic
        </h3>
        <select
          value={selectedClinicId}
          onChange={(e) => onClinicChange(e.target.value)}
          className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {clinics.map(clinic => (
            <option key={clinic.id} value={clinic.id}>
              {clinic.name}
            </option>
          ))}
        </select>
      </div>

      {/* Staff Header */}
      <div className="px-4 pt-4 pb-2">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
          Clinic Staff
        </h3>
        <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wide">
          {providers.length} Active
        </p>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
        {/* All Staff */}
        <button
          onClick={() => onSelect('all')}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all text-left group ${
            selectedId === 'all'
              ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
              selectedId === 'all' ? 'bg-white/20' : 'bg-slate-100'
            }`}
          >
            <Users
              className={`w-4 h-4 ${selectedId === 'all' ? 'text-white' : 'text-slate-500'}`}
            />
          </div>
          <div className="min-w-0">
            <p
              className={`text-[11px] font-bold truncate ${
                selectedId === 'all' ? 'text-white' : 'text-slate-700'
              }`}
            >
              All Staff
            </p>
            <p
              className={`text-[9px] ${
                selectedId === 'all' ? 'text-white/70' : 'text-slate-400'
              }`}
            >
              Full roster
            </p>
          </div>
        </button>

        {/* Divider */}
        {(!isManager && providers.length > 0) && (
          <div className="h-px bg-slate-100 my-2 mx-1" />
        )}

        {/* Providers */}
        {!isManager && providers.map(provider => {
          const colors = PROVIDER_COLORS[provider.colorIndex % PROVIDER_COLORS.length];
          const isSelected = selectedId === provider.id;
          const isMe = provider.id === currentUserId;

          return (
            <button
              key={provider.id}
              onClick={() => onSelect(provider.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all text-left group ${
                isSelected
                  ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-[11px] font-black ${
                  isSelected ? 'bg-white/20 text-white' : `${colors.bg} ${colors.text}`
                }`}
              >
                {provider.initials}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p
                    className={`text-[11px] font-bold truncate ${
                      isSelected ? 'text-white' : 'text-slate-700 group-hover:text-slate-900'
                    }`}
                  >
                    {provider.name}
                  </p>
                  {isMe && (
                    <span
                      className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      YOU
                    </span>
                  )}
                </div>
                <p
                  className={`text-[9px] truncate ${
                    isSelected ? 'text-white/70' : 'text-slate-400'
                  }`}
                >
                  Provider
                </p>
              </div>

              {/* Selection Dot */}
              <div
                className={`w-1.5 h-1.5 rounded-full shadow-sm transition-all ${
                  isSelected ? 'bg-white scale-100 opacity-100' : 'scale-0 opacity-0'
                }`}
              />
            </button>
          );
        })}

        {providers.length === 0 && (
          <div className="px-3 py-4 text-center">
            <Stethoscope className="w-6 h-6 text-slate-200 mx-auto mb-2" />
            <p className="text-[10px] text-slate-400 font-medium">No staff members found</p>
          </div>
        )}
      </div>
    </div>
  );
};
