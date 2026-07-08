import React, { useState } from 'react';
import {
  ChevronLeft, ChevronRight, Calendar, Plus, Lock,
  SlidersHorizontal, RefreshCw,
} from 'lucide-react';
import {
  format, addDays, subDays, addWeeks, subWeeks,
  startOfWeek, endOfWeek,
} from 'date-fns';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import type { CalendarView, CalendarFilters } from './types';

interface CalendarToolbarProps {
  viewDate: Date;
  viewMode: CalendarView;
  filters: CalendarFilters;
  clinics: any[];
  activeFilterCount: number;
  isLoading: boolean;
  onViewDateChange: (date: Date) => void;
  onViewModeChange: (mode: CalendarView) => void;
  onTodayClick: () => void;
  onFilterClinicChange: (clinicId: string) => void;
  onNewAppointment: () => void;
  onBlockSlot: () => void;
  onBlockDay: () => void;
  onOpenFilters: () => void;
  onRefresh: () => void;
}

export const CalendarToolbar: React.FC<CalendarToolbarProps> = ({
  viewDate,
  viewMode,
  filters,
  clinics,
  activeFilterCount,
  isLoading,
  onViewDateChange,
  onViewModeChange,
  onTodayClick,
  onFilterClinicChange,
  onNewAppointment,
  onBlockSlot,
  onBlockDay,
  onOpenFilters,
  onRefresh,
}) => {
  const [showBlockMenu, setShowBlockMenu] = useState(false);
  const { user } = useSelector((state: RootState) => state.auth);
  const isSalesperson = user?.role === 'salesperson';

  const weekStart = startOfWeek(viewDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(viewDate, { weekStartsOn: 1 });

  const navigatePrev = () => {
    onViewDateChange(viewMode === 'week' ? subWeeks(viewDate, 1) : subDays(viewDate, 1));
  };
  const navigateNext = () => {
    onViewDateChange(viewMode === 'week' ? addWeeks(viewDate, 1) : addDays(viewDate, 1));
  };

  const dateLabel =
    viewMode === 'week'
      ? `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d, yyyy')}`
      : format(viewDate, 'EEEE, MMMM d, yyyy');

  return (
    <div className="bg-white border-b border-slate-200 z-20 sticky top-0">
      {/* Top row */}
      <div className="flex items-center justify-between px-4 py-3 gap-3 flex-wrap">
        {/* Brand + Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <Calendar className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-black text-slate-900 leading-tight tracking-tight">
              Appointment Calendar
            </h1>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              Multi-Clinic Booking
            </p>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Clinic Filter */}
          <div className="relative">
            <select
              value={filters.clinicId}
              onChange={e => onFilterClinicChange(e.target.value)}
              className="h-9 bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-semibold rounded-lg pl-3 pr-7 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
            >
              <option value="all">All Clinics</option>
              {clinics.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <ChevronLeft className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 rotate-[-90deg] pointer-events-none" />
          </div>

          {/* Date Navigator */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg h-9 overflow-hidden">
            <button
              onClick={navigatePrev}
              className="w-9 h-9 flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-500"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-[11px] font-bold text-slate-700 whitespace-nowrap min-w-[140px] text-center">
              {dateLabel}
            </span>
            <button
              onClick={navigateNext}
              className="w-9 h-9 flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-500"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Today */}
          <button
            onClick={onTodayClick}
            className="h-9 px-3 text-[11px] font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Today
          </button>

          {/* View Mode Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-lg h-9 items-center gap-0.5">
            {(['day', 'week'] as CalendarView[]).map(mode => (
              <button
                key={mode}
                onClick={() => onViewModeChange(mode)}
                className={`px-3 py-1 text-[10px] font-black uppercase rounded-md transition-all ${
                  viewMode === mode
                    ? 'bg-white shadow-sm text-indigo-600'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Filters */}
          <button
            onClick={onOpenFilters}
            className={`relative h-9 w-9 flex items-center justify-center rounded-lg border transition-colors ${
              activeFilterCount > 0
                ? 'bg-indigo-600 border-indigo-600 text-white'
                : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Refresh */}
          <button
            onClick={onRefresh}
            className={`h-9 w-9 flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors ${isLoading ? 'animate-spin' : ''}`}
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Block Slot menu */}
          {!isSalesperson && (
            <div className="relative">
              <button
                onClick={() => setShowBlockMenu(v => !v)}
                className="h-9 px-3 flex items-center gap-1.5 text-[11px] font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Block</span>
                <ChevronLeft className="w-3 h-3 rotate-[-90deg]" />
              </button>

              {showBlockMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowBlockMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                    <button
                      onClick={() => { setShowBlockMenu(false); onBlockSlot(); }}
                      className="w-full px-4 py-3 text-left text-[12px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
                    >
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      Block Time Slot
                    </button>
                    <button
                      onClick={() => { setShowBlockMenu(false); onBlockDay(); }}
                      className="w-full px-4 py-3 text-left text-[12px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2 border-t border-slate-100"
                    >
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Block Entire Day
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* New Appointment */}
          <button
            onClick={onNewAppointment}
            className="h-9 px-4 flex items-center gap-2 text-[11px] font-black bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-lg shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:scale-[1.02] transition-all"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Appointment</span>
          </button>
        </div>
      </div>
    </div>
  );
};
