import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Eye, Trash2
} from 'lucide-react';
import { Button } from '@/components/atoms/Button/Button';
import { Input } from '@/components/atoms/Input/Input';
import { Select } from '@/components/atoms/Select/Select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/molecules/Card/Card';
import {
  fetchActions,
  fetchPendingActions,
  fetchOverdueTasks,
  updateAction,
  deleteAction,
  createAction
} from '@/store/slices/crmSlice';
import type { RootState, AppDispatch } from '@/store';
import type { CrmAction } from '@/types';
import { createTask, deleteTask, UpdateTask, fetchTasks } from '@/store/slices/TaskSlice';
interface TasksPageProps {
  salespersonId?: string;
  onViewTask?: (task: CrmAction) => void;
}

type formData = {
  title: string;
  description: string;
  type: 'treatment_follow_up' | 'email_follow_up' | 'follow_up_call' | 'loyalty_reward' | 'appointment_reminder' | 'general';
  status: 'pending' | 'completed' | 'cancelled' | 'in_progress';
  dueDate: string;
  assigneeId: string;
  metadata: Record<string, any>;
};

export const Actions: React.FC<TasksPageProps> = ({ salespersonId, onViewTask }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { tasks, pendingTasks, overdueTasks, isLoading, error, leads } = useSelector((state: RootState) => state.crm);
  const { user } = useSelector((state: RootState) => state.auth);

  console.log(user);
  const currentUserId = salespersonId || user?.id;
  const customerId = user?.role === 'client' ? user.id : 'undefined';

  const [formData, setFormData] = useState<formData>({
    title: '',
    description: '',
    type: 'follow_up_call',
    status: 'pending',
    dueDate: new Date().toISOString().slice(0, 16),
    customerId,
    assigneeId: user?.id || '',
    metadata: {}
  });

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'overdue'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (currentUserId) {
      dispatch(fetchActions({ salespersonId: currentUserId }));
      dispatch(fetchPendingActions(currentUserId));
      dispatch(fetchOverdueTasks(currentUserId));
    }
  }, [dispatch, currentUserId]);

  // ✅ Create task
  const handleCreateAction = async () => {
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        status: formData.status,
        dueDate: new Date(formData.dueDate).toISOString(),
        customerId: formData.customerId,
        assigneeId: formData.assigneeId,
        metadata: formData.metadata
      };

      await dispatch(createAction(payload)).unwrap();
      setShowCreateForm(false);
      setFormData({
        title: '',
        description: '',
        type: 'follow_up_call',
        status: 'pending',
        dueDate: new Date().toISOString().slice(0, 16),
        customerId,
        assigneeId: currentUserId || '',
        metadata: {}
      });

      dispatch(fetchActions({ salespersonId: currentUserId }));
    } catch (err) {
      console.error('Error creating task:', err);
    }
  };

  const filteredTasks = tasks.filter(task =>
    task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const updateaction = async () => {
    try {
      await dispatch(updateAction(formData)).unwrap();
      setShowCreateForm(false);
      setFormData({
        title: '',
        description: '',
        type: 'follow_up_call',
        status: 'pending',
        dueDate: new Date().toISOString().slice(0, 16),
        customerId,
        assigneeId: currentUserId || '',
        metadata: {}
      });

      dispatch(fetchActions({ salespersonId: currentUserId }));
    } catch (err) {
      console.error('Error updating task:', err);
    }
  }

  // getaction
  const getaction = async (id: string) => {
    try {
      await dispatch(getAction(id)).unwrap();
      setShowCreateForm(false);
      setFormData({
        title: '',
        description: '',
        type: 'follow_up_call',
        status: 'pending',
        dueDate: new Date().toISOString().slice(0, 16),
        customerId,
        assigneeId: currentUserId || '',
        metadata: {}
      });

      dispatch(fetchActions({ salespersonId: currentUserId }));
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  }
  const formatDate = (date?: string) =>
    date ? new Date(date).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }) : '-';

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Task Management</h2>
            <p className="text-gray-500 mt-1">Manage your tasks and follow-ups</p>
          </div>
          <Button variant="primary" onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" /> New Task
          </Button>
        </div>
      </Card>

      {/* Task List */}
      <Card>
        <CardHeader><CardTitle>Tasks ({filteredTasks.length})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No tasks found</div>
          ) : (
            <div className="space-y-4">
              {filteredTasks.map(task => (
                <div key={task.id} className="p-4 border rounded-lg flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{task.title}</h3>
                    <p className="text-sm text-gray-500">{task.description}</p>
                    <p className="text-xs text-gray-400">Due: {formatDate(task.dueDate)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => onViewTask?.(task)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => dispatch(deleteAction(task.id))}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Task Modal */}
      {showCreateForm && (
        <div className="bg-black bg-opacity-50 fixed inset-0 flex items-center justify-center p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCreateAction();
            }}
            className="bg-white rounded-lg p-6 w-full max-w-md"
          >
            <h2 className="text-xl font-bold mb-4">Create Task</h2>

            <Input label="Title" value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />

            <Input label="Description" value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })} required />



            <Select label="Type" value={formData.type}
              onChange={(v) => setFormData({ ...formData, type: v as formData['type'] })}
              options={[
                { value: 'follow_up_call', label: 'Follow Up Call' },
                { value: 'email_follow_up', label: 'Email Follow Up' },
                { value: 'appointment_reminder', label: 'Appointment Reminder' },
                { value: 'treatment_follow_up', label: 'Treatment Follow Up' },
                { value: 'loyalty_reward', label: 'Loyalty Reward' },
                { value: 'general', label: 'General' }

              ]} />

            <Input type="datetime-local" label="Due Date" value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} required />

            <div className="flex justify-end gap-2 mt-6">
              <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>Cancel</Button>
              <Button type="submit" variant="primary">Create</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
