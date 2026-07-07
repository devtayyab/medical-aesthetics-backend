import React from 'react';
import { Users } from 'lucide-react';
import { SALESPERSON_COLORS } from './constants';
import type { SalesPersonResource } from './types';

interface SalesPersonSidebarProps {
  salespersons: SalesPersonResource[];
  selectedId: string;
  currentUserId?: string;
  currentUserName?: string;
  isManager: boolean;
  onSelect: (id: string) => void;
}

export const SalesPersonSidebar: React.FC<SalesPersonSidebarProps> = ({
  salespersons,
  selectedId,
  currentUserId,
  currentUserName,
  isManager: _isManager,
  onSelect,
}) => {
  return (
    <div className="hidden lg:flex w-52 flex-shrink-0 bg-white border-r border-gray-100 flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 bg-gradient-to-b from-slate-50 to-white">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
          Sales Team
        </h3>
        <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wide">
          {salespersons.length} Active
        </p>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
        {/* All Staff */}
        {_isManager && (
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
        )}

        {/* Divider */}
        {(salespersons.length > 0 || currentUserId) && (
          <div className="h-px bg-slate-100 my-2 mx-1" />
        )}

        {/* Salespersons */}
        {salespersons.map(sp => {
          const colors = SALESPERSON_COLORS[sp.colorIndex % SALESPERSON_COLORS.length];
          const isSelected = selectedId === sp.id;
          const isMe = sp.id === currentUserId;

          return (
            <button
              key={sp.id}
              onClick={() => onSelect(sp.id)}
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
                {sp.initials}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <p
                    className={`text-[11px] font-bold truncate ${
                      isSelected ? 'text-white' : 'text-slate-700'
                    }`}
                  >
                    {sp.name}
                    {isMe && (
                      <span
                        className={`ml-1 text-[8px] font-black ${
                          isSelected ? 'text-white/70' : 'text-indigo-500'
                        }`}
                      >
                        (You)
                      </span>
                    )}
                  </p>
                </div>
                <p
                  className={`text-[9px] font-mono ${
                    isSelected ? 'text-white/60' : 'text-slate-400'
                  }`}
                >
                  #{sp.id.slice(-6).toUpperCase()}
                </p>
              </div>

              {/* Color dot */}
              {!isSelected && (
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${colors.dot}`} />
              )}
            </button>
          );
        })}

        {/* Current user if not in salespersons list */}
        {currentUserId && !salespersons.find(sp => sp.id === currentUserId) && (
          <>
            <div className="h-px bg-slate-100 my-2 mx-1" />
            <button
              onClick={() => onSelect(currentUserId)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all text-left ${
                selectedId === currentUserId
                  ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-[11px] font-black ${
                  selectedId === currentUserId
                    ? 'bg-white/20 text-white'
                    : 'bg-indigo-100 text-indigo-700'
                }`}
              >
                {currentUserName?.[0]?.toUpperCase() || 'M'}
              </div>
              <div className="min-w-0">
                <p
                  className={`text-[11px] font-bold truncate ${
                    selectedId === currentUserId ? 'text-white' : 'text-slate-700'
                  }`}
                >
                  {currentUserName || 'Me'}
                  <span
                    className={`ml-1 text-[8px] font-black ${
                      selectedId === currentUserId ? 'text-white/70' : 'text-indigo-500'
                    }`}
                  >
                    (You)
                  </span>
                </p>
                <p
                  className={`text-[9px] font-mono ${
                    selectedId === currentUserId ? 'text-white/60' : 'text-slate-400'
                  }`}
                >
                  #{currentUserId.slice(-6).toUpperCase()}
                </p>
              </div>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
