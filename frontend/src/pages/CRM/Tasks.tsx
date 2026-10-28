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
import { bookingAPI, crmAPI } from '@/services/api';
import { TaskCallNotes } from '@/components/crm/TaskCallNotes';
import {
  CALL_OUTCOMES,
  KEEP_TASK_OPEN_OUTCOMES,
  formatAthens,
  nextWorkingDay0800,
  toLocalInputValue,
} from '@/constants/callOutcomes';

import type { RootState, AppDispatch } from '@/store';
import {
  updateAction,
  deleteAction,
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
  Star, PhoneOff, XCircle, CheckCircle2, Search, Bell, ListTodo, Lock
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
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 p-4">
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
  const [isGreek, setIsGreek] = useState(
    () => typeof window !== 'undefined' && localStorage.getItem('preferredLang') === 'el'
  );

  useEffect(() => {
    const handleLang = () => {
      setIsGreek(localStorage.getItem('preferredLang') === 'el');
    };
    window.addEventListener('storage', handleLang);
    window.addEventListener('languagechange', handleLang);
    return () => {
      window.removeEventListener('storage', handleLang);
      window.removeEventListener('languagechange', handleLang);
    };
  }, []);

  const { taskKpis, salespersons, clinics } = useSelector((state: RootState) => state.crm);
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const currentUserId = user?.id;

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterDateRange, setFilterDateRange] = useState<string>('today');
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
  const [callMade, setCallMade] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
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
  // Interested remarks
  const [showInterestedRemarks, setShowInterestedRemarks] = useState(false);
  const [interestedRemarks, setInterestedRemarks] = useState('');


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

  // Server-side paged task list (50 per page), filters applied by the API in Athens time
  const PAGE_SIZE = 50;
  const [tasks, setTasks] = useState<CrmAction[]>([]);
  const [totalTasks, setTotalTasks] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const csvInputRef = React.useRef<HTMLInputElement>(null);
  const isAdmin = user?.role === 'admin' || user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filterStatus, filterType, filterDateRange, selectedSalespersonId]);

  const refreshTasks = React.useCallback(async () => {
    const sid = selectedSalespersonId === 'all' ? undefined : selectedSalespersonId;
    dispatch(fetchTaskKpis(sid));
    setIsLoading(true);
    try {
      const res = await crmAPI.getActions(sid, {
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch || undefined,
        status: filterStatus,
        actionType: filterType,
        dateRange: filterDateRange,
      });
      const body: any = res.data;
      if (Array.isArray(body)) {
        setTasks(body);
        setTotalTasks(body.length);
      } else {
        setTasks(body?.data || []);
        setTotalTasks(body?.total || 0);
      }
    } catch (err) {
      console.error('Failed to load tasks', err);
      toast.error(isGreek ? 'Αποτυχία φόρτωσης εργασιών' : 'Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, selectedSalespersonId, page, debouncedSearch, filterStatus, filterType, filterDateRange, isGreek]);

  useEffect(() => {
    refreshTasks();
  }, [refreshTasks]);

  const totalPages = Math.max(1, Math.ceil(totalTasks / PAGE_SIZE));

  // Admin: import open HubSpot tasks from CSV (client, due date, time, salesperson, title, notes)
  const splitCsvRecords = (text: string): string[] => {
    const records: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (ch === '"') inQuotes = !inQuotes;
      if ((ch === '\n' || ch === '\r') && !inQuotes) {
        if (ch === '\r' && text[i + 1] === '\n') i++;
        if (current.trim()) records.push(current);
        current = '';
        continue;
      }
      current += ch;
    }
    if (current.trim()) records.push(current);
    return records;
  };

  const runCsvImport = async (records: string[], dryRun: boolean) => {
    const [header, ...rows] = records;
    const CHUNK = 300;
    const total = { created: 0, skipped: 0, errors: [] as { row: number; reason: string }[] };
    for (let i = 0; i < rows.length; i += CHUNK) {
      const chunk = rows.slice(i, i + CHUNK);
      const res = await crmAPI.importTasksCsv([header, ...chunk].join('\n'), dryRun);
      total.created += res.data?.created || 0;
      total.skipped += res.data?.skipped || 0;
      (res.data?.errors || []).forEach((e: any) => total.errors.push({ row: e.row + i, reason: e.reason }));
    }
    return total;
  };

  const handleCsvSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setIsImporting(true);
    try {
      const records = splitCsvRecords(await file.text());
      if (records.length < 2) {
        toast.error('Το αρχείο CSV δεν έχει γραμμές.');
        return;
      }
      const check = await runCsvImport(records, true);
      const errorLines = check.errors.slice(0, 10).map(er => `Γραμμή ${er.row}: ${er.reason}`).join('\n');
      const proceed = window.confirm(
        `Εισαγωγή εργασιών HubSpot\n\nΝέες εργασίες: ${check.created}\nΥπάρχουν ήδη: ${check.skipped}\nΣφάλματα: ${check.errors.length}` +
        (errorLines ? `\n\n${errorLines}${check.errors.length > 10 ? '\n...' : ''}` : '') +
        (check.created > 0 ? `\n\nΝα δημιουργηθούν ${check.created} εργασίες;` : '')
      );
      if (!proceed || check.created === 0) return;
      const result = await runCsvImport(records, false);
      toast.success(`Δημιουργήθηκαν ${result.created} εργασίες (${result.errors.length} σφάλματα).`);
      refreshTasks();
    } catch (err: any) {
      console.error('CSV import failed', err);
      toast.error(err?.response?.data?.message || 'Η εισαγωγή απέτυχε.');
    } finally {
      setIsImporting(false);
    }
  };

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
        refreshTasks();
      } catch (err) {
        toast.error("Failed to delete task");
        console.error(err);
      }
    }
  };


  const formatDate = (date?: string) => formatAthens(date);

  const isOverdue = (task: CrmAction) => {
    if (task.status !== 'pending' && task.status !== 'in_progress') return false;
    return task.dueDate && new Date(task.dueDate) < new Date();
  };

  // Filtering, search and paging happen on the server
  const filteredTasks = tasks;


  const resetInteractionState = () => {
    setShowInteractionModal(false);
    setInteractionNotes("");
    setInteractionOutcome("");
    setInteractionClinic("");
    setInteractionTask(null);
    setWorkflowStep(1);
    setCallMade(false);
    setCallDuration(0);
    setSelectedTags([]);
    setCallbackDate("");
    setFollowUpData({ title: '', therapy: '', dueDate: '', reminderDate: '', priority: 'medium' });
    setShowInterestedRemarks(false);
    setInterestedRemarks('');
  };

  const handleSaveInteraction = async (outcomeArg?: any) => {
    // Ensure we only use the outcome if it's a string (to ignore React events from onClick)
    const overrideOutcome = typeof outcomeArg === 'string' ? outcomeArg : undefined;
    const effectiveOutcome = overrideOutcome || interactionOutcome;
    if (!effectiveOutcome) {
      toast.error('Επιλέξτε το αποτέλεσμα της κλήσης.');
      return;
    }

    const noteText = (effectiveOutcome === 'interested' && interestedRemarks.trim())
      ? interestedRemarks.trim()
      : interactionNotes.trim();
    // "Skip to result" (no call made): the note is mandatory
    if (!callMade && !noteText) {
      toast.error('Η σημείωση είναι υποχρεωτική όταν καταγράφετε αποτέλεσμα χωρίς κλήση.');
      return;
    }

    // Interested / Call back / No answer: the same task stays open and moves to the next call
    const keepOpen = KEEP_TASK_OPEN_OUTCOMES.includes(effectiveOutcome);
    let nextCall: Date | null = null;
    if (keepOpen) {
      nextCall = new Date(callbackDate || nextWorkingDay0800());
      if (isNaN(nextCall.getTime())) {
        toast.error('Ορίστε έγκυρη ημερομηνία και ώρα επόμενης κλήσης.');
        return;
      }
    }

    let finalNotes = noteText;
    if (nextCall) {
      finalNotes = `[Επόμενη κλήση: ${formatAthens(nextCall)}]\n${finalNotes}`;
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
        subject: `[${effectiveOutcome.toUpperCase()}] ${interactionTask?.title || 'Interaction'}`,
        notes: finalNotes,
        createdAt: new Date().toISOString(),
        durationSeconds: callDuration || 0,
        metadata: {
          clickOnly: true,
          callOutcome: effectiveOutcome,
          outcome: effectiveOutcome,
          originalTaskId: interactionTask?.id,
          clinic: interactionClinic || interactionTask?.clinic || interactionTask?.metadata?.clinic || undefined,
          tags: selectedTags
        }
      })).unwrap();

      if (interactionTask?.id) {
        const updates: any = {
          status: keepOpen ? 'pending' : 'completed',
          metadata: {
            ...(interactionTask.metadata || {}),
            callOutcome: effectiveOutcome,
          },
          // Appended to the task description + call history on the server (never overwritten)
          callNote: {
            note: noteText,
            outcome: effectiveOutcome,
            nextGoal: followUpData.title?.trim() || undefined,
          },
        };
        if (nextCall) {
          updates.dueDate = nextCall.toISOString();
          updates.reminderDate = nextCall.toISOString();
        }
        await dispatch(updateAction({ id: interactionTask.id, updates })).unwrap();
      }

      resetInteractionState();
      refreshTasks();
      toast.success(nextCall
        ? `Η εργασία μεταφέρθηκε στις ${formatAthens(nextCall)}`
        : 'Η εργασία ολοκληρώθηκε');
    } catch (error) {
      console.error("Failed to save interaction:", error);
      toast.error("Failed to process task. Please verify your data.");
    }
  };

  const handleBookingSuccess = async () => {
    if (!interactionTask) return;

    try {
      // 1. Log the communication for the booking outcome
      await dispatch(logCommunication({
        customerId: interactionTask?.customerId || (interactionTask?.customer as any)?.id || undefined,
        relatedLeadId: interactionTask?.relatedLeadId || undefined,
        salespersonId: currentUserId || undefined,
        type: 'call',
        direction: 'outgoing',
        status: 'completed',
        subject: `[APPOINTMENT BOOKED] Task Completed: ${interactionTask?.title || 'Appointment Scheduled'}`,
        notes: interactionNotes ? `[APPOINTMENT BOOKED]\n${interactionNotes}` : 'Appointment booked successfully via task workflow.',
        createdAt: new Date().toISOString(),
        durationSeconds: callDuration || 0,
        metadata: {
          clickOnly: true,
          callOutcome: 'appointment_booked',
          outcome: 'appointment_booked',
          originalTaskId: interactionTask?.id,
          clinic: interactionClinic || interactionTask?.clinic || undefined,
          tags: selectedTags
        }
      })).unwrap();

      // 2. Complete the task (the booking creates its own confirmation-call task)
      await dispatch(updateAction({
        id: interactionTask.id,
        updates: {
          status: 'completed',
          metadata: { ...(interactionTask.metadata || {}), callOutcome: 'appointment_booked' },
          callNote: { note: interactionNotes.trim() || 'Appointment booked', outcome: 'appointment_booked' },
        } as any
      })).unwrap();

      setShowInteractionModal(false);
      setInteractionTask(null);
      setInteractionNotes("");
      setInteractionOutcome("");
      setWorkflowStep(1);
      setCallMade(false);
      setSelectedTags([]);
      setCallbackDate("");

      refreshTasks();
    } catch (error) {
      console.error("Failed to complete task after booking:", error);
      toast.error("Failed to complete task after booking.");
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
    if (callMade || workflowStep > 1) {
      toast.error("Call outcome is mandatory. Please select an option before closing.");
      return;
    }

    if (interactionTask) {
      try {
        await dispatch(updateAction({
          id: interactionTask.id,
          updates: { status: 'pending' }
        })).unwrap();
        refreshTasks();
      } catch (err) {
        console.error("Failed to revert task status:", err);
        toast.error("Failed to revert task status.");
      }
    }
    setShowInteractionModal(false);
    setInteractionTask(null);
    setInteractionNotes("");
    setCallMade(false);
    setWorkflowStep(1);
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
      refreshTasks();
    } catch (err) {
      console.error("Failed to reassign task:", err);
      toast.error("Failed to reassign task.");
    }
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-white border border-slate-100 rounded-lg shadow-sm">
        <div>
          <h2 className="text-lg font-bold leading-tight text-slate-800">Task Management</h2>
          <p className="text-gray-500 text-[11px] mt-0.5">Manage your tasks and follow-ups</p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <input ref={csvInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleCsvSelected} />
              <Button
                variant="outline"
                onClick={() => csvInputRef.current?.click()}
                disabled={isImporting}
                className="h-7 text-xs px-2.5 py-0 rounded-md"
                title="CSV: client, phone, email, due date (dd/mm/yyyy), time (HH:mm), salesperson, title, notes"
              >
                {isImporting ? 'Εισαγωγή...' : 'Εισαγωγή HubSpot (CSV)'}
              </Button>
            </>
          )}
          <Button variant="primary" onClick={() => setShowCreateForm(true)} className="h-7 text-xs px-2.5 py-0 rounded-md">
            <Plus className="h-3.5 w-3.5 mr-1" /> {isGreek ? 'Νέο Task' : 'New Task'}
          </Button>
        </div>
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
          {(user?.role === 'SUPER_ADMIN' || user?.role === 'admin' || user?.role === 'manager' || user?.role === 'salesperson' || user?.role === 'clinic_owner') && (
            <Select
              placeholder="All Salespersons"
              options={[
                { value: 'all', label: 'Global Team' },
                ...(salespersons || [])
                  .filter(sp => sp.isActive !== false && ['salesperson', 'SUPER_ADMIN', 'manager', 'admin'].includes(sp.role))
                  .map(sp => ({
                    value: sp.id,
                    label: `${sp.firstName} ${sp.lastName}`
                  }))
              ]}
              value={selectedSalespersonId}
              onChange={(val) => setSelectedSalespersonId(val)}
              className="h-10 text-[10px] font-black uppercase"
            />
          )}
          <Select
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'pending', label: isGreek ? 'Εκκρεμεί' : 'Pending' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'overdue', label: isGreek ? 'Εκπρόθεσμο' : 'Overdue' },
              { value: 'completed', label: isGreek ? 'Ολοκληρωμένα' : 'Done' }
            ]}
            value={filterStatus}
            onChange={(val) => setFilterStatus(val)}
            className="h-10 text-[10px] font-black uppercase"
          />
          <Select
            options={[
              { value: 'all', label: 'All Action Types' },
              { value: 'call', label: isGreek ? 'Κλήσεις' : 'Calls' },
              { value: 'mobile_message', label: isGreek ? 'SMS' : 'SMS / Mobile' },
              { value: 'appointment', label: isGreek ? 'Ραντεβού' : 'Appointments' },
              { value: 'confirmation_call_reminder', label: isGreek ? 'Επιβεβαίωση ραντεβού' : 'Confirmation Calls' }
            ]}
            value={filterType}
            onChange={(val) => setFilterType(val)}
            className="h-10 text-[10px] font-black uppercase"
          />
          <Select
            options={[
              { value: 'all', label: 'Timeline: Any' },
              { value: 'today', label: 'Due: Today' },
              { value: 'tomorrow', label: 'Due: Tomorrow' },
              { value: 'next_7_days', label: 'Due: Next 7 Days' },
              { value: 'next_15_days', label: 'Due: Next 15 Days' },
              { value: 'next_month', label: 'Due: Next Month' },
              { value: 'yesterday', label: 'Due: Yesterday' },
              { value: 'previous_7_days', label: 'Due: Previous 7 Days' },
              { value: 'previous_month', label: 'Due: Previous Month' },
              { value: 'overdue', label: 'Status: Overdue' }
            ]}
            value={filterDateRange}
            onChange={(val) => setFilterDateRange(val)}
            className="h-10 text-[10px] font-black uppercase"
          />
        </div>
      </div>

      {/* Task List */}
      <div className="bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-3xl shadow-xl shadow-slate-200/40 overflow-hidden animate-in slide-in-from-bottom-2 duration-300">
        {/* Table Header Bar */}
        <div className="px-6 py-4 bg-white border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-2xl bg-[#CBFF38]/20 text-slate-900 flex items-center justify-center font-black">
              <ListTodo size={18} />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight text-slate-900">{isGreek ? 'Λίστα Tasks' : 'Task List'}</h3>
              <p className="text-xs font-medium text-slate-500">Track and execute all CRM action items</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-slate-100 text-slate-800 rounded-xl text-xs font-black">
              {totalTasks} {totalTasks === 1 ? 'Task' : 'Tasks'}
            </span>
            {isLoading && tasks.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-lime-100 text-lime-800 text-[10px] font-bold animate-pulse">
                Syncing...
              </span>
            )}
          </div>
        </div>

        <div>
          {isLoading && tasks.length === 0 ? (
            <div className="text-center py-12 text-xs font-bold text-slate-500">Loading tasks...</div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-12 text-xs font-bold text-slate-400">No tasks found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80">
                    <th className="px-4 py-3.5 font-black text-[10px] uppercase tracking-wider text-slate-400 whitespace-nowrap text-center">Status</th>
                    <th className="px-4 py-3.5 font-black text-[10px] uppercase tracking-wider text-slate-400 whitespace-nowrap">Task Details</th>
                    <th className="px-4 py-3.5 font-black text-[10px] uppercase tracking-wider text-slate-400 whitespace-nowrap">Associated Contact</th>
                    <th className="px-4 py-3.5 font-black text-[10px] uppercase tracking-wider text-slate-400 whitespace-nowrap">Type & Therapy</th>
                    <th className="px-4 py-3.5 font-black text-[10px] uppercase tracking-wider text-slate-400 whitespace-nowrap">Due / Reminder</th>
                    <th className="px-4 py-3.5 font-black text-[10px] uppercase tracking-wider text-slate-400 whitespace-nowrap">Latest Outcome</th>
                    <th className="px-4 py-3.5 font-black text-[10px] uppercase tracking-wider text-slate-400 whitespace-nowrap">Owner</th>
                    <th className="px-4 py-3.5 font-black text-[10px] uppercase tracking-wider text-slate-400 whitespace-nowrap text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTasks.map((task) => {
                    const overdue = isOverdue(task);
                    return (
                      <tr
                        key={task.id}
                        className={`hover:bg-slate-50/80 transition-colors group ${overdue ? 'bg-rose-50/20' : ''}`}
                      >
                        {/* Status */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex justify-center">
                            <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border shadow-2xs ${
                              task.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80' :
                              overdue ? 'bg-rose-50 text-rose-600 border-rose-200/80' :
                              task.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200/80' :
                              task.status === 'cancelled' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                              'bg-blue-50 text-blue-700 border-blue-200/80'
                            }`}>
                              <span className={`size-1.5 rounded-full ${
                                task.status === 'completed' ? 'bg-emerald-500' :
                                overdue ? 'bg-rose-500 animate-pulse' :
                                task.status === 'pending' ? 'bg-amber-500' : 'bg-blue-500'
                              }`} />
                              {overdue ? 'OVERDUE' : task.status?.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </td>

                        {/* Task Details */}
                        <td className="px-4 py-3.5 min-w-[180px]">
                          <div className="font-black text-slate-900 text-xs tracking-tight">{task.title}</div>
                          {task.description && (
                            <div className="text-[11px] text-slate-400 font-semibold line-clamp-1 mt-0.5">{task.description}</div>
                          )}
                        </td>

                        {/* Associated Contact */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {(task.customerId || task.relatedLeadId) ? (
                            onViewTask ? (
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  onViewTask(task);
                                }}
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl font-bold text-xs transition-all ${
                                  task.customerId ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                                }`}
                              >
                                <Users className="h-3 w-3 opacity-60" />
                                {task.customer?.customer
                                  ? `${task.customer.customer.firstName || ''} ${task.customer.customer.lastName || ''}`
                                  : task.relatedLead
                                    ? `${task.relatedLead.firstName || ''} ${task.relatedLead.lastName || ''}`
                                    : 'View Profile'}
                              </button>
                            ) : (
                              <Link
                                to={`/crm/customer/${task.customerId || task.relatedLeadId}`}
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl font-bold text-xs transition-all ${
                                  task.customerId ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                                }`}
                              >
                                <Users className="h-3 w-3 opacity-60" />
                                {task.customer?.customer
                                  ? `${task.customer.customer.firstName || ''} ${task.customer.customer.lastName || ''}`
                                  : task.relatedLead
                                    ? `${task.relatedLead.firstName || ''} ${task.relatedLead.lastName || ''}`
                                    : 'View Profile'}
                              </Link>
                            )
                          ) : (
                            <span className="text-slate-300 text-xs font-semibold">Unassigned</span>
                          )}
                        </td>

                        {/* Type & Therapy */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-blue-700 text-[10px] font-extrabold uppercase border border-blue-100 bg-blue-50/80 w-fit">
                              {task.actionType?.replace(/_/g, ' ')}
                            </span>
                            {task.therapy && (
                              <span className="text-[10px] text-slate-400 font-bold">
                                Re: {task.therapy}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Due / Reminder */}
                        <td className="px-4 py-3.5 whitespace-nowrap min-w-[170px]">
                          <div className="flex flex-col gap-1">
                            <div className={`text-xs font-black flex items-center gap-1.5 ${overdue ? 'text-rose-600' : 'text-slate-900'}`}>
                              <Clock className={`w-3.5 h-3.5 shrink-0 ${overdue ? 'text-rose-500' : 'text-slate-400'}`} />
                              {formatDate(task.dueDate)}
                            </div>
                            {task.reminderDate && (
                              <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                <Bell className="w-3 h-3 text-amber-500 shrink-0" />
                                <span>Reminder:</span>
                                <span className="text-slate-700 font-bold">{formatDate(task.reminderDate)}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Latest Outcome */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {(() => {
                            const outcome = task.metadata?.callOutcome || task.metadata?.outcome || (task as any).outcome;
                            if (!outcome) {
                              return <span className="text-slate-300 text-xs font-bold">-</span>;
                            }
                            return (
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border ${
                                outcome === 'interested' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                outcome === 'not_interested' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                outcome === 'no_answer' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                outcome === 'call_later' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                'bg-slate-100 text-slate-700 border-slate-200'
                              }`}>
                                {outcome.replace(/_/g, ' ')}
                              </span>
                            );
                          })()}
                        </td>

                        {/* Owner */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {(() => {
                            const sp = salespersons?.find(s => s.id === task.salespersonId);
                            return (
                              <div className="flex items-center gap-2">
                                <div className="size-7 rounded-full bg-slate-900 text-[#CBFF38] flex items-center justify-center text-[10px] font-black uppercase shadow-xs">
                                  {sp ? sp.firstName?.charAt(0) : <User className="w-3.5 h-3.5 text-[#CBFF38]" />}
                                </div>
                                <span className="text-xs font-bold text-slate-800">
                                  {sp ? `${sp.firstName} ${sp.lastName}` : 'Unknown'}
                                </span>
                              </div>
                            );
                          })()}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewingTask(task);
                              }}
                              title="View Task Detail"
                            >
                              <Eye className="h-4 w-4" />
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
                                  dueDate: task.dueDate || '',
                                  reminderDate: task.reminderDate || '',
                                  salespersonId: task.salespersonId,
                                  therapy: task.therapy || '',
                                  clinic: task.clinic || task.metadata?.clinic || '',
                                  priority: task.priority as any,
                                  isRecurring: task.isRecurring || false,
                                  recurrenceType: task.recurrenceType as any || 'weekly',
                                  recurrenceInterval: task.recurrenceInterval || 1
                                });
                                setIsEditing(true);
                              }}
                              className="h-8 w-8 p-0 bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 rounded-xl transition-all shadow-xs"
                              title="Edit Task"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            {task.actionType === 'appointment' && (
                              <Button
                                size="xs"
                                variant="white"
                                className="h-8 w-8 p-0 bg-white border border-slate-200 text-blue-600 hover:text-blue-700 hover:bg-blue-50 hover:border-blue-300 rounded-xl transition-all shadow-xs"
                                title="Open Sales Plan"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate('/crm/calendar');
                                }}
                              >
                                <Calendar className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <Button
                              size="xs"
                              variant="white"
                              className="h-8 w-8 p-0 bg-white border border-slate-200 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 rounded-xl transition-all shadow-xs"
                              title={isGreek ? "Καταγραφή Επικοινωνίας" : "Log Communication"}
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  await dispatch(updateAction({
                                    id: task.id,
                                    updates: { status: 'in_progress' }
                                  })).unwrap();

                                  setInteractionTask({ ...task, status: 'in_progress' });
                                  setInteractionNotes("");
                                  setInterestedRemarks('');
                                  setCallbackDate('');
                                  setCallDuration(0);
                                  setFollowUpData({ title: '', therapy: '', dueDate: '', reminderDate: '', priority: 'medium' });
                                  setWorkflowStep(1);
                                  setCallMade(false);
                                  setInteractionOutcome("");
                                  setSelectedTags([]);
                                  setShowInteractionModal(true);

                                  refreshTasks();
                                } catch (err) {
                                  console.error("Failed to start interaction:", err);
                                }
                              }}
                            >
                              <CornerUpRight className="h-3.5 w-3.5" />
                            </Button>

                            <Button
                              size="xs"
                              variant="white"
                              className="h-8 w-8 p-0 bg-white border border-slate-200 text-amber-600 hover:text-amber-700 hover:bg-amber-50 hover:border-amber-300 rounded-xl transition-all shadow-xs"
                              title="Quick Assign"
                              onClick={(e) => {
                                e.stopPropagation();
                                setAssigningTask(task);
                                setNewOwnerId(task.salespersonId || "");
                                setShowAssignModal(true);
                              }}
                            >
                              <UserPlus className="h-3.5 w-3.5" />
                            </Button>
                            {user?.role === 'SUPER_ADMIN' && (
                              <Button
                                size="xs"
                                variant="white"
                                className="h-8 w-8 p-0 bg-white border border-slate-200 text-rose-500 hover:text-rose-700 hover:bg-rose-50 hover:border-rose-300 rounded-xl transition-all shadow-xs"
                                title="Delete Task"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(task.id);
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {totalTasks > PAGE_SIZE && (
          <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-600">
            <span>
              {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, totalTasks)} / {totalTasks}
            </span>
            <div className="flex items-center gap-2">
              <Button size="xs" variant="white" disabled={page <= 1 || isLoading} onClick={() => setPage(p => Math.max(1, p - 1))} className="h-8 px-3 rounded-xl border border-slate-200">
                <ArrowLeft className="h-3.5 w-3.5" />
              </Button>
              <span>{page} / {totalPages}</span>
              <Button size="xs" variant="white" disabled={page >= totalPages || isLoading} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="h-8 px-3 rounded-xl border border-slate-200">
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Task Creation/Edit Modal */}
      {(showCreateForm || isEditing) && createPortal(
        <div className="fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" style={{ zIndex: 99999 }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h3 className="text-lg font-black text-slate-800">
                  {isEditing ? (isGreek ? 'Επεξεργασία Task' : 'Edit Task') : (isGreek ? 'Δημιουργία Task' : 'Create Task')}
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isGreek ? 'Στοιχεία Task' : 'Task Details'}</p>
              </div>
              <button
                type="button"
                onClick={resetForm}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-all flex items-center justify-center cursor-pointer border border-slate-200 shadow-sm shrink-0"
                title="Close"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
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
                    refreshTasks();
                  }}
                />
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Task View Modal */}
      {viewingTask && createPortal(
        <div className="fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" style={{ zIndex: 99999 }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h3 className="text-lg font-black text-slate-800">
                  Task Details
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{viewingTask.actionType.replace(/_/g, ' ')}</p>
              </div>
              <button
                type="button"
                onClick={() => setViewingTask(null)}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-all flex items-center justify-center cursor-pointer border border-slate-200 shadow-sm shrink-0"
                title="Close"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-sm">

              {/* Status Banner */}
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${viewingTask.status === 'completed' ? 'bg-green-50 border-green-200' :
                  viewingTask.status === 'in_progress' ? 'bg-blue-50 border-blue-200' :
                    isOverdue(viewingTask) ? 'bg-red-50 border-red-200' :
                      'bg-amber-50 border-amber-200'
                }`}>
                <div className={`w-2.5 h-2.5 rounded-full ${viewingTask.status === 'completed' ? 'bg-green-500' :
                    viewingTask.status === 'in_progress' ? 'bg-blue-500' :
                      isOverdue(viewingTask) ? 'bg-red-500' : 'bg-amber-500'
                  }`} />
                <div className="flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Task Status</p>
                  <p className={`text-sm font-black uppercase ${viewingTask.status === 'completed' ? 'text-green-700' :
                      viewingTask.status === 'in_progress' ? 'text-blue-700' :
                        isOverdue(viewingTask) ? 'text-red-700' : 'text-amber-700'
                    }`}>{isOverdue(viewingTask) ? 'Overdue' : viewingTask.status.replace('_', ' ')}</p>
                </div>
                <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md ${viewingTask.priority === 'urgent' ? 'bg-red-500 text-white' :
                    viewingTask.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                      viewingTask.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-500'
                  }`}>{viewingTask.priority} priority</span>
              </div>

              {/* Title & Description */}
              <div className="space-y-1">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Task Title</span>
                <p className="font-black text-slate-900 text-base leading-tight">{viewingTask.title}</p>
              </div>

              {viewingTask.description && (
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Description / Notes</span>
                  <p className="text-slate-700 whitespace-pre-wrap text-xs leading-relaxed">{viewingTask.description}</p>
                </div>
              )}

              <TaskCallNotes task={viewingTask} />

              {/* Type & Therapy */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Action Type</span>
                  <span className="text-xs font-black text-slate-800 uppercase">{viewingTask.actionType.replace(/_/g, ' ')}</span>
                </div>
                {viewingTask.therapy && (
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Therapy</span>
                    <span className="text-xs font-black text-slate-800">{viewingTask.therapy}</span>
                  </div>
                )}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Due Date</span>
                  <span className={`text-xs font-bold ${isOverdue(viewingTask) ? 'text-red-600' : 'text-slate-700'}`}>{formatDate(viewingTask.dueDate)}</span>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Reminder</span>
                  <span className="text-xs font-black text-slate-900">{formatDate(viewingTask.reminderDate)}</span>
                </div>
              </div>

              {/* Associated Contact */}
              {(viewingTask.customer || viewingTask.relatedLead) && (
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Associated Contact</span>
                  {viewingTask.customerId ? (
                    <Link
                      to={`/crm/customer/${viewingTask.customerId}`}
                      onClick={() => setViewingTask(null)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 rounded-xl text-blue-700 font-bold transition-all border border-blue-100"
                    >
                      <Users className="h-4 w-4" />
                      {viewingTask.customer?.customer
                        ? `${viewingTask.customer.customer.firstName} ${viewingTask.customer.customer.lastName}`
                        : 'View Customer Profile'}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  ) : (
                    <Link
                      to={`/crm/customer/${viewingTask.relatedLeadId}`}
                      onClick={() => setViewingTask(null)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 hover:bg-orange-100 rounded-xl text-orange-700 font-bold transition-all border border-orange-100"
                    >
                      <Users className="h-4 w-4" />
                      {viewingTask.relatedLead
                        ? `${viewingTask.relatedLead.firstName} ${viewingTask.relatedLead.lastName}`
                        : 'View Lead Profile'}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>
              )}

              {/* Salesperson */}
              {(() => {
                const sp = salespersons?.find(s => s.id === viewingTask.salespersonId);
                return sp ? (
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Assigned To</span>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-[9px] font-black text-white uppercase">
                        {sp.firstName?.charAt(0)}
                      </div>
                      <span className="text-xs font-bold text-slate-800">{sp.firstName} {sp.lastName}</span>
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Call Outcome */}
              {(viewingTask.metadata as any)?.callOutcome && (
                <div className={`rounded-xl p-4 border ${(viewingTask.metadata as any).callOutcome === 'interested' ? 'bg-amber-50 border-amber-200' :
                    (viewingTask.metadata as any).callOutcome === 'not_interested' ? 'bg-red-50 border-red-200' :
                      (viewingTask.metadata as any).callOutcome === 'appointment_booked' ? 'bg-green-50 border-green-200' :
                        'bg-slate-50 border-slate-200'
                  }`}>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Last Interaction Outcome</span>
                  <span className={`text-sm font-black uppercase ${(viewingTask.metadata as any).callOutcome === 'interested' ? 'text-amber-700' :
                      (viewingTask.metadata as any).callOutcome === 'not_interested' ? 'text-red-700' :
                        (viewingTask.metadata as any).callOutcome === 'appointment_booked' ? 'text-green-700' :
                          'text-slate-700'
                    }`}>
                    {(viewingTask.metadata as any).callOutcome.replace(/_/g, ' ')}
                  </span>
                </div>
              )}

              {/* Completion Reason (Interested remarks) */}
              {viewingTask.status === 'completed' && (viewingTask.metadata as any)?.completionReason && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <span className="flex items-center gap-1.5 text-[10px] font-black text-amber-700 uppercase tracking-widest mb-2">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    Why Task Was Completed
                  </span>
                  <p className="text-sm text-amber-900 font-medium whitespace-pre-wrap leading-relaxed">{(viewingTask.metadata as any).completionReason}</p>
                </div>
              )}

              {/* Recurrence */}
              {viewingTask.isRecurring && (
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Recurrence</span>
                  <span className="flex items-center gap-1.5 font-bold text-slate-700 capitalize text-xs">
                    <Repeat className="h-3.5 w-3.5 text-blue-500" />
                    {viewingTask.recurrenceType} · Every {viewingTask.recurrenceInterval}
                  </span>
                </div>
              )}

              {/* Source Task */}
              {(viewingTask.metadata as any)?.sourceTaskId && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3">
                  <span className="block text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Created From Task</span>
                  <span className="text-xs font-bold text-indigo-700">Follow-up from previous interaction</span>
                </div>
              )}

              {/* Created At */}
              {(viewingTask as any).createdAt && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Created: {formatDate((viewingTask as any).createdAt)}</span>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center gap-3">
              {(viewingTask.customerId || viewingTask.relatedLeadId) && (
                <Link
                  to={`/crm/customer/${viewingTask.customerId || viewingTask.relatedLeadId}`}
                  onClick={() => setViewingTask(null)}
                  className="h-9 px-4 rounded-xl bg-black text-[#CBFF38] text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gray-900 transition-all"
                >
                  <Users className="h-3.5 w-3.5" />
                  Full Profile
                </Link>
              )}
              <Button variant="outline" onClick={() => setViewingTask(null)} className="h-9 px-6 font-bold text-xs bg-white text-slate-700 shadow-sm hover:bg-slate-50 ml-auto">
                Close
              </Button>
            </div>
          </div>
        </div>,
        document.body
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
                refreshTasks();
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
        <div className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-sm flex justify-end animate-in fade-in duration-300">
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
              {(!callMade && workflowStep === 1) ? (
                <Button variant="ghost" size="icon" onClick={handleCloseInteraction} className="rounded-xl hover:bg-slate-50">
                  <X className="w-5 h-5 text-slate-400" />
                </Button>
              ) : (
                <div
                  onClick={() => toast.error("Call outcome is mandatory. Please select an option before closing.")}
                  className="px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-lg text-[10px] font-black uppercase tracking-wider text-amber-700 flex items-center gap-1.5 shadow-sm cursor-not-allowed select-none"
                  title="Outcome required before closing"
                >
                  <Lock className="w-3 h-3 text-amber-600" />
                  Outcome Required
                </div>
              )}
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
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                Step {workflowStep}/4
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">

              <TaskCallNotes task={interactionTask} />

              {/* Step 1: Outreach */}
              {workflowStep === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden group">
                    <div className="relative z-10 space-y-6">
                      <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] text-[#CBFF38]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#CBFF38] animate-pulse" /> Live Dialer Ready
                        </div>
                        <h3 className="text-2xl font-black tracking-tighter leading-tight">Initiate Call</h3>
                        <p className="text-slate-400 text-[11px] font-medium leading-relaxed max-w-[280px]">Automated logging is active. Click below to begin the outreach session.</p>
                      </div>

                      <Button
                        onClick={() => {
                          setCallMade(true);
                          setShowDialer(true);
                        }}
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
                    <h3 className="text-sm font-black text-slate-900 uppercase">Interaction Result</h3>
                    {!callMade && (
                      <Button variant="ghost" onClick={() => setWorkflowStep(1)} className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-black">
                        <ArrowLeft className="w-3 h-3 mr-1" /> Back
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {CALL_OUTCOMES.map((o) => ({
                      ...o,
                      label: isGreek ? o.labelEl : o.label,
                      ...({
                        interested: { icon: <Star className="w-5 h-5 fill-amber-400 text-amber-400" />, color: 'hover:border-amber-400 hover:bg-amber-50' },
                        call_later: { icon: <Clock className="w-5 h-5 text-blue-500" />, color: 'hover:border-blue-400 hover:bg-blue-50' },
                        no_answer: { icon: <PhoneOff className="w-5 h-5 text-slate-400" />, color: 'hover:border-gray-400 hover:bg-gray-50' },
                        not_interested: { icon: <XCircle className="w-5 h-5 text-red-500" />, color: 'hover:border-red-400 hover:bg-red-50' },
                        appointment_booked: { icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />, color: 'hover:border-emerald-400 hover:bg-emerald-50' },
                        wrong_number: { icon: <AlertTriangle className="w-5 h-5 text-yellow-500" />, color: 'hover:border-yellow-400 hover:bg-yellow-50' },
                      } as Record<string, { icon: React.ReactNode; color: string }>)[o.value],
                    })).map((opt) => (
                      <div
                        key={opt.value}
                        onClick={async () => {
                          setInteractionOutcome(opt.value);
                          if (opt.value === 'interested') {
                            // Remarks + next call date: the task stays open
                            setShowInterestedRemarks(true);
                            if (!callbackDate) setCallbackDate(nextWorkingDay0800());
                          } else if (opt.value === 'appointment_booked') {
                            setShowBookingModal(true);
                          } else if (opt.value === 'call_later' || opt.value === 'no_answer') {
                            // Default next call: next working day 08:00
                            if (!callbackDate) setCallbackDate(nextWorkingDay0800());
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

                  {/* Outcome specific logic for date picking */}
                  {['call_later', 'no_answer'].includes(interactionOutcome) && (
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 animate-in slide-in-from-top-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-[9px] font-black text-blue-800 uppercase tracking-widest">Επόμενη κλήση (ημερομηνία & ώρα)</p>
                        <span className="text-[9px] text-blue-600 font-bold">Η ίδια εργασία μεταφέρεται</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="date"
                          value={callbackDate ? callbackDate.split('T')[0] : ''}
                          onChange={(e) => {
                            const date = e.target.value;
                            const time = callbackDate && callbackDate.includes('T') ? callbackDate.split('T')[1].substring(0, 5) : '08:00';
                            const fullStr = date ? `${date}T${time}` : '';
                            setCallbackDate(fullStr);
                            setFollowUpData({ ...followUpData, dueDate: fullStr, reminderDate: fullStr });
                          }}
                          className="h-10 flex-1 text-[11px] font-black rounded-lg border-blue-200 bg-white"
                        />
                        <Select
                          value={callbackDate && callbackDate.includes('T') ? callbackDate.split('T')[1].substring(0, 5) : '08:00'}
                          onChange={(time) => {
                            const date = callbackDate ? callbackDate.split('T')[0] : toLocalInputValue(new Date()).split('T')[0];
                            const fullStr = `${date}T${time}`;
                            setCallbackDate(fullStr);
                            setFollowUpData({ ...followUpData, dueDate: fullStr, reminderDate: fullStr });
                          }}
                          options={Array.from({ length: 48 }, (_, i) => {
                            const hour = String(Math.floor(i / 2)).padStart(2, '0');
                            const min = i % 2 === 0 ? '00' : '30';
                            return { value: `${hour}:${min}`, label: `${hour}:${min}` };
                          })}
                          className="h-10 w-32 text-[11px] font-black rounded-lg border-blue-200 bg-white"
                        />
                      </div>
                      <Button
                        onClick={() => setWorkflowStep(3)}
                        className="w-full h-11 bg-black text-[#CBFF38] font-black text-[10px] uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 hover:bg-slate-900 transition-all"
                      >
                        Confirm Date & Next <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  )}

                  {/* Interested: remarks + next call; the same task stays open */}
                  {showInterestedRemarks && interactionOutcome === 'interested' && (
                    <div className="bg-amber-50 p-5 rounded-xl border border-amber-200 animate-in slide-in-from-top-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <p className="text-[9px] font-black text-amber-800 uppercase tracking-widest">Ενδιαφέρεται: σημειώσεις & επόμενη κλήση</p>
                      </div>
                      <p className="text-[10px] text-amber-700 font-medium">Οι σημειώσεις αποθηκεύονται στην εργασία: γιατί ενδιαφέρεται ο πελάτης. Η εργασία μένει ανοιχτή και μεταφέρεται στην επόμενη κλήση.</p>
                      <textarea
                        value={interestedRemarks}
                        onChange={(e) => setInterestedRemarks(e.target.value)}
                        placeholder="π.χ. Ενδιαφέρεται σοβαρά για Botox, συμφωνεί με την τιμή, να τον καλέσουμε την επόμενη εβδομάδα..."
                        rows={3}
                        className="w-full text-xs font-medium rounded-lg border border-amber-200 bg-white px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-amber-300 placeholder:text-amber-300"
                      />
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-amber-800 uppercase tracking-widest">Επόμενη κλήση</p>
                        <div className="flex items-center gap-2">
                          <Input
                            type="date"
                            value={callbackDate ? callbackDate.split('T')[0] : ''}
                            onChange={(e) => {
                              const date = e.target.value;
                              const time = callbackDate && callbackDate.includes('T') ? callbackDate.split('T')[1].substring(0, 5) : '08:00';
                              setCallbackDate(date ? `${date}T${time}` : '');
                            }}
                            className="h-9 flex-1 text-[11px] font-black rounded-lg border-amber-200 bg-white"
                          />
                          <Select
                            value={callbackDate && callbackDate.includes('T') ? callbackDate.split('T')[1].substring(0, 5) : '08:00'}
                            onChange={(time) => {
                              const date = callbackDate ? callbackDate.split('T')[0] : nextWorkingDay0800().split('T')[0];
                              setCallbackDate(`${date}T${time}`);
                            }}
                            options={Array.from({ length: 48 }, (_, i) => {
                              const hour = String(Math.floor(i / 2)).padStart(2, '0');
                              const min = i % 2 === 0 ? '00' : '30';
                              return { value: `${hour}:${min}`, label: `${hour}:${min}` };
                            })}
                            className="h-9 w-28 text-[11px] font-black rounded-lg border-amber-200 bg-white"
                          />
                        </div>
                        <p className="text-[10px] text-amber-700">Για επιπλέον εργασία, χρησιμοποιήστε «Νέο Task».</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setShowInterestedRemarks(false); setInterestedRemarks(''); }}
                          className="flex-1 h-9 rounded-lg border border-amber-200 text-[10px] font-black uppercase tracking-widest text-amber-700 hover:bg-amber-100 transition-all"
                        >
                          Ακύρωση
                        </button>
                        <button
                          onClick={() => handleSaveInteraction('interested')}
                          disabled={!callbackDate}
                          className="flex-1 h-9 rounded-lg bg-black text-[#CBFF38] text-[10px] font-black uppercase tracking-widest hover:bg-gray-900 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Αποθήκευση & επόμενη κλήση
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Classification (Tags) */}
              {workflowStep === 3 && (
                <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-slate-900 uppercase">Classification</h3>
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
                    <h3 className="text-sm font-black text-slate-900 uppercase">Final Protocol</h3>
                    <Button variant="ghost" onClick={() => setWorkflowStep(3)} className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-black">
                      <ArrowLeft className="w-3 h-3 mr-1" /> Back
                    </Button>
                  </div>

                  <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.3em]">Outcome</span>
                      <span className="text-[10px] font-black text-[#CBFF38] uppercase tracking-widest">{interactionOutcome?.replace('_', ' ')}</span>
                    </div>

                    <Textarea
                      placeholder={callMade ? 'Σημειώσεις κλήσης...' : 'Σημείωση (υποχρεωτική όταν δεν έγινε κλήση)...'}
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

                  {KEEP_TASK_OPEN_OUTCOMES.includes(interactionOutcome) && (
                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-600" />
                        <span className="text-[10px] font-black text-slate-900 uppercase">Επόμενη κλήση (η ίδια εργασία)</span>
                      </div>
                      <Input
                        placeholder="Στόχος επόμενης επαφής (προαιρετικό)..."
                        value={followUpData.title}
                        onChange={(e) => setFollowUpData({ ...followUpData, title: e.target.value })}
                        className="h-10 text-[11px] font-bold rounded-lg border-amber-200"
                      />
                      <div className="flex items-center gap-2">
                        <Input
                          type="date"
                          value={(callbackDate || nextWorkingDay0800()).split('T')[0]}
                          onChange={(e) => {
                            const date = e.target.value;
                            const base = callbackDate || nextWorkingDay0800();
                            setCallbackDate(date ? `${date}T${base.split('T')[1].substring(0, 5)}` : '');
                          }}
                          className="h-10 flex-1 text-[10px] font-bold rounded-lg border-amber-200 bg-white"
                        />
                        <Select
                          value={(callbackDate || nextWorkingDay0800()).split('T')[1].substring(0, 5)}
                          onChange={(time) => {
                            const base = callbackDate || nextWorkingDay0800();
                            setCallbackDate(`${base.split('T')[0]}T${time}`);
                          }}
                          options={Array.from({ length: 48 }, (_, i) => {
                            const hour = String(Math.floor(i / 2)).padStart(2, '0');
                            const min = i % 2 === 0 ? '00' : '30';
                            return { value: `${hour}:${min}`, label: `${hour}:${min}` };
                          })}
                          className="h-10 w-32 text-[10px] font-bold rounded-lg border-amber-200 bg-white"
                        />
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
        onClose={() => {
          setShowDialer(false);
          setCallMade(true);
          setWorkflowStep(2);
        }}
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
          setCallDuration(duration);
          setCallMade(true);
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
      {showAssignModal && assigningTask && createPortal(
        <div className="fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" style={{ zIndex: 99999 }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h3 className="text-md font-black text-slate-800">Quick Assign</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reassign Task Owner</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-all flex items-center justify-center cursor-pointer border border-slate-200 shadow-sm shrink-0"
                title="Close"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
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
                    .filter((sp: any) => sp.isActive !== false && ['salesperson', 'SUPER_ADMIN', 'manager', 'admin'].includes(sp.role))
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
        </div>,
        document.body
      )}
      {/* Messaging Modal */}
      {showEmailModal && interactionTask && createPortal(
        <div className="fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 99999 }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h3 className="text-lg font-black text-slate-800">Direct Messaging</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Logging Email/SMS Communication</p>
              </div>
              <button
                type="button"
                onClick={() => setShowEmailModal(false)}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-all flex items-center justify-center cursor-pointer border border-slate-200 shadow-sm shrink-0"
                title="Close"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
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
        </div>,
        document.body
      )}
    </div>
  );
};
