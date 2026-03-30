import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchLeads, setLeadFilters } from "@/store/slices/crmSlice";
import type { RootState, AppDispatch } from "@/store";
import { Search, Filter, X, ChevronDown } from "lucide-react";
import { DataTable } from "@/components/ui/DataTable";
import { OneCustomerDetail } from "@/pages/CRM/OneCustomerDetail";
import { Button } from "@/components/atoms/Button/Button";
import { Card, CardContent } from "@/components/molecules/Card/Card";
import { Input } from "@/components/atoms/Input/Input";
import { Badge } from "@/components/atoms/Badge/Badge";
import { Select } from "@/components/atoms/Select/Select";

export const ArchivedLeads: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { leads, isLoading, leadFilters } = useSelector(
    (state: RootState) => state.crm
  );

  const [searchTerm, setSearchTerm] = useState(leadFilters.search || "");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  // Enforce 'lost' status on mount and whenever filters change
  useEffect(() => {
    // We force status to 'lost' here to override any accidental global filters
    const archiveFilters = { ...leadFilters, status: 'lost' };
    dispatch(fetchLeads(archiveFilters));
  }, [dispatch, leadFilters.search, leadFilters.formNames, leadFilters.submissionDateFrom, leadFilters.submissionDateTo, leadFilters.lastContactedFrom, leadFilters.lastContactedTo]);

  const handleSearch = () => {
    dispatch(setLeadFilters({
      ...leadFilters,
      search: searchTerm,
      status: 'lost',
      page: 1
    }));
  };

  // Real-time search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== leadFilters.search) {
        handleSearch();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleFilterChange = (key: string, value: any) => {
    dispatch(setLeadFilters({
      ...leadFilters,
      [key]: value,
      status: 'lost', // Ensure it stays lost
      page: 1
    }));
  };

  if (selectedCustomer) {
    return (
      <div className="p-6 h-full flex flex-col relative space-y-6">
        <div className="flex justify-between items-center px-4">
          <Button variant="ghost" onClick={() => setSelectedCustomer(null)} className="font-bold text-xs flex items-center gap-2">
            <X className="w-4 h-4" /> Back to Archive
          </Button>
        </div>
        <OneCustomerDetail
          SelectedCustomer={selectedCustomer}
          isLoading={isLoading}
          error={null}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-full mx-auto px-4 sm:px-6 lg:px-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            Archive Database
            <Badge className="bg-red-50 text-red-600 border-red-100 px-2 py-0.5 rounded-lg text-[10px] font-bold">
              LOST LEADS
            </Badge>
          </h1>
          <p className="text-gray-500 text-xs font-medium">Manage and review your inactive or lost contacts</p>
        </div>

        <div className="flex flex-1 max-w-md mx-4 relative">
          <Input
            placeholder="Search archive by Name, Email or Phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="h-10 pl-10 bg-white border-gray-200 shadow-sm focus:ring-[#b3d81b] rounded-xl w-full"
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={`h-10 text-[11px] font-bold border-gray-200 hover:bg-gray-50 transition-all ${showFilters ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-gray-600'}`}
          >
            <Filter className={`w-3.5 h-3.5 mr-1.5 ${showFilters ? 'text-white' : 'text-gray-400'}`} />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
        </div>
      </div>

      {/* Filter Chips */}
      {Object.keys(leadFilters).some(k => leadFilters[k] !== undefined && leadFilters[k] !== '' && k !== 'search' && k !== 'status') && (
        <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
          {Object.entries(leadFilters).map(([key, value]) => {
            if (!value || key === 'search' || key === 'status') return null;
            let label = key;
            if (key === 'metaFormName') label = 'Form';
            if (key === 'submissionDateFrom') label = 'From';
            if (key === 'submissionDateTo') label = 'To';
            if (key === 'lastContactedFrom') label = 'Contact From';
            if (key === 'lastContactedTo') label = 'Contact To';

            const displayValue = Array.isArray(value)
              ? value.filter(Boolean).map(v => String(v).replace('_', ' ')).join(', ').toUpperCase()
              : String(value || '').replace('_', ' ').toUpperCase();

            return (
              <Badge
                key={key}
                variant="secondary"
                className="pl-2 pr-1 py-1 h-7 flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-100 font-medium text-[10px] rounded-lg"
              >
                <span className="opacity-60">{label}:</span> {displayValue}
                <button
                  onClick={() => handleFilterChange(key, '')}
                  className="ml-1 hover:bg-blue-100 rounded-full p-0.5 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            );
          })}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-[10px] text-gray-400 hover:text-red-500 font-bold"
            onClick={() => {
              dispatch(setLeadFilters({ status: 'lost' }));
              setSearchTerm('');
            }}
          >
            Clear All
          </Button>
        </div>
      )}

      {/* Advanced Filters Drawer */}
      {showFilters && (
        <Card className="border-none shadow-md bg-white animate-in slide-in-from-top-2 duration-300">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">Meta Form Name</label>
                <Select
                  value={Array.isArray(leadFilters.formNames) ? leadFilters.formNames[0] || '' : ''}
                  onChange={(val) => handleFilterChange('formNames', val ? [val] : [])}
                  placeholder="Select form..."
                  options={[
                    { value: '', label: 'All Forms' },
                    ...Array.from(new Set(leads.map(l => (l as any).lastMetaFormName).filter(Boolean))).map(f => ({ value: f as string, label: f as string }))
                  ]}
                  className="h-9 text-xs border-gray-200"
                />
              </div>

              <div className="md:col-span-1 space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">Submission Date (Meta Form)</label>
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col sm:flex-row sm:items-end gap-2">
                    <Input
                      label="From"
                      type="date"
                      value={leadFilters.submissionDateFrom || ''}
                      onChange={(e) => handleFilterChange('submissionDateFrom', e.target.value)}
                      className="h-auto text-[10px] px-0 flex-1 border-gray-100"
                    />
                    <Input
                      label="To"
                      type="date"
                      value={leadFilters.submissionDateTo || ''}
                      onChange={(e) => handleFilterChange('submissionDateTo', e.target.value)}
                      className="h-auto text-[10px] px-0 flex-1 border-gray-100"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {[
                      { label: 'Today', getValue: () => { const d = new Date().toISOString().split('T')[0]; return { from: d, to: d }; } },
                      { label: 'Yesterday', getValue: () => { const d = new Date(Date.now() - 86400000).toISOString().split('T')[0]; return { from: d, to: d }; } },
                      { label: 'Last 7 Days', getValue: () => { const to = new Date().toISOString().split('T')[0]; const from = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]; return { from, to }; } },
                      { label: 'Last 30 Days', getValue: () => { const to = new Date().toISOString().split('T')[0]; const from = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]; return { from, to }; } },
                    ].map(preset => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          const { from, to } = preset.getValue();
                          handleFilterChange('submissionDateFrom', from);
                          handleFilterChange('submissionDateTo', to);
                        }}
                        className="text-[9px] font-bold bg-white hover:bg-slate-100 text-slate-500 px-2.5 py-1.5 rounded-lg border border-slate-100 transition-colors shadow-sm"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="md:col-span-1 space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">Last Contacted Date</label>
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col sm:flex-row sm:items-end gap-2">
                    <Input
                      label="From"
                      type="date"
                      value={leadFilters.lastContactedFrom || ''}
                      onChange={(e) => handleFilterChange('lastContactedFrom', e.target.value)}
                      className="h-auto text-[10px] px-0 flex-1 border-gray-100"
                    />
                    <Input
                      label="To"
                      type="date"
                      value={leadFilters.lastContactedTo || ''}
                      onChange={(e) => handleFilterChange('lastContactedTo', e.target.value)}
                      className="h-auto text-[10px] px-0 flex-1 border-gray-100"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {[
                      { label: 'Today', getValue: () => { const d = new Date().toISOString().split('T')[0]; return { from: d, to: d }; } },
                      { label: 'Last 7 Days', getValue: () => { const to = new Date().toISOString().split('T')[0]; const from = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]; return { from, to }; } },
                    ].map(preset => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          const { from, to } = preset.getValue();
                          handleFilterChange('lastContactedFrom', from);
                          handleFilterChange('lastContactedTo', to);
                        }}
                        className="text-[9px] font-bold bg-white hover:bg-slate-100 text-slate-500 px-2.5 py-1.5 rounded-lg border border-slate-100 transition-colors shadow-sm"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50 text-[10px]">
              <button
                onClick={() => {
                  dispatch(setLeadFilters({ status: 'lost' }));
                  setSearchTerm('');
                }}
                className="font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
              >
                Clear All Filters
              </button>
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => setShowFilters(false)} className="h-8 px-4 text-[10px] font-bold text-gray-400">
                  Close Filters
                </Button>
                <Button onClick={handleSearch} size="sm" className="h-8 px-6 bg-slate-900 text-white rounded-lg font-bold">
                  Apply Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table Section */}
      <Card className="border-none shadow-md overflow-hidden bg-white rounded-2xl">
        <CardContent className="p-0">
          <DataTable
            columns={[
              {
                id: "select",
                header: ({ table }: any) => (
                  <div className="pl-4">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-[#b3d81b] focus:ring-[#b3d81b]"
                      checked={table.getIsAllPageRowsSelected()}
                      onChange={(e) => table.toggleAllPageRowsSelected(!!e.target.checked)}
                    />
                  </div>
                ),
                cell: ({ row }: any) => (
                  <div className="pl-4">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-[#b3d81b] focus:ring-[#b3d81b]"
                      checked={row.getIsSelected()}
                      onChange={(e) => {
                        row.toggleSelected(!!e.target.checked);
                      }}
                    />
                  </div>
                ),
              },
              {
                accessorKey: "name",
                header: "Customer Name",
                cell: ({ row }: any) => (
                  <div className="flex items-center gap-3 py-1 cursor-pointer group" onClick={() => setSelectedCustomer(row.original)}>
                    <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center font-bold text-[#212121] border border-gray-100 group-hover:bg-[#b3d81b]/10 group-hover:border-[#b3d81b]/20 transition-colors">
                      {row.original.firstName?.[0]}{row.original.lastName?.[0]}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 leading-none mb-1 group-hover:text-[#b3d81b] transition-colors">
                        {row.original.firstName} {row.original.lastName}
                      </div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{row.original.source || 'Manual Entry'}</div>
                    </div>
                  </div>
                ),
              },
              {
                accessorKey: "metaFormName",
                header: "Meta Form Name",
                cell: ({ row }: any) => (
                  <div className="text-xs font-medium text-gray-500 italic max-w-[150px] truncate">
                    {row.original.lastMetaFormName || "--"}
                  </div>
                ),
              },
              {
                accessorKey: "email",
                header: "Email",
                cell: ({ row }: any) => (
                  <div className="text-xs text-gray-500 font-medium">{row.original.email}</div>
                ),
              },
              {
                accessorKey: "phone",
                header: "Phone",
                cell: ({ row }: any) => (
                  <div className="text-xs text-gray-500 font-medium">{row.original.phone || "--"}</div>
                ),
              },
              {
                accessorKey: "lastMetaFormSubmittedAt",
                header: "Submission Date",
                cell: ({ row }: any) => (
                  <div className="text-xs text-gray-500 font-medium italic">
                    {row.original.lastMetaFormSubmittedAt ? new Date(row.original.lastMetaFormSubmittedAt).toLocaleDateString() : "--"}
                  </div>
                ),
              },
              {
                accessorKey: "status",
                header: "Current Status",
                cell: ({ row }: any) => (
                  <Badge className="bg-red-50 text-red-600 border-red-100 text-[9px] font-black uppercase tracking-widest px-2 py-0.5">
                    {row.original.status}
                  </Badge>
                ),
              },
              {
                accessorKey: "lastContactedAt",
                header: "Date Archived (Last Contacted)",
                cell: ({ row }: any) => (
                  <div className="text-xs text-gray-500 font-medium italic">
                    {row.original.lastContactedAt ? new Date(row.original.lastContactedAt).toLocaleDateString() : "--"}
                  </div>
                ),
              },
              {
                id: "actions",
                header: "",
                cell: ({ row }: any) => (
                  <div className="flex justify-end pr-4">
                    <Button
                      onClick={() => setSelectedCustomer(row.original)}
                      variant="ghost"
                      className="h-8 w-8 p-0 hover:bg-gray-50 rounded-lg transition-colors group"
                    >
                      <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-900" />
                    </Button>
                  </div>
                ),
              },
            ]}
            data={leads}
            searchKey="email"
          />
          {isLoading && (
            <div className="p-8 text-center text-xs text-gray-500 italic">Cleaning the archive...</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
