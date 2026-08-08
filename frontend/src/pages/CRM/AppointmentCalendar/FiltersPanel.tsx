import React from 'react';
import { X, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { APPOINTMENT_STATUS_OPTIONS, STATUS_CONFIG, PAYMENT_STATUS_CONFIG } from './constants';
import type { CalendarFilters } from './types';

interface FiltersPanelProps {
  isOpen: boolean;
  filters: CalendarFilters;
  clinics: any[];
  salespersons: any[];
  onFiltersChange: (filters: CalendarFilters) => void;
  onClose: () => void;
}

const PAYMENT_STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'UNPAID', label: 'Unpaid' },
  { value: 'PAID', label: 'Paid' },
  { value: 'PARTIALLY_PAID', label: 'Partial' },
];

export const FiltersPanel: React.FC<FiltersPanelProps> = ({
  isOpen,
  filters,
  clinics,
  salespersons,
  onFiltersChange,
  onClose,
}) => {
  const update = (key: keyof CalendarFilters, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const resetAll = () => {
    onFiltersChange({
      clinicId: 'all',
      salesPersonId: 'all',
      status: 'all',
      paymentStatus: 'all',
    });
  };

  const activeCount = [
    filters.clinicId !== 'all',
    filters.salesPersonId !== 'all',
    filters.status !== 'all',
    filters.paymentStatus !== 'all',
  ].filter(Boolean).length;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[9999] bg-slate-900/20 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-[20rem] bg-white border-l border-slate-200 shadow-2xl z-[9999] flex flex-col transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-100 rounded-lg flex items-center justify-center">
              <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-[13px] font-black text-slate-800">Filters</h3>
              {activeCount > 0 && (
                <p className="text-[10px] text-indigo-600 font-bold">{activeCount} active</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeCount > 0 && (
              <button
                onClick={resetAll}
                className="flex items-center gap-1 px-2 py-1.5 text-[10px] font-bold text-slate-500 hover:text-slate-700 bg-slate-50 rounded-lg transition-colors"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filters Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          {/* Clinic Filter */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
              Clinic
            </label>
            <div className="space-y-1.5">
              <FilterOption
                value="all"
                label="All Clinics"
                isSelected={filters.clinicId === 'all'}
                onClick={() => update('clinicId', 'all')}
              />
              {clinics.map(c => (
                <FilterOption
                  key={c.id}
                  value={c.id}
                  label={c.name}
                  isSelected={filters.clinicId === c.id}
                  onClick={() => update('clinicId', c.id)}
                />
              ))}
            </div>
          </div>

          {/* Sales Person Filter */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
              Sales Person
            </label>
            <div className="space-y-1.5">
              <FilterOption
                value="all"
                label="All Staff"
                isSelected={filters.salesPersonId === 'all'}
                onClick={() => update('salesPersonId', 'all')}
              />
              {salespersons.map(sp => (
                <FilterOption
                  key={sp.id}
                  value={sp.id}
                  label={sp.name}
                  isSelected={filters.salesPersonId === sp.id}
                  onClick={() => update('salesPersonId', sp.id)}
                />
              ))}
            </div>
          </div>

          {/* Appointment Status Filter */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
              Appointment Status
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => update('status', 'all')}
                className={`px-3 py-2 rounded-xl border text-[10px] font-bold transition-all ${filters.status === 'all'
                    ? 'bg-slate-900 border-slate-900 text-white'
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
              >
                All
              </button>
              {APPOINTMENT_STATUS_OPTIONS.map(opt => {
                const cfg = STATUS_CONFIG[opt.value] || STATUS_CONFIG.PENDING;
                const isSelected = filters.status === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => update('status', opt.value)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[10px] font-bold transition-all ${isSelected
                        ? `${cfg.bg} ${cfg.border} ${cfg.text}`
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                  >
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isSelected ? cfg.dot : 'bg-slate-300'}`} />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment Status Filter */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
              Payment Status
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {PAYMENT_STATUS_OPTIONS.map(opt => {
                const isSelected = filters.paymentStatus === opt.value;
                const cfg = opt.value !== 'all' ? PAYMENT_STATUS_CONFIG[opt.value] : null;
                return (
                  <button
                    key={opt.value}
                    onClick={() => update('paymentStatus', opt.value)}
                    className={`px-3 py-2 rounded-xl border text-[10px] font-bold transition-all ${isSelected
                        ? cfg
                          ? `${cfg.bg} border-current ${cfg.text}`
                          : 'bg-slate-900 border-slate-900 text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full py-3 bg-indigo-600 text-white text-[12px] font-black rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
          >
            Apply Filters {activeCount > 0 && `(${activeCount})`}
          </button>
        </div>
      </div>
    </>
  );
};

interface FilterOptionProps {
  value: string;
  label: string;
  isSelected: boolean;
  onClick: () => void;
}

const FilterOption: React.FC<FilterOptionProps> = ({ label, isSelected, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-left transition-all ${isSelected
        ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
        : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
      }`}
  >
    <span className="text-[12px] font-semibold truncate">{label}</span>
    {isSelected && (
      <div className="w-4 h-4 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
        <div className="w-2 h-2 bg-white rounded-full" />
      </div>
    )}
  </button>
);
