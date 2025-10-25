import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Calendar,
  User,
  Building,
  MessageSquare,
  Phone,
  Mail,
  Eye,
  Edit,
  Trash2,
  MoreVertical
} from 'lucide-react';
import { Button } from '@/components/atoms/Button/Button';
import { Input } from '@/components/atoms/Input/Input';
import { Select } from '@/components/atoms/Select/Select';
import { Badge } from '@/components/atoms/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/molecules/Card/Card';
import {
  fetchActions,
  fetchPendingActions,
  fetchOverdueTasks,
  updateAction,
  deleteAction,
  createAction,
  runTaskAutomationCheck
} from '@/store/slices/crmSlice';
import type { RootState, AppDispatch } from '@/store';
import type { CrmAction } from '@/types';

interface TasksPageProps {
  salespersonId?: string;
  onViewTask?: (task: CrmAction) => void;
}

type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';

type TaskFormData = {
  title: string;
  description: string;
  actionType: 'phone_call' | 'email' | 'follow_up' | 'appointment_confirmation' | 'treatment_reminder' | 'meeting';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
  dueDate: string;
  customerId: string;
};

export const Tasks: React.FC<TasksPageProps> = ({ salespersonId, onViewTask }) => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    tasks,
    pendingTasks,
    overdueTasks,
    automationRules,
    isLoading,
    error
  } = useSelector((state: RootState) => state.crm);

  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'overdue'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    actionType: 'follow_up',
    priority: 'medium',
    status: 'pending',
    dueDate: '',
    customerId: ''
  });

  const { user } = useSelector((state: RootState) => state.auth);
  const currentUserId = salespersonId || user?.id;

  useEffect(() => {
    if (currentUserId) {
      dispatch(fetchActions({ salespersonId: currentUserId }));
      dispatch(fetchPendingActions(currentUserId));
      dispatch(fetchOverdueTasks(currentUserId));
    }
  }, [dispatch, currentUserId]);

  const handleCreateTask = async () => {
    if (!formData.title || !formData.customerId || !formData.actionType) {
      alert('Please fill in required fields');
      return;
    }

    try {
      await dispatch(createAction({
        ...formData,
        salespersonId: currentUserId
      })).unwrap();
      setShowCreateForm(false);
      setFormData({
        title: '',
        description: '',
        actionType: 'follow_up',
        priority: 'medium',
        status: 'pending',
        dueDate: '',
        customerId: ''
      });
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, status: TaskStatus) => {
    try {
      await dispatch(updateAction({
        id: taskId,
        updates: { status }
      })).unwrap();
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleRunAutomation = async () => {
    try {
      await dispatch(runTaskAutomationCheck()).unwrap();
      // Refresh tasks after automation run
      if (currentUserId) {
        dispatch(fetchActions({ salespersonId: currentUserId }));
        dispatch(fetchPendingActions(currentUserId));
        dispatch(fetchOverdueTasks(currentUserId));
      }
    } catch (error) {
      console.error('Failed to run automation:', error);
    }
  };

  const getCurrentTasks = () => {
    switch (activeTab) {
      case 'pending':
        return pendingTasks;
      case 'overdue':
        return overdueTasks;
      default:
        return tasks;
    }
  };

  const getFilteredTasks = () => {
    let filtered = getCurrentTasks();

    if (searchTerm) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.customer?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.customer?.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter) {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    if (priorityFilter) {
      filtered = filtered.filter(task => task.priority === priorityFilter);
    }

    return filtered;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'info';
      case 'pending':
        return 'warning';
      case 'overdue':
        return 'error';
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

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'phone_call':
        return <Phone className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'meeting':
        return <Calendar className="h-4 w-4" />;
      case 'follow_up':
        return <MessageSquare className="h-4 w-4" />;
      case 'appointment_confirmation':
        return <CheckCircle className="h-4 w-4" />;
      case 'treatment_reminder':
        return <Clock className="h-4 w-4" />;
      default:
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const filteredTasks = getFilteredTasks();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Task Management</h2>
          <p className="text-gray-600">Manage your tasks and follow-ups</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRunAutomation}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Run Automation
          </Button>
          <Button variant="primary" onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{tasks.length}</div>
                <div className="text-sm text-gray-500">Total Tasks</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold">{pendingTasks.length}</div>
                <div className="text-sm text-gray-500">Pending</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <div className="text-2xl font-bold">{overdueTasks.length}</div>
                <div className="text-sm text-gray-500">Overdue</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">
                  {tasks.filter(t => t.status === 'completed').length}
                </div>
                <div className="text-sm text-gray-500">Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'pending', label: 'Pending' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'completed', label: 'Completed' },
                { value: 'overdue', label: 'Overdue' },
                { value: 'cancelled', label: 'Cancelled' }
              ]}
            />
            <Select
              value={priorityFilter}
              onChange={setPriorityFilter}
              options={[
                { value: '', label: 'All Priorities' },
                { value: 'urgent', label: 'Urgent' },
                { value: 'high', label: 'High' },
                { value: 'medium', label: 'Medium' },
                { value: 'low', label: 'Low' }
              ]}
            />
          </div>
        </CardContent>
      </Card>

      {/* Task Tabs */}
      <div className="flex border-b">
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'all'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('all')}
        >
          All Tasks ({tasks.length})
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'pending'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('pending')}
        >
          Pending ({pendingTasks.length})
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'overdue'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('overdue')}
        >
          Overdue ({overdueTasks.length})
        </button>
      </div>

      {/* Tasks List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {activeTab === 'all' ? 'All Tasks' :
             activeTab === 'pending' ? 'Pending Tasks' :
             'Overdue Tasks'} ({filteredTasks.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading tasks...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">{error}</div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No tasks found
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-start gap-4 p-4 border rounded-lg ${
                    task.status === 'overdue' ? 'border-red-200 bg-red-50' :
                    task.status === 'completed' ? 'border-green-200 bg-green-50' :
                    'border-gray-200'
                  }`}
                >
                  <div className="flex-shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      task.status === 'completed' ? 'bg-green-100' :
                      task.status === 'overdue' ? 'bg-red-100' :
                      'bg-blue-100'
                    }`}>
                      {task.status === 'completed' ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : isOverdue(task.dueDate || '') && task.status === 'pending' ? (
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      ) : (
                        getActionIcon(task.actionType)
                      )}
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium">{task.title}</h3>
                      <Badge variant={getStatusColor(task.status)} size="sm">
                        {task.status}
                      </Badge>
                      <Badge variant={getPriorityColor(task.priority)} size="sm">
                        {task.priority}
                      </Badge>
                      {task.status === 'overdue' && (
                        <Badge variant="error" size="sm">
                          OVERDUE
                        </Badge>
                      )}
                    </div>

                    {task.description && (
                      <p className="text-gray-600 text-sm mb-2">{task.description}</p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {task.customer?.firstName} {task.customer?.lastName}
                      </div>
                      {task.metadata?.clinic && (
                        <div className="flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          {task.metadata.clinic}
                        </div>
                      )}
                      <div>Created: {formatDate(task.createdAt)}</div>
                      {task.dueDate && (
                        <div className={isOverdue(task.dueDate) && task.status === 'pending' ? 'text-red-600 font-medium' : ''}>
                          Due: {formatDate(task.dueDate)}
                        </div>
                      )}
                      {task.completedAt && (
                        <div>Completed: {formatDate(task.completedAt)}</div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {task.status === 'pending' && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUpdateTaskStatus(task.id, 'in_progress')}
                        >
                          Start
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUpdateTaskStatus(task.id, 'completed')}
                        >
                          Complete
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewTask?.(task)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => dispatch(deleteAction(task.id))}
                    >
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New Task</h2>
            <div className="space-y-4">
              <Input
                label="Title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
              />
              <Select
                label="Action Type"
                value={formData.actionType}
                onChange={(value: 'phone_call' | 'email' | 'follow_up' | 'appointment_confirmation' | 'treatment_reminder' | 'meeting') => setFormData({...formData, actionType: value})}
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
              <Input
                label="Customer ID"
                value={formData.customerId}
              />
              <Select
                label="Priority"
                value={formData.priority}
                onChange={(value: 'low' | 'medium' | 'high' | 'urgent') => setFormData({...formData, priority: value})}
                options={[
                  { value: 'low', label: 'Low' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'high', label: 'High' },
                  { value: 'urgent', label: 'Urgent' }
                ]}
              />
              <Input
                label="Due Date"
                type="datetime-local"
                value={formData.dueDate}
                onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
              />
              <Input
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>
            <div className="flex gap-2 mt-6">
              <Button variant="primary" onClick={handleCreateTask}>
                Create Task
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
