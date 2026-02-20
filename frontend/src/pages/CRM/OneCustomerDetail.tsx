import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    Activity, CheckCircle, PhoneCall,
    Clock, Tag, Mail, Phone, Calendar,
    ArrowRight, User,
    AlertCircle, FileText, Check, X,
    MoreHorizontal, Play, Trash2
} from "lucide-react";
import { Button } from "@/components/atoms/Button/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/molecules/Card/Card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/molecules/Tabs";
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
import { clinicsAPI } from "@/services/api";
import type { Clinic } from "@/types";
import { CRMBookingModal } from '@/components/crm/CRMBookingModal';
import { completeAppointment } from "@/store/slices/bookingSlice";

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
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center shadow-inner border border-gray-600 text-3xl font-black text-gray-300">
                                {customerName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                            {callStatus === 'dialing' && (
                                <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-ping" />
                            )}
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-2xl font-bold tracking-tight">{customerName}</h3>
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
                            className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/40 border-4 border-gray-800 flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
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

    // --- Workflow Handlers ---

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
        <Card className="border-none shadow-lg bg-white overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-500 via-orange-500 to-red-500" />
            <CardHeader className="pb-2 bg-gradient-to-b from-gray-50/50 to-white">
                <CardTitle className="flex justify-between items-center">
                    <span className="flex items-center gap-2 text-gray-800 font-bold">
                        <Activity className="w-5 h-5 text-red-600" />
                        Interaction Flow
                    </span>
                    {workflowStep > 1 && (
                        <Button variant="ghost" size="sm" onClick={resetWorkflow} className="text-gray-400 hover:text-red-500 hover:bg-red-50">
                            <X className="w-4 h-4 mr-1" /> Cancel
                        </Button>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
                {/* Stepper */}
                <div className="flex items-center justify-between mb-8 px-4 relative">
                    <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-gray-100 -z-10 -translate-y-1/2" />
                    {[1, 2, 3, 4].map((step) => (
                        <div key={step} className="flex flex-col items-center gap-2 bg-white px-2">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 border-4 border-white shadow-sm ${step < workflowStep ? 'bg-emerald-500 text-white shadow-emerald-200' :
                                step === workflowStep ? 'bg-red-600 text-white shadow-lg shadow-red-500/40 scale-110' :
                                    'bg-gray-100 text-gray-400'
                                }`}>
                                {step < workflowStep ? <Check className="w-5 h-5" /> : step}
                            </div>
                            <span className={`text-[10px] uppercase tracking-widest font-bold transition-colors duration-300 ${step === workflowStep ? 'text-red-600' : 'text-gray-400'
                                }`}>
                                {['Connect', 'Result', 'Tag', 'Mandatory Task'][step - 1]}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Step 1: Connect */}
                {workflowStep === 1 && (
                    <div className="grid grid-cols-1 gap-4 animate-in slide-in-from-bottom-4 fade-in duration-500">
                        <Button
                            variant="ghost"
                            className="h-32 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-200 bg-gray-50 hover:bg-blue-50 hover:border-blue-400 hover:scale-[1.01] transition-all rounded-2xl group shadow-sm"
                            onClick={() => handleStartInteraction('call')}
                        >
                            <div className="p-4 bg-white text-blue-600 rounded-full shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all">
                                <PhoneCall className="w-8 h-8" />
                            </div>
                            <div className="text-center">
                                <span className="font-bold text-gray-800 text-xl block group-hover:text-blue-700">Start Interaction</span>
                                <span className="text-xs text-gray-500 font-medium group-hover:text-blue-500">Log a call, meeting, or email</span>
                            </div>
                        </Button>
                    </div>
                )}

                {/* Step 2: Result */}
                {workflowStep === 2 && (
                    <div className="space-y-6 animate-in slide-in-from-right-8 fade-in duration-300">
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-gray-900">Call Result</h3>
                            <p className="text-sm text-gray-500">What happened?</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Button variant="outline" className="justify-start h-16 text-left px-5 hover:border-blue-500 hover:bg-blue-50 rounded-xl group transition-all" onClick={() => handleSelectOutcome('appointment_booked')}>
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg mr-3 group-hover:bg-blue-200"><Calendar className="w-5 h-5" /></div>
                                <div>
                                    <span className="font-bold text-gray-800 block group-hover:text-blue-700">Appointment Booked</span>
                                    <span className="text-[10px] text-gray-400 font-medium">Schedule confirmation task</span>
                                </div>
                            </Button>
                            <Button variant="outline" className="justify-start h-16 text-left px-5 hover:border-amber-500 hover:bg-amber-50 rounded-xl group transition-all" onClick={() => handleSelectOutcome('call_later')}>
                                <div className="p-2 bg-amber-100 text-amber-600 rounded-lg mr-3 group-hover:bg-amber-200"><Clock className="w-5 h-5" /></div>
                                <div>
                                    <span className="font-bold text-gray-800 block group-hover:text-amber-700">Call Later</span>
                                    <span className="text-[10px] text-gray-400 font-medium">Schedule callback</span>
                                </div>
                            </Button>
                            <Button variant="outline" className="justify-start h-16 text-left px-5 hover:border-red-500 hover:bg-red-50 rounded-xl group transition-all" onClick={() => handleSelectOutcome('no_answer')}>
                                <div className="p-2 bg-red-100 text-red-600 rounded-lg mr-3 group-hover:bg-red-200"><PhoneCall className="w-5 h-5" /></div>
                                <div>
                                    <span className="font-bold text-gray-800 block group-hover:text-red-700">No Answer</span>
                                    <span className="text-[10px] text-gray-400 font-medium">Schedule retry</span>
                                </div>
                            </Button>
                            <Button variant="outline" className="justify-start h-16 text-left px-5 hover:border-gray-500 hover:bg-gray-100 rounded-xl group transition-all" onClick={() => handleSelectOutcome('not_interested')}>
                                <div className="p-2 bg-gray-200 text-gray-600 rounded-lg mr-3 group-hover:bg-gray-300"><X className="w-5 h-5" /></div>
                                <div>
                                    <span className="font-bold text-gray-800 block group-hover:text-gray-900">Not Interested</span>
                                    <span className="text-[10px] text-gray-400 font-medium">Close lead</span>
                                </div>
                            </Button>
                        </div>
                        <Textarea
                            placeholder="Add notes..."
                            value={interactionNotes}
                            onChange={(e) => setInteractionNotes(e.target.value)}
                            className="bg-gray-50 border-gray-200 min-h-[80px] rounded-xl"
                        />
                    </div>
                )}

                {/* Step 3: Tags (and optional Callback Date for 'Call Later') */}
                {workflowStep === 3 && (
                    <div className="space-y-6 animate-in slide-in-from-right-8 fade-in duration-300">
                        {interactionOutcome === 'call_later' && (
                            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 mb-4">
                                <label className="text-xs font-bold text-amber-700 uppercase tracking-widest block mb-2">Callback Time (Required)</label>
                                <Input
                                    type="datetime-local"
                                    value={callbackDate}
                                    onChange={(e) => {
                                        setCallbackDate(e.target.value);
                                        setAutoTask({ title: 'Callback Request', date: e.target.value, type: 'phone_call' });
                                    }}
                                    className="bg-white"
                                />
                            </div>
                        )}

                        <div className="text-center">
                            <h3 className="text-xl font-bold text-gray-900">Add Tags</h3>
                            <p className="text-sm text-gray-500">Categorize this interaction</p>
                        </div>
                        <div className="flex gap-2">
                            <Input
                                placeholder="e.g. price_objection, voicemail, etc."
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                            />
                            <Button onClick={handleAddTag} variant="secondary"><Check className="w-4 h-4" /></Button>
                        </div>
                        <div className="flex flex-wrap gap-2 min-h-[40px]">
                            {selectedTags.map((tag, i) => (
                                <Badge key={i} className="px-3 py-1 bg-gray-100 text-gray-700 cursor-pointer" onClick={() => setSelectedTags(selectedTags.filter(t => t !== tag))}>
                                    {tag} <X className="w-3 h-3 ml-1" />
                                </Badge>
                            ))}
                        </div>
                        <Button className="w-full mt-4 h-12 bg-gray-900 text-white hover:bg-black" onClick={() => setWorkflowStep(4)}>
                            Next: Mandatory Task <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                )}

                {/* Step 4: Mandatory Task */}
                {workflowStep === 4 && (
                    <div className="space-y-6 animate-in slide-in-from-right-8 fade-in duration-300">
                        {interactionOutcome === 'not_interested' ? (
                            <div className="bg-red-50 p-6 rounded-2xl border border-red-100 text-center space-y-4">
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600 shadow-sm">
                                    <X className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-red-900">Close Lead</h3>
                                    <p className="text-sm text-red-600 mt-1">Please provide a reason for closing this lead.</p>
                                </div>
                                <Textarea
                                    placeholder="Reason for low interest (e.g. Too expensive, Competitor, etc.)"
                                    value={wrongNumberRemakes}
                                    onChange={(e) => setWrongNumberRemakes(e.target.value)} // Reusing state for reason
                                    className="bg-white border-red-200 focus:border-red-400 min-h-[100px]"
                                />
                                <Button
                                    onClick={async () => {
                                        if (!wrongNumberRemakes) return alert("Please provide a reason.");
                                        // Update Lead Status
                                        await dispatch(updateLead({ id: customer.id, updates: { status: 'lost' } }));
                                        handleCompleteWorkflow();
                                    }}
                                    className="w-full bg-red-600 hover:bg-red-700 text-white h-12 font-bold"
                                >
                                    Close Lead Permanently
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="text-center">
                                    <h3 className="text-xl font-bold text-gray-900 flex items-center justify-center gap-2">
                                        <AlertCircle className="w-5 h-5 text-red-600" /> Mandatory Next Step
                                    </h3>
                                    <p className="text-sm text-gray-500">You cannot proceed without scheduling the next task.</p>
                                </div>

                                <div className="bg-red-50 border border-red-200 rounded-2xl p-6 relative">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-bold text-red-700 uppercase tracking-widest block mb-1">Task Title</label>
                                            <Input
                                                value={autoTask?.title || ''}
                                                onChange={(e) => setAutoTask(prev => ({ ...prev!, title: e.target.value }))}
                                                className="bg-white border-red-200 text-lg font-bold text-gray-900"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-bold text-red-700 uppercase tracking-widest block mb-1">Date</label>
                                                <Input
                                                    type="date"
                                                    value={autoTask?.date || ''}
                                                    onChange={(e) => setAutoTask(prev => ({ ...prev!, date: e.target.value }))}
                                                    className="bg-white border-red-200"
                                                    min={new Date().toISOString().split('T')[0]}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-red-700 uppercase tracking-widest block mb-1">Type</label>
                                                <Select
                                                    value={autoTask?.type || 'phone_call'}
                                                    onChange={(val) => setAutoTask(prev => ({ ...prev!, type: val }))}
                                                    options={[
                                                        { value: 'phone_call', label: 'Phone Call' },
                                                        { value: 'meeting', label: 'Meeting' },
                                                        { value: 'email', label: 'Email' }
                                                    ]}
                                                    className="bg-white border-red-200"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <Button variant="ghost" onClick={() => setWorkflowStep(3)} className="flex-1">Back</Button>
                                    <Button
                                        onClick={handleCompleteWorkflow}
                                        variant="primary"
                                        className="flex-[2] h-12 bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/30 font-bold"
                                        disabled={!autoTask?.date || !autoTask?.title}
                                    >
                                        <CheckCircle className="w-5 h-5 mr-2" /> Confirm & Schedule
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );

    return (
        <div className="max-w-[1600px] mx-auto pb-12 space-y-6 animate-in fade-in duration-500">
            {/* 1. Header Card (Premium & Modern) */}
            <Card className="bg-white border-none shadow-md overflow-hidden relative group rounded-3xl">
                {/* Subtle Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-gray-50 via-white to-gray-50 opacity-80" />
                <div className="absolute right-0 top-0 w-96 h-full bg-gradient-to-l from-blue-50/50 to-transparent opacity-60" />

                <CardContent className="p-8 relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="flex items-center gap-6">
                            <div className="relative group/avatar cursor-pointer">
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-800 to-gray-900 text-white flex items-center justify-center font-black text-3xl shadow-2xl shadow-slate-900/20 border-4 border-white transform transition-transform group-hover/avatar:scale-105">
                                    {getInitials(customer.firstName, customer.lastName)}
                                </div>
                                <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-white ${isConverted ? 'bg-emerald-500' : 'bg-blue-500'} shadow-sm`} />
                            </div>

                            <div className="space-y-1">
                                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight leading-none mb-2">
                                    {customer.firstName} <span className="text-gray-600 font-bold">{customer.lastName}</span>
                                </h1>
                                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500 font-medium">
                                    <span className="flex items-center gap-2 hover:text-blue-600 transition-colors bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                                        <Mail className="w-3.5 h-3.5" /> {customer.email}
                                    </span>
                                    {customer.phone && (
                                        <span className="flex items-center gap-2 hover:text-emerald-600 transition-colors bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                                            <Phone className="w-3.5 h-3.5" /> {customer.phone}
                                        </span>
                                    )}
                                    <Badge className={`uppercase text-[10px] font-bold tracking-widest px-2.5 py-1 ${isConverted ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                                        {customer.status}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3 w-full md:w-auto">
                            {user?.role === 'admin' && (
                                <Button
                                    variant="outline"
                                    className="flex-1 md:flex-none h-11 px-6 bg-white hover:bg-red-50 border-red-200 text-red-600 rounded-xl font-bold shadow-sm hover:shadow-md transition-all"
                                    onClick={async () => {
                                        if (confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
                                            try {
                                                await dispatch(deleteLead(customer.id)).unwrap();
                                                // Ideally redirect to list, but parent component handles view state
                                                window.location.reload(); // Simple refresh to clear state/view
                                            } catch (error) {
                                                console.error('Failed to delete customer:', error);
                                                alert('Failed to delete customer.');
                                            }
                                        }
                                    }}
                                >
                                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                className="flex-1 md:flex-none h-11 px-6 bg-white hover:bg-gray-50 border-gray-200 text-gray-700 rounded-xl font-bold shadow-sm hover:shadow-md transition-all"
                                onClick={() => setShowBookingModal(true)}
                            >
                                <Calendar className="w-4 h-4 mr-2 text-indigo-500" /> Book Appointment
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 2. Main Layout - Split View */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                {/* Left Column: Contact Info & Tags (Small) */}
                <div className="lg:col-span-3 space-y-6">
                    <Card className="border-none shadow-sm bg-white overflow-hidden rounded-2xl">
                        <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-4 px-5">
                            <CardTitle className="uppercase tracking-widest text-[11px] font-bold text-gray-500 flex items-center justify-between">
                                Customer Profile
                                <User className="w-4 h-4 text-gray-400" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 p-5">
                            <div className="group">
                                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <Activity className="w-3 h-3" /> Acquisition Source
                                </label>
                                <div className="font-bold text-gray-900 capitalize bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 text-sm">
                                    {customer.source?.replace('_', ' ') || 'Direct / Walk-in'}
                                </div>
                            </div>
                            <div className="group">
                                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <Tag className="w-3 h-3" /> Assigned Tags
                                </label>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {customerRecord?.tags?.map((t: any) => (
                                        <Badge key={t.id || t} variant="secondary" className="bg-blue-50 text-blue-700 text-[10px] border border-blue-100 hover:bg-blue-100 transition-colors px-2 py-1">
                                            #{t.tagId || t}
                                        </Badge>
                                    ))}
                                    {(!customerRecord?.tags || customerRecord.tags.length === 0) && (
                                        <span className="text-gray-400 text-xs italic bg-gray-50 px-3 py-2 rounded-lg w-full block border border-dashed border-gray-200">
                                            No tags assigned
                                        </span>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pending Task Preview */}
                    <Card className="border-none shadow-sm bg-gradient-to-br from-red-50 via-white to-red-50 border border-red-100 overflow-hidden relative rounded-2xl group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-red-100/50 to-transparent rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-red-100/80 transition-all" />
                        <CardHeader className="pb-3 text-red-900 font-bold flex items-center gap-2 relative z-10 pt-5 px-5">
                            <div className="p-1.5 bg-red-100 rounded-lg"><AlertCircle className="w-4 h-4 text-red-600" /></div>
                            <span className="text-sm tracking-tight">Next Scheduled Action</span>
                        </CardHeader>
                        <CardContent className="relative z-10 px-5 pb-5">
                            {pendingTask ? (
                                <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-red-100 shadow-sm group-hover:shadow-md transition-all">
                                    <div className="flex justify-between items-start gap-3">
                                        <div className="font-bold text-gray-900 text-sm leading-snug">{pendingTask.title}</div>
                                        {pendingTask.dueDate && (
                                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[10px] px-2 py-0.5 whitespace-nowrap">
                                                {new Date(pendingTask.dueDate).toLocaleDateString()}
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="mt-3 flex items-center justify-between">
                                        <span className="text-xs text-red-400 font-medium flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5" /> Due Date
                                        </span>
                                        <Button size="sm" variant="ghost" className="h-7 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 -mr-2">
                                            Mark Done <ArrowRight className="w-3 h-3 ml-1" />
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-4 bg-red-100/50 rounded-xl border border-dashed border-red-200">
                                    <p className="text-red-800 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1">
                                        <AlertCircle className="w-4 h-4" /> Action Required
                                    </p>
                                    <p className="text-red-600 text-[10px] mt-1">Lead is blocked until a task is scheduled.</p>
                                    <Button variant="link" size="sm" onClick={() => setWorkflowStep(1)} className="text-red-700 font-bold text-xs h-auto p-0 mt-2 hover:text-red-800 underline">Start Interaction +</Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Middle Column: THE WORKFLOW (Large Focus) */}
                <div className="lg:col-span-5 space-y-6">
                    {renderInteractionFlow()}

                    {/* Conditional Lifecycle Tab (If Customer) */}
                    {isConverted && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                            <Tabs value={activeTab} onValueChange={setActiveTab}>
                                <TabsList className="w-full bg-gray-100/50 p-1 rounded-xl grid grid-cols-2">
                                    <TabsTrigger value="overview" className="rounded-lg font-bold">Lifecycle Overview</TabsTrigger>
                                    <TabsTrigger value="records" className="rounded-lg font-bold">Medical Records</TabsTrigger>
                                </TabsList>
                                <TabsContent value="overview">
                                    <div className="space-y-6 mt-6">
                                        {/* Status & Key Metrics */}
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Lifetime Value</div>
                                                <div className="text-2xl font-black text-emerald-600">€{summary?.summary?.lifetimeValue || 0}</div>
                                            </div>
                                            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Repeat Visits</div>
                                                <div className="text-2xl font-black text-blue-600">{summary?.summary?.repeatCount || 0}</div>
                                            </div>
                                            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</div>
                                                <Badge className="bg-emerald-100 text-emerald-700 border-none font-black uppercase text-[10px]">Active Patient</Badge>
                                            </div>
                                        </div>

                                        {/* Recent Treatments (Appointment History) */}
                                        <Card className="border-none shadow-sm overflow-hidden">
                                            <CardHeader className="bg-gray-50/50 py-3 px-5 border-b border-gray-100">
                                                <CardTitle className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                                    <Calendar className="w-4 h-4" /> Appointment History
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-0">
                                                <div className="divide-y divide-gray-50">
                                                    {summary?.appointments?.slice(0, 3).map((apt: any) => (
                                                        <div key={apt.id} className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center font-bold">
                                                                    {new Date(apt.startTime).getDate()}
                                                                </div>
                                                                <div>
                                                                    <div className="text-sm font-bold text-gray-900">{apt.serviceName}</div>
                                                                    <div className="text-[10px] text-gray-500 font-medium">
                                                                        {new Date(apt.startTime).toLocaleDateString()} • {apt.clinicName}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <Badge variant={apt.status === 'completed' ? 'success' : 'info'} size="sm" className="uppercase text-[9px]">
                                                                {apt.status}
                                                            </Badge>
                                                        </div>
                                                    ))}
                                                    {(!summary?.appointments || summary.appointments.length === 0) && (
                                                        <div className="p-8 text-center text-xs text-gray-400 italic">No appointments recorded.</div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* Communication & Notes Summary */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <Card className="border-none shadow-sm overflow-hidden flex flex-col">
                                                <CardHeader className="bg-gray-50/50 py-3 px-5 border-b border-gray-100">
                                                    <CardTitle className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                                        <Mail className="w-4 h-4" /> Communication Summary
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="p-4 flex-1 space-y-4">
                                                    <div className="text-sm text-gray-600 leading-relaxed bg-blue-50/50 p-4 rounded-xl border border-blue-100 italic">
                                                        {summary?.record?.notes || "No persistent notes for this patient record yet."}
                                                    </div>
                                                    <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                        <span>Last Contact: {summary?.record?.lastContactDate ? new Date(summary.record.lastContactDate).toLocaleDateString() : 'Never'}</span>
                                                        <Button variant="link" size="sm" className="h-auto p-0 text-blue-600" onClick={() => setActiveTab('communications')}>View Full Log →</Button>
                                                    </div>
                                                </CardContent>
                                            </Card>

                                            <Card className="border-none shadow-sm overflow-hidden flex flex-col">
                                                <CardHeader className="bg-gray-50/50 py-3 px-5 border-b border-gray-100">
                                                    <CardTitle className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                                        <Tag className="w-4 h-4" /> Active Tags & Segment
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="p-4 flex-1">
                                                    <div className="flex flex-wrap gap-2">
                                                        {summary?.tags?.map((t: any) => (
                                                            <Badge key={t.id} variant="secondary" className="bg-gray-100 text-gray-600 hover:bg-gray-200 border-none px-3 py-1 font-bold text-[10px]">
                                                                #{t.tag?.name}
                                                            </Badge>
                                                        ))}
                                                        {(!summary?.tags || summary.tags.length === 0) && (
                                                            <div className="text-xs text-gray-400 italic">No tags assigned.</div>
                                                        )}
                                                    </div>
                                                    <div className="mt-4 pt-4 border-t border-gray-50">
                                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-2">Lifecycle Stage</p>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                            <span className="text-sm font-bold text-gray-700">Converted Customer</span>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    </div>
                                </TabsContent>
                                <TabsContent value="records">
                                    <div className="p-8 bg-white rounded-2xl shadow-sm border border-gray-100 mt-4 text-center">
                                        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        <h3 className="text-lg font-bold text-gray-900">Medical Records</h3>
                                        <p className="text-gray-500 mt-1 max-w-sm mx-auto">Upload consent forms, pathology reports, or treatment photos here.</p>
                                        <Button variant="outline" className="mt-6 border-dashed">Upload Document +</Button>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    )}
                </div>

                {/* Right Column: Timeline (History) */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="border-none shadow-sm h-full min-h-[600px] flex flex-col bg-white rounded-2xl">
                        <CardHeader className="border-b border-gray-100 pb-4 pt-5 px-6">
                            <CardTitle className="text-xs uppercase tracking-widest font-bold text-gray-500 flex items-center justify-between">
                                Activity Timeline
                                <Badge variant="secondary" className="bg-gray-100 text-gray-600 hover:bg-gray-200 border-none">
                                    {(summary?.communications?.length || 0) +
                                        (summary?.appointments?.length || 0) +
                                        (summary?.actions?.length || 0) +
                                        (summary?.tags?.length || 0)} Events
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto p-0 relative custom-scrollbar bg-gray-50/30">
                            <div className="absolute left-8 top-0 bottom-0 w-px bg-gray-200 z-0" />

                            <div className="py-6 space-y-6">
                                {(() => {
                                    // Combine all history items
                                    const timelineItems = [
                                        ...(summary?.communications?.map(c => ({ type: 'communication', date: new Date(c.createdAt), data: c })) || []),
                                        ...(summary?.appointments?.map(a => ({ type: 'appointment', date: new Date(a.startTime), data: a })) || []),
                                        ...(summary?.actions?.map(a => ({ type: 'action', date: new Date(a.createdAt), data: a })) || []),
                                        ...(summary?.tags?.map(t => ({ type: 'tag', date: new Date(t.createdAt), data: t })) || [])
                                    ].sort((a, b) => b.date.getTime() - a.date.getTime());

                                    if (timelineItems.length === 0) {
                                        return (
                                            <div className="text-center text-gray-400 py-20 flex flex-col items-center gap-4">
                                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center border border-dashed border-gray-200">
                                                    <MoreHorizontal className="w-8 h-8 text-gray-300" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">No activity yet</p>
                                                    <p className="text-xs text-gray-500 mt-1">Interactions will appear here.</p>
                                                </div>
                                            </div>
                                        );
                                    }

                                    return timelineItems.map((item: any, idx) => {
                                        /* Render Logic based on Type */
                                        if (item.type === 'communication') {
                                            const comm = item.data as CommunicationLog;
                                            const isCall = comm.type === 'call';
                                            return (
                                                <div key={`comm-${idx}`} className="relative pl-16 pr-6 z-10 group">
                                                    {/* Timeline Node */}
                                                    <div className={`absolute left-[26px] top-1.5 w-3 h-3 rounded-full border-2 border-white ring-1 ring-gray-200 shadow-sm z-10 transition-transform group-hover:scale-125 ${isCall ? 'bg-blue-500 ring-blue-100' : 'bg-purple-500 ring-purple-100'}`} />

                                                    {/* Content Card */}
                                                    <div className="flex flex-col gap-1.5">
                                                        <div className="flex items-center justify-between">
                                                            <span className={`text-[10px] font-bold uppercase tracking-wider ${isCall ? 'text-blue-600' : 'text-purple-600'}`}>
                                                                {isCall ? 'Phone Call' : 'Internal Note'}
                                                            </span>
                                                            <span className="text-[10px] text-gray-400 font-medium tabular-nums opacity-70">
                                                                {item.date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                                                            </span>
                                                        </div>

                                                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all group-hover:border-blue-100/50">
                                                            <p className="text-sm text-gray-700 leading-relaxed font-medium whitespace-pre-wrap">{comm.notes}</p>

                                                            {/* Call Recording Player (Mock) */}
                                                            {comm.metadata?.recordingUrl && (
                                                                <div className="mt-3 bg-gray-50 rounded-lg p-2.5 flex items-center gap-3 border border-gray-100 group/player hover:border-blue-200 transition-colors">
                                                                    <div className="w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm cursor-pointer hover:scale-110 hover:shadow-md active:scale-95 transition-all text-blue-600">
                                                                        <Play className="w-3.5 h-3.5 ml-0.5 fill-current" />
                                                                    </div>
                                                                    <div className="h-1.5 bg-gray-200 rounded-full flex-1 overflow-hidden relative">
                                                                        <div className="absolute top-0 left-0 h-full w-1/3 bg-blue-500 rounded-full" />
                                                                    </div>
                                                                    <span className="text-[10px] font-mono text-gray-500 font-bold tabular-nums">
                                                                        00:12 / {(() => {
                                                                            const d = comm.durationSeconds || comm.metadata?.durationSeconds || 0;
                                                                            return d > 0
                                                                                ? `${Math.floor(d / 60).toString().padStart(2, '0')}:${(d % 60).toString().padStart(2, '0')}`
                                                                                : '00:00';
                                                                        })()}
                                                                    </span>
                                                                </div>
                                                            )}

                                                            {comm.metadata && (comm.metadata.outcome || (comm.metadata.tags && comm.metadata.tags.length > 0)) && (
                                                                <div className="mt-3 pt-2 border-t border-gray-50 flex flex-wrap gap-2">
                                                                    {comm.metadata.outcome && (
                                                                        <Badge variant="outline" className="bg-gray-50 text-gray-600 text-[10px] border-gray-200 px-2 py-0">
                                                                            {comm.metadata.outcome}
                                                                        </Badge>
                                                                    )}
                                                                    {comm.metadata.tags && comm.metadata.tags.map((t: string) => (
                                                                        <span key={t} className="text-[10px] font-medium text-blue-500 bg-blue-50 px-1.5 rounded">
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
                                                <div key={`apt-${idx}`} className="relative pl-16 pr-6 z-10 group">
                                                    <div className="absolute left-[26px] top-1.5 w-3 h-3 rounded-full border-2 border-white ring-1 ring-emerald-100 shadow-sm z-10 bg-emerald-500 transition-transform group-hover:scale-125" />
                                                    <div className="flex flex-col gap-1.5">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Appointment</span>
                                                            <span className="text-[10px] text-gray-400 font-medium tabular-nums opacity-70">
                                                                {item.date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                        <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm group-hover:shadow-md transition-all group-hover:border-emerald-100/50 flex items-start gap-4">
                                                            <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-600 flex-shrink-0">
                                                                <Calendar className="w-5 h-5" />
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="text-sm font-bold text-gray-900">{apt.serviceName || 'Consultation'}</p>
                                                                <p className="text-xs text-gray-500 capitalize mt-0.5">{apt.status} • <span className="text-gray-400">{apt.clinicName || 'Clinic'}</span></p>
                                                            </div>
                                                            {apt.status !== 'completed' && apt.status !== 'cancelled' && (
                                                                <Button
                                                                    size="sm"
                                                                    className="h-8 px-3 text-[10px] bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100 font-bold"
                                                                    onClick={() => handleCompleteAppointment(apt.id)}
                                                                >
                                                                    Complete
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        } else if (item.type === 'action') {
                                            const act = item.data as CrmAction;
                                            return (
                                                <div key={`act-${idx}`} className="relative pl-16 pr-6 z-10 group">
                                                    <div className="absolute left-[26px] top-1.5 w-3 h-3 rounded-full border-2 border-white ring-1 ring-amber-100 shadow-sm z-10 bg-amber-500 transition-transform group-hover:scale-125" />
                                                    <div className="flex flex-col gap-1.5">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Task: {act.actionType?.replace('_', ' ')}</span>
                                                            <span className="text-[10px] text-gray-400 font-medium tabular-nums opacity-70">
                                                                {item.date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                        <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm group-hover:shadow-md transition-all group-hover:border-amber-100/50">
                                                            <div className="flex items-start gap-3">
                                                                <div className="mt-0.5">
                                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${act.status === 'completed' ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 bg-white'}`}>
                                                                        {act.status === 'completed' && <Check className="w-3 h-3" />}
                                                                    </div>
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className={`text-sm font-bold text-gray-900 line-clamp-1 ${act.status === 'completed' ? 'line-through text-gray-400' : ''}`}>{act.title}</p>
                                                                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">{act.description || 'No description'}</p>
                                                                    {act.dueDate && (
                                                                        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded w-fit">
                                                                            <Clock className="w-3 h-3" /> Due {new Date(act.dueDate).toLocaleDateString()}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        } else if (item.type === 'tag') {
                                            const tag = item.data as any;
                                            return (
                                                <div key={`tag-${idx}`} className="relative pl-16 pr-6 z-10 group">
                                                    <div className="absolute left-[26px] top-1.5 w-3 h-3 rounded-full border-2 border-white ring-1 ring-gray-100 shadow-sm z-10 bg-gray-300 transition-transform group-hover:scale-125" />
                                                    <div className="flex flex-col gap-1.5">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">System</span>
                                                            <span className="text-[10px] text-gray-400 font-medium tabular-nums opacity-70">
                                                                {item.date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                        <div className="bg-gray-50/50 p-2.5 rounded-lg border border-gray-100 flex items-center gap-3">
                                                            <Tag className="w-3.5 h-3.5 text-gray-400" />
                                                            <span className="text-xs font-medium text-gray-600">Added tag <span className="text-gray-900 font-bold">#{tag.tag?.name}</span></span>
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

            </div>

            {/* Booking Modal */}
            {showBookingModal && (
                <CRMBookingModal
                    customerId={customer.id}
                    customerName={`${customer.firstName} ${customer.lastName}`}
                    onClose={() => setShowBookingModal(false)}
                    onSuccess={async () => {
                        // Auto-convert lead to customer on booking success
                        if (!isConverted) {
                            await dispatch(updateLead({ id: customer.id, updates: { status: 'converted' } }));
                        }
                        dispatch(fetchCustomerRecord({ customerId: customer.id, salespersonId: user?.id }));
                    }}
                />
            )}

            {/* Dialer Modal */}
            <DialerModal
                isOpen={showDialer}
                onClose={() => setShowDialer(false)}
                customerName={`${customer.firstName} ${customer.lastName}`}
                phoneNumber={customer.phone || 'No Number'}
                onCallEnded={handleCallEnded}
            />
        </div>
    );
};
