import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Search,
  Filter,
  Plus,
  Phone,
  Mail,
  Users,
  X,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/atoms/Button/Button';
import { Input } from '@/components/atoms/Input/Input';
import { Select } from '@/components/atoms/Select/Select';
import { Badge } from '@/components/atoms/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/molecules/Card/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/molecules/Table/Table';
import { OneCustomerDetail } from '@/pages/CRM/OneCustomerDetail';
import {
  fetchLeads,
  createLead,
  updateLead,
  deleteLead,
  setLeadFilters,
  fetchSalespersons
} from '@/store/slices/crmSlice';
import type { RootState, AppDispatch } from '@/store';
import type { Lead } from '@/types/crm.types';

export const Customers: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { leads, leadFilters, isLoading, salespersons } = useSelector((state: RootState) => state.crm);
  const { user } = useSelector((state: RootState) => state.auth);

  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Lead | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  // Initial form state
  const initialFormState = {
    source: "manual",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    status: "converted",
    notes: "",
    assignedSalesId: user?.id || null,
    metadata: {},
    estimatedValue: 0,
  };
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    // Default to 'converted' for Customers page
    dispatch(setLeadFilters({ ...leadFilters, status: 'converted' }));
    dispatch(fetchSalespersons());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchLeads(leadFilters));
  }, [dispatch, leadFilters]);

  // Handlers
  const handleFilterChange = (key: string, value: string | string[]) => {
    dispatch(setLeadFilters({ ...leadFilters, [key]: value }));
  };

  const handleSearch = () => {
    dispatch(setLeadFilters({
      ...leadFilters,
      search: searchTerm,
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

  const handleCreateCustomer = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email) return;
    try {
      await dispatch(createLead(formData)).unwrap();
      setShowCreateForm(false);
      setFormData(initialFormState);
    } catch (error) {
      console.error('Failed to create customer:', error);
    }
  };

  const handleEditCustomer = (lead: Lead) => {
    setEditingLead(lead);
    setShowModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingLead) return;
    try {
      const updates = {
        firstName: editingLead.firstName,
        lastName: editingLead.lastName,
        email: editingLead.email,
        phone: editingLead.phone,
        status: editingLead.status,
        source: editingLead.source,
      };
      await dispatch(updateLead({ id: editingLead.id, updates })).unwrap();
      setShowModal(false);
      setEditingLead(null);
      dispatch(fetchLeads(leadFilters));
    } catch (error) {
      console.error("Update failed:", error);
    }
  };

  // UI Helpers
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'SUPER_ADMIN' || user?.role === 'manager';

  if (selectedCustomer) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <Button variant="ghost" onClick={() => setSelectedCustomer(null)} className="flex items-center gap-2 font-bold text-slate-600">
            <ArrowRight className="w-4 h-4 rotate-180" /> Back to Customers
          </Button>
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-bold px-3 py-1">Active Customer</Badge>
          </div>
        </div>
        <OneCustomerDetail SelectedCustomer={selectedCustomer} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-full mx-auto px-4 pb-10">
      {/* Search Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            Customer Database
            <Badge className="bg-[#CBFF38]/20 text-[#212121] border-[#CBFF38]/30 px-2 py-0.5 rounded-lg text-[10px] font-bold">
              {leads.filter(l => l.status === 'converted').length} Converted
            </Badge>
          </h1>
          <p className="text-gray-500 text-xs font-medium">Manage your active clients and their interactions</p>
        </div>

        <div className="flex flex-1 max-w-md mx-4 relative">
          <Input
            placeholder="Search by Name, Email or Phone..."
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
            {Object.keys(leadFilters).filter(k => leadFilters[k] !== undefined && leadFilters[k] !== '' && k !== 'search').length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-blue-500 text-white rounded-full text-[9px] min-w-[18px]">
                {Object.keys(leadFilters).filter(k => leadFilters[k] !== undefined && leadFilters[k] !== '' && k !== 'search').length}
              </span>
            )}
          </Button>
          <Button onClick={() => setShowCreateForm(true)} className="h-9 px-4 bg-slate-900 text-white hover:bg-slate-800 shadow-sm border-none rounded-xl font-bold text-[10px] transition-all hover:scale-[1.02] active:scale-[0.98]">
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Customer
          </Button>
        </div>
      </div>

      {/* Filter Chips */}
      {Object.keys(leadFilters).some(k => leadFilters[k] !== undefined && leadFilters[k] !== '' && k !== 'search') && (
        <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
          {Object.entries(leadFilters).map(([key, value]) => {
            if (!value || key === 'search') return null;
            let label = key;
            if (key === 'status') label = 'Status';
            if (key === 'source') label = 'Source';
            if (key === 'metaFormName') label = 'Form';
            if (key === 'submissionDateFrom') label = 'Created From';
            if (key === 'submissionDateTo') label = 'Created To';
            if (key === 'lastContactedFrom') label = 'Last Contact From';
            if (key === 'lastContactedTo') label = 'Last Contact To';
            const displayValue = Array.isArray(value)
              ? value.filter(Boolean).join(', ').toUpperCase()
              : String(value || '').toUpperCase();

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
            )
          })}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              dispatch(setLeadFilters({}));
              setSearchTerm('');
            }}
            className="h-7 px-2 text-[10px] font-bold text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            Clear All
          </Button>
        </div>
      )}

      {/* Filters Drawer-style */}
      {showFilters && (
        <Card className="border-none shadow-md bg-white animate-in slide-in-from-top-2 duration-300">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">Customer Status</label>
                <Select
                  value={leadFilters.status || ''}
                  onChange={(val) => handleFilterChange('status', val)}
                  options={[
                    { value: '', label: 'All Statuses' },
                    { value: 'new', label: 'New' },
                    { value: 'contacted', label: 'Contacted' },
                    { value: 'qualified', label: 'Qualified' },
                    { value: 'converted', label: 'Converted' },
                    { value: 'lost', label: 'Lost' },
                  ]}
                  className="h-9 text-xs border-gray-200"
                />
              </div>

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
                  <div className="flex items-center gap-2">
                    <Input
                      type="date"
                      value={leadFilters.submissionDateFrom || ''}
                      onChange={(e) => handleFilterChange('submissionDateFrom', e.target.value)}
                      className="h-9 text-[10px] px-2 flex-1 border-gray-100"
                    />
                    <span className="text-gray-300">-</span>
                    <Input
                      type="date"
                      value={leadFilters.submissionDateTo || ''}
                      onChange={(e) => handleFilterChange('submissionDateTo', e.target.value)}
                      className="h-9 text-[10px] px-2 flex-1 border-gray-100"
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
                  <div className="flex items-center gap-2">
                    <Input
                      type="date"
                      value={leadFilters.lastContactedFrom || ''}
                      onChange={(e) => handleFilterChange('lastContactedFrom', e.target.value)}
                      className="h-9 text-[10px] px-2 flex-1 border-gray-100"
                    />
                    <span className="text-gray-300">-</span>
                    <Input
                      type="date"
                      value={leadFilters.lastContactedTo || ''}
                      onChange={(e) => handleFilterChange('lastContactedTo', e.target.value)}
                      className="h-9 text-[10px] px-2 flex-1 border-gray-100"
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

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
              <button
                onClick={() => dispatch(setLeadFilters({}))}
                className="text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
              >
                Clear All Filters
              </button>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)} className="h-8 text-[10px] font-bold">
                  Close
                </Button>
                <Button size="sm" onClick={handleSearch} className="h-8 px-6 text-[10px] font-bold bg-slate-900 text-white">
                  Apply Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk Actions Bar */}
      {/* Table Section */}
      <Card className="border-none shadow-md overflow-hidden bg-white rounded-2xl">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-gray-500">Loading customers...</div>
          ) : leads.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center justify-center text-gray-400">
              <Users className="w-8 h-8 mb-2 opacity-20" />
              <p className="text-xs">No records found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow className="h-10">
                  <TableHead className="w-[40px] px-3">
                    <input
                      type="checkbox"
                      checked={selectedLeads.length === leads.length}
                      onChange={(e) => setSelectedLeads(e.target.checked ? leads.map(l => l.id) : [])}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                    />
                  </TableHead>
                  <TableHead className="text-[10px] uppercase font-bold tracking-wider px-3">Customer</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold tracking-wider px-3">Contact Info</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold tracking-wider px-3">Status</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold tracking-wider px-3">Created</TableHead>
                  <TableHead className="text-right text-[10px] uppercase font-bold tracking-wider px-3">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id} className="hover:bg-gray-50/80 transition-all duration-200 group border-b border-gray-50 last:border-0 h-14">
                    <TableCell className="py-2 px-3 text-xs">
                      <input
                        type="checkbox"
                        checked={selectedLeads.includes(lead.id)}
                        onChange={(e) => {
                          setSelectedLeads(e.target.checked
                            ? [...selectedLeads, lead.id]
                            : selectedLeads.filter(id => id !== lead.id)
                          );
                        }}
                        className="rounded border-gray-300 text-primary focus:ring-primary h-3.5 w-3.5"
                      />
                    </TableCell>
                    <TableCell className="py-2 px-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs uppercase">
                          {lead.firstName[0]}{lead.lastName[0]}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 text-xs">{lead.firstName} {lead.lastName}</div>
                          <div className="text-[9px] text-gray-400 font-mono tracking-tighter uppercase">
                            ID: {lead.id.slice(0, 8)}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-2 px-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
                          <Mail className="h-3 w-3 text-gray-400" /> {lead.email}
                        </div>
                        {lead.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Phone className="h-3 w-3 text-gray-400" /> {lead.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-2 px-3">
                      <Badge className={`bg-emerald-50 text-emerald-700 border-emerald-100 border px-2 py-0.5 rounded-full capitalize font-bold text-[9px]`}>
                        {lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2 px-3 text-gray-400 text-[10px] font-semibold">
                      {formatDate(lead.createdAt)}
                    </TableCell>
                    <TableCell className="py-1 px-3 text-right">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedCustomer(lead)} className="h-8 px-3 text-[10px] font-bold text-blue-600 hover:bg-blue-50">
                        View Details <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {showModal && editingLead && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <Card className="w-full max-w-lg shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-4">
              <CardTitle className="text-xl">Edit Record</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowModal(false)}><X className="w-4 h-4" /></Button>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="First Name" value={editingLead.firstName} onChange={(e) => setEditingLead({ ...editingLead, firstName: e.target.value })} />
                <Input label="Last Name" value={editingLead.lastName} onChange={(e) => setEditingLead({ ...editingLead, lastName: e.target.value })} />
              </div>
              <Input label="Email" value={editingLead.email} onChange={(e) => setEditingLead({ ...editingLead, email: e.target.value })} />
              <Input label="Phone" value={editingLead.phone || ''} onChange={(e) => setEditingLead({ ...editingLead, phone: e.target.value })} />
            </CardContent>
            <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50 rounded-b-xl">
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleSaveEdit}>Save Changes</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Create Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in">
          <Card className="w-full max-w-xl shadow-2xl border-0 overflow-hidden rounded-2xl">
            <div className="px-8 py-6 border-b border-gray-100 bg-white flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Add New Record</h2>
              <button onClick={() => setShowCreateForm(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <Input label="First Name" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} required />
                <Input label="Last Name" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} required />
              </div>
              <Input label="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
              <Input label="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            </div>
            <div className="p-6 bg-gray-50 border-t flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleCreateCustomer}>Save Customer</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
