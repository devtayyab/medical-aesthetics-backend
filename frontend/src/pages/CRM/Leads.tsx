import React, { useState, useEffect } from 'react';
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
  MoreHorizontal,
  ArrowUpRight,
  TrendingUp,
  X
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
  setLeadFilters
} from '@/store/slices/crmSlice';
import type { RootState, AppDispatch } from '@/store';
import type { Lead } from '@/types/crm.types';

interface LeadsPageProps {
  onViewLead?: (lead: Lead) => void;
  forceShowCreateForm?: boolean;
  onFormShown?: () => void;
}

export const LeadsPage: React.FC<LeadsPageProps> = ({ onViewLead, forceShowCreateForm = false, onFormShown }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { leads, leadFilters, duplicateCheck, isLoading, error } = useSelector((state: RootState) => state.crm);
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
    dispatch(fetchLeads(leadFilters));
  }, [dispatch, leadFilters]);

  // Handlers
  const handleFilterChange = (key: string, value: string) => {
    dispatch(setLeadFilters({ ...leadFilters, [key]: value }));
  };

  const handleSearch = () => {
    dispatch(setLeadFilters({ ...leadFilters, search: searchTerm }));
  };

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

  const handleBulkAction = async (action: string) => {
    if (selectedLeads.length === 0) return;
    if (action === 'delete') {
      for (const leadId of selectedLeads) await dispatch(deleteLead(leadId));
    } else if (action === 'mark_contacted') {
      for (const leadId of selectedLeads) await dispatch(updateLead({ id: leadId, updates: { status: 'contacted' } }));
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
      new: "bg-blue-100 text-blue-700 border-blue-200",
      contacted: "bg-amber-100 text-amber-700 border-amber-200",
      qualified: "bg-purple-100 text-purple-700 border-purple-200",
      converted: "bg-emerald-100 text-emerald-700 border-emerald-200",
      lost: "bg-gray-100 text-gray-600 border-gray-200",
    };
    return styles[status as keyof typeof styles] || styles.new;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Render Stats Card
  const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
    <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6 flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h3 className="text-2xl font-bold mt-2 text-gray-900">{value}</h3>
          {trend && (
            <p className="flex items-center gap-1 text-xs mt-1 text-emerald-600 font-medium">
              <TrendingUp className="w-3 h-3" /> {trend}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Lead Management</h1>
          <p className="text-gray-500 mt-1">Track, organize, and convert your potential customers.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="hidden md:flex">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button variant="primary" onClick={() => setShowCreateForm(true)} className="shadow-lg shadow-blue-500/20">
            <Plus className="h-4 w-4 mr-2" />
            Add New Lead
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Leads"
          value={leads.length}
          icon={Users}
          color="bg-blue-50 text-blue-600"
          trend="+12% this month"
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
          color="bg-emerald-50 text-emerald-600"
          trend="4.5% conversion rate"
        />
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-9 bg-gray-50 border-gray-200 focus:bg-white"
          />
        </div>

        {showFilters && (
          <div className="flex flex-col md:flex-row gap-3 animate-in slide-in-from-right-2">
            <Select
              value={leadFilters.status || ''}
              onChange={(value) => handleFilterChange('status', value)}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'new', label: 'New' },
                { value: 'contacted', label: 'Contacted' },
                { value: 'qualified', label: 'Qualified' },
                { value: 'converted', label: 'Converted' },
                { value: 'lost', label: 'Lost' }
              ]}
              className="w-full md:w-40"
            />
            <Select
              value={leadFilters.source || ''}
              onChange={(value) => handleFilterChange('source', value)}
              options={[
                { value: '', label: 'All Sources' },
                { value: 'facebook_ads', label: 'Facebook Ads' },
                { value: 'google_ads', label: 'Google Ads' },
                { value: 'referral', label: 'Referral' },
                { value: 'manual', label: 'Manual' },
                { value: 'website', label: 'Website' }
              ]}
              className="w-full md:w-40"
            />
            <Button variant="ghost" onClick={() => {
              dispatch(setLeadFilters({}));
              setSearchTerm('');
            }}>
              Clear
            </Button>
          </div>
        )}
      </div>

      {/* Bulk Actions Bar */}
      {selectedLeads.length > 0 && (
        <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <span className="text-sm font-medium text-blue-900 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> {selectedLeads.length} leads selected
          </span>
          <div className="flex gap-2">
            <Button variant="white" size="sm" onClick={() => handleBulkAction('mark_contacted')} className="text-blue-700 border-blue-200 hover:bg-blue-50">
              Mark Contacted
            </Button>
            <Button variant="white" size="sm" onClick={() => handleBulkAction('delete')} className="text-red-600 border-red-200 hover:bg-red-50">
              <Trash2 className="w-4 h-4 mr-1" /> Delete
            </Button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <Card className="border-none shadow-md overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-gray-500">Loading leads...</div>
          ) : leads.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center text-gray-400">
              <Users className="w-12 h-12 mb-3 opacity-20" />
              <p>No leads found matching your filters.</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead className="w-[50px]">
                    <input
                      type="checkbox"
                      checked={selectedLeads.length === leads.length}
                      onChange={(e) => setSelectedLeads(e.target.checked ? leads.map(l => l.id) : [])}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </TableHead>
                  <TableHead>Lead Name</TableHead>
                  <TableHead>Contact Info</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id} className="hover:bg-gray-50/50 transition-colors group">
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedLeads.includes(lead.id)}
                        onChange={(e) => {
                          setSelectedLeads(e.target.checked
                            ? [...selectedLeads, lead.id]
                            : selectedLeads.filter(id => id !== lead.id)
                          );
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-100 to-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs uppercase">
                          {lead.firstName[0]}{lead.lastName[0]}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{lead.firstName} {lead.lastName}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            ID: <span className="font-mono">{lead.id.slice(0, 6)}...</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Mail className="h-3.5 w-3.5 text-gray-400" /> {lead.email}
                        </div>
                        {lead.phone && (
                          <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            <Phone className="h-3.5 w-3.5 text-gray-400" /> {lead.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getStatusBadge(lead.status)} border px-2.5 py-0.5 rounded-full capitalize font-medium`}>
                        {lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs text-gray-500 font-normal bg-white">
                        {lead.source?.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">
                      {formatDate(lead.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center bg-white border border-gray-200 rounded-lg shadow-sm">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-blue-600" onClick={() => handleCheckDuplicates(lead)} title="Check Duplicates">
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <div className="w-px h-4 bg-gray-200" />
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-blue-600" onClick={() => handleEditLead(lead)} title="Edit Lead">
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <div className="w-px h-4 bg-gray-200" />
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-red-600" onClick={() => dispatch(deleteLead(lead.id))} title="Delete">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
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
      {showModal && editingLead && (
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
                  onChange={(v) => setEditingLead({ ...editingLead, status: v as any })}
                  options={[{ value: 'new', label: 'New' }, { value: 'contacted', label: 'Contacted' }, { value: 'qualified', label: 'Qualified' }, { value: 'converted', label: 'Converted' }, { value: 'lost', label: 'Lost' }]}
                />
                <Select
                  label="Source"
                  value={editingLead.source}
                  onChange={(v) => setEditingLead({ ...editingLead, source: v })}
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
      )}

      {/* Create Modal Logic - Similar cleaner implementation */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <Card className="w-full max-w-lg shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <CardTitle className="text-xl">Add New Lead</CardTitle>
                <p className="text-sm text-gray-500 mt-1">Enter lead details to get started.</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowCreateForm(false)}><X className="w-4 h-4" /></Button>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="First Name" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} required />
                <Input label="Last Name" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} required />
              </div>
              <Input label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
              <Input label="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              <div className="grid grid-cols-2 gap-4">
                <Select label="Status" value={formData.status} onChange={(v) => setFormData({ ...formData, status: v })} options={[{ value: 'new', label: 'New' }, { value: 'contacted', label: 'Contacted' }, { value: 'qualified', label: 'Qualified' }]} />
                <Select label="Source" value={formData.source} onChange={(v) => setFormData({ ...formData, source: v })} options={[{ value: 'facebook_ads', label: 'Facebook Ads' }, { value: 'website', label: 'Website' }, { value: 'manual', label: 'Manual' }]} />
              </div>
            </CardContent>
            <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50 rounded-b-xl">
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleCreateLead}>Create Lead</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Duplicate Results Modal Logic */}
      {showDuplicateResults && duplicateCheck && (
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
      )}
    </div>
  );
};
