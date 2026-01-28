import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Phone, Mail, MessageSquare, AlertCircle, CheckCircle, Clock, User } from 'lucide-react';
import { Button } from '@/components/atoms/Button/Button';
import { Input } from '@/components/atoms/Input/Input';
import { Select } from '@/components/atoms/Select/Select';
import { Textarea } from '@/components/atoms/Textarea';
import {
  logCommunication,
  validateCommunication,
  getRequiredFieldsForCall
} from '@/store/slices/crmSlice';
import type { RootState, AppDispatch } from '@/store';
import type { CommunicationLog } from '@/types';
import axios from 'axios';

interface CommunicationFormProps {
  customerId: string;
  onSuccess?: () => void;
}

export const CommunicationForm: React.FC<CommunicationFormProps> = ({
  customerId,
  onSuccess
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { requiredFields, fieldValidation } = useSelector((state: RootState) => state.crm);
  const [formData, setFormData] = useState<Partial<CommunicationLog>>({
    customerId,
    type: 'call',
    direction: 'outgoing',
    status: 'completed',
    metadata: {}
  });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [clinics, setClinics] = useState<{ value: string; label: string }[]>([]);

  React.useEffect(() => {
    dispatch(getRequiredFieldsForCall());
  }, [dispatch]);

  const [startTime] = React.useState<number>(Date.now());

  React.useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get('/crm/accessible-clinics');
        const options = (data || []).map((c: any) => ({ value: c.id, label: c.name }));
        setClinics(options);
      } catch (e) {
        // fallback to empty list
        setClinics([]);
      }
    })();
  }, []);

  React.useEffect(() => {
    if (fieldValidation) {
      setValidationErrors(fieldValidation.missingFields);
      setValidationWarnings(fieldValidation.warnings);
    }
  }, [fieldValidation]);

  const handleInputChange = (field: string, value: any) => {
    if (field.startsWith('metadata.')) {
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
    const result = await dispatch(validateCommunication({
      customerId,
      communicationData: formData
    })).unwrap();
    setValidationErrors(result.missingFields || []);
    setValidationWarnings(result.warnings || []);
    return result;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // If call and no duration provided, auto-calculate from timer
    let payload = { ...formData };
    if (payload.type === 'call' && !payload.durationSeconds) {
      const secs = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
      payload = { ...payload, durationSeconds: secs };
      setFormData(payload);
    }

    const validation = await dispatch(validateCommunication({
      customerId,
      communicationData: payload
    })).unwrap();
    setValidationErrors(validation.missingFields || []);
    setValidationWarnings(validation.warnings || []);

    if (validation.isValid) {
      try {
        await dispatch(logCommunication(payload)).unwrap();
        setFormData({
          customerId,
          type: 'call',
          direction: 'outgoing',
          status: 'completed',
          metadata: {}
        });
        setValidationErrors([]);
        setValidationWarnings([]);
        onSuccess?.();
      } catch (error) {
        console.error('Failed to log communication:', error);
      }
    }
  };



  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Communication Core Details */}
      <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <User className="w-4 h-4 text-blue-500" />
          Interaction Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Type"
            value={formData.type}
            onChange={(value) => handleInputChange('type', value)}
            options={[
              { value: 'call', label: 'Phone Call' },
              { value: 'email', label: 'Email' },
              { value: 'sms', label: 'SMS' },
              { value: 'meeting', label: 'Meeting' },
              { value: 'note', label: 'Note' }
            ]}
            required
            className="bg-white"
          />

          <Select
            label="Direction"
            value={formData.direction}
            onChange={(value) => handleInputChange('direction', value)}
            options={[
              { value: 'incoming', label: 'Incoming' },
              { value: 'outgoing', label: 'Outgoing' }
            ]}
            required
            className="bg-white"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Status"
            value={formData.status}
            onChange={(value) => handleInputChange('status', value)}
            options={[
              { value: 'completed', label: 'Completed' },
              { value: 'missed', label: 'Missed' },
              { value: 'pending', label: 'Pending' }
            ]}
            required
            className="bg-white"
          />

          <Input
            label="Subject"
            value={formData.subject || ''}
            onChange={(e) => handleInputChange('subject', e.target.value)}
            placeholder="Brief description..."
            className="bg-white"
          />
        </div>
      </div>

      {/* Call Specifics */}
      {formData.type === 'call' && (
        <div className="bg-blue-50/30 p-4 rounded-xl border border-blue-100 space-y-4 animate-in fade-in slide-in-from-top-2">
          <h3 className="text-sm font-semibold text-blue-900 flex items-center gap-2">
            <Phone className="w-4 h-4 text-blue-500" />
            Call Specifics
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <Input
                label="Duration (sec)"
                type="number"
                value={formData.durationSeconds || ''}
                onChange={(e) => handleInputChange('durationSeconds', parseInt(e.target.value))}
                placeholder={Math.floor((Date.now() - startTime) / 1000).toString()}
                className="bg-white"
              />
              <p className="text-[10px] text-gray-500 mt-1 ml-1">
                *Auto-calculated if empty
              </p>
            </div>

            <div className="md:col-span-2">
              <Select
                label="Clinic"
                value={formData.metadata?.clinic || ''}
                onChange={(value) => handleInputChange('metadata.clinic', value)}
                options={clinics}
                required={requiredFields?.clinic}
                error={validationErrors.includes('clinic')}
                className="bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              required={requiredFields?.proposedTreatment}
              error={validationErrors.includes('proposedTreatment')}
              className="bg-white"
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
              required={requiredFields?.callOutcome}
              error={validationErrors.includes('callOutcome')}
              className="bg-white"
            />
          </div>

          <Input
            label="Estimated Cost"
            type="number"
            value={formData.metadata?.cost || ''}
            onChange={(e) => handleInputChange('metadata.cost', parseFloat(e.target.value))}
            placeholder="0.00"
            required={requiredFields?.cost}
            error={validationErrors.find((error) => error === 'cost')}
            className="bg-white"
            leftIcon={<span className="text-gray-500">$</span>}
          />
        </div>
      )}

      {/* Notes Section */}
      <div>
        <Textarea
          label="Notes & Observations"
          value={formData.notes || ''}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          placeholder="Detailed notes about the conversation..."
          rows={4}
          required={requiredFields?.notes}
          className="bg-white resize-none"
        />
      </div>

      {/* Validation Messages */}
      {validationErrors.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl animate-in zoom-in-95">
          <div className="flex items-center gap-2 text-red-800 font-medium mb-2">
            <AlertCircle className="h-4 w-4" />
            Missing Information
          </div>
          <ul className="text-sm text-red-700 space-y-1 pl-6 list-disc">
            {validationErrors.map((error, index) => (
              <li key={index} className="capitalize">{error.replace(/([A-Z])/g, ' $1')}</li>
            ))}
          </ul>
        </div>
      )}

      {validationWarnings.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-center gap-2 text-amber-800 font-medium mb-2">
            <Clock className="h-4 w-4" />
            Suggestions
          </div>
          <ul className="text-sm text-amber-700 space-y-1 pl-6 list-disc">
            {validationWarnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
        <Button
          type="button"
          variant="ghost"
          onClick={handleValidate}
          className="text-gray-600 hover:text-gray-900"
        >
          Validate Only
        </Button>
        <Button type="submit" variant="primary" className="pl-4 pr-6">
          <CheckCircle className="h-4 w-4 mr-2" />
          Save Communication
        </Button>
      </div>
    </form>
  );
};
