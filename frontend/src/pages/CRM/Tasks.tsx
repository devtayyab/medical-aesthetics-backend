import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/atoms/Button/Button';
import { Input } from '@/components/atoms/Input/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/molecules/Card/Card';
import { Link } from 'react-router-dom';
import { Textarea } from '@/components/atoms/Textarea';
import { CRMBookingModal } from '@/components/crm/CRMBookingModal';
import { bookingAPI } from '@/services/api';

import type { RootState, AppDispatch } from '@/store';
import {
  createAction,
  updateAction,
  deleteAction,
  fetchActions,
  fetchTaskKpis,
  fetchClinics,
  logCommunication,
  fetchSalespersons
} from '@/store/slices/crmSlice';
import type { CrmAction } from '@/types';
import { ActionForm } from '@/components/organisms/ActionForm/ActionForm';
import { Select } from '@/components/atoms/Select/Select';
import {
  CheckCircle, Clock, AlertTriangle, Users, Repeat,
  PhoneCall, MoreHorizontal, User, Eye, Plus, Edit, X,
  CornerUpRight, Calendar, Phone, Trash2, UserPlus, Mail,
  Target, Tag, ArrowLeft, ArrowRight, Building2, MousePointer2, Check, MessageSquare,
  Star, PhoneOff, XCircle, CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';

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
  const { actions: tasks, isLoading, taskKpis, salespersons, clinics } = useSelector((state: RootState) => state.crm);
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const currentUserId = user?.id;

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterDateRange, setFilterDateRange] = useState<string>('all');
  const [selectedSalespersonId, setSelectedSalespersonId] = useState<string>(user?.role === 'SUPER_ADMIN' ? 'all' : (user?.id || 'all'));
  const [selectedTask, setSelectedTask] = useState<CrmAction | null>(null);
  const [viewingTask, setViewingTask] = useState<CrmAction | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Interaction States
  const [showInteractionModal, setShowInteractionModal] = useState(false);
  const [interactionTask, setInteractionTask] = useState<CrmAction | null>(null);
  const [interactionNotes, setInteractionNotes] = useState("");
  const [showDialer, setShowDialer] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [appointmentDetail, setAppointmentDetail] = useState<any>(null);
  const [isFetchingApt, setIsFetchingApt] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningTask, setAssigningTask] = useState<CrmAction | null>(null);
  const [newOwnerId, setNewOwnerId] = useState("");

  // New Interaction States for strict workflow
  const [workflowStep, setWorkflowStep] = useState(1);
  const [interactionOutcome, setInteractionOutcome] = useState("");
  const [interactionClinic, setInteractionClinic] = useState("");
  const [callbackDate, setCallbackDate] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [followUpData, setFollowUpData] = useState({
    title: '',
    therapy: '',
    dueDate: '',
    reminderDate: '',
    priority: 'medium'
  });


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
    dispatch(fetchSalespersons());
    dispatch(fetchClinics());
  }, [dispatch]);

  useEffect(() => {
    const sid = selectedSalespersonId === 'all' ? undefined : selectedSalespersonId;
    dispatch(fetchActions({ salespersonId: sid }));
    dispatch(fetchTaskKpis(sid));
  }, [dispatch, selectedSalespersonId]);

  useEffect(() => {
    if (showInteractionModal && interactionTask) {
      setInteractionClinic(interactionTask.clinic || interactionTask.metadata?.clinic || "");
      
      if (interactionTask.metadata?.appointmentId) {
        const fetchAptDetail = async () => {
          setIsFetchingApt(true);
          try {
            const res = await bookingAPI.getAppointment(interactionTask.metadata.appointmentId);
            setAppointmentDetail(res.data);
          } catch (err) {
            console.error("Failed to fetch appointment detail for task:", err);
          } finally {
            setIsFetchingApt(false);
          }
        };
        fetchAptDetail();
      }
    } else {
      setAppointmentDetail(null);
      setInteractionClinic("");
    }
  }, [showInteractionModal, interactionTask]);

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
  }).sort((a, b) => {
    // Default Sorting Logic
    // 1. Overdue first (oldest overdue)
    // 2. Upcoming nearest first
    // Simply sorting by dueDate ascending automatically handles this correctly!
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });


  const handleSaveInteraction = async () => {
    if (!interactionTask || !interactionOutcome || !interactionNotes.trim() || !interactionClinic) {
      toast.error("Outcome, Clinic, and Notes are mandatory.");
      return;
    }

    // If outcome is NOT "not_interested", follow-up fields are mandatory
    if (interactionOutcome !== 'not_interested') {
      if (!followUpData.title || !followUpData.dueDate || !followUpData.reminderDate || !followUpData.therapy) {
        toast.error("Please complete all Mandatory Follow-up fields.");
        return;
      }
    }

    // Compile final notes based on outcome sub-data
    let finalNotes = interactionNotes;
    if (interactionOutcome === 'interested' && callbackDate) {
      finalNotes = `[Callback Scheduled: ${new Date(callbackDate).toLocaleString()}]\n\n${finalNotes}`;
    }
    if (selectedTags.length > 0) {
      finalNotes = `[Tags: ${selectedTags.join(', ')}]\n${finalNotes}`;
    }

    try {
      await dispatch(logCommunication({
        customerId: interactionTask?.customerId || (interactionTask?.customer as any)?.id || undefined,
        relatedLeadId: interactionTask?.relatedLeadId || undefined,
        salespersonId: currentUserId || undefined,
        type: (interactionTask?.actionType === 'mobile_message' ? 'sms' : 
               (interactionTask?.actionType === 'email' ? 'email' : 'call')) as any,
        direction: 'outgoing',
        status: 'completed',
        subject: `[${interactionOutcome.toUpperCase()}] Follow Up: ${interactionTask?.title || 'Interaction'}`,
        notes: finalNotes,
        createdAt: new Date().toISOString(),
        durationSeconds: 0, // Injected if dialer used
        metadata: { 
          callOutcome: interactionOutcome,
          originalTaskId: interactionTask?.id,
          clinic: interactionClinic,
          tags: selectedTags
        }
      })).unwrap();

      // 2. Create follow-up task if needed
      if (interactionOutcome !== 'not_interested') {
        await dispatch(createAction({
          customerId: interactionTask?.customerId || undefined,
          relatedLeadId: interactionTask?.relatedLeadId || undefined,
          salespersonId: currentUserId || undefined,
          title: followUpData.title,
          description: `Follow-up from previous call (${interactionTask?.title}). Notes: ${interactionNotes.slice(0, 50)}...`,
          actionType: 'follow_up_call',
          therapy: followUpData.therapy,
          status: 'pending',
          priority: followUpData.priority as any,
          dueDate: new Date(followUpData.dueDate).toISOString(),
          reminderDate: new Date(followUpData.reminderDate).toISOString(),
          metadata: {
             sourceTaskId: interactionTask?.id
          },
          clinic: interactionClinic
        } as any)).unwrap();
        toast.success("Follow-up task scheduled!");
      }

      // 3. Complete the current task
      if (interactionTask?.id) {
        await dispatch(updateAction({
          id: interactionTask.id,
          updates: { 
            status: 'completed',
            metadata: { ...interactionTask.metadata, callOutcome: interactionOutcome }
          }
        })).unwrap();
      }

      setShowInteractionModal(false);
      setInteractionNotes("");
      setInteractionOutcome("");
      setInteractionClinic("");
      setInteractionTask(null);
      setWorkflowStep(1);
      setSelectedTags([]);
      setCallbackDate("");
      setFollowUpData({ title: '', therapy: '', dueDate: '', reminderDate: '', priority: 'medium' });

      const sid = selectedSalespersonId === 'all' ? undefined : selectedSalespersonId;
      dispatch(fetchActions({ salespersonId: sid }));
      dispatch(fetchTaskKpis(sid));
      toast.success("Interaction logged successfully!");
    } catch (error) {
      console.error("Failed to save interaction:", error);
      toast.error("Failed to process task. Please verify your data.");
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

      const sid = selectedSalespersonId === 'all' ? undefined : selectedSalespersonId;
      dispatch(fetchActions({ salespersonId: sid }));
      dispatch(fetchTaskKpis(sid));
    } catch (error) {
      console.error("Failed to complete task after booking:", error);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !selectedTags.includes(tagInput.trim())) {
      setSelectedTags([...selectedTags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };

  const handleCloseInteraction = async () => {
    if (interactionTask) {
      try {
        await dispatch(updateAction({
          id: interactionTask.id,
          updates: { status: 'pending' }
        })).unwrap();
        const sid = selectedSalespersonId === 'all' ? undefined : selectedSalespersonId;
        dispatch(fetchActions({ salespersonId: sid }));
        dispatch(fetchTaskKpis(sid));
      } catch (err) {
        console.error("Failed to revert task status:", err);
      }
    }
    setShowInteractionModal(false);
    setInteractionTask(null);
    setInteractionNotes("");
  };

  const handleAssignTask = async () => {
    if (!assigningTask || !newOwnerId) return;
    try {
      await dispatch(updateAction({
        id: assigningTask.id,
        updates: { salespersonId: newOwnerId }
      })).unwrap();
      toast.success("Task reassigned successfully!");
      setShowAssignModal(false);
      setAssigningTask(null);
      setNewOwnerId("");
      const sid = selectedSalespersonId === 'all' ? undefined : selectedSalespersonId;
      dispatch(fetchActions({ salespersonId: sid }));
      dispatch(fetchTaskKpis(sid));
    } catch (err) {
      console.error("Failed to reassign task:", err);
      toast.error("Failed to reassign task.");
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

        <div className={`grid grid-cols-1 md:grid-cols-${user?.role === 'SUPER_ADMIN' ? '4' : '3'} gap-2 flex-2 min-w-[65%] w-full`}>
          {user?.role === 'SUPER_ADMIN' && (
            <Select
              placeholder="Select Salesperson"
              options={[
                { value: 'all', label: 'All Salespersons' },
                ...(salespersons || []).map(sp => ({
                  value: sp.id,
                  label: `${sp.firstName} ${sp.lastName} (${sp.pendingTasksCount || 0} Pending)`
                }))
              ]}
              value={selectedSalespersonId}
              onChange={(val) => setSelectedSalespersonId(val)}
              className="flex-1"
            />
          )}
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
              { value: 'appointment', label: 'Appointment (Calendar)' },
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
                    <th className="p-2.5 font-bold text-[10px] uppercase tracking-wider text-slate-500">Owner</th>
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
                          onViewTask ? (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                onViewTask(task);
                              }}
                              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md font-bold text-[10px] transition-all
                                ${task.customerId ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' : 'bg-orange-50 text-orange-700 hover:bg-orange-100'}`}
                            >
                              <Users className="h-2.5 w-2.5 opacity-60" />
                              {task.customer?.customer
                                ? `${task.customer.customer.firstName || ''} ${task.customer.customer.lastName || ''}`
                                : task.relatedLead
                                  ? `${task.relatedLead.firstName || ''} ${task.relatedLead.lastName || ''}`
                                  : 'View Profile'}
                            </button>
                          ) : (
                            <Link
                              to={`/crm/customer/${task.customerId || task.relatedLeadId}`}
                              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md font-bold text-[10px] transition-all
                                ${task.customerId ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' : 'bg-orange-50 text-orange-700 hover:bg-orange-100'}`}
                            >
                              <Users className="h-2.5 w-2.5 opacity-60" />
                              {task.customer?.customer
                                ? `${task.customer.customer.firstName || ''} ${task.customer.customer.lastName || ''}`
                                : task.relatedLead
                                  ? `${task.relatedLead.firstName || ''} ${task.relatedLead.lastName || ''}`
                                  : 'View Profile'}
                            </Link>
                          )
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
                        {(() => {
                           const sp = salespersons?.find(s => s.id === task.salespersonId);
                           return (
                             <div className="flex items-center gap-1.5">
                               <div className="w-5 h-5 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-[9px] font-black text-slate-600 uppercase border border-slate-300">
                                 {sp ? sp.firstName?.charAt(0) : <User className="w-3 h-3" />}
                               </div>
                               <span className="text-[10px] font-bold text-slate-700 whitespace-nowrap">
                                 {sp ? `${sp.firstName} ${sp.lastName}` : 'Unknown'}
                               </span>
                             </div>
                           );
                        })()}
                      </td>
                      <td className="p-2.5">
                        <div className="flex gap-1 items-center justify-center">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md" 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onViewTask) {
                                onViewTask(task);
                              } else {
                                const id = task.customerId || task.relatedLeadId;
                                if (id) navigate(`/crm/customer/${id}`);
                                else setViewingTask(task);
                              }
                            }}
                            title="View Detail"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="xs"
                            variant="white"
                            onClick={(e) => {
                              e.stopPropagation();
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
                            className="h-8 w-8 p-0 bg-white border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-all shadow-sm"
                            title="Edit Strategy"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="xs"
                            variant="white"
                            className="h-8 w-8 p-0 bg-white border-slate-200 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 transition-all shadow-sm"
                            title="Log Interaction"
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                await dispatch(updateAction({
                                  id: task.id,
                                  updates: { status: 'in_progress' }
                                })).unwrap();

                                setInteractionTask({ ...task, status: 'in_progress' });
                                setInteractionNotes(task.description || "");
                                setWorkflowStep(1);
                                setSelectedTags([]);
                                setShowInteractionModal(true);

                                if (true) {
                                  const sid = selectedSalespersonId === 'all' ? undefined : selectedSalespersonId;
                                  dispatch(fetchActions({ salespersonId: sid }));
                                }
                              } catch (err) {
                                console.error("Failed to start interaction:", err);
                              }
                            }}
                          >
                            <CornerUpRight className="h-4 w-4" />
                          </Button>

                          {user?.role === 'SUPER_ADMIN' && (
                            <Button
                              size="xs"
                              variant="white"
                              className="h-8 w-8 p-0 bg-white border-slate-200 text-amber-500 hover:text-amber-700 hover:bg-amber-50 hover:border-amber-300 transition-all shadow-sm"
                              title="Quick Assign"
                              onClick={(e) => {
                                e.stopPropagation();
                                setAssigningTask(task);
                                setNewOwnerId(task.salespersonId || "");
                                setShowAssignModal(true);
                              }}
                            >
                              <UserPlus className="h-4 w-4" />
                            </Button>
                          )}
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
                  onCancel={resetForm}
                  onSuccess={() => {
                    resetForm();
                    const sid = selectedSalespersonId === 'all' ? undefined : selectedSalespersonId;
                    dispatch(fetchActions({ salespersonId: sid }));
                    dispatch(fetchTaskKpis(sid));
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
                  <span className="font-bold text-slate-800 uppercase text-[10px] tracking-tight">{viewingTask.status}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Priority</span>
                  <span className="font-bold text-slate-800 uppercase text-[10px] tracking-tight">{viewingTask.priority}</span>
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
                <h3 className="text-lg font-black text-slate-800">Processing Task</h3>
                <div className="flex items-center gap-2 mt-0.5">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
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
              </div>
              <div className="flex flex-col items-end">
                 <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 uppercase tracking-tighter mb-1">
                   {interactionTask.therapy || 'Standard Therapy'}
                 </span>
                 <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                   {interactionTask.metadata?.clinic || 'Main Clinic'}
                 </span>
              </div>
            </div>

            {/* Multi-Step Interaction Flow Header */}
            <div className="px-8 pt-8 flex items-center justify-between">
              <div className="flex items-center gap-6">
                {[
                  { step: 1, label: 'Outreach', icon: <PhoneCall className="w-4 h-4" /> },
                  { step: 2, label: 'Result', icon: <Target className="w-4 h-4" /> },
                  { step: 3, label: 'Classification', icon: <Tag className="w-4 h-4" /> },
                  { step: 4, label: 'Finish', icon: <CheckCircle className="w-4 h-4" /> }
                ].map((s) => (
                  <div key={s.step} className={`flex items-center gap-2 group transition-all ${workflowStep === s.step ? 'scale-110' : 'opacity-40 grayscale'}`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-lg transition-all ${workflowStep === s.step ? 'bg-slate-900 text-white shadow-slate-200 rotate-3' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
                      {s.icon}
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${workflowStep === s.step ? 'text-slate-900 underline decoration-2 underline-offset-4' : 'text-slate-400'}`}>
                      {s.label}
                    </span>
                    {s.step < 4 && <div className="h-[2px] w-4 bg-slate-100 mx-2" />}
                  </div>
                ))}
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Clinic Center</p>
                <div className="flex items-center gap-2 text-indigo-600 font-black text-sm">
                  <Building2 className="w-4 h-4" />
                  {interactionTask.metadata?.clinic || 'Main Clinic'}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              
              {/* Step 1: Outreach */}
              {workflowStep === 1 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-slate-200 relative overflow-hidden group">
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                      <div className="space-y-4 text-center md:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-emerald-400">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live Dialer Ready
                        </div>
                        <h3 className="text-3xl font-black tracking-tight leading-tight">Initiate Active Outreach</h3>
                        <p className="text-slate-400 font-medium max-w-sm">Use our integrated dialer to contact the patient. Duration and outcome will be logged automatically.</p>
                      </div>
                      <Button
                        onClick={() => {
                          setShowDialer(true);
                        }}
                        className="bg-[#CBFF38] hover:bg-[#A3D900] text-slate-900 font-black h-20 px-12 rounded-3xl shadow-xl shadow-[#CBFF38]/20 flex items-center gap-4 transition-all active:scale-95 text-lg group"
                      >
                        <div className="w-10 h-10 rounded-2xl bg-slate-900/10 flex items-center justify-center group-hover:rotate-12 transition-transform">
                          <PhoneCall className="w-6 h-6" />
                        </div>
                        START CALL NOW
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 group hover:bg-white hover:shadow-xl hover:shadow-slate-100 transition-all cursor-pointer" onClick={() => setWorkflowStep(2)}>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-slate-900 shadow-sm transition-transform group-hover:scale-110">
                          <MousePointer2 className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800">Skip to Result</p>
                          <p className="text-xs text-slate-500 font-medium tracking-tight">Logger without calling</p>
                        </div>
                        <ArrowRight className="w-5 h-5 ml-auto text-slate-300 group-hover:text-slate-900" />
                      </div>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 group hover:bg-white hover:shadow-xl hover:shadow-slate-100 transition-all cursor-pointer" onClick={() => setShowEmailModal(true)}>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-slate-900 shadow-sm transition-transform group-hover:scale-110">
                          <MessageSquare className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800">Switch to Messaging</p>
                          <p className="text-xs text-slate-500 font-medium tracking-tight">Log email or chat instead</p>
                        </div>
                        <ArrowRight className="w-5 h-5 ml-auto text-slate-300 group-hover:text-slate-900" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Result Selection */}
              {workflowStep === 2 && (
                <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">What was the outcome?</h3>
                    <Button variant="ghost" onClick={() => setWorkflowStep(1)} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 bg-slate-50 rounded-xl px-4">
                      <ArrowLeft className="w-3.5 h-3.5 mr-2" /> Back to Outreach
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { value: 'interested', label: 'Interested', icon: <Star className="w-8 h-8 fill-amber-400 text-amber-400" />, color: 'hover:border-amber-400 hover:bg-amber-50 shadow-amber-100' },
                      { value: 'call_later', label: 'Call Back Later', icon: <Clock className="w-8 h-8 text-blue-500" />, color: 'hover:border-blue-400 hover:bg-blue-50 shadow-blue-100' },
                      { value: 'no_answer', label: 'No Answer', icon: <PhoneOff className="w-8 h-8 text-slate-400" />, color: 'hover:border-gray-400 hover:bg-gray-50 shadow-gray-100' },
                      { value: 'not_interested', label: 'Not Interested', icon: <XCircle className="w-8 h-8 text-red-500" />, color: 'hover:border-red-400 hover:bg-red-50 shadow-red-100' },
                      { value: 'appointment_booked', label: 'Appointment Booked', icon: <CheckCircle2 className="w-8 h-8 text-emerald-500" />, color: 'hover:border-emerald-400 hover:bg-emerald-50 shadow-emerald-100' },
                      { value: 'wrong_number', label: 'Wrong Number', icon: <AlertTriangle className="w-8 h-8 text-yellow-500" />, color: 'hover:border-yellow-400 hover:bg-yellow-50 shadow-yellow-100' }
                    ].map((opt) => (
                      <div 
                        key={opt.value}
                        onClick={() => {
                          setInteractionOutcome(opt.value);
                          if (opt.value === 'appointment_booked') {
                            setShowBookingModal(true);
                          } else {
                            setWorkflowStep(3);
                          }
                        }}
                        className={`group relative p-6 rounded-[2rem] border-2 transition-all cursor-pointer text-center bg-white hover:scale-[1.02] hover:shadow-2xl flex flex-col items-center justify-center gap-3 ${interactionOutcome === opt.value ? 'border-indigo-600 bg-indigo-50 shadow-indigo-100' : 'border-slate-100 ' + opt.color}`}
                      >
                        <div className="filter grayscale group-hover:grayscale-0 transition-all transform group-hover:scale-110">{opt.icon}</div>
                        <span className="text-xs font-black uppercase tracking-widest text-slate-800">{opt.label}</span>
                        <div className="absolute top-4 right-4 w-6 h-6 rounded-full border-2 border-slate-100 group-hover:border-slate-900 transition-colors flex items-center justify-center">
                          <Check className={`w-3 h-3 ${interactionOutcome === opt.value ? 'text-indigo-600' : 'opacity-0'}`} strokeWidth={4} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Outcome specific logic like "Call Later" date picker */}
                  {interactionOutcome === 'call_later' && (
                    <div className="bg-blue-50/50 border border-blue-100 rounded-[2rem] p-6 animate-in slide-in-from-top-4">
                       <p className="text-[10px] font-black text-blue-800 uppercase tracking-widest mb-4 px-1">When should we callback?</p>
                       <Input 
                          type="datetime-local" 
                          value={callbackDate}
                          onChange={(e) => setCallbackDate(e.target.value)}
                          className="h-14 text-sm font-black rounded-2xl border-blue-200 focus:bg-white bg-white/50"
                        />
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Classification (Tags) */}
              {workflowStep === 3 && (
                <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Classify this Outcome</h3>
                    <Button variant="ghost" onClick={() => setWorkflowStep(2)} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 bg-slate-50 rounded-xl px-4">
                      <ArrowLeft className="w-3.5 h-3.5 mr-2" /> Back to Outcome
                    </Button>
                  </div>

                  <div className="bg-slate-50/50 border border-slate-200 rounded-[2.5rem] p-8 space-y-6">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-3 block">Mandatory Classification Tags</label>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {selectedTags.map(tag => (
                          <span key={tag} className="flex items-center gap-2 bg-slate-900 text-[#CBFF38] text-[10px] font-black px-4 py-2 rounded-xl shadow-lg shadow-slate-200 border border-slate-800 animate-in zoom-in-50">
                            {tag}
                            <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedTags(selectedTags.filter(t => t !== tag))} />
                          </span>
                        ))}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {['HIGH PRIORITY', 'NO ANSWER', 'CALL AGAIN', 'WARM LEAD', 'PRICE SENSITIVE', 'SERIOUS INTEREST', 'INFO ONLY', 'WRONG NUMBER'].map(tag => (
                          <button 
                            key={tag}
                            onClick={() => {
                              if (selectedTags.includes(tag)) {
                                removeTag(tag);
                              } else {
                                setSelectedTags([...selectedTags, tag]);
                              }
                            }}
                            className={`p-3 rounded-xl border text-[10px] font-black uppercase tracking-tight transition-all text-center ${selectedTags.includes(tag) ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-900 hover:text-slate-900'}`}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-6 border-t border-slate-200">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-3 block">Add Specialized Tag</label>
                      <div className="flex gap-2">
                        <Input 
                          placeholder="e.g. Needs Botox Special..." 
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                          className="h-12 text-sm font-bold rounded-2xl border-slate-200"
                        />
                        <Button onClick={handleAddTag} className="h-12 px-6 bg-slate-900 text-white font-black text-[10px] uppercase rounded-2xl">Add</Button>
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={() => setWorkflowStep(4)}
                    className="w-full h-16 bg-slate-900 text-white font-black text-xs uppercase tracking-[0.2em] rounded-3xl shadow-2xl shadow-slate-300 transition-all active:scale-95 flex items-center justify-center gap-3"
                  >
                    CONTINUE TO FINAL REVIEW <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Step 4: Finish & Review */}
              {workflowStep === 4 && (
                <div className="space-y-8 animate-in slide-in-from-right-8 duration-500 pb-10">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Final Summary & Protocol</h3>
                    <Button variant="ghost" onClick={() => setWorkflowStep(3)} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 bg-slate-50 rounded-xl px-4">
                      <ArrowLeft className="w-3.5 h-3.5 mr-2" /> Back to Tags
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                       <div className="p-1 bg-slate-50 rounded-[3rem] border border-slate-100 shadow-inner">
                         <div className="p-8 space-y-4">
                           <div className="flex items-center justify-between">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Internal Remarks</label>
                             <span className="text-[9px] font-black text-red-500 uppercase tracking-tighter">Required for logs</span>
                           </div>
                           <Textarea
                             placeholder="Describe the interaction details for the team..."
                             value={interactionNotes}
                             onChange={(e) => setInteractionNotes(e.target.value)}
                             className="min-h-[220px] rounded-[2rem] border-transparent focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50 transition-all resize-none text-sm p-6 font-medium shadow-none bg-white"
                           />
                         </div>
                       </div>
                    </div>

                    <div className="space-y-6">
                       {/* Mandatory Follow-up for anything not terminal */}
                       {interactionOutcome !== 'not_interested' && interactionOutcome !== 'wrong_number' && (
                         <div className="bg-amber-50/50 border-2 border-amber-200 rounded-[2.5rem] p-8 space-y-6">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-[1.25rem] bg-amber-100 flex items-center justify-center text-amber-600 shadow-inner">
                                <Clock className="w-6 h-6" />
                              </div>
                              <div>
                                <h4 className="text-md font-black text-slate-800">Mandatory Follow-up</h4>
                                <p className="text-[10px] font-bold text-amber-600/70 uppercase tracking-widest">Protocol strictly enforced</p>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Follow-up Goal</label>
                                <Input 
                                  placeholder="e.g. Re-try calling..." 
                                  value={followUpData.title}
                                  onChange={(e) => setFollowUpData({...followUpData, title: e.target.value})}
                                  className="h-12 text-xs font-bold rounded-2xl border-amber-100"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Next Contact</label>
                                  <Input type="datetime-local" value={followUpData.dueDate} onChange={(e) => setFollowUpData({...followUpData, dueDate: e.target.value})} className="h-12 text-xs font-bold rounded-2xl border-amber-100" />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Protocol Ref</label>
                                  <Input placeholder="Botox" value={followUpData.therapy} onChange={(e) => setFollowUpData({...followUpData, therapy: e.target.value})} className="h-12 text-xs font-bold rounded-2xl border-amber-100" />
                                </div>
                              </div>
                            </div>
                         </div>
                       )}

                       {/* Confirmation Specific Section */}
                       {interactionTask?.title === 'Confirmation Call Reminder' && (
                          <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-blue-100 space-y-4">
                            <h4 className="text-xs font-black uppercase tracking-widest opacity-80">Quick Confirmation</h4>
                            <div className="grid grid-cols-2 gap-3">
                              <Button onClick={() => setInteractionNotes(n => `CONFIRMED: ${n}`)} className="h-12 bg-white/10 hover:bg-white/20 text-white font-black text-[10px] uppercase rounded-2xl border border-white/20">Yes, Confirmed</Button>
                              <Button onClick={() => setInteractionNotes(n => `CANCELLED: ${n}`)} className="h-12 bg-white/10 hover:bg-white/20 text-white font-black text-[10px] uppercase rounded-2xl border border-white/20">Client Cancelled</Button>
                            </div>
                          </div>
                       )}

                       <Button
                        onClick={handleSaveInteraction}
                        disabled={!interactionNotes.trim() || (interactionOutcome !== 'not_interested' && interactionOutcome !== 'wrong_number' && (!followUpData.title || !followUpData.dueDate || !followUpData.therapy))}
                        className="w-full h-16 bg-[#CBFF38] hover:bg-[#A3D900] text-slate-900 font-black text-xs uppercase tracking-[0.25em] rounded-[2rem] shadow-2xl shadow-[#CBFF38]/30 transition-all flex items-center justify-center gap-3 disabled:grayscale disabled:opacity-50"
                      >
                        <CheckCircle className="w-5 h-5" /> SAVE COMPLETE RECORD
                      </Button>
                    </div>
                  </div>
                </div>
              )}
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
      {/* Quick Assign Modal */}
      {showAssignModal && assigningTask && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h3 className="text-md font-black text-slate-800">Quick Assign</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reassign Task Owner</p>
              </div>
              <Button variant="ghost" onClick={() => setShowAssignModal(false)} className="h-8 w-8 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                <X className="h-5 h-5" />
              </Button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                <div className="text-[10px] font-bold text-blue-400 uppercase mb-1">Active Task</div>
                <div className="text-xs font-black text-blue-900 truncate">{assigningTask.title}</div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select New Owner</label>
                <Select
                  placeholder="Choose Salesperson..."
                  options={(salespersons || []).map(sp => ({
                    value: sp.id,
                    label: `${sp.firstName} ${sp.lastName} (${sp.pendingTasksCount || 0} Pending)`
                  }))}
                  value={newOwnerId}
                  onChange={(val) => setNewOwnerId(val)}
                  className="w-full"
                />
              </div>
              
              <Button 
                onClick={handleAssignTask}
                disabled={!newOwnerId || newOwnerId === assigningTask?.salespersonId}
                className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95"
              >
                Confirm Assignment
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Messaging Modal */}
      {showEmailModal && interactionTask && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h3 className="text-lg font-black text-slate-800">Direct Messaging</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Logging Email/SMS Communication</p>
              </div>
              <Button variant="ghost" onClick={() => setShowEmailModal(false)} className="h-10 w-10 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                <X className="h-6 w-6" />
               </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
               <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-indigo-600 shadow-sm">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest leading-none mb-1">Target Recipient</p>
                    <p className="text-sm font-black text-indigo-900">
                      {interactionTask.customer?.customer
                        ? `${interactionTask.customer.customer.firstName} ${interactionTask.customer.customer.lastName}`
                        : interactionTask.relatedLead
                        ? `${interactionTask.relatedLead.firstName} ${interactionTask.relatedLead.lastName}`
                        : 'Unknown Client'}
                    </p>
                  </div>
               </div>

               <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Communication Channel</label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" className={`h-12 rounded-xl text-xs font-black ${interactionTask.actionType === 'email' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100'}`}>
                        EMAIL PORTAL
                      </Button>
                      <Button variant="outline" className={`h-12 rounded-xl text-xs font-black ${interactionTask.actionType === 'mobile_message' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100'}`}>
                        SMS / WHATSAPP
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Message Detail / Log</label>
                     <Textarea 
                        placeholder="Paste message content here or describe the communication..."
                        value={interactionNotes}
                        onChange={(e) => setInteractionNotes(e.target.value)}
                        className="min-h-[150px] rounded-2xl border-slate-100 focus:ring-4 focus:ring-indigo-50 transition-all text-sm p-4 font-medium"
                     />
                  </div>
               </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3">
              <Button variant="ghost" onClick={() => setShowEmailModal(false)} className="h-12 flex-1 rounded-xl font-bold text-slate-500 hover:bg-white text-xs">Cancel</Button>
              <Button 
                onClick={() => {
                  setShowEmailModal(false);
                  setWorkflowStep(2); // Move to outcome step after logging message
                }}
                disabled={!interactionNotes.trim()}
                className="h-12 flex-[2] bg-slate-900 text-white hover:bg-black rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-200 transition-all active:scale-95"
              >
                Continue to Outcome
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
