import React, { useEffect, useState } from "react";
import { notificationsAPI } from "@/services/api";
import { Bell, Mail, Smartphone, Edit2, RefreshCcw, Save, X, Plus, Info } from "lucide-react";
import { toast } from "react-hot-toast";

interface NotificationTemplate {
  id: string;
  trigger: string;
  type: 'email' | 'push';
  subject: string;
  content: string;
  isActive: boolean;
}

export const NotificationSettings: React.FC = () => {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newTemplate, setNewTemplate] = useState<Partial<NotificationTemplate>>({
    trigger: 'APPOINTMENT_BOOKED',
    type: 'email',
    subject: '',
    content: '',
    isActive: true
  });
  const [isSaving, setIsSaving] = useState(false);

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const res = await notificationsAPI.getTemplates();
      setTemplates(res.data);
    } catch (error) {
      toast.error("Failed to load notification templates");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate) return;

    try {
      setIsSaving(true);
      await notificationsAPI.updateTemplate(editingTemplate.id, editingTemplate);
      toast.success("Template updated successfully");
      setEditingTemplate(null);
      fetchTemplates();
    } catch (error) {
      toast.error("Failed to update template");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await notificationsAPI.createTemplate(newTemplate);
      toast.success("Template created successfully");
      setIsCreating(false);
      setNewTemplate({ trigger: 'APPOINTMENT_BOOKED', type: 'email', subject: '', content: '', isActive: true });
      fetchTemplates();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to create template");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm("Are you sure you want to reset templates to defaults? This will not delete your custom templates but will add missing defaults.")) return;
    try {
      await notificationsAPI.resetDefaultTemplates();
      toast.success("Templates reset/seeded successfully");
      fetchTemplates();
    } catch (error) {
      toast.error("Failed to reset templates");
    }
  };

  const getTriggerLabel = (trigger: string) => {
    return trigger.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notification Settings</h1>
          <p className="text-gray-500 mt-1">Manage email and push notification templates and rules</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-semibold"
          >
            <RefreshCcw size={18} />
            Reset Defaults
          </button>
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold shadow-sm"
          >
            <Plus size={18} />
            Create Notification
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 items-start mb-4">
          <Info className="text-blue-500 mt-0.5" size={20} />
          <div>
            <h4 className="font-semibold text-blue-900">Customizing Templates</h4>
            <p className="text-sm text-blue-800 mt-1">
              You can use placeholders like <code className="bg-blue-100 px-1 rounded">{"{{customerName}}"}</code>, 
              <code className="bg-blue-100 px-1 rounded">{"{{appointmentDate}}"}</code>, 
              <code className="bg-blue-100 px-1 rounded">{"{{appointmentTime}}"}</code>, and 
              <code className="bg-blue-100 px-1 rounded">{"{{clinicName}}"}</code> in your templates.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <RefreshCcw className="animate-spin text-gray-400" size={32} />
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-bottom border-gray-100">
                  <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Trigger</th>
                  <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Channel</th>
                  <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Subject / Title</th>
                  <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Status</th>
                  <th className="px-6 py-4 font-semibold text-gray-600 text-sm text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {templates.map((template) => (
                  <tr key={template.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">{getTriggerLabel(template.trigger)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {template.type === 'email' ? (
                          <Mail size={16} className="text-blue-500" />
                        ) : (
                          <Smartphone size={16} className="text-purple-500" />
                        )}
                        <span className="capitalize text-sm text-gray-600">{template.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600 truncate max-w-md">{template.subject}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        template.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {template.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setEditingTemplate(template)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editingTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Edit Template: {getTriggerLabel(editingTemplate.trigger)}</h2>
              <button onClick={() => setEditingTemplate(null)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trigger</label>
                  <input
                    type="text"
                    value={getTriggerLabel(editingTemplate.trigger)}
                    disabled
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
                  <input
                    type="text"
                    value={editingTemplate.type.toUpperCase()}
                    disabled
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {editingTemplate.type === 'email' ? 'Email Subject' : 'Push Title'}
                </label>
                <input
                  type="text"
                  value={editingTemplate.subject}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  placeholder="Enter subject or title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content / Message</label>
                <textarea
                  value={editingTemplate.content}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, content: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none min-h-[150px]"
                  placeholder="Enter message content"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={editingTemplate.isActive}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Active</label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingTemplate(null)}
                  className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-200 active:scale-95 disabled:opacity-50"
                >
                  {isSaving ? <RefreshCcw className="animate-spin" size={20} /> : <Save size={20} />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCreating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Plus className="text-blue-500" size={24} />
                Create New Notification Trigger
              </h2>
              <button 
                onClick={() => {
                  setIsCreating(false);
                  setNewTemplate({ trigger: 'APPOINTMENT_BOOKED', type: 'email', subject: '', content: '', isActive: true });
                }} 
                className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Trigger Event</label>
                  <select
                    value={newTemplate.trigger}
                    onChange={(e) => setNewTemplate({ ...newTemplate, trigger: e.target.value })}
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                    required
                  >
                    <option value="APPOINTMENT_BOOKED">Appointment Booked</option>
                    <option value="APPOINTMENT_CONFIRMED">Appointment Confirmed</option>
                    <option value="APPOINTMENT_RESCHEDULED">Appointment Rescheduled</option>
                    <option value="APPOINTMENT_CANCELED">Appointment Canceled</option>
                    <option value="APPOINTMENT_REMINDER">Appointment Reminder</option>
                    <option value="POST_VISIT_THANK_YOU">Post Visit Thank You</option>
                    <option value="TASK_REMINDER">Task Reminder</option>
                    <option value="EXECUTION_NOTIFICATION">Execution Notification</option>
                    <option value="WELCOME_CREDENTIALS">Welcome Credentials</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Channel (Type)</label>
                  <select
                    value={newTemplate.type}
                    onChange={(e) => setNewTemplate({ ...newTemplate, type: e.target.value as 'email' | 'push' })}
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                    required
                  >
                    <option value="email">Email</option>
                    <option value="push">Push Notification</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  {newTemplate.type === 'email' ? 'Email Subject' : 'Push Title'}
                </label>
                <input
                  type="text"
                  value={newTemplate.subject}
                  onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  placeholder="Enter subject or title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Content / Message</label>
                <textarea
                  value={newTemplate.content}
                  onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none min-h-[150px]"
                  placeholder="Enter message content"
                  required
                />
              </div>

              <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
                <input
                  type="checkbox"
                  id="newIsActive"
                  checked={newTemplate.isActive}
                  onChange={(e) => setNewTemplate({ ...newTemplate, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor="newIsActive" className="text-sm font-bold text-gray-700">Enable notification immediately</label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-200 active:scale-95 disabled:opacity-50"
                >
                  {isSaving ? <RefreshCcw className="animate-spin" size={20} /> : <Plus size={20} />}
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
