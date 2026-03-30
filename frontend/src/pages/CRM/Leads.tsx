import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Search,
  Filter,
  Plus,
  AlertTriangle,
  CheckCircle,
  Clock,
  Phone,
  Mail,
  Edit,
  Trash2,
  Copy,
  Users,
  X,
  Eye,
  User,
  Globe,
  Tag,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/atoms/Button/Button';
import { Input } from '@/components/atoms/Input/Input';
import { Select } from '@/components/atoms/Select/Select';
import { Badge } from '@/components/atoms/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/molecules/Card/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/molecules/Table/Table';
import {
  fetchLeads,
  createLead,
  updateLead,
  deleteLead,
  checkForDuplicates,
  setLeadFilters,
  fetchSalespersons
} from '@/store/slices/crmSlice';
import type { RootState, AppDispatch } from '@/store';
import type { Lead } from '@/types/crm.types';

interface LeadsPageProps {
  onViewLead?: (lead: Lead) => void;
  forceShowCreateForm?: boolean;
  onFormShown?: () => void;
}

export const LeadsPage: React.FC<LeadsPageProps> = ({ onViewLead, forceShowCreateForm = false, onFormShown }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { leads, leadFilters, duplicateCheck, isLoading, salespersons } = useSelector((state: RootState) => state.crm);
  const { user } = useSelector((state: RootState) => state.auth);

  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [showDuplicateResults, setShowDuplicateResults] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  // Initial form state
  const initialFormState = {
    source: "facebook_ads",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    status: "new",
    notes: "",
    assignedSalesId: user?.id || null,
    metadata: {},
    estimatedValue: 0,
  };
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    if (forceShowCreateForm && !showCreateForm) {
      setShowCreateForm(true);
      if (onFormShown) onFormShown();
    }
  }, [forceShowCreateForm, onFormShown]);

  useEffect(() => {
    // Reset status filter for Leads page (exclude lost)
    dispatch(setLeadFilters({ ...leadFilters, status: undefined }));
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

  const handleCreateLead = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email) return;
    try {
      await dispatch(createLead(formData)).unwrap();
      setShowCreateForm(false);
      setFormData(initialFormState);
    } catch (error) {
      console.error('Failed to create lead:', error);
    }
  };

  const handleCheckDuplicates = async (lead: Lead) => {
    await dispatch(checkForDuplicates({
      email: lead.email,
      phone: lead.phone,
      firstName: lead.firstName,
      lastName: lead.lastName
    }));
    setShowDuplicateResults(true);
  };

  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead);
    setShowModal(true);
  };

  const handleBulkAction = async (action: string, value?: string) => {
    if (selectedLeads.length === 0) return;
    if (action === 'delete') {
      for (const leadId of selectedLeads) await dispatch(deleteLead(leadId));
    } else if (action === 'mark_contacted') {
      for (const leadId of selectedLeads) await dispatch(updateLead({ id: leadId, updates: { status: 'contacted' } }));
    } else if (action === 'assign' && value) {
      for (const leadId of selectedLeads) await dispatch(updateLead({ id: leadId, updates: { assignedSalesId: value } }));
    }
    setSelectedLeads([]);
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
  const getStatusBadge = (status: string) => {
    const styles = {
      new: "bg-blue-50 text-blue-700 border-blue-100",
      contacted: "bg-amber-50 text-amber-700 border-amber-100",
      qualified: "bg-purple-50 text-purple-700 border-purple-100",
      converted: "bg-emerald-50 text-emerald-700 border-emerald-100",
      lost: "bg-gray-50 text-gray-500 border-gray-100",
    };
    return styles[status as keyof typeof styles] || styles.new;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Render Stats Card
  const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
    <Card className="border-none shadow-sm hover:shadow-md transition-all duration-300 group overflow-hidden relative">
      <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-[0.03] group-hover:scale-110 transition-transform duration-500 ${color.split(' ')[1]}`} style={{ backgroundColor: 'currentColor' }} />
      <CardContent className="p-3 flex items-start justify-between relative z-10">
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 group-hover:text-gray-500 transition-colors">{title}</p>
          <div className="flex items-baseline gap-1.5">
            <h3 className="text-xl font-extrabold text-gray-900 leading-none">{value}</h3>
            {trend && (
              <span className="text-[10px] font-bold text-emerald-600 flex items-center bg-emerald-50 px-1 py-0.5 rounded-full">
                {trend.includes('%') ? trend : `+${trend}`}
              </span>
            )}
          </div>
        </div>
        <div className={`p-2 rounded-xl ${color} shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all duration-300`}>
          <Icon className="w-5 h-5" />
        </div>
      </CardContent>
    </Card>
  );

  const isAdmin = user?.role === 'admin' || user?.role === 'SUPER_ADMIN' || user?.role === 'manager';

  return (
    <div className="space-y-6 max-w-full mx-auto px-4 sm:px-6 lg:px-8 pb-10">
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
          </Button>
          <Button onClick={() => setShowCreateForm(true)} className="h-10 px-4 bg-[#CBFF38] text-gray-900 hover:bg-[#b3d81b] shadow-sm border-none rounded-xl font-bold text-[11px] transition-all hover:scale-[1.02] active:scale-[0.98]">
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Lead
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

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          title="Total Leads"
          value={leads.length}
          icon={Users}
          color="bg-[#CBFF38]/20 text-gray-900"
          trend="+12%"
        />
        <StatCard
          title="New Inquiries"
          value={leads.filter(l => l.status === 'new').length}
          icon={AlertTriangle}
          color="bg-amber-50 text-amber-600"
        />
        <StatCard
          title="In Conversation"
          value={leads.filter(l => l.status === 'contacted').length}
          icon={Clock}
          color="bg-purple-50 text-purple-600"
        />
        <StatCard
          title="Converted"
          value={leads.filter(l => l.status === 'converted').length}
          icon={CheckCircle}
          color="bg-[#b3d81b] text-white"
          trend="4.5%"
        />
      </div>
      {/* Filters Drawer-style */}
      {showFilters && (
        <Card className="border-none shadow-md bg-white animate-in slide-in-from-top-2 duration-300">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">Lead Status</label>
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
              <div className="flex items-center gap-2">
                <button
                  onClick={() => dispatch(setLeadFilters({}))}
                  className="text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)} className="h-8 text-[10px] font-bold">
                  Close Filters
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
      {selectedLeads.length > 0 && (
        <div className="bg-white border-2 border-primary/20 p-2 px-4 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-4 shadow-xl shadow-primary/5">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-1.5 rounded-lg">
              <CheckCircle className="w-4 h-4 text-primary" />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-900">{selectedLeads.length} leads selected</span>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            {user?.role !== 'salesperson' && (
              <Select
                placeholder="Assign to..."
                options={(salespersons || []).map((sp:any) => ({
                  value: sp.id,
                  label: `${sp.firstName} ${sp.lastName}`
                }))}
                onChange={(val) => handleBulkAction('assign', val)}
                className="w-40 text-xs h-8"
              />
            )}
            <Button variant="white" size="sm" onClick={() => handleBulkAction('mark_contacted')} className="h-8 text-[10px] hover:border-primary/30">
              Mark Contacted
            </Button>
            {user?.role !== 'salesperson' && (
              <Button variant="white" size="sm" onClick={() => handleBulkAction('delete')} className="h-8 text-[10px] text-red-600 hover:bg-red-50 border-red-100">
                <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Table Section */}
      <Card className="border-none shadow-md overflow-hidden bg-white rounded-2xl">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-gray-500">Loading leads...</div>
          ) : leads.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center justify-center text-gray-400">
              <Users className="w-8 h-8 mb-2 opacity-20" />
              <p className="text-xs">No leads found matching your filters.</p>
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
                  <TableHead className="text-[10px] uppercase font-bold tracking-wider px-3">Lead Name</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold tracking-wider px-3">Contact Info</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold tracking-wider px-3">Status</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold tracking-wider px-3">Source</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold tracking-wider px-3 text-emerald-600 bg-emerald-50/50">Last Form</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold tracking-wider px-3">Last Contact</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold tracking-wider px-3">Created</TableHead>
                  <TableHead className="text-right text-[10px] uppercase font-bold tracking-wider px-3">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id} className="hover:bg-gray-50/80 transition-all duration-200 group border-b border-gray-50 last:border-0 h-14">
                    <TableCell className="py-2 px-3">
                      <input
                        type="checkbox"
                        checked={selectedLeads.includes(lead.id)}
                        onChange={(e) => {
                          setSelectedLeads(e.target.checked
                            ? [...selectedLeads, lead.id]
                            : selectedLeads.filter(id => id !== lead.id)
                          );
                        }}
                        className="rounded border-gray-300 text-primary focus:ring-primary h-3.5 w-3.5 transition-all"
                      />
                    </TableCell>
                    <TableCell className="py-2 px-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-100 text-primary flex items-center justify-center font-black text-xs uppercase shadow-sm group-hover:scale-105 transition-transform">
                          {lead.firstName[0]}{lead.lastName[0]}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 group-hover:text-primary transition-colors text-xs">{lead.firstName} {lead.lastName}</div>
                          <div className="text-[9px] text-gray-400 font-mono tracking-tighter uppercase mt-0.5">
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
                      <Badge className={`${getStatusBadge(lead.status)} border px-2 py-0.5 rounded-full capitalize font-bold text-[9px] tracking-wider`}>
                        {lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2 px-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{lead.source?.replace('_', ' ')}</span>
                        {lead.facebookAdName && <span className="text-[8px] font-bold text-blue-500">Ad: {lead.facebookAdName}</span>}
                      </div>
                    </TableCell>
                    <TableCell className="py-2 px-3 bg-emerald-50/20">
                      {lead.lastMetaFormSubmittedAt ? (
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-gray-900 truncate max-w-[120px]" title={lead.lastMetaFormName || 'Form'}>
                            {lead.lastMetaFormName || 'Meta Form'}
                          </span>
                          <span className="text-[9px] font-semibold text-emerald-600">{formatDate(lead.lastMetaFormSubmittedAt)}</span>
                        </div>
                      ) : <span className="text-gray-300 text-[10px] italic">No submission</span>}
                    </TableCell>
                    <TableCell className="py-2 px-3">
                      {lead.lastContactedAt ? (
                        <span className="text-[10px] font-bold text-slate-800">{formatDate(lead.lastContactedAt)}</span>
                      ) : <span className="text-gray-300 text-[10px]">-</span>}
                    </TableCell>
                    <TableCell className="py-2 px-3 text-gray-400 text-[10px] font-semibold">
                      {formatDate(lead.createdAt)}
                    </TableCell>
                    <TableCell className="py-2 px-3 text-right">
                      <div className="flex justify-end gap-1 items-center">
                        <div className="flex items-center bg-white border border-gray-100 rounded-lg shadow-sm p-0.5">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-md" onClick={() => {
                            if (onViewLead) {
                              onViewLead(lead);
                            } else {
                              navigate(`/crm/customer/${lead.id}`);
                            }
                          }}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-md" onClick={() => handleCheckDuplicates(lead)}>
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-md" onClick={() => handleEditLead(lead)}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <div className="w-px h-3 bg-gray-100 mx-0.5" />
                          {user?.role !== 'salesperson' && (
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md" onClick={() => dispatch(deleteLead(lead.id))}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Logic for Edit Modal */}
      {
        showModal && editingLead && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
            <Card className="w-full max-w-lg shadow-2xl">
              <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <CardTitle className="text-xl">Edit Lead</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">Update lead information</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowModal(false)}><X className="w-4 h-4" /></Button>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input label="First Name" value={editingLead.firstName} onChange={(e) => setEditingLead({ ...editingLead, firstName: e.target.value })} />
                  <Input label="Last Name" value={editingLead.lastName} onChange={(e) => setEditingLead({ ...editingLead, lastName: e.target.value })} />
                </div>
                <Input label="Email" value={editingLead.email} onChange={(e) => setEditingLead({ ...editingLead, email: e.target.value })} />
                <Input label="Phone" value={editingLead.phone || ''} onChange={(e) => setEditingLead({ ...editingLead, phone: e.target.value })} />
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Status"
                    value={editingLead.status}
                    onChange={(value) => setEditingLead({ ...editingLead, status: value as any })}
                    options={[{ value: 'new', label: 'New' }, { value: 'contacted', label: 'Contacted' }, { value: 'qualified', label: 'Qualified' }, { value: 'converted', label: 'Converted' }, { value: 'lost', label: 'Lost' }]}
                  />
                  <Select
                    label="Source"
                    value={editingLead.source}
                    onChange={(value) => setEditingLead({ ...editingLead, source: value })}
                    options={[{ value: 'facebook_ads', label: 'Facebook Ads' }, { value: 'website', label: 'Website' }, { value: 'referral', label: 'Referral' }]}
                  />
                </div>
              </CardContent>
              <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50 rounded-b-xl">
                <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button variant="primary" onClick={handleSaveEdit}>Save Changes</Button>
              </div>
            </Card>
          </div>
        )
      }

      {/* Create Modal Logic - Revamped Design */}
      {
        showCreateForm && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <Card className="w-full max-w-2xl shadow-2xl border-0 overflow-hidden rounded-2xl flex flex-col max-h-[85vh]">
              {/* Header */}
              <div className="px-8 py-6 border-b border-gray-100 bg-white flex items-start justify-between flex-none">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Add New Lead</h2>
                  <p className="text-gray-500 mt-1.5 text-sm font-medium">Create a new prospect entry in your CRM</p>
                </div>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-gray-50/50">
                {/* Section 1: Contact Information */}
                <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center gap-3 pb-4 mb-4 border-b border-gray-50">
                    <div className="bg-blue-50 p-2 rounded-lg">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">Contact Information</h3>
                      <p className="text-xs text-gray-500">Basic details about the prospect</p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <Input
                        label="First Name"
                        placeholder="e.g. Sarah"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        required
                        leftIcon={<User className="w-4 h-4" />}
                      />
                      <Input
                        label="Last Name"
                        placeholder="e.g. Johnson"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        required
                        leftIcon={<User className="w-4 h-4" />}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <Input
                        label="Email Address"
                        type="email"
                        placeholder="sarah@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        leftIcon={<Mail className="w-4 h-4" />}
                      />
                      <Input
                        label="Phone Number"
                        placeholder="+1 (555) 000-0000"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        leftIcon={<Phone className="w-4 h-4" />}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Lead Details */}
                <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center gap-3 pb-4 mb-4 border-b border-gray-50">
                    <div className="bg-purple-50 p-2 rounded-lg">
                      <Tag className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">Lead Details</h3>
                      <p className="text-xs text-gray-500">Status and source information</p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <Select
                        label="Initial Status"
                        value={formData.status}
                        onChange={(value) => setFormData({ ...formData, status: value })}
                        leftIcon={<Tag className="w-4 h-4" />}
                        options={[
                          { value: 'new', label: 'New Lead' },
                          { value: 'contacted', label: 'Contacted' },
                          { value: 'qualified', label: 'Qualified' }
                        ]}
                      />
                      <Select
                        label="Lead Source"
                        value={formData.source}
                        onChange={(value) => setFormData({ ...formData, source: value })}
                        leftIcon={<Globe className="w-4 h-4" />}
                        options={[
                          { value: 'facebook_ads', label: 'Facebook Ads' },
                          { value: 'website', label: 'Website' },
                          { value: 'manual', label: 'Manual Entry' },
                          { value: 'referral', label: 'Referral' }
                        ]}
                      />
                    </div>

                    <div className="col-span-2">
                      <Input
                        label="Initial Notes"
                        placeholder="Add any initial notes or context about this lead..."
                        value={formData.notes || ''}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        leftIcon={<MessageSquare className="w-4 h-4" />}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex justify-end gap-3 backdrop-blur-sm flex-none">
                <Button
                  variant="white"
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-700 hover:text-gray-900 border-gray-200"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCreateLead}
                  className="px-8 shadow-lg shadow-blue-500/20"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Lead
                </Button>
              </div>
            </Card>
          </div>
        )
      }

      {/* Duplicate Results Modal Logic */}
      {
        showDuplicateResults && duplicateCheck && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
            <Card className="w-full max-w-md shadow-2xl border-t-4 border-amber-400">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-amber-100 rounded-full text-amber-600">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Duplicate Check</h3>
                    <p className="text-sm text-gray-500">Analysis results</p>
                  </div>
                </div>

                {duplicateCheck.isDuplicate ? (
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 mb-4">
                    <p className="font-semibold text-amber-800 flex items-center gap-2">
                      Potential duplicate found!
                    </p>
                    <p className="text-sm text-amber-700 mt-1">
                      Matched with <strong>{duplicateCheck.existingCustomer?.firstName} {duplicateCheck.existingCustomer?.lastName}</strong> ({duplicateCheck.confidence}% confidence)
                    </p>
                  </div>
                ) : (
                  <div className="bg-green-50 p-4 rounded-xl border border-green-100 mb-4 flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-green-800 font-medium">No duplicates detected.</span>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button onClick={() => setShowDuplicateResults(false)}>Close</Button>
                </div>
              </div>
            </Card>
          </div>
        )
      }
    </div >
  );
};
