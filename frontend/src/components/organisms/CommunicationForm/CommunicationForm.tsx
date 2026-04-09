import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Phone, AlertCircle, CheckCircle, Clock, User } from 'lucide-react';
import { Button } from '@/components/atoms/Button/Button';
import { Input } from '@/components/atoms/Input/Input';
import { Select } from '@/components/atoms/Select/Select';
import { Textarea } from '@/components/atoms/Textarea';
import {
  logCommunication,
  updateCommunication,
  validateCommunication,
  getRequiredFieldsForCall
} from '@/store/slices/crmSlice';
import type { RootState, AppDispatch } from '@/store';
import type { CommunicationLog } from '@/types';
import { crmAPI, userAPI, bookingAPI } from '@/services/api';
import { Calendar, List, FilePlus, CalendarPlus } from 'lucide-react';

interface CommunicationFormProps {
  customerId: string;
  initialData?: CommunicationLog;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const CommunicationForm: React.FC<CommunicationFormProps> = ({
  customerId,
  initialData,
  onSuccess,
  onCancel
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { requiredFields, fieldValidation } = useSelector((state: RootState) => state.crm);
  const [formData, setFormData] = useState<Partial<CommunicationLog>>(initialData || {
    customerId,
    type: 'call',
    direction: 'outgoing',
    status: 'completed',
    metadata: {},
    salespersonId: (user as any)?.id || undefined
  });

  // Post-log action states
  const [createFollowUpTask, setCreateFollowUpTask] = useState(false);
  const [taskData, setTaskData] = useState({
    subject: '',
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Default to tomorrow
    priority: 'medium'
  });

  const [scheduleAppointment, setScheduleAppointment] = useState(false);
  const [appointmentData, setAppointmentData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    serviceId: '',
    clinicId: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [clinics, setClinics] = useState<{ value: string; label: string }[]>([]);
  const [salespersons, setSalespersons] = useState<{ value: string; label: string }[]>([]);

  React.useEffect(() => {
    dispatch(getRequiredFieldsForCall());
  }, [dispatch]);

  const [startTime] = React.useState<number>(Date.now());

  React.useEffect(() => {
    (async () => {
      try {
        const [clinicRes, salesRes] = await Promise.all([
          crmAPI.getAccessibleClinics().catch(() => ({ data: [] })),
          userAPI.getAllUsers({ role: 'salesperson', limit: 100 }).catch(() => ({ data: { users: [] } }))
        ]);

        const clinicOptions = (clinicRes.data || []).map((c: any) => ({ value: c.id, label: c.name }));
        setClinics(clinicOptions);

        const salesData = Array.isArray(salesRes.data) ? salesRes.data : salesRes.data.users || [];
        const salesOptions = salesData.map((s: any) => ({ value: s.id, label: `${s.firstName} ${s.lastName}` }));
        setSalespersons(salesOptions);
      } catch (e) {
        setClinics([]);
        setSalespersons([]);
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
      setIsSubmitting(true);
      try {
        if (initialData?.id) {
          await dispatch(updateCommunication({ id: initialData.id, updates: payload })).unwrap();
        } else {
          await dispatch(logCommunication(payload)).unwrap();
          
          // Handle post-log actions only for new communications
          const actions: Promise<any>[] = [];
          
          if (createFollowUpTask) {
            actions.push(crmAPI.createAction({
              customerId,
              actionType: 'follow_up_call',
              title: taskData.subject || `Follow up: ${payload.subject || 'Interaction'}`,
              description: `Automated follow-up task from communication log.`,
              dueDate: taskData.dueDate,
              priority: taskData.priority as any,
              status: 'pending',
              salespersonId: (user as any)?.id
            }));
          }
          
          if (scheduleAppointment && appointmentData.serviceId && appointmentData.clinicId) {
            const startStr = `${appointmentData.date}T${appointmentData.time}:00`;
            const startDate = new Date(startStr);
            const endDate = new Date(startDate.getTime() + 30 * 60000); // 30 min default
            
            actions.push(bookingAPI.createAppointment({
              clientId: customerId,
              clinicId: appointmentData.clinicId,
              serviceId: appointmentData.serviceId,
              startTime: startDate.toISOString(),
              endTime: endDate.toISOString(),
              status: 'PENDING',
              notes: `Scheduled during communication: ${payload.subject || 'No subject'}`
            }));
          }
          
          if (actions.length > 0) {
            await Promise.all(actions);
          }
        }

        setFormData({
          customerId,
          type: 'call',
          direction: 'outgoing',
          status: 'completed',
          metadata: {},
          salespersonId: (user as any)?.id || undefined
        });
        setValidationErrors([]);
        setValidationWarnings([]);
        onSuccess?.();
      } catch (error) {
        console.error('Failed to log/update communication:', error);
      } finally {
        setIsSubmitting(false);
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

          {user?.role === 'SUPER_ADMIN' && (
            <Select
              label="Salesperson"
              value={formData.salespersonId || ''}
              onChange={(value) => handleInputChange('salespersonId', value || undefined)}
              options={salespersons}
              required
              className="bg-white"
            />
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>

        <Input
          label="Subject"
          value={formData.subject || ''}
          onChange={(e) => handleInputChange('subject', e.target.value)}
          placeholder="Brief description..."
          className="bg-white"
        />      </div>

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
                onChange={(e) => handleInputChange('durationSeconds', e.target.value === '' ? 0 : parseInt(e.target.value))}
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
            onChange={(e) => handleInputChange('metadata.cost', e.target.value === '' ? 0 : parseFloat(e.target.value))}
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

      {/* Process Continuity Options (Only for new logs) */}
      {!initialData && (
        <div className="space-y-4">
          <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="createTask"
                checked={createFollowUpTask}
                onChange={(e) => setCreateFollowUpTask(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <label htmlFor="createTask" className="text-xs font-bold text-gray-700 cursor-pointer flex items-center gap-1.5">
                <FilePlus className="w-3.5 h-3.5 text-blue-500" />
                Create Follow-up Task
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="scheduleApp"
                checked={scheduleAppointment}
                onChange={(e) => setScheduleAppointment(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
              />
              <label htmlFor="scheduleApp" className="text-xs font-bold text-gray-700 cursor-pointer flex items-center gap-1.5">
                <CalendarPlus className="w-3.5 h-3.5 text-purple-500" />
                Schedule Appointment
              </label>
            </div>
          </div>

          {/* Conditional Task Fields */}
          {createFollowUpTask && (
            <div className="p-4 bg-blue-50/30 rounded-xl border border-blue-100 space-y-4 animate-in slide-in-from-top-1">
              <h4 className="text-[11px] font-black text-blue-900 uppercase tracking-wider flex items-center gap-2">
                <List className="w-3.5 h-3.5" /> Follow-up Task Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Task Subject"
                  value={taskData.subject}
                  onChange={(e) => setTaskData({ ...taskData, subject: e.target.value })}
                  placeholder="e.g. Call back to finalize price"
                  className="bg-white text-xs"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="Due Date"
                    type="date"
                    value={taskData.dueDate}
                    onChange={(e) => setTaskData({ ...taskData, dueDate: e.target.value })}
                    className="bg-white text-xs"
                  />
                  <Select
                    label="Priority"
                    value={taskData.priority}
                    onChange={(val) => setTaskData({ ...taskData, priority: val })}
                    options={[
                      { value: 'low', label: 'Low' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'high', label: 'High' }
                    ]}
                    className="bg-white text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Conditional Appointment Fields */}
          {scheduleAppointment && (
            <div className="p-4 bg-purple-50/30 rounded-xl border border-purple-100 space-y-4 animate-in slide-in-from-top-1">
              <h4 className="text-[11px] font-black text-purple-900 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" /> Quick Appointment
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="Date"
                    type="date"
                    value={appointmentData.date}
                    onChange={(e) => setAppointmentData({ ...appointmentData, date: e.target.value })}
                    className="bg-white text-xs"
                  />
                  <Input
                    label="Time"
                    type="time"
                    value={appointmentData.time}
                    onChange={(e) => setAppointmentData({ ...appointmentData, time: e.target.value })}
                    className="bg-white text-xs"
                  />
                </div>
                <Select
                  label="Proposed Service"
                  value={appointmentData.serviceId}
                  onChange={(val) => setAppointmentData({ ...appointmentData, serviceId: val })}
                  options={[
                    { value: 'botox', label: 'Botox Treatment' },
                    { value: 'fillers', label: 'Dermal Fillers' },
                    { value: 'laser', label: 'Laser Session' },
                    { value: 'consult', label: 'General Consultation' }
                  ]}
                  className="bg-white text-xs"
                />
              </div>
              <Select
                label="Select Clinic"
                value={appointmentData.clinicId}
                onChange={(val) => setAppointmentData({ ...appointmentData, clinicId: val })}
                options={clinics}
                className="bg-white text-xs"
              />
            </div>
          )}
        </div>
      )}

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
        {(initialData || onCancel) && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            className="text-gray-500"
          >
            Cancel
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          onClick={handleValidate}
          disabled={isSubmitting}
          className="text-gray-600 hover:text-gray-900"
        >
          Validate Only
        </Button>
        <Button type="submit" variant="primary" className="pl-4 pr-6" disabled={isSubmitting}>
          {isSubmitting ? (
            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
          ) : (
            <CheckCircle className="h-4 w-4 mr-2" />
          )}
          {initialData ? 'Update Interaction' : 'Save Communication'}
        </Button>
      </div>
    </form>
  );
};
