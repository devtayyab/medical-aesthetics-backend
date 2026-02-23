import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchLeads } from "@/store/slices/crmSlice";
import type { RootState, AppDispatch } from "@/store";
import type { Lead } from "@/types";
import { Search, Filter, X, PlusCircle, ArrowRight, ArrowLeft } from "lucide-react";
import { DataTable } from "@/components/ui/DataTable";
import { OneCustomerDetail } from "@/pages/CRM/OneCustomerDetail";
import { Button } from "@/components/atoms/Button/Button";
import { Card } from "@/components/molecules/Card/Card";

// Types for our local advanced filter state
interface AdvancedFilters {
  formNames: string[];
  submissionDateFrom: string;
  submissionDateTo: string;
  lastContactedFrom: string;
  lastContactedTo: string;
  status: string[];
}

export const Customers: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { leads, isLoading, error } = useSelector(
    (state: RootState) => state.crm
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Lead | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<AdvancedFilters>({
    formNames: [],
    submissionDateFrom: "",
    submissionDateTo: "",
    lastContactedFrom: "",
    lastContactedTo: "",
    status: [],
  });

  // Unique Form Names for the dropdown (derived from leads or an API)
  // For v1, we extract distinct form names from the loaded leads if no separate API exists.
  const availableFormNames = useMemo(() => {
    const names = new Set<string>();
    leads.forEach((l) => {
      // Accessing lastMetaFormName if it exists on metadata or directly
      const formName = (l as any).lastMetaFormName || l.metadata?.lastMetaFormName;
      if (formName) names.add(formName);
    });
    return Array.from(names);
  }, [leads]);

  const availableStatuses = ["new", "contacted", "converted"];

  // Fetch data on mount or when filters/search change
  useEffect(() => {
    // Only fetch if we are applying filters to backend
    // Since search is also driven by backend as per instructions:
    const appliedFilters: any = {};
    if (searchTerm.trim()) appliedFilters.search = searchTerm.trim();
    if (filters.formNames.length > 0) appliedFilters.formNames = filters.formNames;
    if (filters.submissionDateFrom) appliedFilters.submissionDateFrom = filters.submissionDateFrom;
    if (filters.submissionDateTo) appliedFilters.submissionDateTo = filters.submissionDateTo;
    if (filters.lastContactedFrom) appliedFilters.lastContactedFrom = filters.lastContactedFrom;
    if (filters.lastContactedTo) appliedFilters.lastContactedTo = filters.lastContactedTo;
    if (filters.status.length > 0) appliedFilters.status = filters.status;

    dispatch(fetchLeads(appliedFilters));
  }, [dispatch, searchTerm, filters]);

  const activeFilterChips = useMemo(() => {
    const chips: { label: string; onRemove: () => void }[] = [];
    if (filters.formNames.length > 0) {
      chips.push({
        label: `Forms: ${filters.formNames.join(", ")}`,
        onRemove: () => setFilters((f) => ({ ...f, formNames: [] })),
      });
    }
    if (filters.submissionDateFrom || filters.submissionDateTo) {
      chips.push({
        label: `Submitted: ${filters.submissionDateFrom || "Any"} to ${filters.submissionDateTo || "Any"}`,
        onRemove: () => setFilters((f) => ({ ...f, submissionDateFrom: "", submissionDateTo: "" })),
      });
    }
    if (filters.lastContactedFrom || filters.lastContactedTo) {
      chips.push({
        label: `Contacted: ${filters.lastContactedFrom || "Any"} to ${filters.lastContactedTo || "Any"}`,
        onRemove: () => setFilters((f) => ({ ...f, lastContactedFrom: "", lastContactedTo: "" })),
      });
    }
    if (filters.status.length > 0) {
      chips.push({
        label: `Status: ${filters.status.join(", ")}`,
        onRemove: () => setFilters((f) => ({ ...f, status: [] })),
      });
    }
    return chips;
  }, [filters]);

  const clearAllFilters = () => {
    setFilters({
      formNames: [],
      submissionDateFrom: "",
      submissionDateTo: "",
      lastContactedFrom: "",
      lastContactedTo: "",
      status: [],
    });
    setSearchTerm("");
  };

  const setDatePreset = (days: number) => {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - days);

    setFilters(f => ({
      ...f,
      submissionDateFrom: from.toISOString().split('T')[0],
      submissionDateTo: to.toISOString().split('T')[0],
    }));
  };

  if (selectedCustomer) {
    return (
      <div className="p-6 h-full flex flex-col relative space-y-6">
        <Card className="border-none shadow-sm pb-6">
          <div className="px-8 pt-6 border-b pb-4 mb-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">
                Customer Details
              </h2>
              <Button variant="outline" onClick={() => setSelectedCustomer(null)} className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Back to Customers
              </Button>
            </div>
          </div>
          <OneCustomerDetail
            SelectedCustomer={selectedCustomer as any}
            isLoading={isLoading}
            error={error}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 h-full flex flex-col relative">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Customers</h2>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
          onClick={() => {
            // Trigger add contact modal or link here
          }}
        >
          <PlusCircle className="w-5 h-5" /> Add Contact
        </button>
      </div>

      {/* Top Bar (Search + Advanced Filters Button + Clear) */}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 border rounded-lg bg-white hover:bg-gray-50 text-gray-700 font-medium transition"
        >
          <Filter className="w-4 h-4" /> Advanced Filters
        </button>
        {(activeFilterChips.length > 0 || searchTerm) && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium transition"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Active Filter Chips */}
      {activeFilterChips.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {activeFilterChips.map((chip, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-200"
            >
              {chip.label}
              <button onClick={chip.onRemove} className="hover:text-blue-900 mx-1">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="bg-white p-6 border rounded-xl shadow-sm mb-6 animate-in slide-in-from-top-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800 text-lg">Filters</h3>
            <button onClick={() => setShowFilters(false)} className="text-gray-500 hover:text-gray-800">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Meta Form Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Meta Form Name</label>
              <div className="flex flex-wrap gap-2">
                {availableFormNames.length === 0 ? (
                  <span className="text-sm text-gray-500">No forms recorded</span>
                ) : (
                  availableFormNames.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => {
                        setFilters((prev) => ({
                          ...prev,
                          formNames: prev.formNames.includes(name)
                            ? prev.formNames.filter((n) => n !== name)
                            : [...prev.formNames, name],
                        }));
                      }}
                      className={`px-3 py-1 text-sm rounded-full border transition ${filters.formNames.includes(name)
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                        }`}
                    >
                      {name}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Submission Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Submission Date</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={filters.submissionDateFrom}
                  onChange={(e) => setFilters({ ...filters, submissionDateFrom: e.target.value })}
                  className="w-full text-sm py-1.5 px-3 border rounded-md"
                />
                <input
                  type="date"
                  value={filters.submissionDateTo}
                  onChange={(e) => setFilters({ ...filters, submissionDateTo: e.target.value })}
                  className="w-full text-sm py-1.5 px-3 border rounded-md"
                />
              </div>
              <div className="mt-2 flex gap-2 text-xs text-blue-600">
                <button type="button" onClick={() => setDatePreset(0)} className="hover:underline">Today</button>
                <button type="button" onClick={() => setDatePreset(1)} className="hover:underline">Yesterday</button>
                <button type="button" onClick={() => setDatePreset(7)} className="hover:underline">7 days</button>
                <button type="button" onClick={() => setDatePreset(30)} className="hover:underline">30 days</button>
              </div>
            </div>

            {/* Last Contacted */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Last Contacted Date</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={filters.lastContactedFrom}
                  onChange={(e) => setFilters({ ...filters, lastContactedFrom: e.target.value })}
                  className="w-full text-sm py-1.5 px-3 border rounded-md"
                />
                <input
                  type="date"
                  value={filters.lastContactedTo}
                  onChange={(e) => setFilters({ ...filters, lastContactedTo: e.target.value })}
                  className="w-full text-sm py-1.5 px-3 border rounded-md"
                />
              </div>
            </div>

            {/* Lead Status */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Lead Status</label>
              <div className="flex flex-wrap gap-2">
                {availableStatuses.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => {
                      setFilters((prev) => ({
                        ...prev,
                        status: prev.status.includes(status)
                          ? prev.status.filter((s) => s !== status)
                          : [...prev.status, status],
                      }));
                    }}
                    className={`px-3 py-1 text-sm rounded-full border capitalize transition ${filters.status.includes(status)
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                      }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {isLoading && <div className="text-center py-10">Loading customers...</div>}

      {!isLoading && !error && leads.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200 shadow-sm flex-1">
          <p className="text-gray-500 text-lg font-medium">No customers found.</p>
          <p className="text-gray-400 text-sm mt-1">Try adjusting your filters or search terms.</p>
        </div>
      )}

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6 border border-red-200">{error}</div>}

      {/* List View with DataTable */}
      <div className="flex-1 bg-white rounded-lg border shadow-sm mt-4 overflow-hidden">
        {leads.length > 0 && (
          <DataTable
            columns={[
              {
                accessorKey: "name",
                header: "Name",
                cell: ({ row }: any) => (
                  <div className="font-medium text-gray-900">
                    {row.original.firstName} {row.original.lastName}
                  </div>
                ),
              },
              {
                accessorKey: "email",
                header: "Email",
                cell: ({ row }: any) => <div className="text-gray-600">{row.original.email}</div>,
              },
              {
                accessorKey: "phone",
                header: "Phone",
                cell: ({ row }: any) => <div className="text-gray-600">{row.original.phone || "N/A"}</div>,
              },
              {
                accessorKey: "status",
                header: "Status",
                cell: ({ row }: any) => (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${row.original.status === 'new' ? 'bg-blue-100 text-blue-700' :
                    row.original.status === 'contacted' ? 'bg-amber-100 text-amber-700' :
                      row.original.status === 'converted' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                    }`}>
                    {row.original.status}
                  </span>
                ),
              },
              {
                id: "actions",
                header: "",
                cell: ({ row }: any) => (
                  <div className="flex justify-end pr-4">
                    <button
                      onClick={() => setSelectedCustomer(row.original)}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1"
                    >
                      View Details <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                ),
              },
            ]}
            data={leads}
            searchKey="email"
          />
        )}
      </div>
    </div>
  );
};
