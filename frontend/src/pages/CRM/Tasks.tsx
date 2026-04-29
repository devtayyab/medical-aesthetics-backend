import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  Star, PhoneOff, XCircle, CheckCircle2, Search
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
      customerId: undefined,
      relatedLeadId: undefined,
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

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this task? This action cannot be undone.")) {
      try {
        await dispatch(deleteAction(id)).unwrap();
        toast.success("Task deleted successfully");
        const sid = selectedSalespersonId === 'all' ? undefined : selectedSalespersonId;
        dispatch(fetchActions({ salespersonId: sid }));
        dispatch(fetchTaskKpis(sid));
      } catch (err) {
        toast.error("Failed to delete task");
        console.error(err);
      }
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
    if (filterStatus === 'overdue') {
      if (!isOverdue(task)) return false;
    } else if (filterStatus === 'pending') {
      if (task.status !== 'pending' || isOverdue(task)) return false;
    } else if (filterStatus !== 'all' && task.status !== filterStatus) {
      return false;
    }

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


  const handleSaveInteraction = async (outcomeArg?: any) => {
    // Ensure we only use the outcome if it's a string (to ignore React events from onClick)
    const overrideOutcome = typeof outcomeArg === 'string' ? outcomeArg : undefined;
    const effectiveOutcome = overrideOutcome || interactionOutcome || 'none';
    const defaultNote = effectiveOutcome === 'interested' ? 'Customer expressed serious interest.' : 'Interaction logged';
    const effectiveNotes = interactionNotes.trim() || defaultNote;

    // Follow-up logic
    const hasFollowUpInfo = followUpData.title || followUpData.dueDate || followUpData.therapy;
    const isFollowUpComplete = followUpData.title && followUpData.dueDate && followUpData.therapy;

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
        subject: `[${effectiveOutcome.toUpperCase()}] Follow Up: ${interactionTask?.title || 'Interaction'}`,
        notes: finalNotes,
        createdAt: new Date().toISOString(),
        durationSeconds: 0, 
        metadata: { 
          callOutcome: effectiveOutcome,
          originalTaskId: interactionTask?.id,
          clinic: interactionClinic || interactionTask?.clinic || interactionTask?.metadata?.clinic || undefined,
          tags: selectedTags
        }
      })).unwrap();

      // 2. Create follow-up task
      const shouldCreateTask = (effectiveOutcome === 'not_interested') || (followUpData.title && followUpData.dueDate && followUpData.therapy);
      
      if (shouldCreateTask && effectiveOutcome !== 'wrong_number') {
        const safeISO = (d: string) => {
          if (!d) return undefined;
          const date = new Date(d);
          return isNaN(date.getTime()) ? undefined : date.toISOString();
        };
        const defaultDateStr = new Date(Date.now() + 86400000 * 7).toISOString();
        
        await dispatch(createAction({
          customerId: interactionTask?.customerId || undefined,
          relatedLeadId: interactionTask?.relatedLeadId || undefined,
          salespersonId: currentUserId || undefined,
          title: followUpData.title || `Follow-up: ${effectiveOutcome.replace('_', ' ')}`,
          description: `Interaction Notes: ${effectiveNotes.slice(0, 100)}`,
          actionType: 'follow_up_call',
          therapy: followUpData.therapy || interactionTask?.therapy || 'General',
          status: 'pending',
          priority: followUpData.priority || 'medium',
          dueDate: safeISO(followUpData.dueDate) || defaultDateStr,
          reminderDate: safeISO(followUpData.reminderDate) || safeISO(followUpData.dueDate) || defaultDateStr,
          metadata: {
             sourceTaskId: interactionTask?.id,
             outcome: effectiveOutcome
          },
          clinic: interactionClinic || interactionTask?.clinic || interactionTask?.metadata?.clinic || undefined
        } as any)).unwrap();
        toast.success(effectiveOutcome === 'not_interested' ? "Re-engagement task created." : "Follow-up task scheduled!");
      }

      // 3. Complete or update the current task (Reschedule if needed)
      if (interactionTask?.id) {
        const nextStatus = (effectiveOutcome === 'call_later' || effectiveOutcome === 'no_answer') ? 'pending' : 'completed';
        
        const updates: any = { 
          status: nextStatus,
          metadata: { ...(interactionTask.metadata || {}), callOutcome: effectiveOutcome }
        };

        // If rescheduling (Call Later / No Answer), update the dates to clear "OVERDUE" status
        if ((effectiveOutcome === 'call_later' || effectiveOutcome === 'no_answer')) {
          const newDate = callbackDate ? new Date(callbackDate).toISOString() : new Date(Date.now() + 3600000).toISOString(); // Default 1h later if no date selected
          updates.dueDate = newDate;
          updates.reminderDate = newDate;
        }

        await dispatch(updateAction({
          id: interactionTask.id,
          updates
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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-4 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2 text-blue-600">
            <Users className="h-4 w-4" />
            <span className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">Total</span>
          </div>
          <div className="text-2xl font-black text-slate-900 leading-none">{taskKpis?.total || 0}</div>
        </div>

        <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-4 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2 text-yellow-600">
            <Clock className="h-4 w-4" />
            <span className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">Pending</span>
          </div>
          <div className="text-2xl font-black text-slate-900 leading-none">{taskKpis?.pending || 0}</div>
        </div>

        <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-4 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2 text-red-600">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">Overdue</span>
          </div>
          <div className="text-2xl font-black text-slate-900 leading-none">{taskKpis?.overdue || 0}</div>
        </div>

        <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-4 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2 text-indigo-600">
            <Repeat className="h-4 w-4" />
            <span className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">In-progress</span>
          </div>
          <div className="text-2xl font-black text-slate-900 leading-none">{taskKpis?.inProgress || 0}</div>
        </div>

        <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-4 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">Done</span>
          </div>
          <div className="text-2xl font-black text-slate-900 leading-none">{taskKpis?.completed || 0}</div>
        </div>
      </div>

      <div className="flex flex-col gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="w-full">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-black" />
            <Input
              placeholder="Search tasks by title, contact, type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 text-xs font-bold bg-slate-50/50 border-slate-100 rounded-xl focus:bg-white transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {user?.role === 'SUPER_ADMIN' && (
            <Select
              placeholder="All Salespersons"
              options={[
                { value: 'all', label: 'Global Team' },
                ...(salespersons || [])
                  .filter(sp => sp.role === 'salesperson' || sp.role === 'SUPER_ADMIN')
                  .map(sp => ({
                    value: sp.id,
                    label: `${sp.firstName} ${sp.lastName}`
                  }))
              ]}
              value={selectedSalespersonId}
              onChange={(val) => setSelectedSalespersonId(val)}
              className="h-10 text-[10px] font-black uppercase italic"
            />
          )}
          <Select
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'pending', label: 'Pending Status' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'overdue', label: 'Overdue Status' },
              { value: 'completed', label: 'Done' }
            ]}
            value={filterStatus}
            onChange={(val) => setFilterStatus(val)}
            className="h-10 text-[10px] font-black uppercase italic"
          />
          <Select
            options={[
              { value: 'all', label: 'All Action Types' },
              { value: 'call', label: 'Calls Only' },
              { value: 'mobile_message', label: 'SMS/Mobile' },
              { value: 'appointment', label: 'Appointments' }
            ]}
            value={filterType}
            onChange={(val) => setFilterType(val)}
            className="h-10 text-[10px] font-black uppercase italic"
          />
          <Select
            options={[
              { value: 'all', label: 'Timeline: Any' },
              { value: 'today', label: 'Due: Today' },
              { value: 'next_7_days', label: 'Due: Next 7 Days' },
              { value: 'overdue', label: 'Status: Overdue' }
            ]}
            value={filterDateRange}
            onChange={(val) => setFilterDateRange(val)}
            className="h-10 text-[10px] font-black uppercase italic"
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
                              isOverdue(task) ? 'bg-red-100 text-red-700 border border-red-200' :
                                task.status === 'pending' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                                  task.status === 'cancelled' ? 'bg-slate-100 text-slate-500 border border-slate-200' :
                                    'bg-blue-100 text-blue-700 border border-blue-200'}`}
                          >
                            {isOverdue(task) ? 'overdue' : task.status}
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
                                id: task.id,
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
                            <div className="flex gap-1 items-center">
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
                              <Button
                                size="xs"
                                variant="white"
                                className="h-8 w-8 p-0 bg-white border-slate-200 text-red-500 hover:text-red-700 hover:bg-red-50 hover:border-red-300 transition-all shadow-sm"
                                title="Delete Task"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(task.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
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

      {/* Task Edit Modal */}
      {isEditing && selectedTask && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto" style={{ zIndex: 99999 }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden my-8">
            <ActionForm 
              customerId={selectedTask.customerId || ''}
              prefilledData={taskFormData}
              onSuccess={() => {
                setIsEditing(false);
                setSelectedTask(null);
                const sid = selectedSalespersonId === 'all' ? undefined : selectedSalespersonId;
                dispatch(fetchActions({ salespersonId: sid }));
                dispatch(fetchTaskKpis(sid));
              }}
              onCancel={() => {
                setIsEditing(false);
                setSelectedTask(null);
              }}
            />
          </div>
        </div>,
        document.body
      )}

      {showInteractionModal && interactionTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex justify-end animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-[500px] shadow-2xl animate-in slide-in-from-right duration-500 flex flex-col h-full border-l border-slate-100">
            <div className="flex items-center justify-between px-6 py-6 border-b border-slate-50">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#CBFF38] animate-pulse" />
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tighter">Process Task</h3>
                </div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                  {interactionTask.customer?.customer
                    ? `${interactionTask.customer.customer.firstName || ''} ${interactionTask.customer.customer.lastName || ''}`
                    : interactionTask.relatedLead
                      ? `${interactionTask.relatedLead.firstName || ''} ${interactionTask.relatedLead.lastName || ''}`
                      : 'Unassigned'}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowInteractionModal(false)} className="rounded-xl hover:bg-slate-50">
                <X className="w-5 h-5 text-slate-400" />
              </Button>
            </div>

            {/* Vertical Stepper Header */}
            <div className="px-6 py-4 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {[1, 2, 3, 4].map((s) => (
                  <div key={s} className="flex items-center">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-black transition-all ${workflowStep === s ? 'bg-black text-[#CBFF38] shadow-lg shadow-lime-500/20' : workflowStep > s ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-400'}`}>
                      {workflowStep > s ? <Check className="w-4 h-4" /> : s}
                    </div>
                    {s < 4 && <div className={`w-4 h-px mx-1 ${workflowStep > s ? 'bg-slate-900' : 'bg-slate-200'}`} />}
                  </div>
                ))}
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">
                Step {workflowStep}/4
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              
              {/* Step 1: Outreach */}
              {workflowStep === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden group">
                    <div className="relative z-10 space-y-6">
                      <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] text-[#CBFF38]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#CBFF38] animate-pulse" /> Live Dialer Ready
                        </div>
                        <h3 className="text-2xl font-black tracking-tighter leading-tight italic">Initiate Call</h3>
                        <p className="text-slate-400 text-[11px] font-medium leading-relaxed max-w-[280px]">Automated logging is active. Click below to begin the outreach session.</p>
                      </div>
                      
                      <Button
                        onClick={() => setShowDialer(true)}
                        className="w-full bg-[#CBFF38] hover:bg-[#D9FF66] text-black font-black h-16 rounded-2xl shadow-xl shadow-lime-500/10 flex items-center justify-center gap-3 transition-all active:scale-95 text-xs uppercase tracking-[0.15em]"
                      >
                        <PhoneCall className="w-5 h-5" />
                        Start Active Call
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:bg-white hover:shadow-lg transition-all cursor-pointer" onClick={() => setWorkflowStep(2)}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-900 border border-slate-100">
                          <MousePointer2 className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[11px] font-black text-slate-900 uppercase">Skip to Result</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Log without calling</p>
                        </div>
                        <ArrowRight className="w-4 h-4 ml-auto text-slate-300 group-hover:text-black" />
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:bg-white hover:shadow-lg transition-all cursor-pointer" onClick={() => setShowEmailModal(true)}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-900 border border-slate-100">
                          <MessageSquare className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[11px] font-black text-slate-900 uppercase">Switch to Email</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Send message instead</p>
                        </div>
                        <ArrowRight className="w-4 h-4 ml-auto text-slate-300 group-hover:text-black" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Result Selection */}
              {workflowStep === 2 && (
                <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-slate-900 uppercase italic">Interaction Result</h3>
                    <Button variant="ghost" onClick={() => setWorkflowStep(1)} className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-black">
                      <ArrowLeft className="w-3 h-3 mr-1" /> Back
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'interested', label: 'Interested', icon: <Star className="w-5 h-5 fill-amber-400 text-amber-400" />, color: 'hover:border-amber-400 hover:bg-amber-50' },
                      { value: 'call_later', label: 'Call Later', icon: <Clock className="w-5 h-5 text-blue-500" />, color: 'hover:border-blue-400 hover:bg-blue-50' },
                      { value: 'no_answer', label: 'No Answer', icon: <PhoneOff className="w-5 h-5 text-slate-400" />, color: 'hover:border-gray-400 hover:bg-gray-50' },
                      { value: 'not_interested', label: 'Not Interested', icon: <XCircle className="w-5 h-5 text-red-500" />, color: 'hover:border-red-400 hover:bg-red-50' },
                      { value: 'appointment_booked', label: 'Booked', icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />, color: 'hover:border-emerald-400 hover:bg-emerald-50' },
                      { value: 'wrong_number', label: 'Wrong Num', icon: <AlertTriangle className="w-5 h-5 text-yellow-500" />, color: 'hover:border-yellow-400 hover:bg-yellow-50' }
                    ].map((opt) => (
                      <div 
                        key={opt.value}
                        onClick={async () => {
                          setInteractionOutcome(opt.value);
                          if (opt.value === 'interested') {
                            // Quick complete for "Interested" as requested
                            await handleSaveInteraction(opt.value);
                          } else if (opt.value === 'appointment_booked') {
                            setShowBookingModal(true);
                          } else {
                            setWorkflowStep(3);
                          }
                        }}
                        className={`group relative p-4 rounded-xl border transition-all cursor-pointer flex items-center gap-3 bg-white ${interactionOutcome === opt.value ? 'border-black bg-slate-50' : 'border-slate-100 ' + opt.color}`}
                      >
                        <div className="transition-transform group-hover:scale-110">{opt.icon}</div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">{opt.label}</span>
                        <div className={`ml-auto w-4 h-4 rounded-full border flex items-center justify-center ${interactionOutcome === opt.value ? 'bg-black border-black' : 'border-slate-200'}`}>
                          {interactionOutcome === opt.value && <Check className="w-2.5 h-2.5 text-[#CBFF38]" strokeWidth={4} />}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Outcome specific logic like "Call Later" date picker */}
                  {interactionOutcome === 'call_later' && (
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 animate-in slide-in-from-top-4">
                       <p className="text-[9px] font-black text-blue-800 uppercase tracking-widest mb-3">Recall Schedule</p>
                       <Input 
                          type="datetime-local" 
                          value={callbackDate}
                          onChange={(e) => setCallbackDate(e.target.value)}
                          className="h-10 text-[11px] font-black rounded-lg border-blue-200 bg-white"
                        />
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Classification (Tags) */}
              {workflowStep === 3 && (
                <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-slate-900 uppercase italic">Classification</h3>
                    <Button variant="ghost" onClick={() => setWorkflowStep(2)} className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-black">
                      <ArrowLeft className="w-3 h-3 mr-1" /> Back
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {selectedTags.map(tag => (
                        <span key={tag} className="flex items-center gap-1.5 bg-black text-[#CBFF38] text-[9px] font-black px-3 py-1.5 rounded-lg border border-black shadow-lg shadow-lime-500/10">
                          {tag}
                          <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedTags(selectedTags.filter(t => t !== tag))} />
                        </span>
                      ))}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
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
                            className={`p-2.5 rounded-lg border text-[9px] font-black uppercase tracking-tight transition-all text-center ${selectedTags.includes(tag) ? 'bg-black border-black text-[#CBFF38]' : 'bg-white border-slate-100 text-slate-400 hover:border-black hover:text-black'}`}
                          >
                            {tag}
                          </button>
                        ))}
                    </div>

                    <div className="flex gap-2 pt-2">
                        <Input 
                          placeholder="Custom tag..." 
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                          className="h-10 text-[11px] font-bold rounded-lg border-slate-200"
                        />
                        <Button onClick={handleAddTag} className="h-10 px-4 bg-black text-[#CBFF38] font-black text-[9px] uppercase rounded-lg">Add</Button>
                    </div>
                  </div>

                  <Button 
                    onClick={() => setWorkflowStep(4)}
                    className="w-full h-14 bg-black text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    Review Final Protocol <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Step 4: Finish & Review */}
              {workflowStep === 4 && (
                <div className="space-y-6 animate-in slide-in-from-right-8 duration-500 pb-10">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-slate-900 uppercase italic">Final Protocol</h3>
                    <Button variant="ghost" onClick={() => setWorkflowStep(3)} className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-black">
                      <ArrowLeft className="w-3 h-3 mr-1" /> Back
                    </Button>
                  </div>
 
                  <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl space-y-4">
                    <div className="flex items-center justify-between">
                       <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.3em]">Outcome</span>
                       <span className="text-[10px] font-black text-[#CBFF38] uppercase tracking-widest italic">{interactionOutcome?.replace('_', ' ')}</span>
                    </div>
                    
                    <Textarea
                      placeholder="Enter internal interaction remarks..."
                      value={interactionNotes}
                      onChange={(e) => setInteractionNotes(e.target.value)}
                      className="min-h-[120px] rounded-xl border-white/10 bg-white/5 text-white text-[11px] font-medium p-4 focus:bg-white/10"
                    />

                    {(interactionOutcome === 'interested' || interactionOutcome === 'appointment_booked') && (
                      <Button 
                        onClick={() => setShowBookingModal(true)}
                        className="w-full h-10 bg-[#CBFF38] text-black font-black text-[9px] uppercase tracking-widest rounded-lg flex items-center justify-center gap-2"
                      >
                        <Calendar className="w-3.5 h-3.5" /> Open Booking System
                      </Button>
                    )}
                  </div>

                  {interactionOutcome !== 'not_interested' && interactionOutcome !== 'wrong_number' && (
                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-600" />
                        <span className="text-[10px] font-black text-slate-900 uppercase">Follow-up Goal</span>
                      </div>
                      <Input 
                        placeholder="Next contact goal..." 
                        value={followUpData.title}
                        onChange={(e) => setFollowUpData({...followUpData, title: e.target.value})}
                        className="h-10 text-[11px] font-bold rounded-lg border-amber-200"
                      />
                      <div className="grid grid-cols-1 gap-2">
                        <Input type="datetime-local" value={followUpData.dueDate} onChange={(e) => setFollowUpData({...followUpData, dueDate: e.target.value})} className="h-10 text-[10px] font-bold rounded-lg border-amber-200" />
                      </div>
                    </div>
                  )}



                  <Button
                    onClick={handleSaveInteraction}
                    className="w-full h-16 bg-black text-[#CBFF38] font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl shadow-2xl transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" /> Save Complete Record
                  </Button>
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
          // Auto-append duration to notes
          setInteractionNotes(prev => `${prev}\n[Call Duration: ${Math.floor(duration / 60)}m ${duration % 60}s]`.trim());
          // Automatically move to results step after call ends
          setWorkflowStep(2);
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
                <X className="h-5 w-5" />
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
                  options={(salespersons || [])
                    .filter((sp: any) => ['salesperson', 'SUPER_ADMIN', 'manager', 'admin'].includes(sp.role))
                    .map(sp => ({
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
