import React, { useState, useRef, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Clock, AlertCircle, CheckCircle, Search, User as UserIcon, X } from 'lucide-react';
import { Button } from '@/components/atoms/Button/Button';
import { Input } from '@/components/atoms/Input/Input';
import { Select } from '@/components/atoms/Select/Select';
import { Textarea } from '@/components/atoms/Textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/molecules/Card/Card';
import {
  createAction,
  validateAction,
  getRequiredFieldsForAction
} from '@/store/slices/crmSlice';
import type { AppDispatch } from '@/store';
import type { CrmAction } from '@/types';
import { userAPI, crmAPI } from '@/services/api';

interface ActionFormProps {
  customerId: string;
  onSuccess?: () => void;
  prefilledData?: Partial<CrmAction>;
}

export const ActionForm: React.FC<ActionFormProps> = ({
  customerId: propCustomerId,
  onSuccess,
  prefilledData
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const [customerId, setCustomerId] = useState(propCustomerId);
  const [customers, setCustomers] = useState<{ value: string; label: string }[]>([]);
  const [formData, setFormData] = useState<Partial<CrmAction>>({
    customerId: propCustomerId,
    actionType: prefilledData?.actionType || 'call',
    title: prefilledData?.title || '',
    description: prefilledData?.description || '',
    status: prefilledData?.status || 'pending',
    priority: prefilledData?.priority || 'medium',
    dueDate: prefilledData?.dueDate || '',
    salespersonId: prefilledData?.salespersonId || undefined,
    metadata: {
      ...(prefilledData?.metadata || {}),
      // Initialize metadata fields from prefilledData if they exist in metadata
      ...((prefilledData as any)?.metadata?.clinic && { clinic: (prefilledData as any).metadata.clinic }),
      ...((prefilledData as any)?.metadata?.proposedTreatment && { proposedTreatment: (prefilledData as any).metadata.proposedTreatment }),
      ...((prefilledData as any)?.metadata?.callOutcome && { callOutcome: (prefilledData as any).metadata.callOutcome }),
      ...((prefilledData as any)?.metadata?.cost && { cost: (prefilledData as any).metadata.cost })
    }
  });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [clinics, setClinics] = useState<{ value: string; label: string }[]>([]);
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

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await userAPI.getAllUsers({ role: 'client' });
        const users = Array.isArray(response.data) ? response.data : response.data.users || [];
        const options = users.map((u: any) => ({
          value: u.id,
          label: `${u.firstName} ${u.lastName} (${u.email || 'No email'})`
        }));
        setCustomers(options);

        // If we have a propCustomerId, set the initial label
        if (propCustomerId) {
          const matched = options.find((o: any) => o.value === propCustomerId);
          if (matched) setSelectedCustomerLabel(matched.label);
        }

        // Fetch clinics
        const { data: clinicData } = await crmAPI.getAccessibleClinics();
        const clinicOptions = (clinicData || []).map((c: any) => ({ value: c.id, label: c.name }));
        setClinics(clinicOptions);
      } catch (e) {
        console.error('ActionForm initialization failed:', e);
        setCustomers([]);
        setClinics([]);
      }
    };
    fetchData();
  }, [propCustomerId]);

  const handleInputChange = (field: string, value: any) => {
    if (field === 'customerId') {
      setCustomerId(value);
      setFormData(prev => ({ ...prev, customerId: value }));
    } else if (field.startsWith('metadata.')) {
      const metadataField = field.replace('metadata.', '');
      setFormData(prev => ({
        ...prev,
        metadata: {
          ...prev.metadata,
          [metadataField]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }

    // Clear validation errors when user starts typing
    if (validationErrors.includes(field.replace('metadata.', ''))) {
      setValidationErrors(prev => prev.filter(err => err !== field.replace('metadata.', '')));
    }
  };

  const handleValidate = async () => {
    const result = await dispatch(validateAction({
      customerId,
      actionData: formData
    })).unwrap();
    setValidationErrors(result.missingFields || []);
    setValidationWarnings(result.warnings || []);
    return result;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = await handleValidate();

    if (validation.isValid) {
      try {
        // Prepare payload according to backend entity structure
        const payload: Partial<CrmAction> = {
          customerId: customerId || propCustomerId || undefined,
          salespersonId: formData.salespersonId || prefilledData?.salespersonId || undefined,
          actionType: formData.actionType,
          therapy: formData.therapy,
          title: formData.title,
          description: formData.description,
          status: formData.status || 'pending',
          priority: formData.priority || 'medium',
          dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
          reminderDate: formData.reminderDate ? new Date(formData.reminderDate).toISOString() : undefined,
          isRecurring: formData.isRecurring || false,
          recurrenceType: formData.recurrenceType,
          recurrenceInterval: formData.recurrenceInterval,
          metadata: formData.metadata || {}
        };

        // Remove undefined values to prevent SQL errors
        Object.keys(payload).forEach(key => {
          if (payload[key as keyof CrmAction] === undefined) {
            delete payload[key as keyof CrmAction];
          }
        });

        await dispatch(createAction(payload)).unwrap();
        setFormData({
          customerId: customerId || propCustomerId,
          actionType: 'call',
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
        onSuccess?.();
      } catch (error) {
        console.error('Failed to create action:', error);
      }
    }
  };


  return (
    <Card>
      <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-6">
        <div>
          <CardTitle className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            Program New Task
          </CardTitle>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Operation Workflow</p>
        </div>
      </CardHeader>
      <CardContent className="pt-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            <span className="text-sm font-bold text-slate-700">Create Task/Action</span>
          </div>
          {/* Searchable Customer Selection */}
          <div className="relative" ref={searchRef}>
            <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2 block">Associated Contact</label>
            <div className="relative group">
              <Input
                value={propCustomerId ? selectedCustomerLabel : searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowResults(true);
                }}
                onFocus={() => !propCustomerId && setShowResults(true)}
                placeholder={propCustomerId ? selectedCustomerLabel : "Search by Client ID or Name..."}
                disabled={!!propCustomerId}
                className="pl-11 h-12 bg-slate-50 border-slate-200 rounded-xl focus:bg-white transition-all font-medium"
                leftIcon={<Search className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />}
              />
              {!propCustomerId && searchTerm && (
                <button
                  type="button"
                  onClick={() => { setSearchTerm(''); setShowResults(false); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full"
                >
                  <X className="w-3 h-3 text-slate-400" />
                </button>
              )}
            </div>

            {/* Floating Search Results */}
            {showResults && !propCustomerId && searchTerm.length > 0 && (
              <div className="absolute z-[100] left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 max-h-[300px] overflow-y-auto">
                {customers
                  .filter(c =>
                    c.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    c.value.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map(c => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => {
                        handleInputChange('customerId', c.value);
                        setSearchTerm(c.label);
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
                {customers.filter(c =>
                  c.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  c.value.toLowerCase().includes(searchTerm.toLowerCase())
                ).length === 0 && (
                    <div className="p-8 text-center text-slate-400 italic text-sm">No clients found matching your search.</div>
                  )}
              </div>
            )}
          </div>

          {/* Action Type and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Task Type"
              value={formData.actionType}
              onChange={(value) => handleInputChange('actionType', value)}
              options={[
                { value: 'call', label: 'Call' },
                { value: 'mobile_message', label: 'Mobile Message (SMS/Viber/WhatsApp)' },
                { value: 'follow_up_call', label: 'Follow up Call' },
                { value: 'email', label: 'Email' },
                { value: 'appointment', label: 'Appointment' },
                { value: 'confirmation_call_reminder', label: 'Confirmation Call Reminder' }
              ]}
              required
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
              required
            />
          </div>

          {/* Title and Therapy */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Task Title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="e.g. Call client for confirmation"
              required
            />
            <Input
              label="Therapy Associated"
              value={formData.therapy}
              onChange={(e) => handleInputChange('therapy', e.target.value)}
              placeholder="e.g. Botox Treatment"
            />
          </div>

          {/* Due Date and Reminder Date */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Due Date & Time"
              type="datetime-local"
              value={formData.dueDate}
              onChange={(e) => handleInputChange('dueDate', e.target.value)}
              required
            />
            <Input
              label="Reminder Date & Time"
              type="datetime-local"
              value={formData.reminderDate || ''}
              onChange={(e) => handleInputChange('reminderDate', e.target.value)}
              required
            />
          </div>

          {/* Recurring Options */}
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
                  onChange={(e) => handleInputChange('recurrenceInterval', parseInt(e.target.value))}
                />
              </div>
            )}
          </div>

          {/* Description */}
          <Textarea
            label="Description"
            value={formData.description || ''}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Detailed description of the task..."
            rows={3}
          />

          {/* Action-specific fields */}
          {(formData.actionType === 'call' || formData.actionType === 'follow_up_call' || formData.actionType === 'confirmation_call_reminder') && (
            <>
              <h4 className="font-medium text-sm text-gray-700">Call Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Clinic"
                  value={formData.metadata?.clinic || ''}
                  onChange={(value) => handleInputChange('metadata.clinic', value)}
                  options={clinics}
                />

                <Select
                  label="Proposed Treatment"
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
                  onChange={(e) => handleInputChange('metadata.cost', parseFloat(e.target.value))}
                  placeholder="0.00"
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

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Missing Required Fields:</span>
              </div>
              <ul className="mt-2 text-sm text-red-700">
                {validationErrors.map((error, index) => (
                  <li key={index}>• {error.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Validation Warnings */}
          {validationWarnings.length > 0 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-center gap-2 text-yellow-800">
                <Clock className="h-4 w-4" />
                <span className="font-medium">Suggestions:</span>
              </div>
              <ul className="mt-2 text-sm text-yellow-700">
                {validationWarnings.map((warning, index) => (
                  <li key={index}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button type="submit" variant="primary">
              <CheckCircle className="h-4 w-4 mr-2" />
              Create Task
            </Button>
            <Button type="button" variant="secondary" onClick={handleValidate}>
              Validate
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
