import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Clock,
  Euro,
  TrendingUp,
  Star,
  Award,
  AlertCircle,
  CheckCircle,
  Building,
  Stethoscope,
  Tag,
  MessageSquare,
  FileText,
  Plus,
  PhoneCall,
  X,
  Users,
  Layout,
  Check,
  ChevronRight,
  Activity,
  Search,
  Trash2,
  Edit2
} from 'lucide-react';

// Helper component for properties
const PropertyItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: React.ReactNode }) => (
  <div className="flex items-start gap-4 group">
    <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-colors">
      <div className="text-slate-400 group-hover:text-indigo-600 transition-colors">
        {icon}
      </div>
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-0.5">{label}</div>
      <div className="text-sm font-bold text-slate-700 truncate">{value}</div>
    </div>
  </div>
);
import { Textarea } from "@/components/atoms/Textarea";
import { Input } from "@/components/atoms/Input/Input";
import { StaffDiary } from '@/components/organisms/StaffDiary/StaffDiary';
import {
  logCommunication,
  fetchSalespersons,
  updateLead,
  updateCustomerRecord,
  updateCommunication,
  deleteCommunication
} from "@/store/slices/crmSlice";
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/molecules/Card/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/molecules/Tabs';
import { CommunicationForm } from '@/components/organisms/CommunicationForm/CommunicationForm';
import { ActionForm } from '@/components/organisms/ActionForm/ActionForm';
import { TagForm } from '@/components/organisms/TagForm/TagForm';
import { CRMBookingModal } from '@/components/crm/CRMBookingModal';
import { crmAPI, clinicsAPI } from '@/services/api';
import { useDispatch } from 'react-redux';
import { completeAppointment } from '@/store/slices/bookingSlice';
import type { AppDispatch } from '@/store';
import type { CustomerSummary } from '@/types';

interface CustomerDetailsProps {
  customerData: CustomerSummary;

  onUpdate?: () => void;
  onCall?: (phone: string) => void;
}

