import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Eye, Trash2, Plus, Edit, X } from 'lucide-react';
import { Button } from '@/components/atoms/Button/Button';
import { Input } from '@/components/atoms/Input/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/molecules/Card/Card';
import { Link, useNavigate } from 'react-router-dom';

import type { RootState, AppDispatch } from '@/store';
import {
  deleteAction,
  updateAction,
  fetchActions,
  fetchTaskKpis
} from '@/store/slices/crmSlice';
import type { CrmAction } from '@/types';
import { CheckCircle, Clock, AlertTriangle, Users, Repeat } from 'lucide-react';
import { ActionForm } from '@/components/organisms/ActionForm/ActionForm';
import { Select } from '@/components/atoms/Select/Select';

interface TasksPageProps {
  onViewTask?: (task: any) => void;
}



export const Tasks: React.FC<TasksPageProps> = ({ onViewTask }) => {
  const { actions: tasks, isLoading, taskKpis } = useSelector((state: RootState) => state.crm);
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const currentUserId = user?.id;

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterDateRange, setFilterDateRange] = useState<string>('all');
  const [selectedTask, setSelectedTask] = useState<CrmAction | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [taskFormData, setTaskFormData] = useState<any>({
    title: '',
    description: '',
    actionType: 'call',
    status: 'pending',
    dueDate: new Date().toISOString().slice(0, 16),
    reminderDate: new Date().toISOString().slice(0, 16),
    priority: 'medium',
    isRecurring: false,
    recurrenceType: 'weekly',
    recurrenceInterval: 1,
    therapy: ''
  });

  useEffect(() => {
    if (currentUserId) {
      dispatch(fetchActions({ salespersonId: currentUserId }));
      dispatch(fetchTaskKpis());
    }
  }, [dispatch, currentUserId]);

  const resetForm = () => {
    setShowCreateForm(false);
    setIsEditing(false);
    setSelectedTask(null);
    setTaskFormData({
      title: '',
      description: '',
      actionType: 'call',
      status: 'pending',
      dueDate: new Date().toISOString().slice(0, 16),
      reminderDate: new Date().toISOString().slice(0, 16),
      priority: 'medium',
      isRecurring: false,
      recurrenceType: 'weekly',
      recurrenceInterval: 1
    });
  };

  const handleDeleteTask = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await dispatch(deleteAction(id)).unwrap();
      dispatch(fetchTaskKpis());
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const formatDate = (date?: string) =>
    date
      ? new Date(date).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
      : '-';

  const isOverdue = (task: CrmAction) => {
    if (task.status !== 'pending' && task.status !== 'in_progress') return false;
    return task.dueDate && new Date(task.dueDate) < new Date();
  };

  const filteredTasks = tasks.filter((task) => {
    // 1. Search term
    const matchesSearch = !searchTerm || (
      task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.actionType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.customer && `${task.customer.firstName} ${task.customer.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (!matchesSearch) return false;

    // 2. Status filter
    if (filterStatus !== 'all' && task.status !== filterStatus) return false;

    // 3. Type filter
    if (filterType !== 'all' && task.actionType !== filterType) return false;

    // 4. Date range filter
    if (filterDateRange !== 'all') {
      const dueDate = task.dueDate ? new Date(task.dueDate) : null;
      if (!dueDate) return false;

      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const taskDate = new Date(dueDate);
      taskDate.setHours(0, 0, 0, 0);

      const diffTime = taskDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (filterDateRange === 'today' && diffDays !== 0) return false;
      if (filterDateRange === 'next_7_days' && (diffDays < 0 || diffDays > 7)) return false;
      if (filterDateRange === 'overdue' && !isOverdue(task)) return false;
    }

    return true;
  });

  const handleTaskCompletion = async (task: CrmAction) => {
    const isCompleting = task.status !== 'completed';
    const newStatus = isCompleting ? 'completed' : 'pending';

    try {
      await dispatch(updateAction({ id: task.id, updates: { status: newStatus } })).unwrap();
      dispatch(fetchTaskKpis());

      if (isCompleting) {
        if (task.actionType === 'call' || task.actionType === 'follow_up_call') {
          // Open Log Communication behavior (handled by parent or state)
          // For now, alert or redirect
          if (confirm('Task completed! Would you like to log this communication?')) {
            navigate(`/crm/customers/${task.customerId}?log=true`);
          }
        } else if (task.actionType === 'appointment') {
          if (confirm('Task completed! Would you like to open the Calendar?')) {
            navigate('/calendar');
          }
        }
      }
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-white border border-slate-100 rounded-lg shadow-sm">
        <div>
          <h2 className="text-lg font-bold leading-tight text-slate-800">Task Management</h2>
          <p className="text-gray-500 text-[11px] mt-0.5">Manage your tasks and follow-ups</p>
        </div>
        <Button variant="primary" onClick={() => setShowCreateForm(true)} className="h-7 text-xs px-2.5 py-0 rounded-md">
          <Plus className="h-3.5 w-3.5 mr-1" /> New Task
        </Button>
      </div>

      {/* KPI Summary */}
      {/* KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <div className="bg-white border border-slate-100 rounded-lg shadow-sm px-3 py-2 flex flex-col justify-center">
          <div className="flex items-center gap-1.5 mb-0.5 text-blue-600">
            <Users className="h-3.5 w-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total</span>
          </div>
          <div className="text-lg font-black text-slate-800 leading-none">{taskKpis?.total || 0}</div>
        </div>

        <div className="bg-white border border-slate-100 rounded-lg shadow-sm px-3 py-2 flex flex-col justify-center">
          <div className="flex items-center gap-1.5 mb-0.5 text-yellow-600">
            <Clock className="h-3.5 w-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Pending</span>
          </div>
          <div className="text-lg font-black text-slate-800 leading-none">{taskKpis?.pending || 0}</div>
        </div>

        <div className="bg-white border border-slate-100 rounded-lg shadow-sm px-3 py-2 flex flex-col justify-center">
          <div className="flex items-center gap-1.5 mb-0.5 text-red-600">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Overdue</span>
          </div>
          <div className="text-lg font-black text-slate-800 leading-none">{taskKpis?.overdue || 0}</div>
        </div>

        <div className="bg-white border border-slate-100 rounded-lg shadow-sm px-3 py-2 flex flex-col justify-center">
          <div className="flex items-center gap-1.5 mb-0.5 text-indigo-600">
            <Repeat className="h-3.5 w-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">In Progress</span>
          </div>
          <div className="text-lg font-black text-slate-800 leading-none">{taskKpis?.inProgress || 0}</div>
        </div>

        <div className="bg-white border border-slate-100 rounded-lg shadow-sm px-3 py-2 flex flex-col justify-center">
          <div className="flex items-center gap-1.5 mb-0.5 text-green-600">
            <CheckCircle className="h-3.5 w-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Completed</span>
          </div>
          <div className="text-lg font-black text-slate-800 leading-none">{taskKpis?.completed || 0}</div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-2 bg-white px-3 py-2 rounded-lg shadow-sm border border-slate-100 items-center">
        <div className="flex-1 w-full">
          <Input
            placeholder="Search tasks by title, contact, type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full transition-all h-8 text-[11px]"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 flex-2 min-w-[50%] w-full">
          <Select
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'pending', label: 'Pending' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'completed', label: 'Completed' },
              { value: 'cancelled', label: 'Cancelled' },
              { value: 'missed', label: 'Missed' }
            ]}
            value={filterStatus}
            onChange={(val) => setFilterStatus(val)}
          />
          <Select
            options={[
              { value: 'all', label: 'All Types' },
              { value: 'call', label: 'Call' },
              { value: 'mobile_message', label: 'Mobile Message' },
              { value: 'follow_up_call', label: 'Follow up Call' },
              { value: 'email', label: 'Email' },
              { value: 'appointment', label: 'Appointment' },
              { value: 'confirmation_call_reminder', label: 'Confirmation Call Reminder' }
            ]}
            value={filterType}
            onChange={(val) => setFilterType(val)}
          />
          <Select
            options={[
              { value: 'all', label: 'Any Date' },
              { value: 'today', label: 'Today' },
              { value: 'next_7_days', label: 'Next 7 Days' },
              { value: 'overdue', label: 'Overdue' }
            ]}
            value={filterDateRange}
            onChange={(val) => setFilterDateRange(val)}
          />
        </div>
      </div>

      {/* Task List */}
      <Card padding="none" className="overflow-hidden">
        <CardHeader className="p-3 border-b border-gray-100">
          <CardTitle className="text-sm font-bold">Global Task List ({filteredTasks.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No tasks found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b bg-gray-50/50">
                    <th className="p-2.5 font-bold text-[10px] uppercase tracking-wider text-slate-500">Status</th>
                    <th className="p-2.5 font-bold text-[10px] uppercase tracking-wider text-slate-500">Task Details</th>
                    <th className="p-2.5 font-bold text-[10px] uppercase tracking-wider text-slate-500">Associated Contact</th>
                    <th className="p-2.5 font-bold text-[10px] uppercase tracking-wider text-slate-500">Type & Therapy</th>
                    <th className="p-2.5 font-bold text-[10px] uppercase tracking-wider text-slate-500">Due/Reminder</th>
                    <th className="p-2.5 font-bold text-[10px] uppercase tracking-wider text-slate-500">Priority</th>
                    <th className="p-2.5 font-bold text-[10px] uppercase tracking-wider text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((task) => (
                    <tr
                      key={task.id}
                      className={`border-b hover:bg-slate-50/50 transition-colors group ${isOverdue(task) ? 'bg-red-50/30' : ''}`}
                    >
                      <td className="p-2.5">
                        <div className="flex justify-center">
                          <input
                            type="checkbox"
                            checked={task.status === 'completed'}
                            onChange={() => handleTaskCompletion(task)}
                            className="h-4 w-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer"
                          />
                        </div>
                      </td>
                      <td className="p-2.5">
                        <div className="font-bold text-slate-800 text-xs">{task.title}</div>
                        {task.description && (
                          <div className="text-[10px] text-slate-400 line-clamp-1 font-medium mt-0.5">{task.description}</div>
                        )}
                      </td>
                      <td className="p-2.5">
                        {task.customerId ? (
                          <Link
                            to={`/crm/customers/${task.customerId}`}
                            className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-100/50 hover:bg-slate-200/50 rounded-md text-slate-700 font-bold text-[10px] transition-all"
                          >
                            <Users className="h-2.5 w-2.5 text-slate-400" />
                            {task.customer ? `${task.customer.firstName} ${task.customer.lastName}` : 'View Profile'}
                          </Link>
                        ) : (
                          <span className="text-slate-300 text-[10px] font-medium italic">Unassigned</span>
                        )}
                      </td>
                      <td className="p-2.5">
                        <div className="flex flex-col gap-0.5">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-blue-700 text-[9px] font-bold uppercase border border-blue-100 bg-blue-50 w-fit">
                            {task.actionType.replace(/_/g, ' ')}
                          </span>
                          {task.therapy && (
                            <span className="text-[9px] text-slate-400 font-bold italic">
                              Re: {task.therapy}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-2.5">
                        <div className="flex flex-col gap-0">
                          <div className={`text-[10px] font-bold flex items-center gap-1 ${isOverdue(task) ? 'text-red-500' : 'text-slate-600'}`}>
                            <Clock className="w-2.5 h-2.5 opacity-60" />
                            {formatDate(task.dueDate)}
                          </div>
                          <div className="text-[9px] font-medium text-slate-400 italic mt-0.5">
                            Reminder: {formatDate(task.reminderDate)}
                          </div>
                        </div>
                      </td>
                      <td className="p-2.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider
                          ${task.priority === 'urgent' ? 'bg-red-500 text-white shadow-sm shadow-red-200' :
                            task.priority === 'high' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                              task.priority === 'medium' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                                'bg-slate-100 text-slate-600 border border-slate-200'}`}
                        >
                          {task.priority}
                        </span>
                      </td>
                      <td className="p-2.5">
                        <div className="flex gap-0.5 justify-end">
                          <Button size="sm" variant="ghost" onClick={() => onViewTask?.(task)} className="h-7 w-7 p-0">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedTask(task);
                              setTaskFormData({
                                customerId: task.customerId || '',
                                title: task.title || '',
                                description: task.description || '',
                                actionType: task.actionType,
                                status: task.status as any,
                                dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : '',
                                reminderDate: task.reminderDate ? new Date(task.reminderDate).toISOString().slice(0, 16) : '',
                                priority: task.priority as any,
                                isRecurring: task.isRecurring || false,
                                recurrenceType: task.recurrenceType as any || 'weekly',
                                recurrenceInterval: task.recurrenceInterval || 1
                              });
                              setIsEditing(true);
                            }}
                            className="h-7 w-7 p-0"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-red-500 h-7 w-7 p-0" onClick={() => handleDeleteTask(task.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task Creation/Edit Modal */}
      {(showCreateForm || isEditing) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h3 className="text-lg font-black text-slate-800">
                  {isEditing ? 'Modify Strategy' : 'Program New Task'}
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Operation Workflow</p>
              </div>
              <Button variant="ghost" onClick={resetForm} className="h-10 w-10 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                <X className="h-6 w-6" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
              <div className="bg-white border-none space-y-0">
                <ActionForm
                  customerId={taskFormData.customerId || ''}
                  prefilledData={isEditing ? {
                    ...taskFormData,
                    id: selectedTask?.id
                  } : undefined}
                  onSuccess={() => {
                    resetForm();
                    if (currentUserId) {
                      dispatch(fetchActions({ salespersonId: currentUserId }));
                      dispatch(fetchTaskKpis());
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
