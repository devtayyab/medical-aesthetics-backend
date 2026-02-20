import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Clock, AlertCircle, CheckCircle } from 'lucide-react';
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
    actionType: prefilledData?.actionType || 'follow_up',
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

  React.useEffect(() => {
    dispatch(getRequiredFieldsForAction(formData.actionType));
  }, [dispatch, formData.actionType]);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch customers if no customerId is provided
        if (!propCustomerId) {
          const response = await userAPI.getAllUsers({ role: 'client' });
          const users = Array.isArray(response.data) ? response.data : response.data.users || [];
          const options = users.map((u: any) => ({
            value: u.id,
            label: `${u.firstName} ${u.lastName} (${u.email || 'No email'})`
          }));
          setCustomers(options);
        }

        // Fetch clinics - trying to use relative path if axios is configured with baseURL
        // In this project, axios is imported from 'axios' here, not restricted to the service
        // We'll use the relative path which should be handled by the proxy
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
          title: formData.title,
          description: formData.description,
          status: formData.status || 'pending',
          priority: formData.priority || 'medium',
          dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
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
          actionType: 'follow_up',
          title: '',
          description: '',
          status: 'pending',
          priority: 'medium',
          dueDate: '',
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
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Create Task/Action
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer Selection - only show if no customerId is provided */}
          {!propCustomerId && customers.length > 0 && (
            <Select
              label="Customer"
              value={customerId}
              onChange={(value) => handleInputChange('customerId', value)}
              options={customers}
              required
              placeholder="Select a customer..."
            />
          )}

          {/* Action Type and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Action Type"
              value={formData.actionType}
              onChange={(value) => handleInputChange('actionType', value)}
              options={[
                { value: 'phone_call', label: 'Phone Call' },
                { value: 'email', label: 'Email' },
                { value: 'meeting', label: 'Meeting' },
                { value: 'follow_up', label: 'Follow Up' },
                { value: 'appointment_confirmation', label: 'Appointment Confirmation' },
                { value: 'treatment_reminder', label: 'Treatment Reminder' }
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

          {/* Title */}
          <Input
            label="Title"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="Brief task title..."
            required
          />

          {/* Due Date */}
          <Input
            label="Due Date & Time"
            type="datetime-local"
            value={formData.dueDate}
            onChange={(e) => handleInputChange('dueDate', e.target.value)}
          />

          {/* Description */}
          <Textarea
            label="Description"
            value={formData.description || ''}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Detailed description of the task..."
            rows={3}
          />

          {/* Action-specific fields */}
          {formData.actionType === 'phone_call' && (
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
