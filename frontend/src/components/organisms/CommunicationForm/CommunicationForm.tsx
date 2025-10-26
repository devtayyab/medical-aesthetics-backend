import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Phone, Mail, MessageSquare, Calendar, AlertCircle, CheckCircle, Clock, User } from 'lucide-react';
import { Button } from '@/components/atoms/Button/Button';
import { Input } from '@/components/atoms/Input/Input';
import { Select } from '@/components/atoms/Select/Select';
import { Textarea } from '@/components/atoms/Textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/molecules/Card/Card';
import {
  logCommunication,
  validateCommunication,
  getRequiredFieldsForCall
} from '@/store/slices/crmSlice';
import type { RootState, AppDispatch } from '@/store';
import type { CommunicationLog } from '@/types';

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

  React.useEffect(() => {
    dispatch(getRequiredFieldsForCall());
  }, [dispatch]);

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
    await dispatch(validateCommunication({
      customerId,
      communicationData: formData
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await handleValidate();

    if (validationErrors.length === 0) {
      try {
        await dispatch(logCommunication(formData)).unwrap();
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

  const getCommunicationIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <Phone className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'sms':
        return <MessageSquare className="h-4 w-4" />;
      case 'meeting':
        return <Calendar className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'missed':
        return 'error';
      case 'pending':
        return 'warning';
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getCommunicationIcon(formData.type || 'call')}
          Log Communication
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Communication Type */}
          <div className="grid grid-cols-2 gap-4">
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
            />
          </div>

          {/* Status */}
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
          />

          {/* Subject */}
          <Input
            label="Subject"
            value={formData.subject || ''}
            onChange={(e) => handleInputChange('subject', e.target.value)}
            placeholder="Brief description of the communication"
          />

          {/* Duration (for calls) */}
          {formData.type === 'call' && (
            <Input
              label="Duration (seconds)"
              type="number"
              value={formData.durationSeconds || ''}
              onChange={(e) => handleInputChange('durationSeconds', parseInt(e.target.value))}
              placeholder="Call duration in seconds"
            />
          )}

          {/* Call-specific fields */}
          {formData.type === 'call' && (
            <>
              <h4 className="font-medium text-sm text-gray-700">Call Details (Required)</h4>
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Clinic"
                  value={formData.metadata?.clinic || ''}
                  onChange={(value) => handleInputChange('metadata.clinic', value)}
                  options={[
                    { value: 'clinic1', label: 'Downtown Clinic' },
                    { value: 'clinic2', label: 'Westside Clinic' },
                    { value: 'clinic3', label: 'Eastside Clinic' }
                  ]}
                  required={requiredFields?.clinic}
                  error={validationErrors.includes('clinic')}
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
                  required={requiredFields?.proposedTreatment}
                  error={validationErrors.includes('proposedTreatment')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Cost"
                  type="number"
                  value={formData.metadata?.cost || ''}
                  onChange={(e) => handleInputChange('metadata.cost', parseFloat(e.target.value))}
                  placeholder="0.00"
                  required={requiredFields?.cost}
                  error={validationErrors.find((error) => error === 'cost')}
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
                />
              </div>
            </>
          )}

          {/* Notes */}
          <Textarea
            label="Notes"
            value={formData.notes || ''}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Detailed notes about the communication..."
            rows={4}
            required={requiredFields?.notes}
          />

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
              Log Communication
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