export const CustomerDetails: React.FC<CustomerDetailsProps> = ({
  customerData,
  onUpdate,
  onCall
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { salespersons } = useSelector((state: RootState) => state.crm);

  const [activeTab, setActiveTab] = useState('overview');

  // Property edit state
  const [isEditingClinics, setIsEditingClinics] = useState(false);
  const [isEditingOwners, setIsEditingOwners] = useState(false);
  const [availableClinics, setAvailableClinics] = useState<any[]>([]);

  useEffect(() => {
    dispatch(fetchSalespersons());
    const loadClinics = async () => {
      const res = await clinicsAPI.search({ limit: 100 });
      setAvailableClinics(res.data.clinics || []);
    };
    loadClinics();
  }, [dispatch]);

  const customer = customerData.record;
  const isLead = (customer as any).source !== undefined; // Heuristic to check if it's a Lead entity

  const handleUpdateProperty = async (updates: any) => {
    try {
      if (isLead) {
        await dispatch(updateLead({ id: (customer as any).customerId, updates })).unwrap();
      } else {
        await dispatch(updateCustomerRecord({ customerId: customer.customerId, updates })).unwrap();
      }
      onUpdate?.();
    } catch (error) {
      console.error("Failed to update property", error);
    }
  };

  const handleStatusChange = async (clinicId: string, newStatus: string) => {
    const currentClinics = (customer.metadata as any)?.clinics || [];
    const updatedClinics = currentClinics.map((c: any) =>
      c.id === clinicId ? { ...c, status: newStatus } : c
    );

    await handleUpdateProperty({
      metadata: {
        ...(customer.metadata || {}),
        clinics: updatedClinics
      }
    });
  };

  const toggleClinic = async (clinic: any) => {
    const currentClinics = (customer.metadata as any)?.clinics || [];
    const exists = currentClinics.find((c: any) => c.id === clinic.id);

    let updatedClinics;
    if (exists) {
      updatedClinics = currentClinics.filter((c: any) => c.id !== clinic.id);
    } else {
      updatedClinics = [...currentClinics, { id: clinic.id, name: clinic.name, status: 'Lead' }];
    }

    await handleUpdateProperty({
      metadata: {
        ...(customer.metadata || {}),
        clinics: updatedClinics
      }
    });
  };

  const toggleOwner = async (owner: any) => {
    const currentOwners = (customer.metadata as any)?.owners || [];
    const exists = currentOwners.find((o: any) => o.id === owner.id);

    let updatedOwners;
    if (exists) {
      updatedOwners = currentOwners.filter((o: any) => o.id !== owner.id);
    } else {
      updatedOwners = [...currentOwners, { id: owner.id, name: `${owner.firstName} ${owner.lastName}` }];
    }

    await handleUpdateProperty({
      metadata: {
        ...(customer.metadata || {}),
        owners: updatedOwners
      }
    });
  };
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [showDiaryModal, setShowDiaryModal] = useState(false);
  const [showPhoneCallModal, setShowPhoneCallModal] = useState(false);
  const [phoneCallNotes, setPhoneCallNotes] = useState("");
  const [editingCallId, setEditingCallId] = useState<string | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailNotes, setEmailNotes] = useState("");
  const [emailDate, setEmailDate] = useState(new Date().toISOString().substring(0, 16));
  const [callSearchTerm, setCallSearchTerm] = useState('');

  const tabsRef = useRef<HTMLDivElement>(null);
  const { record, appointments, communications, actions, tags, summary } = customerData;
  // Note: affiliations removed as per user request


  const scrollToTabs = (tab: string) => {
    setActiveTab(tab);
    setTimeout(() => {
      tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const formatCurrency = (amount: any) => {
    const value = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency: 'EUR'
    }).format(value || 0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'confirmed':
        return 'info';
      case 'pending':
        return 'warning';
      case 'cancelled':
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

  const handleCompleteAppointment = async (id: string) => {
    if (confirm('Are you sure you want to mark this appointment as completed?')) {
      try {
        await dispatch(completeAppointment({ id })).unwrap();
        onUpdate?.();
      } catch (error) {
        console.error('Failed to complete appointment:', error);
        alert('Failed to complete appointment.');
      }
    }
  };

  const handleSavePhoneCallNotes = async () => {
    if (!phoneCallNotes.trim()) return;
    try {
      if (editingCallId) {
        await dispatch(updateCommunication({
          id: editingCallId,
          updates: { notes: phoneCallNotes }
        })).unwrap();
      } else {
        await dispatch(logCommunication({
          customerId: record.customerId,
          salespersonId: user?.id,
          type: 'call',
          status: 'completed',
          notes: phoneCallNotes,
          direction: 'outgoing'
        })).unwrap();
      }
      setPhoneCallNotes("");
      setEditingCallId(null);
      setShowPhoneCallModal(false);
      onUpdate?.();
    } catch (error) {
      console.error("Failed to save phone call note", error);
      alert("Failed to save.");
    }
  };

  const handleEditCall = (call: any) => {
    setEditingCallId(call.id);
    setPhoneCallNotes(call.notes || "");
    setShowPhoneCallModal(true);
  };

  const handleDeleteCommunication = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this log?")) {
      try {
        await dispatch(deleteCommunication(id)).unwrap();
        onUpdate?.();
      } catch (error) {
        console.error("Failed to delete communication", error);
        alert("Failed to delete.");
      }
    }
  };

  const handleSaveEmailLog = async () => {
    if (!emailNotes.trim()) return;
    try {
      await dispatch(logCommunication({
        customerId: record.customerId,
        salespersonId: user?.id,
        type: 'email',
        status: 'completed',
        notes: `[Sent: ${new Date(emailDate).toLocaleString()}]\n\n${emailNotes}`,
        direction: 'outgoing'
      })).unwrap();
      setEmailNotes("");
      setShowEmailModal(false);
      onUpdate?.();
    } catch (error) {
      console.error("Failed to log email", error);
      alert("Failed to save.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Customer Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  {record.customer?.firstName} {record.customer?.lastName}
                </h1>
                <div className="flex items-center gap-4 text-gray-600 mt-1">
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {record.customer?.email}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {record.customer?.phone || 'No phone'}
                    </span>
                    {record.customer?.phone && (
                      <a
                        href={`tel:${record.customer.phone}`}
                        onClick={() => onCall?.(record.customer!.phone!)}
                        className="inline-flex items-center px-2 py-1 text-sm rounded border border-gray-300 hover:bg-gray-100"
                      >
                        Call
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {record.isRepeatCustomer && (
                    <Badge variant="success">
                      <Award className="h-3 w-3 mr-1" />
                      Repeat Customer
                    </Badge>
                  )}
                  <Badge variant="info">
                    {summary.repeatCount} visits
                  </Badge>
                  <Badge variant="secondary">
                    {formatCurrency(summary.lifetimeValue)} lifetime value
                  </Badge>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Assigned to</div>
              <div className="font-medium">
                {record.assignedSalesperson?.firstName} {record.assignedSalesperson?.lastName}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{summary.totalAppointments || 0}</div>
                <div className="text-sm text-gray-500">Total Appointments</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{summary.completedAppointments || 0}</div>
                <div className="text-sm text-gray-500">Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Euro className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{formatCurrency(summary.lifetimeValue)}</div>
                <div className="text-sm text-gray-500">Lifetime Value</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{summary.repeatCount || 0}</div>
                <div className="text-sm text-gray-500">Repeat Visits</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <div ref={tabsRef} className="scroll-mt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="communications">Communications</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="calls">Calls</TabsTrigger>
          </TabsList>

          {/* Overview Tab - Refactored to 2-column HubSpot style */}
          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Properties Panel */}
              <div className="lg:col-span-4 space-y-6">
                <Card className="border-none shadow-sm bg-white rounded-xl overflow-hidden border border-slate-200">
                  <div className="bg-slate-50 border-b border-slate-100 py-4 px-6">
                    <h3 className="text-sm font-bold text-slate-700 flex items-center justify-between">
                      Properties
                      <User className="w-4 h-4 text-slate-400" />
                    </h3>
                  </div>
                  <CardContent className="p-6 space-y-6">
                    {/* Facebook Ad Section */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                          <TrendingUp className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Facebook Ad Name</div>
                          <div className="text-sm font-black text-slate-900">{record.metadata?.facebookAdName || 'Direct / Organic'}</div>
                        </div>
                      </div>
                    </div>

                    <div className="h-px bg-slate-100" />

                    {/* Clinique Section */}
                    <div className="space-y-4">
                      <PropertyItem
                        icon={<Building className="w-4 h-4" />}
                        label="Ιατρείο – Clinique"
                        value={
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {((customer.metadata as any)?.clinics || []).length > 0 ? (
                              (customer.metadata as any).clinics.map((c: any) => (
                                <Badge
                                  key={c.id}
                                  variant="outline"
                                  className="bg-slate-50 text-slate-700 border-slate-200 flex items-center gap-1 group"
                                >
                                  {c.name}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => toggleClinic(c)}
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </Badge>
                              ))
                            ) : (
                              <span className="text-slate-400 italic text-xs">No clinic assigned</span>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 px-2 text-[10px] border-dashed"
                              onClick={() => setIsEditingClinics(!isEditingClinics)}
                            >
                              <Plus className="w-3 h-3 mr-1" /> Add
                            </Button>
                          </div>
                        }
                      />

                      {isEditingClinics && (
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 animate-in slide-in-from-top-2">
                          <div className="text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider">Select Clinics</div>
                          <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                            {availableClinics.map(clinic => (
                              <div
                                key={clinic.id}
                                className={`flex items-center justify-between p-1.5 rounded cursor-pointer transition-colors ${((customer.metadata as any)?.clinics || []).some((c: any) => c.id === clinic.id)
                                  ? 'bg-indigo-50 text-indigo-700'
                                  : 'hover:bg-white text-slate-600'
                                  }`}
                                onClick={() => toggleClinic(clinic)}
                              >
                                <span className="text-xs font-medium">{clinic.name}</span>
                                {((customer.metadata as any)?.clinics || []).some((c: any) => c.id === clinic.id) && (
                                  <CheckCircle className="w-3 h-3 flex-shrink-0" />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Clinic Specific Statuses */}
                      {((customer.metadata as any)?.clinics || []).length > 0 && (
                        <div className="pl-6 space-y-3 border-l-2 border-slate-100 ml-2 py-1">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Clinique Status</div>
                          {(customer.metadata as any).clinics.map((c: any) => (
                            <div key={c.id} className="flex items-center justify-between group">
                              <span className="text-xs text-slate-600 font-medium truncate max-w-[120px]">{c.name}</span>
                              <select
                                value={c.status || 'Lead'}
                                onChange={(e) => handleStatusChange(c.id, e.target.value)}
                                className="text-[10px] font-black bg-white border border-slate-200 rounded px-2 py-1 focus:ring-1 focus:ring-indigo-500 outline-none"
                              >
                                <option value="Lead">Lead</option>
                                <option value="Contacted">Contacted</option>
                                <option value="Client">Client</option>
                                <option value="Converted">Converted</option>
                              </select>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="h-px bg-slate-50" />

                      <PropertyItem
                        icon={<Users className="w-4 h-4" />}
                        label="Contact owner"
                        value={
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {((customer.metadata as any)?.owners || []).length > 0 ? (
                              (customer.metadata as any).owners.map((o: any) => (
                                <Badge
                                  key={o.id}
                                  variant="outline"
                                  className="bg-indigo-50 text-indigo-700 border-indigo-200 flex items-center gap-1 group"
                                >
                                  {o.name}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => toggleOwner(o)}
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </Badge>
                              ))
                            ) : record.assignedSalesperson ? (
                              <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">
                                {record.assignedSalesperson.firstName} {record.assignedSalesperson.lastName} (Assigned)
                              </Badge>
                            ) : (
                              <span className="text-slate-400 italic text-xs">Unassigned</span>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 px-2 text-[10px] border-dashed"
                              onClick={() => setIsEditingOwners(!isEditingOwners)}
                            >
                              <Plus className="w-3 h-3 mr-1" /> Add
                            </Button>
                          </div>
                        }
                      />

                      {isEditingOwners && (
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 animate-in slide-in-from-top-2">
                          <div className="text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider">Select Owners</div>
                          <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                            {salespersons.map(sp => (
                              <div
                                key={sp.id}
                                className={`flex items-center justify-between p-1.5 rounded cursor-pointer transition-colors ${((customer.metadata as any)?.owners || []).some((o: any) => o.id === sp.id)
                                  ? 'bg-indigo-50 text-indigo-700'
                                  : 'hover:bg-white text-slate-600'
                                  }`}
                                onClick={() => toggleOwner(sp)}
                              >
                                <span className="text-xs font-medium">{sp.firstName} {sp.lastName}</span>
                                {((customer.metadata as any)?.owners || []).some((o: any) => o.id === sp.id) && (
                                  <CheckCircle className="w-3 h-3 flex-shrink-0" />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="h-px bg-slate-50" />

                      <PropertyItem
                        icon={<Calendar className="w-4 h-4" />}
                        label="Create date"
                        value={new Date(customer.createdAt).toLocaleDateString()}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions Card */}
                <Card className="border-none shadow-premium bg-white rounded-3xl overflow-hidden border border-slate-100">
                  <div className="bg-slate-50/50 border-b border-slate-100 py-4 px-6">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Quick Actions</h3>
                  </div>
                  <CardContent className="p-4 space-y-2">
                    <Button
                      className="w-full bg-[#CBFF38] text-gray-900 border-none hover:bg-[#b8e632] font-black text-xs h-10 rounded-xl shadow-sm"
                      onClick={() => setShowDiaryModal(true)}
                    >
                      <Calendar className="h-3.5 w-3.5 mr-2" />
                      Book Appointment
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        className="text-slate-700 font-bold text-[10px] h-10 rounded-xl"
                        onClick={() => setShowPhoneCallModal(true)}
                      >
                        <PhoneCall className="h-3 w-3 mr-1.5" />
                        Call Notes
                      </Button>
                      <Button
                        variant="outline"
                        className="text-slate-700 font-bold text-[10px] h-10 rounded-xl"
                        onClick={() => setShowEmailModal(true)}
                      >
                        <Mail className="h-3 w-3 mr-1.5" />
                        Log Email
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>


              {/* Right Column: Activity Timeline */}
              <div className="lg:col-span-8 space-y-6">
                <Card className="border-none shadow-sm bg-white rounded-xl overflow-hidden border border-slate-200 min-h-[600px] flex flex-col">
                  <div className="bg-white border-b border-slate-100 py-4 px-6 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-700">Activity Feed</h3>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="xs" className="text-[10px] h-7">Filter</Button>
                    </div>
                  </div>
                  <CardContent className="p-0 flex-1 overflow-y-auto">
                    <div className="relative p-6">
                      {/* Vertical line */}
                      <div className="absolute left-[39px] top-6 bottom-6 w-0.5 bg-slate-100" />

                      <div className="space-y-8">
                        {/* Merge and Filter Activities */}
                        {[
                          ...communications.filter(c => {
                            const type = c.type?.toLowerCase();
                            const excluded = ['website_visit', 'page_view', 'subscription', 'email_marketing', 'newsletter', 'form_submission'];
                            return !excluded.includes(type);
                          }).map(c => ({ type: 'comm', date: new Date(c.createdAt), data: c })),
                          ...appointments.map(a => ({ type: 'apt', date: new Date(a.startTime), data: a })),
                          ...actions.map(act => ({ type: 'task', date: new Date(act.createdAt), data: act })),
                          ...(record.metadata?.metaSubmissions?.map((s: any) => ({ type: 'meta', date: new Date(s.submittedAt), data: s })) || [])
                        ].sort((a, b) => b.date.getTime() - a.date.getTime()).map((item, idx) => (
                          <div key={idx} className="relative pl-12">
                            {/* Icon Circle */}
                            <div className="absolute left-[-2px] top-0 w-8 h-8 rounded-full border border-slate-100 bg-white shadow-sm flex items-center justify-center z-10">
                              {item.type === 'comm' && <MessageSquare className="w-3.5 h-3.5 text-blue-500" />}
                              {item.type === 'apt' && <Calendar className="w-3.5 h-3.5 text-emerald-500" />}
                              {item.type === 'task' && <CheckCircle className="w-3.5 h-3.5 text-amber-500" />}
                              {item.type === 'meta' && <Building className="w-3.5 h-3.5 text-indigo-500" />}
                            </div>

                            <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                  {item.type === 'comm' ? `Communication (${item.data.type})` :
                                    item.type === 'apt' ? 'Appointment' :
                                      item.type === 'task' ? 'Task' : 'Meta Form Submission'}
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium">{item.date.toLocaleString()}</span>
                              </div>

                              {item.type === 'comm' && (
                                <div className="space-y-1">
                                  <p className="text-xs font-bold text-slate-800">{item.data.notes}</p>
                                  <p className="text-[10px] text-slate-500">Log by: {item.data.salesperson?.firstName || 'System'}</p>
                                </div>
                              )}

                              {item.type === 'apt' && (
                                <div className="space-y-1">
                                  <p className="text-xs font-bold text-slate-800">Appointment: {item.data.serviceName}</p>
                                  <div className="flex gap-2">
                                    <Badge variant={getStatusColor(item.data.status)} size="xs" className="text-[8px]">{item.data.status}</Badge>
                                    <span className="text-[10px] text-slate-500">{item.data.clinicName}</span>
                                  </div>
                                </div>
                              )}

                              {item.type === 'task' && (
                                <div className="space-y-1">
                                  <p className="text-xs font-bold text-slate-800">{item.data.title}</p>
                                  <p className="text-[10px] text-slate-500">{item.data.description}</p>
                                  <Badge variant={getStatusColor(item.data.status)} size="xs" className="text-[8px]">{item.data.status}</Badge>
                                </div>
                              )}

                              {item.type === 'meta' && (
                                <div className="space-y-2">
                                  <p className="text-xs font-bold text-slate-800">Meta Form: {item.data.formName}</p>
                                  <div className="bg-slate-50 rounded-lg p-2 space-y-1">
                                    <p className="text-[10px] text-slate-600"><strong>Facebook Ad Name:</strong> {item.data.adName}</p>
                                    {Object.entries(item.data.fields || {}).map(([key, val]) => (
                                      <p key={key} className="text-[10px] text-slate-500"><strong>{key}:</strong> {String(val)}</p>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}

                        {/* If no activity */}
                        {[...communications, ...appointments, ...actions].length === 0 && (
                          <div className="text-center py-12">
                            <Activity className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                            <p className="text-xs text-slate-400 font-medium">No operational events recorded yet.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Appointments Tab */}
          <TabsContent value="appointments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Appointment History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {appointments.map((appointment) => (
                    <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <Calendar className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">{appointment.serviceName}</div>
                          <div className="text-sm text-gray-600">{appointment.clinicName}</div>
                          <div className="text-xs text-gray-500">
                            {formatDate(appointment.startTime)}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant={getStatusColor(appointment.status)}>
                          {appointment.status}
                        </Badge>
                        {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                          <Button
                            size="xs"
                            variant="primary"
                            onClick={() => handleCompleteAppointment(appointment.id)}
                            className="text-[10px] h-7 px-3 bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            Mark Completed
                          </Button>
                        )}
                        <div className="text-sm font-medium mt-1">
                          {formatCurrency(appointment.totalAmount)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Communications Tab */}
          <TabsContent value="communications" className="space-y-4">
            <CommunicationForm customerId={record.customerId} onSuccess={onUpdate} />
            <Card>
              <CardHeader>
                <CardTitle>Communication History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {communications.map((comm) => (
                    <div key={comm.id} className="flex items-start gap-4 p-4 border rounded-lg">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <MessageSquare className="h-5 w-5 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium capitalize">{comm.type}</span>
                          <Badge variant={getStatusColor(comm.status)} size="sm">
                            {comm.status}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {formatDate(comm.createdAt)}
                          </span>
                        </div>
                        {comm.subject && (
                          <div className="font-medium text-gray-900 mb-1">{comm.subject}</div>
                        )}
                        {comm.notes && (
                          <div className="text-gray-600">{comm.notes}</div>
                        )}
                        {comm.metadata && Object.keys(comm.metadata).length > 0 && (
                          <div className="mt-2 text-xs text-gray-500">
                            {Object.entries(comm.metadata).map(([key, value]) => (
                              <span key={key} className="mr-4">
                                {key}: {String(value)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tasks Tab (Replaces Actions) */}
          <TabsContent value="tasks" className="space-y-4">
            <ActionForm customerId={record.customerId} onSuccess={onUpdate} />
            <Card>
              <CardHeader>
                <CardTitle>Tasks List</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {actions.map((action) => (
                    <div key={action.id} className="flex items-start gap-4 p-4 border rounded-lg">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">{action.title}</span>
                          <Badge variant={getStatusColor(action.status)} size="sm">
                            {action.status}
                          </Badge>
                          <Badge variant={getPriorityColor(action.priority)} size="sm">
                            {action.priority}
                          </Badge>
                        </div>
                        {action.description && (
                          <div className="text-gray-600 mb-2">{action.description}</div>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Created: {formatDate(action.createdAt)}</span>
                          {action.dueDate && (
                            <span>Due: {formatDate(action.dueDate)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {actions.length === 0 && (
                    <div className="text-center py-6 text-slate-400 text-sm italic">No tasks assigned.</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Calls Tab */}
          <TabsContent value="calls" className="space-y-4">
            <Card className="border-none shadow-premium bg-white rounded-3xl overflow-hidden border border-slate-100">
              <div className="bg-slate-50/50 border-b border-slate-100 py-4 px-6 flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Phone Call Logs</h3>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search call notes..."
                    value={callSearchTerm}
                    onChange={(e) => setCallSearchTerm(e.target.value)}
                    className="pl-9 h-9 text-xs"
                  />
                </div>
              </div>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {communications
                    .filter(c => c.type === 'call')
                    .filter(c => !callSearchTerm || (c.notes || '').toLowerCase().includes(callSearchTerm.toLowerCase()))
                    .map((call) => (
                      <div key={call.id} className="group flex items-start gap-4 p-4 border border-slate-100 rounded-2xl hover:border-indigo-100 hover:bg-slate-50/50 transition-all duration-300">
                        <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center flex-shrink-0">
                          <PhoneCall className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                              {new Date(call.createdAt).toLocaleString()}
                            </span>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                                onClick={() => handleEditCall(call)}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                onClick={() => handleDeleteCommunication(call.id)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm font-bold text-slate-700 leading-relaxed">
                            {call.notes || <span className="text-slate-400 italic font-normal">No notes provided.</span>}
                          </p>
                          {call.salesperson && (
                            <div className="mt-2 flex items-center gap-1.5">
                              <div className="w-4 h-4 bg-slate-200 rounded-full flex items-center justify-center text-[8px] font-black text-slate-500">
                                {call.salesperson.firstName?.charAt(0)}
                              </div>
                              <span className="text-[10px] font-bold text-slate-500 capitalize">
                                Logged by {call.salesperson.firstName} {call.salesperson.lastName}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                  {communications.filter(c => c.type === 'call').length === 0 && (
                    <div className="text-center py-12">
                      <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <PhoneCall className="w-6 h-6 text-slate-200" />
                      </div>
                      <p className="text-sm font-bold text-slate-400">No phone calls logged yet.</p>
                      <p className="text-xs text-slate-300">Every call interaction recorded will appear here.</p>
                    </div>
                  )}

                  {communications.filter(c => c.type === 'call').length > 0 &&
                    communications.filter(c => c.type === 'call').filter(c => !callSearchTerm || (c.notes || '').toLowerCase().includes(callSearchTerm.toLowerCase())).length === 0 && (
                      <div className="text-center py-12">
                        <p className="text-sm font-bold text-slate-400">No calls found matching "{callSearchTerm}"</p>
                      </div>
                    )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>


        </Tabs>
      </div>

      <CRMBookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        customer={{
          id: record.customerId,
          name: `${record.customer?.firstName} ${record.customer?.lastName}`,
          email: record.customer?.email || '',
          phone: record.customer?.phone || ''
        }}
        onSuccess={() => {
          setIsBookingModalOpen(false);
          onUpdate?.();
        }}
      />

      {/* Diary Modal */}
      {showDiaryModal && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-gray-50 flex flex-col w-[95vw] h-[95vh] rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-white border-b border-gray-100 flex items-center justify-between px-6 py-4">
              <h3 className="font-black text-xl text-gray-900">Clinic Sales Diary</h3>
              <Button variant="ghost" className="hover:bg-red-50 text-gray-500 hover:text-red-500 rounded-xl" onClick={() => setShowDiaryModal(false)}>
                <X className="w-6 h-6" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <StaffDiary onNewAppointment={() => {
                setShowDiaryModal(false);
                setIsBookingModalOpen(true);
              }} />
            </div>
          </div>
        </div>
      )}

      {/* Phone Call Notes Modal */}
      {showPhoneCallModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-slate-200 p-6 space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-slate-400" /> {editingCallId ? "Edit Phone Call Notes" : "Add Phone Call Notes"}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => { setShowPhoneCallModal(false); setPhoneCallNotes(""); setEditingCallId(null); }} className="h-8 w-8 p-0">
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <Textarea
                placeholder="Write down important notes from the phone call..."
                value={phoneCallNotes}
                onChange={(e) => setPhoneCallNotes(e.target.value)}
                className="min-h-[120px] resize-none"
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setShowPhoneCallModal(false); setPhoneCallNotes(""); setEditingCallId(null); }}>Cancel</Button>
                <Button className="bg-slate-800 hover:bg-slate-900 text-white" onClick={handleSavePhoneCallNotes}>
                  {editingCallId ? "Update Notes" : "Save Notes"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Log Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-slate-200 p-6 space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" /> Log Sent Email
              </h3>
              <Button variant="ghost" size="sm" onClick={() => { setShowEmailModal(false); setEmailNotes(""); }} className="h-8 w-8 p-0">
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">Date Sent</label>
                <Input type="datetime-local" value={emailDate} onChange={(e) => setEmailDate(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">Email Content / Body</label>
                <Textarea
                  placeholder="Paste email content here..."
                  value={emailNotes}
                  onChange={(e) => setEmailNotes(e.target.value)}
                  className="min-h-[120px] resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => { setShowEmailModal(false); setEmailNotes(""); }}>Cancel</Button>
                <Button className="bg-slate-800 hover:bg-slate-900 text-white" onClick={handleSaveEmailLog}>Save Email Log</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
