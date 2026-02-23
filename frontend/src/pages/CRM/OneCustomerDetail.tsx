import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    Clock, Tag, Mail, Phone, Calendar,
    ArrowRight, User, Users, Plus,
    AlertCircle, FileText, Check, X,
    MoreHorizontal, Trash2, PhoneCall,
    Activity, CheckCircle
} from "lucide-react";
import { Button } from "@/components/atoms/Button/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/molecules/Card/Card";
import { Badge } from "@/components/atoms/Badge";
import { Input } from "@/components/atoms/Input/Input";
import { Select } from "@/components/atoms/Select/Select";
import { Textarea } from "@/components/atoms/Textarea";



import type { Lead, Customer, CustomerSummary, CommunicationLog, CrmAction } from "@/types";
import type { RootState, AppDispatch } from "@/store";
import {
    fetchCustomerRecord,
    createAction,
    logCommunication,
    updateLead,
    addCustomerTag,
    deleteLead
} from "@/store/slices/crmSlice";
import { AuthState } from "@/store/slices/authSlice";
import { CRMBookingModal } from '@/components/crm/CRMBookingModal';
import { completeAppointment } from "@/store/slices/bookingSlice";
import { ActionForm } from '@/components/organisms/ActionForm/ActionForm';
import { StaffDiary } from '@/components/organisms/StaffDiary/StaffDiary';

interface OneCustomerDetailProps {
    SelectedCustomer: Customer | Lead;
    isLoading?: boolean;
    error?: string | null;
}

