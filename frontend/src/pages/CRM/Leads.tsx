import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Search,
  Filter,
  Plus,
  MoreVertical,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Phone,
  Mail,
  Calendar,
  Tag,
  Eye,
  Edit,
  Trash2,
  Copy,
  Users,
  Building
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
  getDuplicateSuggestions,
  setLeadFilters
} from '@/store/slices/crmSlice';
import type { RootState, AppDispatch } from '@/store';
import type { Lead } from '@/types/crm.types';

interface LeadsPageProps {
  onViewLead?: (lead: Lead) => void;
}

export const LeadsPage: React.FC<LeadsPageProps> = ({ onViewLead }) => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    leads,
    leadFilters,
    duplicateCheck,
    duplicateSuggestions,
    isLoading,
    error
  } = useSelector((state: RootState) => state.crm);

  const { user } = useSelector((state: RootState) => state.auth);

  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [showDuplicateResults, setShowDuplicateResults] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [formData, setFormData] = useState({
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
  });

  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead);
    setShowModal(true);
  };
  useEffect(() => {
    dispatch(fetchLeads(leadFilters));
  }, [dispatch, leadFilters]);

  const handleFilterChange = (key: string, value: string) => {
    dispatch(setLeadFilters({ ...leadFilters, [key]: value }));
  };

  const handleSearch = () => {
    dispatch(setLeadFilters({ ...leadFilters, search: searchTerm }));
  };

  const handleCreateLead = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email) {
      alert('Please fill in required fields');
      return;
    }

    try {
      await dispatch(createLead(formData)).unwrap();
      setShowCreateForm(false);
      setFormData({
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
      });
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
    setShowDuplicateResults(true); // ✅ Show results only after click

  };

  const handleBulkAction = async (action: string) => {
    if (selectedLeads.length === 0) return;

    switch (action) {
      case 'delete':
        for (const leadId of selectedLeads) {
          await dispatch(deleteLead(leadId));
        }
        break;
      case 'mark_contacted':
        for (const leadId of selectedLeads) {
          await dispatch(updateLead({ id: leadId, updates: { status: 'contacted' } }));
        }
        break;
    }
    setSelectedLeads([]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'info';
      case 'contacted':
        return 'warning';
      case 'qualified':
        return 'success';
      case 'converted':
        return 'success';
      case 'lost':
        return 'error';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <div className="flex items-center justify-between  ">
          <div>
            <h1 className="text-2xl font-bold">Lead Management</h1>
            <p className="text-gray-500 mt-1">Manage and track your sales leads</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Button variant="primary" onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Lead
            </Button>
          </div>
        </div>
      </Card>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{leads.length}</div>
                <div className="text-sm text-gray-500">Total Leads</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold">
                  {leads.filter(l => l.status === 'new').length}
                </div>
                <div className="text-sm text-gray-500">New Leads</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <div>
                <div className="text-2xl font-bold">
                  {leads.filter(l => l.status === 'contacted').length}
                </div>
                <div className="text-sm text-gray-500">Contacted</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">
                  {leads.filter(l => l.status === 'converted').length}
                </div>
                <div className="text-sm text-gray-500">Converted</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select
                label="Status"
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
              />


              <Select
                label="Source"
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
              />

              <div className="flex items-end gap-2">
                <Button variant="outline" onClick={() => {
                  dispatch(setLeadFilters({}));
                  setSearchTerm('');
                }}>
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Search leads by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button variant="outline" onClick={handleSearch}>
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedLeads.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span>{selectedLeads.length} leads selected</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleBulkAction('mark_contacted')}>
                  Mark as Contacted
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleBulkAction('delete')}>
                  Delete Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>Leads ({leads.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading leads...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">{error}</div>
          ) : leads.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No leads found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <input
                      type="checkbox"
                      checked={selectedLeads.length === leads.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedLeads(leads.map(l => l.id));
                        } else {
                          setSelectedLeads([]);
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedLeads.includes(lead.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedLeads([...selectedLeads, lead.id]);
                          } else {
                            setSelectedLeads(selectedLeads.filter(id => id !== lead.id));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {lead.firstName} {lead.lastName}
                        </div>

                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {lead.email}
                        </div>
                        {lead.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {lead.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(lead.status)}>
                        {lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {lead.source}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatDate(lead.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewLead?.(lead)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditLead(lead)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCheckDuplicates(lead)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => dispatch(deleteLead(lead.id))}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Duplicate Check Results */}
      {
        showDuplicateResults && duplicateCheck && (
          <Card className="">
            {/* Close (X) button */}
            <Button
              variant='outline'
              onClick={() => setShowDuplicateResults(false)}
              className="rounded-[100%] pt-4"
            >
              ✕
            </Button>

            <CardHeader>
              <CardTitle className="flex items-center gap-2 mb-8">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                Duplicate Check Results
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                {duplicateCheck.isDuplicate ? (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 text-yellow-800 mb-2">
                      <AlertTriangle className="h-5 w-5" />
                      <span className="font-medium">Potential Duplicate Found</span>
                      <Badge variant="warning">
                        {duplicateCheck.confidence}% confidence
                      </Badge>
                    </div>
                    {duplicateCheck.existingCustomer && (
                      <div className="text-sm text-yellow-700">
                        Matches existing customer:{" "}
                        {duplicateCheck.existingCustomer.firstName}{" "}
                        {duplicateCheck.existingCustomer.lastName}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-800">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">No duplicates found</span>
                    </div>
                  </div>
                )}

                {duplicateCheck?.suggestions?.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Similar Customers:</h4>
                    <div className="space-y-2">
                      {duplicateCheck.suggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div>
                            <div className="font-medium">
                              {suggestion.customer.firstName}{" "}
                              {suggestion.customer.lastName}
                            </div>
                            <div className="text-sm text-gray-600">
                              {suggestion.customer.email} •{" "}
                              {suggestion.matchReason}
                            </div>
                          </div>
                          <Badge variant="info">
                            {suggestion.confidence}% match
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )
      }


      {/* Create Lead Modal */}
      {
        showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Create New Lead</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                  />
                  <Input
                    label="Last Name"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                  />
                </div>
                <Input
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
                <Input
                  label="Phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Status"
                    value={formData.status}
                    onChange={(value) => setFormData({ ...formData, status: value })}
                    options={[
                      { value: '', label: 'All Statuses' },
                      { value: 'new', label: 'New' },
                      { value: 'contacted', label: 'Contacted' },
                      { value: 'qualified', label: 'Qualified' },
                      { value: 'converted', label: 'Converted' },
                      { value: 'lost', label: 'Lost' }
                    ]}

                  />

                  <Select label="Source" value={formData.source || ''} onChange={(value) => setFormData({ ...formData, source: value })} options={[{ value: '', label: 'All Sources' }, { value: 'facebook_ads', label: 'Facebook Ads' }, { value: 'google_ads', label: 'Google Ads' }, { value: 'referral', label: 'Referral' }, { value: 'manual', label: 'Manual' }, { value: 'website', label: 'Website' }]} />

                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <Button variant="primary" onClick={handleCreateLead}>
                  Create Lead
                </Button>
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )
      }
      {showModal && editingLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Lead</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  value={editingLead.firstName}
                  onChange={(e) => setEditingLead({ ...editingLead, firstName: e.target.value })}
                />
                <Input
                  label="Last Name"
                  value={editingLead.lastName}
                  onChange={(e) => setEditingLead({ ...editingLead, lastName: e.target.value })}
                />
              </div>
              <Input
                label="Email"
                type="email"
                value={editingLead.email}
                onChange={(e) => setEditingLead({ ...editingLead, email: e.target.value })}
              />
              <Input
                label="Phone"
                value={editingLead.phone || ""}
                onChange={(e) => setEditingLead({ ...editingLead, phone: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Status"
                  value={editingLead.status}
                  onChange={(value) =>
                    setEditingLead({ ...editingLead, status: value as Lead["status"] })
                  }
                  options={[
                    { value: 'new', label: 'New' },
                    { value: 'contacted', label: 'Contacted' },
                    { value: 'qualified', label: 'Qualified' },
                    { value: 'converted', label: 'Converted' },
                    { value: 'lost', label: 'Lost' }
                  ]}
                />
                <Select
                  label="Source"
                  value={editingLead.source}
                  onChange={(value) => setEditingLead({ ...editingLead, source: value })}
                  options={[
                    { value: 'facebook_ads', label: 'Facebook Ads' },
                    { value: 'google_ads', label: 'Google Ads' },
                    { value: 'referral', label: 'Referral' },
                    { value: 'manual', label: 'Manual' },
                    { value: 'website', label: 'Website' }
                  ]}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button
                variant="primary"
                onClick={async () => {
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
                    dispatch(fetchLeads(leadFilters)); // ✅ Refresh list after save
                  } catch (error) {
                    console.error("Update failed:", error);
                  }
                }}
              >
                Save
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowModal(false);
                  setEditingLead(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div >
  );
};
