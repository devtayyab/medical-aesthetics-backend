import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Clock, AlertCircle, CheckCircle, Search, User as UserIcon, X, Calendar, Euro } from 'lucide-react';
import { Button } from '@/components/atoms/Button/Button';
import { Input } from '@/components/atoms/Input/Input';
import { Select } from '@/components/atoms/Select/Select';
import { Textarea } from '@/components/atoms/Textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/molecules/Card/Card';
import {
  createAction,
  updateAction,
  validateAction,
  getRequiredFieldsForAction
} from '@/store/slices/crmSlice';
import type { AppDispatch, RootState } from '@/store';
import type { CrmAction } from '@/types';
import { userAPI, crmAPI } from '@/services/api';
import toast from 'react-hot-toast';
import { cn } from "@/lib/utils";

interface ActionFormProps {
  customerId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  prefilledData?: Partial<CrmAction>;
  hideHeader?: boolean;
}

export const ActionForm: React.FC<ActionFormProps> = ({
  customerId: propCustomerId,
  onSuccess,
  onCancel,
  prefilledData,
  hideHeader
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const [customers, setCustomers] = useState<{ value: string; label: string; type: 'customer' | 'lead'; email?: string }[]>([]);
  const [formData, setFormData] = useState<Partial<CrmAction>>({
    customerId: propCustomerId || prefilledData?.customerId || undefined,
    salespersonId: prefilledData?.salespersonId || user?.id || '',
    relatedLeadId: prefilledData?.relatedLeadId || undefined,
    actionType: prefilledData?.actionType || 'call',
    title: prefilledData?.title || '',
    description: prefilledData?.description || '',
    status: prefilledData?.status || 'pending',
    priority: prefilledData?.priority || 'medium',
    dueDate: prefilledData?.dueDate || '',
    reminderDate: prefilledData?.reminderDate || '',
    metadata: {
      ...(prefilledData?.metadata || {}),
      ...((prefilledData as any)?.metadata?.clinic && { clinic: (prefilledData as any).metadata.clinic }),
      ...((prefilledData as any)?.metadata?.proposedTreatment && { proposedTreatment: (prefilledData as any).metadata.proposedTreatment }),
      ...((prefilledData as any)?.metadata?.callOutcome && { callOutcome: (prefilledData as any).metadata.callOutcome }),
      ...((prefilledData as any)?.metadata?.cost && { cost: (prefilledData as any).metadata.cost })
    }
  });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [clinics, setClinics] = useState<{ value: string; label: string }[]>([]);
  const [salespersons, setSalespersons] = useState<{ value: string; label: string }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [selectedCustomerLabel, setSelectedCustomerLabel] = useState('');
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  React.useEffect(() => {
    dispatch(getRequiredFieldsForAction(formData.actionType));
  }, [dispatch, formData.actionType]);

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const searchContacts = async () => {
      if (!searchTerm.trim() || propCustomerId) return;
      setIsLoading(true);
      try {
        const [customerResponse, leadsResponse] = await Promise.all([
          userAPI.getAllUsers({ role: 'client', search: searchTerm, limit: 20 }).catch(() => ({ data: { users: [] } })),
          crmAPI.getLeads({ search: searchTerm }).catch(() => ({ data: [] }))
        ]);

        const customersData = Array.isArray(customerResponse.data) ? customerResponse.data : customerResponse.data.users || [];
        const leadsData = leadsResponse.data || [];

        const options = [
          ...customersData.map((u: any) => ({
            value: u.id,
            type: 'customer' as const,
            email: u.email,
            label: `${u.email || 'No email'} (${u.firstName} ${u.lastName})`
          })),
          ...leadsData.map((l: any) => ({
            value: l.id,
            type: 'lead' as const,
            email: l.email,
            label: `${l.email || 'No email'} (${l.firstName} ${l.lastName}) - LEAD`
          }))
        ];
        setCustomers(options);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      if (searchTerm.length > 1) {
        searchContacts();
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, propCustomerId]);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const targetId = propCustomerId || prefilledData?.relatedLeadId;
        
        const [clinicRes, salesRes, custRes, leadRes] = await Promise.all([
          crmAPI.getAccessibleClinics().catch(() => ({ data: [] })),
          userAPI.getAllUsers({ role: 'salesperson', limit: 100 }).catch(() => ({ data: { users: [] } })),
          userAPI.getAllUsers({ role: 'client', limit: 50 }).catch(() => ({ data: { users: [] } })),
          crmAPI.getLeads().catch(() => ({ data: [] }))
        ]);

        const clinicOptions = (clinicRes.data || []).map((c: any) => ({ value: c.id, label: c.name }));
        setClinics(clinicOptions);

        const salesData = Array.isArray(salesRes.data) ? salesRes.data : salesRes.data.users || [];
        const salesOptions = salesData.map((s: any) => ({ value: s.id, label: `${s.firstName} ${s.lastName}`, role: s.role }));
        setSalespersons(salesOptions);

        const customersData = Array.isArray(custRes.data) ? custRes.data : custRes.data.users || [];
        const leadsData = leadRes.data || [];

        const options = [
          ...customersData.map((u: any) => ({
            value: u.id,
            type: 'customer' as const,
            email: u.email,
            label: `${u.email || 'No email'} (${u.firstName} ${u.lastName})`
          })),
          ...leadsData.map((l: any) => ({
            value: l.id,
            type: 'lead' as const,
            email: l.email,
            label: `${l.email || 'No email'} (${l.firstName} ${l.lastName}) - LEAD`
          }))
        ];
        setCustomers(options);

        if (targetId) {
          const matched = options.find((o: any) => o.value === targetId);
          if (matched) {
            const displayLabel = matched.email || matched.label;
            setSelectedCustomerLabel(displayLabel);
            setSearchTerm(displayLabel);
          } else {
            try {
              const res = await crmAPI.getCustomerRecord(targetId);
              if (res.data?.record?.customer) {
                const c = res.data.record.customer;
                const display = c.email || `${c.firstName} ${c.lastName}`;
                setSelectedCustomerLabel(display);
                setSearchTerm(display);
              }
            } catch (err) {
              console.error("Failed to fetch specific target details:", err);
            }
          }
        }
      } catch (e) {
        console.error('ActionForm initialization failed:', e);
      }
    };
    fetchData();
  }, [propCustomerId, prefilledData?.relatedLeadId, prefilledData?.customerId]);

  const handleInputChange = (field: string, value: any) => {
    if (field === 'customerId') {
      setFormData(prev => ({ ...prev, customerId: value, relatedLeadId: undefined }));
    } else if (field === 'relatedLeadId') {
      setFormData(prev => ({ ...prev, relatedLeadId: value, customerId: undefined }));
    } else if (field.startsWith('metadata.')) {
      const metadataField = field.replace('metadata.', '');
      setFormData(prev => ({
        ...prev,
        metadata: {
          ...prev.metadata,
          [metadataField]: value
        }
      }));
    } else if (field === 'reminderDate') {
      setFormData(prev => {
        const newReminder = value;
        const currentDue = prev.dueDate;
        // Automatically sync due date if it's empty or earlier than the new reminder
        if (!currentDue || new Date(currentDue) < new Date(newReminder)) {
          return { ...prev, reminderDate: value, dueDate: value };
        }
        return { ...prev, reminderDate: value };
      });
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }

    if (validationErrors.includes(field.replace('metadata.', ''))) {
      setValidationErrors(prev => prev.filter(err => err !== field.replace('metadata.', '')));
    }
  };

  const handleValidate = async () => {
    try {
      const result = await dispatch(validateAction({
        customerId: formData.customerId || formData.relatedLeadId || '',
        actionData: formData
      })).unwrap();
      setValidationErrors(result.missingFields || []);
      setValidationWarnings(result.warnings || []);
      return result;
    } catch (e) {
      console.error("handleValidate error", e);
      return { isValid: true, missingFields: [], warnings: [] };
    }
  };

  const handleValidateClick = async () => {
    const result = await handleValidate();
    if (result.isValid) {
      if (result.warnings && result.warnings.length > 0) {
        toast.success("Validation passed, but look at the suggestions below.");
      } else {
        toast.success("Validation successful! Form is complete.");
        onSuccess?.();
      }
    } else {
      toast.error("Validation failed. Please fill all required fields.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.reminderDate) {
      toast.error("Task validation failed: Reminder Date & Time is mandatory.");
      return;
    }

    const reminderDateObj = new Date(formData.reminderDate);
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 1);

    if (reminderDateObj > maxDate) {
      toast.error("Task validation failed: Reminder cannot be set more than 1 year in the future.");
      return;
    }

    const now = new Date();
    if (reminderDateObj < new Date(now.getTime() - 60000)) {
      toast.error("Task validation failed: Reminder cannot be set in the past.");
      return;
    }

    let validation;
    try {
      validation = await handleValidate();
    } catch (e) {
      console.error("Validation failed:", e);
      validation = { isValid: true, missingFields: [], warnings: [] };
    }

    if (validation.isValid) {
      try {
        const payload: Partial<CrmAction> = {
          customerId: formData.customerId || undefined,
          relatedLeadId: formData.relatedLeadId || undefined,
          salespersonId: formData.salespersonId || user?.id || '',
          actionType: formData.actionType,
          therapy: (formData as any).therapy,
          title: formData.title,
          description: formData.description,
          status: formData.status || 'pending',
          priority: formData.priority || 'medium',
          dueDate: formData.dueDate,
          reminderDate: formData.reminderDate,
          isRecurring: formData.isRecurring || false,
          recurrenceType: formData.recurrenceType,
          recurrenceInterval: formData.recurrenceInterval,
          metadata: formData.metadata || {}
        };

        Object.keys(payload).forEach(key => {
          const val = payload[key as keyof CrmAction];
          if (val === undefined || val === null || val === '') {
            delete payload[key as keyof CrmAction];
          }
        });

        if (prefilledData?.id) {
          await dispatch(updateAction({ id: prefilledData.id, updates: payload })).unwrap();
        } else {
          await dispatch(createAction(payload)).unwrap();
        }

        setFormData({
          customerId: propCustomerId || undefined,
          relatedLeadId: undefined,
          therapy: '',
          title: '',
          description: '',
          status: 'pending',
          priority: 'medium',
          dueDate: '',
          reminderDate: '',
          isRecurring: false,
          salespersonId: prefilledData?.salespersonId || '',
          metadata: {}
        });
        setValidationErrors([]);
        setValidationWarnings([]);
        toast.success(prefilledData?.id ? 'Task updated successfully!' : 'Task created successfully!');
        onSuccess?.();
      } catch (error: any) {
        console.error(`Failed to ${prefilledData?.id ? 'update' : 'create'} action:`, error);
        toast.error(error?.response?.data?.message || 'Failed to save task. Please check your data.');
      }
    } else {
      toast.error("Please resolve validation errors before saving.");
    }
  };


  return (
    <Card className={hideHeader ? 'border-none shadow-none' : ''}>
      {!hideHeader && (
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-6">
          <div>
            <CardTitle className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              {prefilledData?.id ? 'Modify Task Details' : 'Program New Task'}
            </CardTitle>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">
              {prefilledData?.id ? 'Update Strategy' : 'Operation Workflow'}
            </p>
          </div>
        </CardHeader>
      )}
      <CardContent className={hideHeader ? 'p-0' : 'pt-8'}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            <span className="text-sm font-bold text-slate-700">Create Task/Action</span>
          </div>
          <div className="relative" ref={searchRef}>
            <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2 block">Associated Contact</label>
            <div className="relative group">
              <Input
                value={(formData.customerId || formData.relatedLeadId) ? (selectedCustomerLabel || searchTerm) : searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowResults(true);
                }}
                onFocus={() => {
                  if (!(propCustomerId || prefilledData?.relatedLeadId)) setShowResults(true);
                }}
                placeholder={(formData.customerId || formData.relatedLeadId) ? (selectedCustomerLabel || "Loading contact...") : "Search by Client ID or Name..."}
                disabled={Boolean(formData.customerId || formData.relatedLeadId)}
                className={cn(
                  "pl-11 h-12 bg-slate-50 border-slate-200 rounded-xl focus:bg-white transition-all font-medium",
                  (Boolean(propCustomerId || prefilledData?.relatedLeadId)) && "bg-slate-50 border-slate-100 text-slate-500"
                )}
                leftIcon={<Search className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />}
              />
              {!formData.customerId && !formData.relatedLeadId && searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setShowResults(false);
                    setFormData(prev => ({ ...prev, customerId: undefined, relatedLeadId: undefined }));
                    setSelectedCustomerLabel('');
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full"
                >
                  <X className="w-3 h-3 text-slate-400" />
                </button>
              )}
            </div>

            {showResults && !formData.customerId && !formData.relatedLeadId && searchTerm.length > 0 && (
              <div className="absolute z-[100] left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 max-h-[300px] overflow-y-auto">
                {isLoading && (
                  <div className="p-4 text-center text-slate-400">
                    <div className="animate-spin h-5 w-5 border-b-2 border-blue-500 rounded-full mx-auto"></div>
                  </div>
                )}
                {customers.map(c => (
                  <button
                    key={`${c.type}-${c.value}`}
                    type="button"
                    onClick={() => {
                      if (c.type === 'customer') {
                        handleInputChange('customerId', c.value);
                      } else {
                        handleInputChange('relatedLeadId', c.value);
                      }
                      const displayValue = c.email || c.label;
                      setSearchTerm(displayValue);
                      setSelectedCustomerLabel(displayValue);
                      setShowResults(false);
                    }}
                    className="w-full text-left px-5 py-4 hover:bg-blue-50 transition-colors border-b border-slate-50 last:border-none flex items-center gap-4 group"
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-all">
                      <UserIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-black text-slate-800">{c.label}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">ID: {c.value}</div>
                    </div>
                  </button>
                ))}
                {customers.length === 0 && !isLoading && (
                  <div className="p-8 text-center text-slate-400 italic text-sm">No clients found matching your search.</div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Select
              label="Task Type (Required)"
              value={formData.actionType}
              onChange={(value) => handleInputChange('actionType', value)}
              required
              options={[
                { value: 'call', label: 'Call' },
                { value: 'mobile_message', label: 'Mobile Message (SMS/Viber/WhatsApp)' },
                { value: 'follow_up_call', label: 'Follow up Call' },
                { value: 'email', label: 'Email' },
                { value: 'appointment', label: 'Appointment (Calendar Link)' },
                { value: 'confirmation_call_reminder', label: 'Confirmation Call Reminder' },
                { value: 'satisfaction_check', label: 'Satisfaction Check' },
                { value: 'complaint', label: 'Complaint Handling' }
              ]}
            />

            <Select
              label="Status"
              value={formData.status}
              onChange={(value) => handleInputChange('status', value)}
              options={[
                { value: 'pending', label: 'Pending' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'completed', label: 'Completed' },
                { value: 'cancelled', label: 'Cancelled' },
                { value: 'missed', label: 'Missed' }
              ]}
            />

            <Select
              label="Priority"
              value={formData.priority}
              onChange={(value) => handleInputChange('priority', value)}
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
                { value: 'urgent', label: 'Urgent' }
              ]}
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            {(user?.role === 'admin' || user?.role === 'SUPER_ADMIN' || user?.role === 'manager' || user?.role === 'clinic_owner') ? (
              <Select
                label="Salesperson (Required)"
                value={formData.salespersonId || user?.id || ''}
                onChange={(value) => handleInputChange('salespersonId', value)}
                options={salespersons}
                required
              />
            ) : (
                <div className="flex flex-col">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2 block">Owner</label>
                  <div className="h-10 px-4 bg-slate-100 border border-slate-200 rounded-xl flex items-center text-sm font-bold text-slate-600">
                    {user?.firstName} {user?.lastName} (Self)
                  </div>
                </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Task Title (Required)"
              value={formData.title || ''}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="e.g. Call client for confirmation"
              required
            />
            <Input
              label="Due Date & Time (Required)"
              type="datetime-local"
              value={formData.dueDate || ''}
              onChange={(e) => handleInputChange('dueDate', e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <Input
              label="Reminder Date & Time (Mandatory)"
              type="datetime-local"
              value={formData.reminderDate || ''}
              onChange={(e) => handleInputChange('reminderDate', e.target.value)}
              required
              max={new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().slice(0, 16)}
            />
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                id="isRecurring"
                checked={formData.isRecurring || false}
                onChange={(e) => handleInputChange('isRecurring', e.target.checked)}
                className="h-4 w-4"
              />
              <label htmlFor="isRecurring" className="text-sm font-bold text-slate-700">Set to Repeat (Recurring)</label>
            </div>
            {formData.isRecurring && (
              <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                <Select
                  label="Recurrence Frequency"
                  value={formData.recurrenceType || 'weekly'}
                  onChange={(val) => handleInputChange('recurrenceType', val)}
                  options={[
                    { value: 'daily', label: 'Daily' },
                    { value: 'weekly', label: 'Weekly' },
                    { value: 'monthly', label: 'Monthly' }
                  ]}
                />
                <Input
                  label="Interval"
                  type="number"
                  value={formData.recurrenceInterval || 1}
                  onChange={(e) => handleInputChange('recurrenceInterval', e.target.value === '' ? 1 : parseInt(e.target.value))}
                />
              </div>
            )}
          </div>

          <Textarea
            label="Description"
            value={formData.description || ''}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Detailed description of the task..."
            rows={3}
          />

          {formData.actionType === 'email' && (
            <div className="mb-4 animate-in slide-in-from-top-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2 block">Email Body Content (Copied from platform)</label>
              <Textarea
                value={formData.metadata?.emailBody || ''}
                onChange={(e) => handleInputChange('metadata.emailBody', e.target.value)}
                placeholder="Paste the email content here for logging..."
                rows={6}
                className="bg-indigo-50/30 border-indigo-100"
              />
            </div>
          )}

          {formData.actionType === 'mobile_message' && (
            <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 animate-in slide-in-from-top-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3 block">Service Platforms (Select at least one)</label>
              <div className="flex flex-wrap gap-6">
                {['SMS', 'Viber', 'WhatsApp'].map((platform) => (
                  <label key={platform} className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={formData.metadata?.platforms?.includes(platform.toLowerCase())}
                        onChange={(e) => {
                          const currentPlatforms = formData.metadata?.platforms || [];
                          const platLower = platform.toLowerCase();
                          const newPlatforms = e.target.checked
                            ? [...currentPlatforms, platLower]
                            : currentPlatforms.filter((p: string) => p !== platLower);
                          handleInputChange('metadata.platforms', newPlatforms);
                        }}
                        className="peer h-5 w-5 appearance-none rounded-md border-2 border-slate-300 checked:border-blue-600 checked:bg-blue-600 transition-all cursor-pointer"
                      />
                      <CheckCircle className="absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
                    </div>
                    <span className="text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{platform}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {formData.actionType === 'appointment' && (
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 animate-in zoom-in-95 fill-mode-both mb-4">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Calendar className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-black text-emerald-800 uppercase tracking-tight">Booking Coordination</h4>
                  <p className="text-xs text-emerald-600 mt-1 font-medium leading-relaxed">
                    This task is for your own record. To secure an actual slot on the main calendar, please use the <strong>Calendar Module</strong>.
                  </p>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="xs" 
                    className="mt-3 bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  >
                    Go to Calendar
                  </Button>
                </div>
              </div>
            </div>
          )}
          {(formData.actionType === 'call' || formData.actionType === 'follow_up_call' || formData.actionType === 'confirmation_call_reminder') && (
            <>
              <h4 className="font-medium text-sm text-gray-700 mt-2">Call Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Proposed Treatment Category"
                  value={formData.metadata?.proposedTreatment || ''}
                  onChange={(value) => handleInputChange('metadata.proposedTreatment', value)}
                  options={[
                    { value: 'botox', label: 'Botox' },
                    { value: 'fillers', label: 'Dermal Fillers' },
                    { value: 'laser', label: 'Laser Treatment' },
                    { value: 'peels', label: 'Chemical Peels' },
                    { value: 'consultation', label: 'Consultation' }
                  ]}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Cost"
                  type="number"
                  value={formData.metadata?.cost || ''}
                  onChange={(e) => handleInputChange('metadata.cost', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                  placeholder="0.00"
                  leftIcon={<Euro className="w-4 h-4 text-slate-400" />}
                />

                <Select
                  label="Call Outcome"
                  value={formData.metadata?.callOutcome || ''}
                  onChange={(value) => handleInputChange('metadata.callOutcome', value)}
                  options={[
                    { value: 'interested', label: 'Interested' },
                    { value: 'not_interested', label: 'Not Interested' },
                    { value: 'callback', label: 'Call Back' },
                    { value: 'booked', label: 'Booked Appointment' },
                    { value: 'no_answer', label: 'No Answer' },
                    { value: 'wrong_number', label: 'Wrong Number' }
                  ]}
                />
              </div>
            </>
          )}

          {validationErrors.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Missing Required Fields:</span>
              </div>
              <ul className="mt-2 text-sm text-red-700 space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index} className="flex items-center gap-2 italic">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    {error.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {validationWarnings.length > 0 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-center gap-2 text-yellow-800">
                <Clock className="h-4 w-4" />
                <span className="font-medium">Suggestions:</span>
              </div>
              <ul className="mt-2 text-sm text-yellow-700 space-y-1">
                {validationWarnings.map((warning, index) => (
                  <li key={index} className="flex items-center gap-2 italic">
                    <Clock className="h-3 w-3 shrink-0" />
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
            )}
            {formData.actionType === 'appointment' && (
              <Button
                type="button"
                variant="outline"
                className="flex-[1.5] bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 font-black flex items-center justify-center gap-2"
                onClick={() => navigate('/crm/calendar')}
              >
                <Calendar className="h-4 w-4" />
                Open Sales Plan
              </Button>
            )}
            <Button 
              type="submit" 
              variant="primary" 
              className="flex-1"
              disabled={!formData.reminderDate || !formData.title || !formData.actionType || !formData.dueDate || (!formData.customerId && !formData.relatedLeadId)}
              title={!formData.reminderDate ? "Reminder Date & Time is mandatory" : "Please fill all required fields"}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {prefilledData?.id ? 'Save Changes' : 'Create Task'}
            </Button>
            <Button type="button" variant="secondary" onClick={handleValidateClick}>
              Validate
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