// --- Dialer Component ---
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
            // Reset state on open
            setCallStatus('dialing');
            setDuration(0);

            // Simulate connection after 2 seconds
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
        // Small delay to show "Call Ended" state before closing
        setTimeout(() => {
            onCallEnded(duration);
        }, 1000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden border border-gray-700 relative">
                {/* Decorative blobs */}
                <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl -ml-10 -mt-10" />
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl -mr-10 -mb-10" />

                <div className="relative z-10 flex flex-col h-[500px]">
                    {/* Header */}
                    <div className="p-6 flex justify-between items-center">
                        <div className="text-xs font-bold tracking-widest text-gray-400 uppercase">VoIP Dialer</div>
                        <div className="flex gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-xs text-green-400 font-bold">Online</span>
                        </div>
                    </div>

                    {/* Caller Info */}
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

                    {/* Controls */}
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

export const OneCustomerDetail: React.FC<OneCustomerDetailProps> = ({
    SelectedCustomer,
}) => {
    const dispatch = useDispatch<AppDispatch>();
    const crmState = useSelector((state: RootState) => state.crm);
    const { customerRecord } = crmState;
    const { user } = useSelector((state: RootState) => state.auth as AuthState);

    // State for Workflow
    const [workflowStep, setWorkflowStep] = useState<1 | 2 | 3 | 4>(1);
    const [interactionType, setInteractionType] = useState<'call' | 'meeting' | 'email'>('call');
    const [interactionOutcome, setInteractionOutcome] = useState<string>("");
    const [interactionNotes, setInteractionNotes] = useState("");
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState("");
    const [autoTask, setAutoTask] = useState<{ title: string; date: string; type: string } | null>(null);

    // Dialer State
    const [showDialer, setShowDialer] = useState(false);
    const [callDuration, setCallDuration] = useState(0);

    // Dynamic Workflow State
    const [outcomeStep, setOutcomeStep] = useState<'interested' | 'callback' | 'wrong_number' | null>(null);
    const [interestedData, setInterestedData] = useState({ date: '', services: [] as string[] });
    const [callbackDate, setCallbackDate] = useState('');
    const [wrongNumberRemakes, setWrongNumberRemakes] = useState(''); // "Remakes" as per user request (Remarks)

    const customer = SelectedCustomer;
    const isConverted = customer.status === 'converted' || (customer as any).role === 'customer' || (customer as any).role === 'client';
    const summary = customerRecord as CustomerSummary | null;
    const pendingTask = summary?.actions?.find(a => a.status === 'pending');
    const isBlocked = !isConverted && customer.status !== 'lost' && !pendingTask;

    const [showBookingModal, setShowBookingModal] = useState(false);
    const [activeTab, setActiveTab] = useState("overview");

    const [showTaskModal, setShowTaskModal] = useState(false);
    const [showTagModal, setShowTagModal] = useState(false);
    const [quickTagInput, setQuickTagInput] = useState("");

    // --- New Action Modals ---
    const [showPhoneCallModal, setShowPhoneCallModal] = useState(false);
    const [phoneCallNotes, setPhoneCallNotes] = useState("");

    const [showEmailModal, setShowEmailModal] = useState(false);
    const [emailNotes, setEmailNotes] = useState("");
    const [emailDate, setEmailDate] = useState(new Date().toISOString().substring(0, 16));

    const [showDiaryModal, setShowDiaryModal] = useState(false);

    useEffect(() => {
        if (SelectedCustomer?.id) {
            dispatch(fetchCustomerRecord({
                customerId: SelectedCustomer.id,
                salespersonId: user?.id
            }));
        }
    }, [SelectedCustomer, dispatch, user]);

    // --- UI/UX Helpers ---

    // Helper to get initials
    const getInitials = (first: string, last: string) => {
        return (first?.[0] || '') + (last?.[0] || '');
    };

    const handleDirectAddTag = async () => {
        if (!quickTagInput.trim()) return;
        try {
            await dispatch(addCustomerTag({ customerId: customer.id, tagId: quickTagInput.trim() }) as any).unwrap();
            setQuickTagInput("");
            setShowTagModal(false);
            dispatch(fetchCustomerRecord({ customerId: customer.id, salespersonId: user?.id }));
        } catch (error) {
            console.error("Failed to add tag", error);
            alert("Failed to add tag.");
        }
    };

    // --- Workflow Handlers ---

    const handleSavePhoneCallNotes = async () => {
        if (!phoneCallNotes.trim()) return;
        try {
            await dispatch(logCommunication({
                customerId: customer.id,
                salespersonId: user?.id,
                type: 'call',
                status: 'completed',
                notes: phoneCallNotes,
                direction: 'outgoing'
            })).unwrap();
            setPhoneCallNotes("");
            setShowPhoneCallModal(false);
            dispatch(fetchCustomerRecord({ customerId: customer.id, salespersonId: user?.id }));
        } catch (error) {
            console.error("Failed to save phone call note", error);
            alert("Failed to save.");
        }
    };

    const handleSaveEmailLog = async () => {
        if (!emailNotes.trim()) return;
        try {
            await dispatch(logCommunication({
                customerId: customer.id,
                salespersonId: user?.id,
                type: 'email',
                status: 'completed',
                notes: `[Sent: ${new Date(emailDate).toLocaleString()}]\n\n${emailNotes}`,
                direction: 'outgoing'
            })).unwrap();
            setEmailNotes("");
            setShowEmailModal(false);
            dispatch(fetchCustomerRecord({ customerId: customer.id, salespersonId: user?.id }));
        } catch (error) {
            console.error("Failed to log email", error);
            alert("Failed to save.");
        }
    };

    const handleStartInteraction = (type: 'call' | 'meeting' | 'email') => {
        setInteractionType(type);
        if (type === 'call') {
            setShowDialer(true);
        } else {
            setWorkflowStep(2);
        }
    };

    const handleCallEnded = (duration: number) => {
        setShowDialer(false);
        setCallDuration(duration);

        // Auto-advance workflow after call
        setWorkflowStep(2); // Go to Result step
        // Optional: Pre-fill notes with duration
        const mins = Math.floor(duration / 60);
        const secs = duration % 60;
        setInteractionNotes(prev => `Call Duration: ${mins}m ${secs}s\n${prev}`);
    };

    const handleSelectOutcome = (outcome: string) => {
        setInteractionOutcome(outcome);

        // Reset dynamic state
        setOutcomeStep(null);
        setInterestedData({ date: '', services: [] });
        setCallbackDate('');
        setWrongNumberRemakes('');

        // Strict Workflow Logic
        if (outcome === 'not_interested') {
            setOutcomeStep(null); // No specific sub-step for details, goes correctly to review
            setWorkflowStep(3); // Tag step first
            setAutoTask(null); // No task for closed lead
        } else if (outcome === 'appointment_booked') {
            setShowBookingModal(true);
            setWorkflowStep(4); // Go to review to set confirmation task
            // Task set by modal success or manually here? 
            // We'll set a default confirmation task
            setAutoTask({ title: 'Confirmation Call', date: new Date(Date.now() + 86400000).toISOString().split('T')[0], type: 'phone_call' });
        } else if (outcome === 'call_later') {
            setOutcomeStep('callback'); // Shows date picker
            setWorkflowStep(3); // Tag step (can skip or integrate) -> actually let's go to Tag then Task
            // User requirement: "Tag -> Mandatory Task"
            // So Outcome -> Tag -> Task
        } else if (outcome === 'no_answer') {
            setWorkflowStep(3); // Tag
            // Mandatory Task: Call again
            setAutoTask({ title: 'Call again (No Answer)', date: new Date(Date.now() + 86400000).toISOString().split('T')[0], type: 'phone_call' });
        } else {
            // Default Fallback
            setWorkflowStep(3);
        }
    };

    const handleAddTag = () => {
        if (tagInput.trim()) {
            if (!selectedTags.includes(tagInput.trim())) {
                setSelectedTags([...selectedTags, tagInput.trim()]);
            }
            setTagInput("");
        }
    };

    const resetWorkflow = () => {
        setWorkflowStep(1);
        setInteractionOutcome("");
        setInteractionNotes("");
        setSelectedTags([]);
        setAutoTask(null);
        setOutcomeStep(null);
        setInterestedData({ date: '', services: [] });
        setCallbackDate('');
        setWrongNumberRemakes('');
    };

    const handleCompleteWorkflow = async () => {
        if (!user?.id) return;

        // Smart Tag Detection Logic
        const hasNoAnswer = selectedTags.some(t => t.toLowerCase().includes('no answer'));
        const hasWrongNumber = selectedTags.some(t => t.toLowerCase().includes('wrong number'));
        const hasCallAgain = selectedTags.some(t => t.toLowerCase().includes('call again'));
        const provinceTag = selectedTags.find(t => t.toLowerCase().startsWith('province:'));

        // Compile Notes from specific steps
        let finalNotes = interactionNotes;
        if (outcomeStep === 'interested') {
            finalNotes = `[Interested]\nServices: ${interestedData.services.join(', ')}\nDate: ${interestedData.date}\n\n${finalNotes}`;
        } else if (outcomeStep === 'callback') {
            finalNotes = `[Callback Requested]\nTime: ${new Date(callbackDate).toLocaleString()}\n\n${finalNotes}`;
        } else if (outcomeStep === 'wrong_number') {
            finalNotes = `[Wrong Number]\nRemarks: ${wrongNumberRemakes}\n\n${finalNotes}`;
        }

        // Apply Smart Tag Actions
        let currentAutoTask = autoTask;
        if (hasNoAnswer && !currentAutoTask) {
            currentAutoTask = {
                title: 'Follow-up: No Answer (Auto)',
                date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                type: 'phone_call'
            };
        }
        if (hasCallAgain && !currentAutoTask) {
            currentAutoTask = {
                title: 'Follow-up: Call Again (Auto)',
                date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                type: 'phone_call'
            };
        }

        try {
            // If Wrong Number, auto-close lead
            if (hasWrongNumber) {
                await dispatch(updateLead({ id: customer.id, updates: { status: 'lost' } })).unwrap();
                finalNotes = `[AUTO-CLOSED: WRONG NUMBER]\n${finalNotes}`;
            }

            // Province Routing (placeholder/logging)
            if (provinceTag) {
                finalNotes = `[ROUTING TAG: ${provinceTag}]\n${finalNotes}`;
                // Future: dispatch(reassignLead({ id: customer.id, province: provinceTag.split(':')[1] }));
            }

            await dispatch(logCommunication({
                customerId: customer.id,
                salespersonId: user?.id,
                type: interactionType,
                direction: 'outgoing',
                status: 'completed',
                notes: finalNotes,
                durationSeconds: callDuration,
                metadata: {
                    outcome: interactionOutcome,
                    tags: selectedTags,
                    recordingUrl: (interactionType === 'call' && callDuration > 0)
                        ? `https://api.twilio.com/2010-04-01/Accounts/AC.../Recordings/RE${Date.now()}.mp3`
                        : undefined
                }
            })).unwrap();

            if (currentAutoTask) {
                await dispatch(createAction({
                    customerId: customer.id,
                    salespersonId: user?.id || undefined,
                    actionType: currentAutoTask.type as any,
                    title: currentAutoTask.title,
                    description: `Generated from interaction outcome: ${interactionOutcome}${selectedTags.length ? ` (Tags: ${selectedTags.join(', ')})` : ''}`,
                    status: 'pending',
                    dueDate: new Date(currentAutoTask.date).toISOString(),
                    priority: 'high'
                })).unwrap();
            }

            // If appointment booked tagging, ensure logic
            if (interactionOutcome === 'appointment_booked' && !isConverted) {
                await dispatch(updateLead({ id: customer.id, updates: { status: 'converted' } })).unwrap();
            }

            resetWorkflow();

            dispatch(fetchCustomerRecord({
                customerId: customer.id,
                salespersonId: user?.id
            }));

        } catch (error) {
            console.error("Workflow failed", error);
            alert("Failed to save workflow.");
        }
    };

    const handleCompleteAppointment = async (id: string) => {
        if (!confirm('Mark this appointment as completed?')) return;
        try {
            await dispatch(completeAppointment({ id })).unwrap();
            dispatch(fetchCustomerRecord({
                customerId: customer.id,
                salespersonId: user?.id
            }));
        } catch (error) {
            console.error("Failed to complete appointment", error);
            alert("Failed to update appointment status.");
        }
    };

    const renderInteractionFlow = () => (
        <Card className="border-none shadow-sm bg-white rounded-lg overflow-hidden border border-slate-200 relative group">
            <CardHeader className="pb-2 pt-4 px-5 bg-slate-50 border-b border-slate-100">
                <CardTitle className="flex justify-between items-center">
                    <div className="space-y-0.5">
                        <span className="flex items-center gap-2 text-slate-700 font-bold text-base tracking-tight">
                            <Activity className="w-4 h-4 text-blue-500" />
                            Log Interaction
                        </span>
                        <p className="text-[10px] font-medium text-slate-400 block">Record customer communication</p>
                    </div>
                    {workflowStep > 1 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={resetWorkflow}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-md px-3 h-8 font-bold transition-all text-[10px]"
                        >
                            <X className="w-3 h-3 mr-1.5" /> Reset
                        </Button>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-5 pb-5">
                {/* Premium Stepper */}
                <div className="flex items-center justify-between mb-6 px-4 relative">
                    <div className="absolute top-4 left-10 right-10 h-[1.5px] bg-slate-100 -z-0 rounded-full" />
                    {[1, 2, 3, 4].map((step) => (
                        <div key={step} className="flex flex-col items-center gap-2 bg-white px-1.5 z-10 transition-all duration-500">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all duration-700 border shadow-md ${step < workflowStep ? 'bg-emerald-500 text-white border-emerald-500 scale-90 opacity-40' :
                                step === workflowStep ? 'bg-slate-900 text-white border-slate-900 shadow-slate-900/10 ring-4 ring-slate-900/5' :
                                    'bg-white text-slate-300 border-slate-200'
                                }`}>
                                {step < workflowStep ? <Check className="w-4 h-4" strokeWidth={3} /> : step}
                            </div>
                            <span className={`text-[10px] font-bold transition-all duration-500 ${step === workflowStep ? 'text-slate-900' : 'text-slate-300'
                                }`}>
                                {['Start', 'Result', 'Focus', 'Done'][step - 1]}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Step Content Container */}
                <div className="min-h-[140px] flex flex-col justify-center">
                    {workflowStep === 1 && (
                        <div className="animate-in fade-in duration-500">
                            <button
                                className="w-full h-20 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-100 bg-slate-50/50 hover:bg-white hover:border-blue-200 transition-all rounded-lg group"
                                onClick={() => handleStartInteraction('call')}
                            >
                                <div className="p-2.5 bg-white text-blue-600 rounded-lg shadow-sm border border-slate-100 group-hover:scale-105 transition-transform duration-300">
                                    <PhoneCall className="w-5 h-5" />
                                </div>
                                <div className="text-center">
                                    <span className="font-bold text-slate-700 text-sm block">Start Interaction</span>
                                    <span className="text-[10px] text-slate-400 font-medium">Log a call or meeting</span>
                                </div>
                            </button>
                        </div>
                    )}

                    {workflowStep === 2 && (
                        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {[
                                    { id: 'appointment_booked', label: 'Appointment Booked', sub: 'Confirmed', icon: Calendar, color: 'emerald' },
                                    { id: 'call_later', label: 'Call Back', sub: 'Set reminder', icon: Clock, color: 'blue' },
                                    { id: 'no_answer', label: 'No Answer', sub: 'Follow up later', icon: PhoneCall, color: 'slate' },
                                    { id: 'not_interested', label: 'Not Interested', sub: 'Archive lead', icon: X, color: 'red' }
                                ].map(opt => (
                                    <button
                                        key={opt.id}
                                        onClick={() => handleSelectOutcome(opt.id)}
                                        className="flex items-center gap-3 p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-all duration-300 text-left shadow-sm group"
                                    >
                                        <div className={`p-2.5 bg-slate-50 text-slate-500 rounded-lg border border-slate-100 group-hover:text-blue-600 transition-colors`}>
                                            <opt.icon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <span className="font-bold text-slate-800 block text-sm leading-tight transition-colors">{opt.label}</span>
                                            <span className="text-[10px] text-slate-400 font-medium">{opt.sub}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                            <div className="relative">
                                <Textarea
                                    placeholder="Add interaction notes..."
                                    value={interactionNotes}
                                    onChange={(e) => setInteractionNotes(e.target.value)}
                                    className="bg-slate-50 border-slate-200 min-h-[120px] rounded-lg p-4 font-medium text-sm focus:bg-white transition-all shadow-sm"
                                />
                            </div>
                        </div>
                    )}

                    {workflowStep === 3 && (
                        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
                            {interactionOutcome === 'call_later' && (
                                <div className="bg-blue-50/50 p-5 rounded-lg border border-blue-100">
                                    <label className="text-xs font-bold text-blue-800 block mb-3">Target Callback Time</label>
                                    <Input
                                        type="datetime-local"
                                        value={callbackDate}
                                        onChange={(e) => {
                                            setCallbackDate(e.target.value);
                                            setAutoTask({ title: 'Callback Request', date: e.target.value, type: 'phone_call' });
                                        }}
                                        className="bg-white h-12 rounded-lg border-blue-200 text-sm font-bold px-4 shadow-sm"
                                    />
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Add tags (e.g. VIP, Interested)..."
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                                        className="h-11 rounded-lg bg-slate-50 border-slate-200 font-medium px-4 text-sm shadow-sm"
                                    />
                                    <Button onClick={handleAddTag} className="h-11 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-lg shadow-sm">
                                        <Plus className="w-5 h-5" />
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-2 min-h-[40px]">
                                    {selectedTags.map((tag, i) => (
                                        <Badge
                                            key={i}
                                            className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-[10px] rounded-lg shadow-sm hover:bg-indigo-100 cursor-pointer transition-colors"
                                            onClick={() => setSelectedTags(selectedTags.filter(t => t !== tag))}
                                        >
                                            #{tag} <X className="w-3 h-3 ml-1.5 opacity-60" />
                                        </Badge>
                                    ))}
                                    {selectedTags.length === 0 && (
                                        <div className="text-slate-400 text-[11px] font-medium italic">No tags added</div>
                                    )}
                                </div>
                            </div>
                            <Button className="w-full h-11 bg-slate-900 text-white hover:bg-black rounded-lg font-bold text-sm transition-all shadow-md" onClick={() => setWorkflowStep(4)}>
                                Next Step <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    )}

                    {workflowStep === 4 && (
                        <div className="animate-in fade-in zoom-in-95 duration-500">
                            {interactionOutcome === 'not_interested' ? (
                                <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 text-center space-y-4">
                                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mx-auto text-slate-400 shadow-sm border border-slate-100">
                                        <Trash2 className="w-6 h-6" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-base font-bold text-slate-800">Archive Lead</h3>
                                        <p className="text-[11px] text-slate-500 font-medium">Please provide a reason for archiving</p>
                                    </div>
                                    <Textarea
                                        placeholder="Why is this conversion unlikely?"
                                        value={wrongNumberRemakes}
                                        onChange={(e) => setWrongNumberRemakes(e.target.value)}
                                        className="bg-white border-slate-200 h-24 rounded-lg p-3 text-sm font-medium shadow-sm"
                                    />
                                    <Button
                                        onClick={async () => {
                                            if (!wrongNumberRemakes) return alert("Reason required.");
                                            await dispatch(updateLead({ id: customer.id, updates: { status: 'lost' } }));
                                            handleCompleteWorkflow();
                                        }}
                                        className="w-full bg-slate-900 hover:bg-black text-white h-11 rounded-lg font-bold text-sm shadow-sm transition-all"
                                    >
                                        Confirm Archive
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="text-center">
                                        <h3 className="text-base font-bold text-slate-800 flex items-center justify-center gap-2">
                                            <AlertCircle className="w-5 h-5 text-blue-500" />
                                            Next Action
                                        </h3>
                                        <p className="text-[11px] text-slate-400 font-medium">Schedule the follow-up task</p>
                                    </div>

                                    <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 shadow-sm">
                                        <div className="space-y-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase block text-center">Task Title</label>
                                                <Input
                                                    value={autoTask?.title || ''}
                                                    onChange={(e) => setAutoTask(prev => ({ ...prev!, title: e.target.value }))}
                                                    className="h-10 bg-white border-slate-200 text-sm font-bold text-center text-slate-800 rounded-lg shadow-sm"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase block px-1 text-center">Due Date</label>
                                                    <Input
                                                        type="date"
                                                        value={autoTask?.date || ''}
                                                        onChange={(e) => setAutoTask(prev => ({ ...prev!, date: e.target.value }))}
                                                        className="h-10 bg-white border-slate-200 rounded-lg font-bold px-3 text-xs shadow-sm"
                                                        min={new Date().toISOString().split('T')[0]}
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase block px-1 text-center">Type</label>
                                                    <Select
                                                        value={autoTask?.type || 'phone_call'}
                                                        onChange={(val) => setAutoTask(prev => ({ ...prev!, type: val }))}
                                                        options={[
                                                            { value: 'phone_call', label: 'Call' },
                                                            { value: 'meeting', label: 'Meeting' },
                                                            { value: 'email', label: 'Email' }
                                                        ]}
                                                        className="h-10 bg-white border-slate-200 rounded-lg font-bold px-3 text-xs shadow-sm"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button variant="ghost" onClick={() => setWorkflowStep(3)} className="h-11 flex-1 rounded-lg font-bold text-slate-400 hover:bg-slate-50 text-xs">Back</Button>
                                        <Button
                                            onClick={handleCompleteWorkflow}
                                            className="h-11 flex-[2] bg-slate-900 text-white hover:bg-black rounded-lg font-bold text-sm shadow-md transition-all active:scale-[0.98]"
                                            disabled={!autoTask?.date || !autoTask?.title}
                                        >
                                            Save Interaction
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="max-w-[1500px] mx-auto pb-10 space-y-6 animate-in fade-in slide-in-from-top-4 duration-1000">
            {/* 1. Header Card (Ultra-Premium Redesign) */}
            <div className="relative overflow-hidden rounded-xl bg-slate-900 shadow-2xl shadow-blue-900/20 group border border-white/10">
                <div className="absolute inset-0 mesh-gradient opacity-40 mix-blend-overlay pointer-events-none" />
                <div className="absolute top-0 right-0 w-[600px] h-full bg-gradient-to-l from-blue-500/10 to-transparent pointer-events-none" />
                <div className="absolute -left-20 -top-20 w-80 h-80 bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />

                <div className="p-5 relative z-10">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5">
                        <div className="flex items-center gap-5">
                            <div className="relative group/avatar">
                                <div className="relative w-16 h-16 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold text-xl shadow-xl border border-white/10 overflow-hidden text-center leading-none">
                                    {getInitials(customer.firstName, customer.lastName)}
                                </div>
                                <div className={`absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full border-2 border-slate-900 shadow-xl ${isConverted ? 'bg-emerald-400' : 'bg-blue-400'} ring-1 ring-white/10`} />
                            </div>

                            <div className="space-y-2">
                                <div className="flex flex-col gap-0.5">
                                    <div className="flex items-center gap-3">
                                        <h1 className="text-xl font-bold text-white tracking-tight leading-none">
                                            {customer.firstName} <span className="text-slate-300 font-medium">{customer.lastName}</span>
                                        </h1>
                                        <Badge className={`text-[10px] font-bold px-3 py-1 rounded-full border-none shadow ${isConverted ? 'bg-emerald-500 text-white' : 'bg-blue-500 text-white'}`}>
                                            {customer.status}
                                        </Badge>
                                    </div>
                                    <p className="text-slate-400 text-[11px] font-medium flex items-center gap-1.5">
                                        Active Profile
                                    </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg border border-white/5 group/link cursor-pointer hover:bg-white/10 transition-all">
                                        <Mail className="w-3 h-3 text-slate-400 group-hover/link:text-white transition-colors" />
                                        <span className="text-[11px] font-medium text-slate-300 group-hover/link:text-white">{customer.email}</span>
                                    </div>
                                    {customer.phone && (
                                        <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg border border-white/5 group/link cursor-pointer hover:bg-white/10 transition-all">
                                            <Phone className="w-3 h-3 text-slate-400 group-hover/link:text-white transition-colors" />
                                            <span className="text-[11px] font-medium text-slate-300 group-hover/link:text-white">{customer.phone}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg border border-white/5">
                                        <Users className="w-3 h-3 text-slate-500" />
                                        <span className="text-[11px] font-medium text-slate-400">ID {customer.id.slice(-6).toUpperCase()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3 w-full lg:w-auto">
                            {user?.role === 'admin' && (
                                <Button
                                    variant="ghost"
                                    className="flex-1 lg:flex-none h-10 px-4 bg-white/5 hover:bg-red-500/10 hover:text-red-400 text-slate-400 border border-white/5 rounded-lg font-bold transition-all text-xs"
                                    onClick={async () => {
                                        if (confirm('Permanently delete this customer record?')) {
                                            try {
                                                await dispatch(deleteLead(customer.id)).unwrap();
                                                window.location.reload();
                                            } catch (error) {
                                                console.error('Delete failed:', error);
                                            }
                                        }
                                    }}
                                >
                                    <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                                </Button>
                            )}
                            <Button
                                className="flex-1 lg:flex-none h-10 px-6 bg-white text-slate-900 hover:bg-slate-100 shadow-md rounded-lg font-bold text-xs transition-all active:scale-[0.98] border border-slate-200"
                                onClick={() => setShowBookingModal(true)}
                            >
                                <Calendar className="w-3.5 h-3.5 mr-2" /> Book Appointment
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6">
                <Card className="border-none shadow-sm bg-white overflow-hidden p-4">
                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Total Appointments</div>
                    <div className="text-xl font-bold text-slate-900">{summary?.appointments?.length || 0}</div>
                </Card>
                <Card className="border-none shadow-sm bg-white overflow-hidden p-4">
                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Completed</div>
                    <div className="text-xl font-bold text-slate-900">{summary?.appointments?.filter(a => a.status === 'completed').length || 0}</div>
                </Card>
                <Card className="border-none shadow-sm bg-white overflow-hidden p-4">
                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1.5">Lifetime Value</div>
                    <div className="text-xl font-bold text-slate-900">€{summary?.summary?.lifetimeValue || 0}</div>
                </Card>
                <Card className="border-none shadow-sm bg-white overflow-hidden p-4">
                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" /> Repeat Visits</div>
                    <div className="text-xl font-bold text-slate-900">{summary?.summary?.repeatCount || 0}</div>
                </Card>
            </div>

            {/* Quick Actions Bar */}
            <div className="flex flex-wrap gap-2 bg-white p-3 rounded-lg shadow-sm border border-slate-200 mb-6">
                <Button variant="primary" size="sm" onClick={() => handleStartInteraction('call')} className="bg-[#b3d81b] hover:bg-[#a1c218] text-white border-none text-xs px-4 shadow-sm">
                    <Plus className="w-3.5 h-3.5 mr-1" /> Log Communication
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowPhoneCallModal(true)} className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs px-4 shadow-sm">
                    <PhoneCall className="w-3.5 h-3.5 mr-1" /> Add Phone Call Notes
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowEmailModal(true)} className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs px-4 shadow-sm">
                    <Mail className="w-3.5 h-3.5 mr-1" /> Log Email Sent
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowTaskModal(true)} className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs px-4 shadow-sm">
                    <Clock className="w-3.5 h-3.5 mr-1" /> Follow Up
                </Button>
                <Button variant="primary" size="sm" onClick={() => setShowDiaryModal(true)} className="bg-slate-900 hover:bg-slate-800 text-white border-none text-xs px-4 shadow-sm">
                    <Calendar className="w-3.5 h-3.5 mr-1" /> Book Appointment
                </Button>
            </div>

            {/* Main Layout - 2 Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                {/* Left Column: Properties */}
                <div className="lg:col-span-4 xl:col-span-3 space-y-6">
                    <Card className="border-none shadow-sm bg-white rounded-lg overflow-hidden border border-slate-200">
                        <CardHeader className="bg-slate-50 border-b border-slate-100 py-3 px-5">
                            <CardTitle className="text-xs font-bold text-slate-600 flex items-center justify-between">
                                Customer Profile
                                <User className="w-3.5 h-3.5 text-slate-400" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 p-5">
                            <div className="space-y-1.5">
                                <label className="text-[10px] text-gray-300 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Activity className="w-2.5 h-2.5" /> Source Origin
                                </label>
                                <div className="font-bold text-gray-800 capitalize bg-gray-50/80 px-4 py-2.5 rounded-xl border border-gray-100 text-xs shadow-inner group-hover:border-blue-100 transition-colors">
                                    {customer.source?.replace('_', ' ') || 'Direct / Walk-in'}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] text-gray-300 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Tag className="w-2.5 h-2.5" /> Active Spectrum
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {customerRecord?.tags?.map((t: any) => (
                                        <Badge key={t.id || t} className="bg-blue-50/50 text-blue-600 text-[10px] font-bold border border-blue-100/50 px-2.5 py-0.5 rounded-lg">
                                            #{t.tagId || t}
                                        </Badge>
                                    ))}
                                    {(!customerRecord?.tags || customerRecord.tags.length === 0) && (
                                        <div className="text-gray-400 text-[11px] font-bold italic bg-gray-50/50 p-3 rounded-xl w-full text-center border border-dashed border-gray-200">
                                            No segments assigned
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-4 pt-4 border-t border-slate-100">
                                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-2 mb-2">
                                        <Activity className="w-3 h-3" /> Core Properties
                                    </label>
                                    <div className="space-y-3 text-xs">
                                        <div className="space-y-1 pb-2">
                                            <label className="text-gray-400 font-medium">First Name</label>
                                            <div className="font-bold text-gray-800">{customer.firstName}</div>
                                        </div>
                                        <div className="space-y-1 pb-2">
                                            <label className="text-gray-400 font-medium">Last Name</label>
                                            <div className="font-bold text-gray-800">{customer.lastName || '--'}</div>
                                        </div>
                                        <div className="space-y-1 pb-2">
                                            <label className="text-gray-400 font-medium">Phone Number</label>
                                            <div className="font-bold text-blue-600">{customer.phone || '--'}</div>
                                        </div>
                                        <div className="space-y-1 pb-2">
                                            <label className="text-gray-400 font-medium">Email</label>
                                            <div className="font-bold text-blue-600">{customer.email || '--'}</div>
                                        </div>
                                        <div className="space-y-1 pb-2">
                                            <label className="text-gray-400 font-medium">Customer ID</label>
                                            <div className="font-bold text-gray-800">{customer.id.slice(-6).toUpperCase()}</div>
                                        </div>
                                        <div className="space-y-1 pb-2">
                                            <label className="text-gray-400 font-medium">Contact owner</label>
                                            <div className="font-bold text-blue-600">{user?.firstName} {user?.lastName}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Interaction Logging & Timeline */}
                <div className="lg:col-span-8 xl:col-span-9 space-y-6 h-full">

                    {/* Interaction Logger Drop-in */}
                    <div className="mb-6">
                        {renderInteractionFlow()}
                    </div>
                    <Card className="border-none shadow-sm h-[650px] flex flex-col bg-white rounded-lg overflow-hidden border border-slate-200">
                        <CardHeader className="border-b border-gray-100/30 pb-3 pt-4 px-5 bg-white/40">
                            <CardTitle className="text-[10px] uppercase font-bold text-slate-500 flex items-center justify-between">
                                Activity History
                                <div className="px-2 py-1 bg-slate-100 rounded-lg text-[9px] font-bold text-slate-600 border border-slate-200">
                                    {((summary?.communications?.length || 0) +
                                        (summary?.appointments?.length || 0) +
                                        (summary?.actions?.length || 0) +
                                        (summary?.tags?.length || 0))} Activities
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto p-0 relative custom-scrollbar bg-slate-50/10">
                            <div className="absolute left-[29px] top-0 bottom-0 w-[2px] bg-gradient-to-b from-blue-500/0 via-blue-500/10 to-blue-500/0 z-0" />

                            <div className="py-6 space-y-6">
                                {(() => {
                                    const timelineItems = [
                                        ...(summary?.communications?.map(c => ({ type: 'communication', date: new Date(c.createdAt), data: c })) || []),
                                        ...(summary?.appointments?.map(a => ({ type: 'appointment', date: new Date(a.startTime), data: a })) || []),
                                        ...(summary?.actions?.map(a => ({ type: 'action', date: new Date(a.createdAt), data: a })) || []),
                                        ...(summary?.tags?.map(t => ({ type: 'tag', date: new Date(t.createdAt), data: t })) || []),
                                        // Fake Form Submission if they have customer.metadata.lastMetaFormName
                                        ...((customer as any).metadata?.lastMetaFormName ? [{
                                            type: 'form',
                                            date: new Date((customer as any).metadata.lastMetaFormSubmittedAt || customer.createdAt),
                                            data: { formName: (customer as any).metadata.lastMetaFormName }
                                        }] : [])
                                    ].sort((a, b) => b.date.getTime() - a.date.getTime());

                                    if (timelineItems.length === 0) {
                                        return (
                                            <div className="text-center text-slate-400 py-12 text-xs">
                                                No activity recorded yet.
                                            </div>
                                        );
                                    }

                                    return timelineItems.map((item: any, idx) => {

                                        // Renderer for Form Submission
                                        if (item.type === 'form') {
                                            return (
                                                <div key={`form-${idx}`} className="relative pl-12 pr-5 z-10 group/item">
                                                    <div className="absolute left-[-2px] top-1 w-6 h-6 rounded-full bg-slate-100 border border-slate-200 shadow-sm flex items-center justify-center">
                                                        <FileText className="w-3 h-3 text-slate-600" />
                                                    </div>
                                                    <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm mb-4">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="font-bold text-slate-800 text-sm">Form submission</span>
                                                            <div className="text-[10px] text-slate-400 ml-auto">{item.date.toLocaleString()}</div>
                                                        </div>
                                                        <div className="text-xs text-slate-600">
                                                            <strong>{customer.firstName}</strong> submitted <strong>{item.data.formName}</strong>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        }
                                        if (item.type === 'communication') {
                                            const comm = item.data as CommunicationLog;
                                            const isCall = comm.type === 'call';
                                            return (
                                                <div key={`comm-${idx}`} className="relative pl-12 pr-5 z-10 group/item">
                                                    <div className="absolute left-[-2px] top-1 w-6 h-6 rounded-full bg-slate-100 border border-slate-200 shadow-sm z-10 flex items-center justify-center">
                                                        {isCall ? <PhoneCall className="w-3 h-3 text-slate-600" /> : <Mail className="w-3 h-3 text-slate-600" />}
                                                    </div>
                                                    <div className="space-y-2 mb-4">
                                                        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm transition-all duration-300">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className="font-bold text-slate-800 text-sm">{isCall ? 'Call logged' : 'Message logged'}</span>
                                                                <div className="text-[10px] text-slate-400 ml-auto">{item.date.toLocaleString()}</div>
                                                            </div>
                                                            <p className="text-xs text-slate-700 leading-relaxed font-medium mb-3">{comm.notes}</p>
                                                            {(comm.metadata?.outcome || (comm.metadata?.tags && comm.metadata?.tags.length > 0)) && (
                                                                <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                                                                    {comm.metadata.outcome && (
                                                                        <Badge className="bg-slate-700 text-white text-[9px] font-semibold px-2 py-0.5 rounded">
                                                                            {comm.metadata.outcome.replace('_', ' ')}
                                                                        </Badge>
                                                                    )}
                                                                    {comm.metadata.tags && comm.metadata.tags.map((t: string) => (
                                                                        <span key={t} className="text-[9px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                                                            #{t}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        } else if (item.type === 'appointment') {
                                            const apt = item.data as any;
                                            return (
                                                <div key={`apt-${idx}`} className="relative pl-12 pr-5 z-10 group/item">
                                                    <div className="absolute left-[-2px] top-1 w-6 h-6 rounded-full bg-emerald-50 border border-emerald-200 shadow-sm z-10 flex items-center justify-center">
                                                        <Calendar className="w-3 h-3 text-emerald-600" />
                                                    </div>
                                                    <div className="space-y-2 mb-4">
                                                        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm transition-all duration-300">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className="font-bold text-slate-800 text-sm">Meeting</span>
                                                                <div className="text-[10px] text-slate-400 ml-auto">{item.date.toLocaleString()}</div>
                                                            </div>
                                                            <p className="text-sm font-bold text-slate-900 leading-tight mb-3">{apt.serviceName || 'Procedure'}</p>
                                                            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                                                                <div className="flex items-center gap-3">
                                                                    <Badge className="bg-emerald-50 text-emerald-700 text-[10px] font-semibold px-2 py-0.5 rounded border border-emerald-100">
                                                                        {apt.status}
                                                                    </Badge>
                                                                    <span className="text-[10px] font-medium text-slate-400">{apt.clinicName || 'Clinic'}</span>
                                                                </div>
                                                                {apt.status !== 'completed' && apt.status !== 'cancelled' && (
                                                                    <Button
                                                                        size="sm"
                                                                        className="h-7 px-3 bg-slate-800 hover:bg-emerald-600 text-white rounded font-bold text-[10px] transition-all"
                                                                        onClick={() => handleCompleteAppointment(apt.id)}
                                                                    >
                                                                        Complete
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        } else if (item.type === 'action') {
                                            const act = item.data as CrmAction;
                                            return (
                                                <div key={`act-${idx}`} className="relative pl-12 pr-5 z-10 group/item">
                                                    <div className="absolute left-[-2px] top-1 w-6 h-6 rounded-full bg-amber-50 border border-amber-200 shadow-sm z-10 flex items-center justify-center">
                                                        <CheckCircle className="w-3 h-3 text-amber-600" />
                                                    </div>
                                                    <div className="space-y-2 mb-4">
                                                        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm transition-all duration-300">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className="font-bold text-slate-800 text-sm">Task: {act.title}</span>
                                                                <div className="text-[10px] text-slate-400 ml-auto">{item.date.toLocaleString()}</div>
                                                            </div>
                                                            <p className="text-xs text-slate-700 leading-relaxed font-medium mb-3">{act.description || '--'}</p>
                                                            <div className="flex items-center gap-2 border-t border-slate-100 pt-3">
                                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${act.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>{act.status}</span>
                                                                {act.dueDate && (
                                                                    <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium"><Clock className="w-3 h-3" /> Due {new Date(act.dueDate).toLocaleDateString()}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        } else if (item.type === 'tag') {
                                            const tag = item.data as any;
                                            return (
                                                <div key={`tag-${idx}`} className="relative pl-12 pr-5 z-10 group/item">
                                                    <div className="absolute left-[-2px] top-1 w-6 h-6 rounded-full bg-slate-50 border border-slate-200 shadow-sm z-10 flex items-center justify-center">
                                                        <Tag className="w-3 h-3 text-slate-600" />
                                                    </div>
                                                    <div className="space-y-2 mb-4">
                                                        <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-sm font-bold text-slate-800">Tag added:</span>
                                                                <Badge className="bg-slate-100 text-slate-700 border border-slate-200">#{tag.tag?.name || 'General'}</Badge>
                                                            </div>
                                                            <span className="text-[10px] text-slate-400 ml-auto">{item.date.toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    });
                                })()}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div >

            {/* Diary Modal */}
            {showDiaryModal && (
                <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex justify-center items-center p-4">
                    <div className="bg-gray-50 flex flex-col w-[95vw] h-[95vh] rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="bg-white border-b border-gray-100 flex items-center justify-between px-6 py-4">
                            <h3 className="font-black text-xl text-gray-900">Clinic Sales Diary</h3>
                            <Button variant="ghost" className="hover:bg-red-50 text-gray-500 hover:text-red-500 rounded-xl" onClick={() => setShowDiaryModal(false)}>
                                <X className="w-6 h-6" />
                            </Button>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            <StaffDiary onNewAppointment={() => {
                                setShowDiaryModal(false);
                                setShowBookingModal(true);
                            }} />
                        </div>
                    </div>
                </div>
            )}

            {/* Modals */}
            {showBookingModal && (
                <CRMBookingModal
                    customerId={customer.id}
                    customerName={`${customer.firstName} ${customer.lastName}`}
                    onClose={() => setShowBookingModal(false)}
                    onSuccess={async () => {
                        if (!isConverted) {
                            await dispatch(updateLead({ id: customer.id, updates: { status: 'converted' } }));
                        }
                        dispatch(fetchCustomerRecord({ customerId: customer.id, salespersonId: user?.id }));
                    }}
                />
            )}

            {/* Phone Call Notes Modal */}
            {showPhoneCallModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-slate-200 p-6 space-y-4">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2"><PhoneCall className="w-4 h-4 text-slate-400" /> Add Phone Call Notes</h3>
                            <Button variant="ghost" size="sm" onClick={() => { setShowPhoneCallModal(false); setPhoneCallNotes(""); }} className="h-8 w-8 p-0">
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="space-y-4">
                            <Textarea
                                placeholder="Write down important notes from the phone call..."
                                value={phoneCallNotes}
                                onChange={(e) => setPhoneCallNotes(e.target.value)}
                                className="min-h-[120px] resize-none"
                            />
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => { setShowPhoneCallModal(false); setPhoneCallNotes(""); }}>Cancel</Button>
                                <Button className="bg-slate-800 hover:bg-slate-900 text-white" onClick={handleSavePhoneCallNotes}>Save Notes</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Email Log Modal */}
            {showEmailModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-slate-200 p-6 space-y-4">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2"><Mail className="w-4 h-4 text-slate-400" /> Log Sent Email</h3>
                            <Button variant="ghost" size="sm" onClick={() => { setShowEmailModal(false); setEmailNotes(""); }} className="h-8 w-8 p-0">
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-1 block">Date Sent</label>
                                <Input type="datetime-local" value={emailDate} onChange={(e) => setEmailDate(e.target.value)} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-1 block">Email Content / Body</label>
                                <Textarea
                                    placeholder="Paste the email sent from Outlook..."
                                    value={emailNotes}
                                    onChange={(e) => setEmailNotes(e.target.value)}
                                    className="min-h-[120px] resize-none"
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <Button variant="outline" onClick={() => { setShowEmailModal(false); setEmailNotes(""); }}>Cancel</Button>
                                <Button className="bg-slate-800 hover:bg-slate-900 text-white" onClick={handleSaveEmailLog}>Save Email Log</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tag Modal */}
            {showTagModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm border border-slate-200 p-6 space-y-4">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-bold text-slate-800">Add Customer Tag</h3>
                            <Button variant="ghost" size="sm" onClick={() => { setShowTagModal(false); setQuickTagInput(""); }} className="h-8 w-8 p-0">
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="flex gap-2">
                            <Input
                                placeholder="e.g. VIP, Interested"
                                value={quickTagInput}
                                onChange={(e) => setQuickTagInput(e.target.value)}
                                onKeyPress={async (e) => {
                                    if (e.key === 'Enter' && quickTagInput.trim()) {
                                        await handleDirectAddTag();
                                    }
                                }}
                            />
                            <Button
                                onClick={handleDirectAddTag}
                                className="bg-slate-800 hover:bg-slate-900 text-white"
                            >
                                Save
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Task Modal */}
            {showTaskModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-slate-800">New Follow-up Task</h2>
                            <Button variant="ghost" size="sm" onClick={() => setShowTaskModal(false)}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            <ActionForm
                                customerId={customer.id}
                                onSuccess={() => {
                                    setShowTaskModal(false);
                                    dispatch(fetchCustomerRecord({ customerId: customer.id, salespersonId: user?.id }));
                                }}
                                prefilledData={{ salespersonId: user?.id }}
                            />
                        </div>
                    </div>
                </div>
            )}

            <DialerModal
                isOpen={showDialer}
                onClose={() => setShowDialer(false)}
                customerName={`${customer.firstName} ${customer.lastName}`}
                phoneNumber={customer.phone || 'No Number'}
                onCallEnded={handleCallEnded}
            />
        </div >
    );
};
