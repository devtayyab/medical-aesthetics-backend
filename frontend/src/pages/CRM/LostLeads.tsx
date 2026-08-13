import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Search,
  Filter,
  UserX,
  Phone,
  Mail,
  Trash2,
  Users,
  X,
  Eye,
  Calendar,
  Download,
  RotateCcw,
  AlertCircle,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/atoms/Button/Button';
import { Input } from '@/components/atoms/Input/Input';
import { Card, CardContent } from '@/components/molecules/Card/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/molecules/Table/Table';
import { Badge } from '@/components/atoms/Badge';
import { fetchLeads, updateLead, deleteLead, fetchSalespersons } from '@/store/slices/crmSlice';
import { openDialer } from '@/store/slices/dialerSlice';
import type { RootState, AppDispatch } from '@/store';
import type { Lead } from '@/types/crm.types';
import { crmAPI } from '@/services/api';
import { toast } from 'react-hot-toast';

export const LostLeadsPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { leads, isLoading, salespersons } = useSelector((state: RootState) => state.crm);
  const { user } = useSelector((state: RootState) => state.auth);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [submissionDateFrom, setSubmissionDateFrom] = useState('');
  const [submissionDateTo, setSubmissionDateTo] = useState('');
  const [lastContactedFrom, setLastContactedFrom] = useState('');
  const [lastContactedTo, setLastContactedTo] = useState('');
  const [selectedFormName, setSelectedFormName] = useState('');
  const [selectedSalesId, setSelectedSalesId] = useState('');
  const [detailLead, setDetailLead] = useState<Lead | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [leadsPerPage, setLeadsPerPage] = useState(50);

  // Load lost leads on mount & filter changes
  useEffect(() => {
    dispatch(fetchSalespersons());
    dispatch(fetchLeads({
      status: 'lost',
      limit: 10000,
      search: searchTerm,
      submissionDateFrom: submissionDateFrom || undefined,
      submissionDateTo: submissionDateTo || undefined,
      lastContactedFrom: lastContactedFrom || undefined,
      lastContactedTo: lastContactedTo || undefined,
      formNames: selectedFormName ? [selectedFormName] : undefined,
      assignedSalesId: selectedSalesId || undefined,
    }));
  }, [dispatch, searchTerm, submissionDateFrom, submissionDateTo, lastContactedFrom, lastContactedTo, selectedFormName, selectedSalesId]);

  // Filter lost leads locally as a fallback
  const lostLeads = (leads || []).filter(l => l.status === 'lost');

  // Available Form Names for filter dropdown
  const availableForms = Array.from(new Set(lostLeads.map(l => (l as any).lastMetaFormName).filter(Boolean)));

  // Pagination logic
  const totalPages = Math.ceil(lostLeads.length / leadsPerPage);
  const indexOfLastLead = currentPage * leadsPerPage;
  const indexOfFirstLead = indexOfLastLead - leadsPerPage;
  const currentLeads = lostLeads.slice(indexOfFirstLead, indexOfLastLead);

  // Handlers
  const handleReactivate = async (lead: Lead, newStatus: string) => {
    try {
      await dispatch(updateLead({ id: lead.id, updates: { status: newStatus as any } })).unwrap();
      toast.success(`Lead restored to status "${newStatus}"`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to restore lead');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this lost lead?')) return;
    try {
      await dispatch(deleteLead(id)).unwrap();
      toast.success('Lead deleted');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete lead');
    }
  };

  const handleExportCSV = () => {
    if (lostLeads.length === 0) {
      toast.error('No lost leads to export');
      return;
    }
    const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Source', 'Form Name', 'Reason/Notes', 'Created Date'];
    const rows = lostLeads.map(l => [
      l.firstName || '',
      l.lastName || '',
      l.email || '',
      l.phone || '',
      l.source || '',
      (l as any).lastMetaFormName || '',
      (l as any).notes || '',
      (l as any).createdAt ? new Date((l as any).createdAt).toLocaleDateString() : ''
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `lost_leads_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSubmissionDateFrom('');
    setSubmissionDateTo('');
    setLastContactedFrom('');
    setLastContactedTo('');
    setSelectedFormName('');
    setSelectedSalesId('');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="size-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center">
            <UserX size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Lost Leads</h1>
            <p className="text-xs text-gray-500 font-medium mt-0.5">Manage and reactivate non-converting leads</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleExportCSV}
            className="h-10 text-xs font-bold uppercase tracking-wider border-gray-200 hover:bg-gray-50 gap-2"
          >
            <Download size={16} /> Export CSV
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Lost Leads</p>
              <h3 className="text-2xl font-black text-gray-900 mt-1">{lostLeads.length}</h3>
            </div>
            <div className="size-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center font-bold">
              <UserX size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">From Facebook Ads</p>
              <h3 className="text-2xl font-black text-gray-900 mt-1">
                {lostLeads.filter(l => l.source === 'facebook_ads' || (l as any).facebookLeadId).length}
              </h3>
            </div>
            <div className="size-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold">
              <Users size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Last 30 Days</p>
              <h3 className="text-2xl font-black text-gray-900 mt-1">
                {lostLeads.filter(l => {
                  const d = new Date((l as any).createdAt);
                  return (Date.now() - d.getTime()) <= 30 * 86400000;
                }).length}
              </h3>
            </div>
            <div className="size-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-bold">
              <Calendar size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Restorable Leads</p>
              <h3 className="text-2xl font-black text-gray-900 mt-1">
                {lostLeads.filter(l => l.phone || l.email).length}
              </h3>
            </div>
            <div className="size-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold">
              <RotateCcw size={20} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 size-4" />
            <Input
              placeholder="Search lost leads by name, email, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 bg-gray-50 border-none rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#CBFF38]"
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Button
              variant={showFilters ? 'primary' : 'outline'}
              onClick={() => setShowFilters(!showFilters)}
              className="h-11 px-4 text-xs font-bold uppercase tracking-wider gap-2 border-gray-200"
            >
              <Filter size={16} /> Filters
            </Button>
            {(submissionDateFrom || submissionDateTo || lastContactedFrom || lastContactedTo || selectedFormName || selectedSalesId || searchTerm) && (
              <Button
                variant="ghost"
                onClick={clearFilters}
                className="h-11 px-4 text-xs font-bold text-red-500 hover:bg-red-50 hover:text-red-600"
              >
                Clear All
              </Button>
            )}
          </div>
        </div>

        {/* Date & Detailed Filters */}
        {showFilters && (
          <div className="pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-300">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">
                Submission Date From
              </label>
              <input
                type="date"
                value={submissionDateFrom}
                onChange={(e) => setSubmissionDateFrom(e.target.value)}
                className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-[#CBFF38]"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">
                Submission Date To
              </label>
              <input
                type="date"
                value={submissionDateTo}
                onChange={(e) => setSubmissionDateTo(e.target.value)}
                className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-[#CBFF38]"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">
                Last Contacted From
              </label>
              <input
                type="date"
                value={lastContactedFrom}
                onChange={(e) => setLastContactedFrom(e.target.value)}
                className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-[#CBFF38]"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">
                Last Contacted To
              </label>
              <input
                type="date"
                value={lastContactedTo}
                onChange={(e) => setLastContactedTo(e.target.value)}
                className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-[#CBFF38]"
              />
            </div>

            {availableForms.length > 0 && (
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">
                  Form Name
                </label>
                <select
                  value={selectedFormName}
                  onChange={(e) => setSelectedFormName(e.target.value)}
                  className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-[#CBFF38]"
                >
                  <option value="">All Forms</option>
                  {availableForms.map((name, i) => (
                    <option key={i} value={name}>{name}</option>
                  ))}
                </select>
              </div>
            )}

            {salespersons.length > 0 && (
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">
                  Assigned Salesperson
                </label>
                <select
                  value={selectedSalesId}
                  onChange={(e) => setSelectedSalesId(e.target.value)}
                  className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-[#CBFF38]"
                >
                  <option value="">All Salespersons</option>
                  {salespersons
                    .filter(s => s.role?.toLowerCase() === 'salesperson')
                    .map(s => (
                      <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
                    ))}
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50/50">
            <TableRow>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400">Lead Name</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400">Contact</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400">Form / Campaign</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400">Created Date</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400">Assigned To</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <div className="animate-spin size-6 border-2 border-[#CBFF38] border-t-transparent rounded-full mx-auto" />
                </TableCell>
              </TableRow>
            ) : currentLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-gray-400 font-bold text-sm">
                  No lost leads found matching criteria.
                </TableCell>
              </TableRow>
            ) : (
              currentLeads.map((lead) => (
                <TableRow key={lead.id} className="hover:bg-gray-50/50 transition-colors">
                  <TableCell>
                    <div>
                      <p className="font-black text-gray-900 text-sm">{lead.firstName} {lead.lastName}</p>
                      <Badge variant="outline" className="bg-red-50 text-red-600 border-red-100 text-[9px] mt-1 font-bold">
                        LOST
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {lead.phone && (
                        <p className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                          <Phone size={12} className="text-gray-400" /> {lead.phone}
                        </p>
                      )}
                      {lead.email && (
                        <p className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                          <Mail size={12} className="text-gray-400" /> {lead.email}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-xs font-bold text-gray-800">{(lead as any).lastMetaFormName || 'N/A'}</p>
                    <p className="text-[10px] text-gray-400 font-medium uppercase mt-0.5">{lead.source || 'facebook_ads'}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-xs font-bold text-gray-700">
                      {(lead as any).createdAt ? new Date((lead as any).createdAt).toLocaleDateString() : '—'}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="text-xs font-bold text-gray-700">
                      {lead.assignedSales ? `${lead.assignedSales.firstName} ${lead.assignedSales.lastName}` : 'Unassigned'}
                    </p>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {lead.phone && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => dispatch(openDialer({ phoneNumber: lead.phone!, customerName: `${lead.firstName} ${lead.lastName}`, customerId: lead.id }))}
                          title="Call Lead"
                          className="h-8 w-8 p-0 text-emerald-600 hover:bg-emerald-50"
                        >
                          <Phone size={14} />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReactivate(lead, 'new')}
                        title="Reactivate Lead (Set to New)"
                        className="h-8 px-2 text-[10px] font-bold text-indigo-600 hover:bg-indigo-50 gap-1"
                      >
                        <RotateCcw size={12} /> Reactivate
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(lead.id)}
                        title="Delete Lead"
                        className="h-8 w-8 p-0 text-red-500 hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination Footer */}
        {lostLeads.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-white">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Leads per page:</span>
              <select
                value={leadsPerPage}
                onChange={(e) => {
                  setLeadsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-8 px-2 text-[11px] font-bold text-gray-900 border border-gray-200 rounded-lg focus:ring-[#CBFF38] bg-white cursor-pointer"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-[10px] text-gray-400 font-medium ml-4 uppercase tracking-widest hidden sm:inline">
                Showing {indexOfFirstLead + 1} to {Math.min(indexOfLastLead, lostLeads.length)} of {lostLeads.length}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 px-3 text-[10px] font-bold uppercase tracking-widest border-gray-200 disabled:opacity-50"
              >
                Prev
              </Button>
              <span className="text-xs font-bold px-2 text-gray-700">
                Page {currentPage} of {totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="h-8 px-3 text-[10px] font-bold uppercase tracking-widest border-gray-200 disabled:opacity-50"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
