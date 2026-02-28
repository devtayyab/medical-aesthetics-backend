import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '@/components/atoms/Button/Button';
import { Input } from '@/components/atoms/Input/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/molecules/Card/Card';
import { Link, useNavigate } from 'react-router-dom';
import { Textarea } from '@/components/atoms/Textarea';
import { CRMBookingModal } from '@/components/crm/CRMBookingModal';

import type { RootState, AppDispatch } from '@/store';
import {
  deleteAction,
  updateAction,
  fetchActions,
  fetchTaskKpis,
  logCommunication
} from '@/store/slices/crmSlice';
import type { CrmAction } from '@/types';
import { ActionForm } from '@/components/organisms/ActionForm/ActionForm';
import { Select } from '@/components/atoms/Select/Select';
import {
  CheckCircle, Clock, AlertTriangle, Users, Repeat,
  PhoneCall, MoreHorizontal, User, Eye, Plus, Edit, X,
  CornerUpRight, Calendar, Phone
} from 'lucide-react';

// --- Dialer Component (Reused from OneCustomerDetail) ---
const DialerModal = ({
  isOpen,
  onClose,
  customerName,
  phoneNumber,
  onCallEnded
}: {
  isOpen: boolean;
  onClose: () => void;
  customerName: string;
  phoneNumber: string;
  onCallEnded: (duration: number) => void;
}) => {
  const [callStatus, setCallStatus] = useState<'dialing' | 'connected' | 'ended'>('dialing');
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen) {
      setCallStatus('dialing');
      setDuration(0);
      timer = setTimeout(() => {
        setCallStatus('connected');
      }, 2000);
    }
    return () => clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (callStatus === 'connected') {
      timer = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [callStatus]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    setCallStatus('ended');
    setTimeout(() => {
      onCallEnded(duration);
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden border border-gray-700 relative">
        <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl -ml-10 -mt-10" />
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl -mr-10 -mb-10" />

        <div className="relative z-10 flex flex-col h-[500px]">
          <div className="p-6 flex justify-between items-center">
            <div className="text-xs font-bold tracking-widest text-gray-400 uppercase">VoIP Dialer</div>
            <div className="flex gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-green-400 font-bold">Online</span>
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center shadow-inner border border-gray-600 text-2xl font-bold text-gray-300">
                {customerName.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              {callStatus === 'dialing' && (
                <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-ping" />
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold tracking-tight">{customerName}</h3>
              <p className="text-lg text-gray-400 font-mono tracking-wider">{phoneNumber}</p>
            </div>

            <div className="space-y-1">
              <div className={`text-sm font-bold uppercase tracking-widest px-3 py-1 rounded-full inline-block
                                ${callStatus === 'dialing' ? 'bg-yellow-500/20 text-yellow-400' :
                  callStatus === 'connected' ? 'bg-red-500/10 text-red-500 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'bg-red-500/20 text-red-400'}`}>
                {callStatus === 'dialing' ? 'Dialing...' :
                  callStatus === 'connected' ? (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span>REC {formatDuration(duration)}</span>
                    </div>
                  ) : 'Call Ended'}
              </div>
            </div>
          </div>

          <div className="p-8 pb-10 flex justify-center items-center gap-8">
            <Button
              variant="ghost"
              className="w-14 h-14 rounded-full bg-gray-700/50 hover:bg-gray-700 text-white border border-gray-600 backdrop-blur-md"
              onClick={onClose}
            >
              <User className="w-6 h-6" />
            </Button>

            <Button
              onClick={handleEndCall}
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/40 border-4 border-gray-800 flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
            >
              <Phone className="w-8 h-8 fill-current rotate-[135deg]" />
            </Button>

            <Button
              variant="ghost"
              className="w-14 h-14 rounded-full bg-gray-700/50 hover:bg-gray-700 text-white border border-gray-600 backdrop-blur-md"
            >
              <MoreHorizontal className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

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
  const [viewingTask, setViewingTask] = useState<CrmAction | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

  // Interaction States
  const [showInteractionModal, setShowInteractionModal] = useState(false);
  const [interactionTask, setInteractionTask] = useState<CrmAction | null>(null);
  const [interactionNotes, setInteractionNotes] = useState("");
  const [showDialer, setShowDialer] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks(prev =>
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

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
      customerId: '',
      relatedLeadId: '',
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
    const matchesSearch = (
      task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.actionType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.customer?.customer && `${task.customer.customer.firstName || ''} ${task.customer.customer.lastName || ''}`.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (task.relatedLead && `${task.relatedLead.firstName || ''} ${task.relatedLead.lastName || ''}`.toLowerCase().includes(searchTerm.toLowerCase()))
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
          if (task.customerId && confirm('Task completed! Would you like to log this communication?')) {
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

  const handleSaveInteraction = async () => {
    if (!interactionTask) return;

    try {
      // 1. Log the communication
      await dispatch(logCommunication({
        customerId: interactionTask.customerId || interactionTask.relatedLeadId || '',
        salespersonId: currentUserId || '',
        type: 'call',
        direction: 'outgoing',
        status: 'completed',
        subject: `Follow Up Call: ${interactionTask.title}`,
        notes: interactionNotes,
        createdAt: new Date().toISOString()
      })).unwrap();

      // 2. Complete the task
      await dispatch(updateAction({
        id: interactionTask.id,
        updates: { status: 'completed' }
      })).unwrap();

      setShowInteractionModal(false);
      setInteractionNotes("");
      setInteractionTask(null);

      if (currentUserId) {
        dispatch(fetchActions({ salespersonId: currentUserId }));
        dispatch(fetchTaskKpis());
      }
    } catch (error) {
      console.error("Failed to save interaction:", error);
    }
  };

  const handleBookingSuccess = async () => {
    if (!interactionTask) return;

    try {
      // Complete the task
      await dispatch(updateAction({
        id: interactionTask.id,
        updates: { status: 'completed' }
      })).unwrap();

      setShowInteractionModal(false);
      setInteractionTask(null);
      setInteractionNotes("");

      if (currentUserId) {
        dispatch(fetchActions({ salespersonId: currentUserId }));
        dispatch(fetchTaskKpis());
      }
    } catch (error) {
      console.error("Failed to complete task after booking:", error);
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
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-tight
                            ${task.status === 'completed' ? 'bg-green-100 text-green-700 border border-green-200' :
                              task.status === 'pending' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                                task.status === 'cancelled' ? 'bg-slate-100 text-slate-500 border border-slate-200' :
                                  'bg-blue-100 text-blue-700 border border-blue-200'}`}
                          >
                            {task.status}
                          </span>
                        </div>
                      </td>
                      <td className="p-2.5">
                        <div className="font-bold text-slate-800 text-xs">{task.title}</div>
                        {task.description && (
                          <div className="text-[10px] text-slate-400 line-clamp-1 font-medium mt-0.5">{task.description}</div>
                        )}
                      </td>
                      <td className="p-2.5">
                        {(task.customerId || task.relatedLeadId) ? (
                          <Link
                            to={task.customerId ? `/crm/customers/${task.customerId}` : '#'}
                            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md font-bold text-[10px] transition-all
                              ${task.customerId ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' : 'bg-orange-50 text-orange-700'}`}
                          >
                            <Users className="h-2.5 w-2.5 opacity-60" />
                            {task.customer?.customer
                              ? `${task.customer.customer.firstName || ''} ${task.customer.customer.lastName || ''}`
                              : task.relatedLead
                                ? `${task.relatedLead.firstName || ''} ${task.relatedLead.lastName || ''}`
                                : 'View Profile'}
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
                        <div className="flex gap-1 items-center justify-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setViewingTask(task)}
                            className="h-7 w-7 p-0 bg-white border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200"
                            title="View"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedTask(task);
                              setTaskFormData({
                                customerId: task.customerId || '',
                                relatedLeadId: task.relatedLeadId || '',
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
                            className="h-7 w-7 p-0 bg-white border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200"
                            title="Edit"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 w-7 p-0 bg-white border-slate-200 text-green-600 hover:text-green-700 hover:bg-green-50 hover:border-green-200"
                            onClick={async () => {
                              try {
                                // 1. Set status to in_progress in DB
                                await dispatch(updateAction({
                                  id: task.id,
                                  updates: { status: 'in_progress' }
                                  // Removed unwrap() if it causes issues, but updateAction is likely thunk
                                })).unwrap();

                                // 2. Local state update and open modal
                                setInteractionTask({ ...task, status: 'in_progress' });
                                setInteractionNotes(task.description || "");
                                setShowInteractionModal(true);

                                // 3. Refresh list
                                if (currentUserId) {
                                  dispatch(fetchActions({ salespersonId: currentUserId }));
                                }
                              } catch (err) {
                                console.error("Failed to start interaction:", err);
                              }
                            }}
                            title="Follow Up"
                          >
                            <CornerUpRight className="h-3.5 w-3.5" />
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
                  hideHeader={true}
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

      {/* Task View Modal */}
      {viewingTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h3 className="text-lg font-black text-slate-800">
                  Task Details
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{viewingTask.actionType.replace(/_/g, ' ')}</p>
              </div>
              <Button variant="ghost" onClick={() => setViewingTask(null)} className="h-10 w-10 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                <X className="h-6 w-6" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-sm">
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Title</span>
                <span className="font-bold text-slate-800">{viewingTask.title}</span>
              </div>

              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Description</span>
                <p className="text-slate-700 whitespace-pre-wrap">{viewingTask.description || 'No description provided.'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</span>
                  <span className="font-bold text-slate-700 capitalize">{viewingTask.status.replace(/_/g, ' ')}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Priority</span>
                  <span className="font-bold text-slate-700 capitalize">{viewingTask.priority}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Due Date</span>
                  <span className="font-bold text-slate-700">{formatDate(viewingTask.dueDate)}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Reminder</span>
                  <span className="font-bold text-slate-700">{formatDate(viewingTask.reminderDate)}</span>
                </div>
              </div>

              {(viewingTask.customer || viewingTask.relatedLead) && (
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Associated Contact</span>
                  {viewingTask.customerId ? (
                    <Link
                      to={`/crm/customers/${viewingTask.customerId}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-700 font-bold transition-all"
                    >
                      <Users className="h-4 w-4" />
                      {viewingTask.customer?.customer
                        ? `${viewingTask.customer.customer.firstName} ${viewingTask.customer.customer.lastName}`
                        : 'Customer Record'}
                    </Link>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 rounded-lg text-orange-700 font-bold">
                      <Users className="h-4 w-4" />
                      {viewingTask.relatedLead
                        ? `${viewingTask.relatedLead.firstName} ${viewingTask.relatedLead.lastName}`
                        : 'Lead'}
                    </div>
                  )}
                </div>
              )}

              {viewingTask.isRecurring && (
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Recurrence</span>
                  <span className="flex items-center gap-1.5 font-bold text-slate-700 capitalize">
                    <Repeat className="h-3.5 w-3.5 text-blue-500" />
                    {viewingTask.recurrenceType} (Every {viewingTask.recurrenceInterval})
                  </span>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <Button variant="outline" onClick={() => setViewingTask(null)} className="h-9 px-6 font-bold text-xs bg-white text-slate-700 shadow-sm hover:bg-slate-50">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Interaction Modal */}
      {showInteractionModal && interactionTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h3 className="text-lg font-black text-slate-800">Interaction Panel</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Patient: {
                    interactionTask.customer?.customer
                      ? `${interactionTask.customer.customer.firstName || ''} ${interactionTask.customer.customer.lastName || ''}`
                      : interactionTask.relatedLead
                        ? `${interactionTask.relatedLead.firstName || ''} ${interactionTask.relatedLead.lastName || ''}`
                        : 'Unassigned'
                  }
                </p>
              </div>
              <Button variant="ghost" onClick={() => setShowInteractionModal(false)} className="h-10 w-10 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                <X className="h-6 w-6" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Call Controls */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex items-center justify-between shadow-sm">
                <div className="space-y-1">
                  <div className="text-sm font-bold text-slate-800">Active Outreach</div>
                  <div className="text-xs text-slate-500 font-medium">Ready to contact patient via dialer</div>
                </div>
                <Button
                  onClick={() => setShowDialer(true)}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold h-12 px-6 rounded-xl shadow-lg shadow-green-200 flex items-center gap-2 transition-all active:scale-95"
                >
                  <PhoneCall className="w-5 h-5" /> Let's Call
                </Button>
              </div>

              {/* Remarks Box */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Call Remarks / Outcome</span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[10px] font-bold bg-white text-slate-700 border-slate-200"
                      onClick={() => setShowBookingModal(true)}
                    >
                      <Calendar className="w-3 h-3 mr-1.5 text-blue-500" /> WANTS BOOKING
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[10px] font-bold bg-white text-slate-700 border-slate-200"
                      onClick={async () => {
                        try {
                          // 1. Reset status to pending in DB
                          await dispatch(updateAction({
                            id: interactionTask.id,
                            updates: { status: 'pending' }
                          })).unwrap();

                          // 2. Open edit form
                          setSelectedTask(interactionTask);
                          setTaskFormData({
                            customerId: interactionTask.customerId || '',
                            relatedLeadId: interactionTask.relatedLeadId || '',
                            title: interactionTask.title || '',
                            description: interactionTask.description || '',
                            actionType: interactionTask.actionType,
                            status: 'pending', // Explicitly set to pending
                            dueDate: interactionTask.dueDate ? new Date(interactionTask.dueDate).toISOString().slice(0, 16) : '',
                            reminderDate: interactionTask.reminderDate ? new Date(interactionTask.reminderDate).toISOString().slice(0, 16) : '',
                            priority: interactionTask.priority as any,
                            isRecurring: interactionTask.isRecurring || false,
                            recurrenceType: interactionTask.recurrenceType as any || 'weekly',
                            recurrenceInterval: interactionTask.recurrenceInterval || 1
                          });
                          setIsEditing(true);

                          // 3. Close interaction modal
                          setShowInteractionModal(false);

                          if (currentUserId) {
                            dispatch(fetchActions({ salespersonId: currentUserId }));
                          }
                        } catch (err) {
                          console.error("Failed to reset task to pending:", err);
                        }
                      }}
                    >
                      <Edit className="w-3 h-3 mr-1.5 text-slate-400" /> EDIT DETAIL
                    </Button>
                  </div>
                </div>
                <Textarea
                  placeholder="Summarize the patient's response and next steps..."
                  value={interactionNotes}
                  onChange={(e) => setInteractionNotes(e.target.value)}
                  className="min-h-[150px] rounded-xl border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all resize-none text-sm p-4"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowInteractionModal(false)} className="h-10 px-6 font-bold text-xs bg-white text-slate-700 shadow-sm border-slate-200 rounded-xl">
                Discard
              </Button>
              <Button
                onClick={handleSaveInteraction}
                disabled={!interactionNotes.trim()}
                className="h-10 px-8 font-black text-xs bg-slate-900 text-white shadow-lg rounded-xl hover:bg-slate-800 transition-all disabled:opacity-50"
              >
                Log Interaction & Finish
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Dialer Modal */}
      <DialerModal
        isOpen={showDialer}
        onClose={() => setShowDialer(false)}
        customerName={
          interactionTask?.customer?.customer
            ? `${interactionTask.customer.customer.firstName} ${interactionTask.customer.customer.lastName}`
            : interactionTask?.relatedLead
              ? `${interactionTask.relatedLead.firstName} ${interactionTask.relatedLead.lastName}`
              : 'Patient'
        }
        phoneNumber={
          interactionTask?.customer?.customer?.phone ||
          interactionTask?.relatedLead?.phone ||
          'Unknown'
        }
        onCallEnded={(duration) => {
          setShowDialer(false);
          // Auto-append duration to notes?
          setInteractionNotes(prev => `${prev}\n[Call Duration: ${Math.floor(duration / 60)}m ${duration % 60}s]`.trim());
        }}
      />

      {/* Booking Modal */}
      {showBookingModal && interactionTask && (
        <CRMBookingModal
          isOpen={showBookingModal}
          customerId={interactionTask.customerId || interactionTask.relatedLeadId || ''}
          customerName={
            interactionTask.customer?.customer
              ? `${interactionTask.customer.customer.firstName} ${interactionTask.customer.customer.lastName}`
              : interactionTask.relatedLead
                ? `${interactionTask.relatedLead.firstName} ${interactionTask.relatedLead.lastName}`
                : ''
          }
          customerPhone={interactionTask.customer?.customer?.phone || interactionTask.relatedLead?.phone}
          customerEmail={interactionTask.customer?.customer?.email || interactionTask.relatedLead?.email}
          onClose={() => setShowBookingModal(false)}
          onSuccess={handleBookingSuccess}
        />
      )}
    </div>
  );
};
