import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    Clock, Tag, Mail, Phone, Calendar,
    ArrowRight, User, Users, Plus, CreditCard,
    AlertCircle, FileText, Check, X,
    MoreHorizontal, Trash2, PhoneCall,
    Activity, CheckCircle, Repeat, RefreshCw, Bell,
    ClipboardCheck, ShieldCheck, MessageSquare, MessageCircle,
    ChevronDown, ArrowLeft, Sparkles, UserPlus
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
    removeCustomerTag,
    deleteLead,
    updateAction,
    deleteAction,
    updateCommunication,
    deleteCommunication,
    fetchSalespersons,
    fetchClinics
} from "@/store/slices/crmSlice";
import { openDialer } from "@/store/slices/dialerSlice";
import { AuthState } from "@/store/slices/authSlice";
import { CRMBookingModal } from '@/components/crm/CRMBookingModal';
import { updateAppointmentStatus, completeAppointment } from "@/store/slices/bookingSlice";
import { ActionForm } from '@/components/organisms/ActionForm/ActionForm';
import { StaffDiary } from '@/components/organisms/StaffDiary/StaffDiary';

interface OneCustomerDetailProps {
    SelectedCustomer?: Customer | Lead;
    customerId?: string;
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
    customerId,
    isLoading,
    error
}) => {
    const dispatch = useDispatch<AppDispatch>();
    const crmState = useSelector((state: RootState) => state.crm);
    const { customerRecord, leads } = crmState;
    const { user } = useSelector((state: RootState) => state.auth as AuthState);

    // Dynamic derivation of the customer object
    // Priority: Updated Prop from Redux > Prop > Nested User in Record > The Record itself
    const updatedSelectedCustomer = SelectedCustomer ? leads.find(l => l.id === SelectedCustomer.id) || SelectedCustomer : null;
    const customer = updatedSelectedCustomer || (customerRecord?.record?.customer as any) || (customerRecord?.record as any);

    // The ID to use for CRM updates (Must be the Lead/User ID, not the Record ID)
    const effectiveId = SelectedCustomer?.id || (customerRecord?.record?.customerId) || (customerRecord?.record?.id) || customerId;

    const firstName = customer?.firstName || (customerRecord?.record?.customer as any)?.firstName || (customerRecord?.record as any)?.firstName || "";
    const lastName = customer?.lastName || (customerRecord?.record?.customer as any)?.lastName || (customerRecord?.record as any)?.lastName || "";
    const fullName = `${firstName} ${lastName}`.trim();
    const email = customer?.email || (customerRecord?.record?.customer as any)?.email || (customerRecord?.record as any)?.email || "";
    const phone = customer?.phone || (customerRecord?.record?.customer as any)?.phone || (customerRecord?.record as any)?.phone || "";

    // Status can be in Lead record, or on the Customer profile if synced
    const displayStatus = customer?.status || (customerRecord as any)?.record?.status || 'new';

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

    const isConverted = customer?.status === 'converted' || (customer as any)?.role === 'customer' || (customer as any)?.role === 'client';
    const summary = customerRecord as CustomerSummary | null;
    const pendingTask = summary?.actions?.find(a => a.status === 'pending');
    const isBlocked = !isConverted && customer?.status !== 'lost' && !pendingTask;

    const [showBookingModal, setShowBookingModal] = useState(false);
    const [activeTab, setActiveTab] = useState("overview");

    const [showTaskModal, setShowTaskModal] = useState(false);
    const [showTagModal, setShowTagModal] = useState(false);
    const [quickTagInput, setQuickTagInput] = useState("");
    const [pendingTaskId, setPendingTaskId] = useState<string | undefined>(undefined);

    // --- New Action Modals ---
    const [showPhoneCallModal, setShowPhoneCallModal] = useState(false);
    const [phoneCallNotes, setPhoneCallNotes] = useState("");

    const [showEmailModal, setShowEmailModal] = useState(false);
    const [emailNotes, setEmailNotes] = useState("");
    const [emailDate, setEmailDate] = useState(new Date().toISOString().substring(0, 16));

    const [showDiaryModal, setShowDiaryModal] = useState(false);
    const [editingLogId, setEditingLogId] = useState<string | null>(null);

    const [isPaymentPrompt, setIsPaymentPrompt] = useState(false);
    const [paymentAmt, setPaymentAmt] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("cash");
    const [pendingAptId, setPendingAptId] = useState<string | null>(null);
    const [pendingAptObj, setPendingAptObj] = useState<any>(null);

    const [isEditingClinics, setIsEditingClinics] = useState(false);
    const [isEditingOwners, setIsEditingOwners] = useState(false);
    const [isEditingCore, setIsEditingCore] = useState(false);
    const [editedProperties, setEditedProperties] = useState<any>({});
    const [selectedAppointmentForEdit, setSelectedAppointmentForEdit] = useState<any>(null);
    const [callSearchTerm, setCallSearchTerm] = useState('');
    const [timelineFilter, setTimelineFilter] = useState('all');

    const isAdmin = user?.role === 'admin' || user?.role === 'SUPER_ADMIN' || user?.role === 'manager';
    const canSeeFinancials = ['admin', 'SUPER_ADMIN', 'doctor', 'ADMIN', 'DOCTOR', 'manager'].includes(user?.role);

    useEffect(() => {
        if (customer) {
            setEditedProperties({
                firstName: customer.firstName,
                lastName: customer.lastName,
                email: customer.email,
                phone: customer.phone,
                lastMetaFormName: (customer as any).lastMetaFormName,
                facebookAdName: (customer as any).facebookAdName,
                lastMetaFormSubmittedAt: (customer as any).lastMetaFormSubmittedAt,
                estimatedValue: customer.estimatedValue
            });
        }
    }, [customer]);

    const handleSaveCoreProperties = async () => {
        try {
            await dispatch(updateLead({ id: effectiveId, updates: editedProperties })).unwrap();
            dispatch(fetchCustomerRecord({ customerId: effectiveId, salespersonId: user?.id }));
            setIsEditingCore(false);
        } catch (e) {
            alert("Failed to update properties");
        }
    };

    useEffect(() => {
        const idToFetch = SelectedCustomer?.id || customerId;
        if (idToFetch) {
            dispatch(fetchCustomerRecord({
                customerId: idToFetch,
                salespersonId: user?.id
            }));
        }
        dispatch(fetchSalespersons());
        dispatch(fetchClinics());
    }, [SelectedCustomer, customerId, dispatch, user]);

    if (isLoading && !customer) {
        return (
            <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
                <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-4" />
                <p className="text-slate-500 font-bold text-sm tracking-tight">Initializing premium detail view...</p>
            </div>
        );
    }

    if (error && !customer) {
        return (
            <div className="p-8 text-center bg-red-50 border border-red-100 rounded-2xl mx-auto max-w-md my-20">
                <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                <h3 className="text-red-800 font-bold mb-1">Load Error</h3>
                <p className="text-red-600/70 text-sm font-medium">{error}</p>
                <Button onClick={() => window.location.reload()} variant="outline" className="mt-4 border-red-200 text-red-700 bg-white">Retry</Button>
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Users className="w-12 h-12 mb-4 opacity-20" />
                <p className="font-bold text-sm">Customer Record Not Found</p>
                <Button variant="ghost" className="mt-2 text-blue-600 font-bold text-xs" onClick={() => window.history.back()}>Go Back</Button>
            </div>
        );
    }

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
            const isLegacyId = editingLogId?.startsWith('lead-log-');

            if (editingLogId && !isLegacyId) {
                await dispatch(updateCommunication({
                    id: editingLogId,
                    updates: { notes: phoneCallNotes }
                })).unwrap();
            } else {
                await dispatch(logCommunication({
                    customerId: customer.id,
                    salespersonId: user?.id,
                    type: 'call',
                    status: 'completed',
                    notes: phoneCallNotes,
                    direction: 'outgoing',
                    metadata: { 
                        clickOnly: true,
                        wasLegacyEdit: isLegacyId ? true : undefined,
                        originalLegacyId: isLegacyId ? editingLogId : undefined
                    }
                })).unwrap();

                // Rule: Update Last Contacted At
                await dispatch(updateLead({
                    id: customer.id,
                    updates: { lastContactedAt: new Date().toISOString() }
                })).unwrap();
            }
            setPhoneCallNotes("");
            setEditingLogId(null);
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
            const isLegacyId = editingLogId?.startsWith('lead-log-');

            if (editingLogId && !isLegacyId) {
                await dispatch(updateCommunication({
                    id: editingLogId,
                    updates: { notes: emailNotes }
                })).unwrap();
            } else {
                await dispatch(logCommunication({
                    customerId: customer.id,
                    salespersonId: user?.id,
                    type: 'email',
                    status: 'completed',
                    notes: emailNotes,
                    direction: 'outgoing',
                    metadata: {
                        wasLegacyEdit: isLegacyId ? true : undefined,
                        originalLegacyId: isLegacyId ? editingLogId : undefined
                    }
                })).unwrap();

                // Rule: Update Last Contacted At
                await dispatch(updateLead({
                    id: customer.id,
                    updates: { lastContactedAt: new Date().toISOString() }
                })).unwrap();
            }

            setEmailNotes("");
            setEditingLogId(null);
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
            setAutoTask({ title: 'Confirmation Call', date: new Date(Date.now() + 86400000).toISOString().split('T')[0], type: 'call' });
        } else if (outcome === 'call_later') {
            setOutcomeStep('callback'); // Shows date picker
            setWorkflowStep(3); // Tag step (can skip or integrate) -> actually let's go to Tag then Task
            // User requirement: "Tag -> Mandatory Task"
            // So Outcome -> Tag -> Task
        } else if (outcome === 'no_answer') {
            setWorkflowStep(3); // Tag
            // Mandatory Task: Call again
            setAutoTask({ title: 'Call again (No Answer)', date: new Date(Date.now() + 86400000).toISOString().split('T')[0], type: 'call' });
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
                type: 'call'
            };
        }
        if (hasCallAgain && !currentAutoTask) {
            currentAutoTask = {
                title: 'Follow-up: Call Again (Auto)',
                date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                type: 'call'
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
                    clickOnly: true,
                    outcome: interactionOutcome,
                    tags: selectedTags,
                    recordingUrl: (interactionType === 'call' && callDuration > 0)
                        ? `https://api.twilio.com/2010-04-01/Accounts/AC.../Recordings/RE${Date.now()}.mp3`
                        : undefined
                }
            })).unwrap();

            // Rule: Update Last Contacted At (Internal Rule: call, email, viber, notes as contact attempts)
            const isContactAttempt = interactionType === 'call' || interactionType === 'email' || finalNotes.toLowerCase().includes('viber') || finalNotes.toLowerCase().includes('whatsapp');
            if (isContactAttempt) {
                await dispatch(updateLead({
                    id: customer.id,
                    updates: { lastContactedAt: new Date().toISOString() }
                })).unwrap();
            }

            if (currentAutoTask) {
                const taskDate = currentAutoTask.date ? new Date(currentAutoTask.date) : new Date();
                const safeDate = !isNaN(taskDate.getTime()) ? taskDate.toISOString() : new Date().toISOString();

                await dispatch(createAction({
                    customerId: customer.id,
                    salespersonId: user?.id || undefined,
                    actionType: currentAutoTask.type as any,
                    title: currentAutoTask.title,
                    description: `Generated from interaction outcome: ${interactionOutcome}${selectedTags.length ? ` (Tags: ${selectedTags.join(', ')})` : ''}`,
                    status: 'pending',
                    dueDate: safeDate,
                    reminderDate: safeDate,
                    priority: 'high'
                })).unwrap();
            }

            // If appointment booked tagging, ensure logic
            if (interactionOutcome === 'appointment_booked' && !isConverted) {
                try {
                    // Check if lead still exists or if it was converted in background
                    await dispatch(updateLead({ id: customer.id, updates: { status: 'converted' } })).unwrap();
                } catch (updateErr) {
                    console.warn("Lead update skipped (maybe already converted):", updateErr);
                }
            }

            resetWorkflow();

            dispatch(fetchCustomerRecord({
                customerId: customer.id,
                salespersonId: user?.id
            }));

        } catch (error: any) {
            console.error("Workflow failed", error);
            if (error.response?.data) {
                console.error("Workflow error details:", error.response.data);
            }
            alert(`Failed: ${error.message || "Unknown error"}`);
        }
    };

    const handleUpdateAppointmentStatus = async (id: string, status: string, aptObj?: any) => {
        if (status === 'COMPLETED' || status === 'completed') {
            setPendingAptId(id);
            setPendingAptObj(aptObj);
            setIsPaymentPrompt(true);
            return;
        }

        if (!confirm(`Mark this appointment as ${status.toLowerCase()}?`)) return;
        try {
            await dispatch(updateAppointmentStatus({ id, status })).unwrap();
            dispatch(fetchCustomerRecord({ customerId: effectiveId, salespersonId: user?.id }));
        } catch (error) {
            console.error("Failed to update appointment status", error);
            alert("Failed to update appointment status.");
        }
    };

    const handleCompletePayment = async () => {
        if (!pendingAptId) return;
        try {
            const amountValue = parseFloat(paymentAmt) || 0;
            const completionReport = {
                patientCame: true,
                servicePerformed: true,
                notes: `Completed from CRM Detail view. Amount: ${paymentAmt} via ${paymentMethod}`
            };

            await dispatch(completeAppointment({
                id: pendingAptId,
                data: {
                    amountPaid: amountValue,
                    totalAmount: amountValue,
                    paymentMethod: paymentMethod,
                    serviceExecuted: true,
                    treatmentDetails: completionReport
                }
            })).unwrap();

            // Create follow-up task
            const nextDay = new Date();
            nextDay.setDate(nextDay.getDate() + 1);

            await dispatch(createAction({
                title: `Post-Treatment Follow-up: ${pendingAptObj?.serviceName || 'Procedure'}`,
                description: 'Check in with customer after procedure.',
                actionType: 'confirmation_call_reminder' as any,
                priority: 'medium',
                status: 'pending',
                dueDate: nextDay.toISOString().split('T')[0],
                reminderDate: nextDay.toISOString(),
                customerId: customer.id,
                salespersonId: user?.id || undefined,
            })).unwrap();

            setIsPaymentPrompt(false);
            setPaymentAmt("");
            setPendingAptId(null);
            setPendingAptObj(null);
            dispatch(fetchCustomerRecord({ customerId: effectiveId, salespersonId: user?.id }));

            alert("Appointment completed and payment recorded.");
        } catch (error) {
            console.error("Completion failed", error);
            alert("Finalization failed. Ensure amount is valid.");
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
                                            setAutoTask({ title: 'Callback Request', date: e.target.value, type: 'call' });
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
                                                        value={autoTask?.date?.includes('T') ? autoTask.date.split('T')[0] : autoTask?.date || ''}
                                                        onChange={(e) => setAutoTask(prev => ({ ...prev!, date: e.target.value }))}
                                                        className="h-10 bg-white border-slate-200 rounded-lg font-bold px-3 text-xs shadow-sm"
                                                        min={new Date().toISOString().split('T')[0]}
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase block px-1 text-center">Type</label>
                                                    <Select
                                                        value={autoTask?.type || 'call'}
                                                        onChange={(val) => setAutoTask(prev => ({ ...prev!, type: val }))}
                                                        options={[
                                                            { value: 'call', label: 'Call' },
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
        <>
        <div className="max-w-[1600px] mx-auto pb-10 animate-in fade-in slide-in-from-top-4 duration-700 bg-slate-50 min-h-screen">
            {/* Top Navigation Bar */}
            <div className="px-6 py-3 border-b border-slate-200 bg-white flex items-center gap-4 shadow-sm relative z-10 rounded-t-xl md:rounded-none">
                <Button variant="ghost" onClick={() => window.history.back()} className="text-blue-600 font-bold hover:bg-blue-50 px-3 h-8">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Contacts
                </Button>
                <div className="h-6 w-px bg-slate-200"></div>
                <h2 className="text-base font-black text-slate-800 tracking-tight">{customer.firstName} {customer.lastName}</h2>
                {/* Right side - Contact creation info */}
                <div className="ml-auto flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
                        <UserPlus className="w-3.5 h-3.5 text-emerald-500" />
                        <div className="flex flex-col leading-none">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Contact Created</span>
                            <span className="text-[11px] font-bold text-slate-700">
                                via {customer.source || 'Manual Entry'} &nbsp;·&nbsp; {new Date(customer.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                        </div>
                    </div>
                    <Badge className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${isConverted ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                        {customer.status}
                    </Badge>
                </div>
            </div>

            {/* 3-Column CSS Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4">
                
                {/* --- LEFT COLUMN (~25% width) --- */}
                <div className="col-span-1 md:col-span-3 space-y-6">
                    {/* Profile Card */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col items-center text-center">
                        <div className="relative mb-3">
                            <div className="w-14 h-14 rounded-full bg-slate-800 border-[3px] border-white shadow-xl flex items-center justify-center font-black text-xl text-white">
                                {getInitials(customer.firstName, customer.lastName)}
                            </div>
                            <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${isConverted ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                        </div>
                        <h1 className="text-base font-black text-slate-900 tracking-tight">{customer.firstName} {customer.lastName}</h1>
                        <p className="text-xs font-bold text-slate-500 mt-0.5 flex items-center justify-center gap-1 truncate max-w-full"><Mail className="w-3 h-3 text-slate-400 flex-shrink-0" /> <span className="truncate">{customer.email}</span></p>
                        
                        <div className="mt-4 w-full flex justify-center gap-2">
                            <button onClick={() => setShowEmailModal(true)} className="flex flex-col items-center gap-1 group">
                                <div className="w-9 h-9 rounded-full border border-slate-200 shadow-sm flex items-center justify-center text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-200 transition-all group-hover:scale-105">
                                    <Mail className="w-4 h-4" />
                                </div>
                                <span className="text-[10px] font-bold text-slate-500 group-hover:text-slate-800">Email</span>
                            </button>
                            <button onClick={() => { setActiveTab('overview'); setShowPhoneCallModal(true); }} className="flex flex-col items-center gap-1 group">
                                <div className="w-9 h-9 rounded-full border border-slate-200 shadow-sm flex items-center justify-center text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-200 transition-all group-hover:scale-105">
                                    <PhoneCall className="w-4 h-4" />
                                </div>
                                <span className="text-[10px] font-bold text-slate-500 group-hover:text-slate-800">Call</span>
                            </button>
                            <button onClick={() => setShowBookingModal(true)} className="flex flex-col items-center gap-1 group">
                                <div className="w-9 h-9 rounded-full border border-slate-200 shadow-sm flex items-center justify-center text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-200 transition-all group-hover:scale-105">
                                    <Calendar className="w-4 h-4" />
                                </div>
                                <span className="text-[10px] font-bold text-slate-500 group-hover:text-slate-800">Meet</span>
                            </button>
                            <button onClick={() => setShowTaskModal(true)} className="flex flex-col items-center gap-1 group">
                                <div className="w-9 h-9 rounded-full border border-slate-200 shadow-sm flex items-center justify-center text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-200 transition-all group-hover:scale-105">
                                    <CheckCircle className="w-4 h-4" />
                                </div>
                                <span className="text-[10px] font-bold text-slate-500 group-hover:text-slate-800">Task</span>
                            </button>
                        </div>
                    </div>

                    {/* About this contact Card */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-slate-100 transition-colors">
                            <h3 className="font-bold text-slate-800 text-xs">About this contact</h3>
                            <ChevronDown className="w-3 h-3 text-slate-500" />
                        </div>
                        <div className="p-4 space-y-3">
                            <div className="group relative">
                                <span className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">First Name</span>
                                <span className="text-xs font-bold text-slate-800 group-hover:bg-slate-50 p-1 -ml-1 rounded transition-colors block">{customer.firstName}</span>
                            </div>
                            <div className="group relative">
                                <span className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Last Name</span>
                                <span className="text-xs font-bold text-slate-800 group-hover:bg-slate-50 p-1 -ml-1 rounded transition-colors block">{customer.lastName}</span>
                            </div>
                            <div className="group relative">
                                <span className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Phone Number</span>
                                <span className="text-xs font-bold text-slate-800 group-hover:bg-slate-50 p-1 -ml-1 rounded transition-colors block">{customer.phone || 'N/A'}</span>
                            </div>
                            <div className="group relative">
                                <span className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Email</span>
                                <span className="text-xs font-bold text-blue-600 group-hover:bg-blue-50 p-1 -ml-1 rounded transition-colors block cursor-pointer truncate" onClick={() => setShowEmailModal(true)}>{customer.email}</span>
                            </div>
                            <div>
                                <span className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Lead Status</span>
                                <Badge className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border shadow-sm ${isConverted ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>{customer.status}</Badge>
                            </div>
                            <div className="group relative">
                                <span className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Source</span>
                                <span className="text-xs font-bold text-slate-800 group-hover:bg-slate-50 p-1 -ml-1 rounded transition-colors block">{customer.source || 'Manual Entry'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- MIDDLE COLUMN (~50% width) --- */}
                <div className="col-span-1 md:col-span-6 space-y-6">
                    
                    {/* Main Interaction Flow Component */}
                    {renderInteractionFlow()}

                    {/* Tabs / Feed Container */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="flex border-b border-slate-200 px-2 bg-slate-50/50">
                            {['overview', 'activities', 'notes'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-6 py-4 text-xs font-black uppercase tracking-widest transition-colors relative ${activeTab === tab ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    {tab}
                                    {activeTab === tab && <div className="absolute bottom-[-1px] left-0 w-full h-0.5 bg-blue-600" />}
                                </button>
                            ))}
                        </div>

                        {/* Content Area */}
                        <div className="p-8">
                            {activeTab === 'overview' && (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center mb-8">
                                        <h3 className="font-black text-slate-800 text-base flex items-center gap-2">
                                            <Activity className="w-5 h-5 text-blue-600" /> Activity Feed
                                        </h3>
                                    </div>
                                    
                                    {/* Unified Timeline */}
                                    <div className="relative border-l-[3px] border-slate-100 ml-6 pl-10 space-y-10 pb-6">
                                        
                                        {/* Combine and Sort Timeline Items */}
                                        {(() => {
                                            const timelineItems = [];
                                            
                                            if (summary?.communications) {
                                                summary.communications.forEach(c => timelineItems.push({ type: 'comm', date: new Date(c.createdAt), data: c }));
                                            }
                                            if (summary?.actions) {
                                                summary.actions.forEach(a => timelineItems.push({ type: 'action', date: new Date(a.createdAt), data: a }));
                                            }
                                            if (summary?.appointments) {
                                                summary.appointments.forEach(a => timelineItems.push({ type: 'appointment', date: new Date(a.startTime), data: a }));
                                            }
                                            
                                            // Create a lead created event
                                            timelineItems.push({ type: 'created', date: new Date(customer.createdAt), data: null });

                                            timelineItems.sort((a, b) => b.date.getTime() - a.date.getTime());

                                            return timelineItems.map((item, idx) => {
                                                let icon = <Activity className="w-5 h-5 text-slate-400" />;
                                                let iconBg = "bg-white border-slate-200";
                                                let content = null;

                                                if (item.type === 'created') {
                                                    icon = <UserPlus className="w-5 h-5 text-emerald-600" />;
                                                    iconBg = "bg-emerald-50 border-emerald-200";
                                                    content = (
                                                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-sm font-medium text-slate-600 shadow-sm">
                                                            <span className="font-bold text-slate-900 block mb-1">Contact created</span> 
                                                            This contact was created via {customer.source || 'Manual Entry'}.
                                                        </div>
                                                    );
                                                } else if (item.type === 'comm') {
                                                    const isCall = item.data.type === 'call';
                                                    icon = isCall ? <PhoneCall className="w-5 h-5 text-blue-600" /> : <Mail className="w-5 h-5 text-indigo-600" />;
                                                    iconBg = isCall ? "bg-blue-50 border-blue-200" : "bg-indigo-50 border-indigo-200";
                                                    content = (
                                                        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all group">
                                                            <div className="flex justify-between items-center mb-3">
                                                                <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                                                    {isCall ? 'Logged a Call' : 'Logged an Email'}
                                                                </span>
                                                                <span className="text-[11px] font-bold text-slate-400">{item.date.toLocaleString()}</span>
                                                            </div>
                                                            <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100">{item.data.notes}</p>
                                                            {item.data.metadata?.outcome && (
                                                                <Badge className="mt-3 bg-slate-800 text-white text-[10px] font-bold uppercase tracking-widest px-2.5">{item.data.metadata.outcome.replace('_', ' ')}</Badge>
                                                            )}
                                                        </div>
                                                    );
                                                } else if (item.type === 'appointment') {
                                                    icon = <Calendar className="w-5 h-5 text-amber-600" />;
                                                    iconBg = "bg-amber-50 border-amber-200";
                                                    content = (
                                                        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all">
                                                            <div className="flex justify-between items-center mb-3">
                                                                <span className="font-bold text-slate-900 text-sm">Appointment: {item.data.serviceName}</span>
                                                                <span className="text-[11px] font-bold text-slate-400">{item.date.toLocaleString()}</span>
                                                            </div>
                                                            <div className="text-sm text-slate-600 font-medium mb-4 flex items-center gap-2">
                                                                <Badge className={`${item.data.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'} text-[10px] font-black uppercase`}>
                                                                    {item.data.status}
                                                                </Badge>
                                                                <span>at {item.data.clinicName}</span>
                                                            </div>
                                                            <div className="flex gap-2 items-center border-t border-slate-100 pt-3">
                                                                {item.data.status === 'COMPLETED' ? (
                                                                    <Button size="sm" variant="outline" className="h-8 text-[11px] font-bold text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => { setPendingAptId(item.data.id); setPendingAptObj(item.data); setPaymentAmt(item.data.amountPaid?.toString() || ''); setPaymentMethod(item.data.paymentMethod || 'cash'); setIsPaymentPrompt(true); }}>Update Record</Button>
                                                                ) : (
                                                                    <>
                                                                        <Button size="sm" className="h-8 text-[11px] font-bold text-white bg-emerald-500 hover:bg-emerald-600 shadow-sm" onClick={() => handleUpdateAppointmentStatus(item.data.id, 'COMPLETED', item.data)}>Complete</Button>
                                                                        <Button size="sm" variant="outline" className="h-8 text-[11px] font-bold text-slate-600 border-slate-200 hover:bg-slate-50" onClick={() => { setSelectedAppointmentForEdit(item.data); setShowBookingModal(true); }}>Edit</Button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                } else if (item.type === 'action') {
                                                    icon = <CheckCircle className="w-5 h-5 text-slate-600" />;
                                                    iconBg = "bg-slate-100 border-slate-300";
                                                    content = (
                                                        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all">
                                                            <div className="flex justify-between items-center mb-2">
                                                                <span className="font-bold text-slate-900 text-sm">Task: {item.data.title}</span>
                                                                <span className="text-[11px] font-bold text-slate-400">{item.date.toLocaleString()}</span>
                                                            </div>
                                                            <p className="text-sm text-slate-600 font-medium mb-4">{item.data.description}</p>
                                                            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                                <input type="checkbox" checked={item.data.status === 'completed'} onChange={async (e) => { 
                                                                    const newStatus = item.data.status === 'completed' ? 'pending' : 'completed';
                                                                    await dispatch(updateAction({ id: item.data.id, updates: { status: newStatus } })).unwrap();
                                                                    dispatch(fetchCustomerRecord({ customerId: customer.id, salespersonId: user?.id }));
                                                                }} className="h-5 w-5 rounded-md border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer" />
                                                                <span className="text-xs font-bold text-slate-700 uppercase tracking-tight">Mark Complete</span>
                                                                {item.data.dueDate && (
                                                                    <span className={`ml-auto text-[10px] font-bold uppercase ${new Date(item.data.dueDate) < new Date() && item.data.status !== 'completed' ? 'text-red-500' : 'text-slate-400'}`}>
                                                                        Due: {new Date(item.data.dueDate).toLocaleDateString()}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                }

                                                return (
                                                    <div key={`${item.type}-${idx}`} className="relative">
                                                        <div className={`absolute -left-[63px] top-1 w-11 h-11 rounded-full border-[3px] ${iconBg} flex items-center justify-center shadow-sm z-10`}>
                                                            {icon}
                                                        </div>
                                                        {content}
                                                    </div>
                                                );
                                            });
                                        })()}
                                    </div>
                                </div>
                            )}

                            {activeTab !== 'overview' && (
                                <div className="py-20 text-center text-slate-400 font-medium">
                                    <Activity className="w-12 h-12 mx-auto mb-4 opacity-20 text-blue-500" />
                                    <h3 className="text-lg font-bold text-slate-600 mb-1">Coming Soon</h3>
                                    <p className="text-sm">This tab is being optimized in the new layout.<br/> Use the Overview tab for a unified timeline feed.</p>
                                </div>
                            )}

                        </div>
                    </div>
                </div>

                {/* --- RIGHT COLUMN (~25% width) --- */}
                <div className="col-span-1 md:col-span-3 space-y-6">
                    {/* Breeze Summary Card */}
                    <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-xl border border-indigo-100 shadow-sm p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/40 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
                        <div className="flex items-center gap-2 mb-4 relative z-10">
                            <Sparkles className="w-5 h-5 text-indigo-500" />
                            <h3 className="font-black text-indigo-900 text-sm tracking-tight">Breeze Record Summary</h3>
                        </div>
                        <p className="text-xs text-indigo-900/80 font-medium leading-relaxed relative z-10">
                            {customer.status === 'converted' 
                                ? 'This contact has successfully converted and engaged with appointments. Strong potential for repeat visits. Keep following up for post-treatment care.'
                                : 'This is an active prospect. Review the timeline and schedule a call or meeting to drive conversion. No appointments booked yet.'}
                        </p>
                    </div>

                    {/* Deals / Appointments Widget */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="bg-slate-50 border-b border-slate-200 px-5 py-4 flex justify-between items-center cursor-pointer hover:bg-slate-100 transition-colors">
                            <h3 className="font-bold text-slate-800 text-sm">Appointments ({summary?.appointments?.length || 0})</h3>
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0 hover:bg-blue-100 text-blue-600 rounded-md" onClick={() => setShowBookingModal(true)}>
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="p-2">
                            {summary?.appointments?.length === 0 ? (
                                <div className="text-center p-6 text-xs font-medium text-slate-400 italic">No appointments booked.</div>
                            ) : (
                                <div className="space-y-1">
                                    {summary?.appointments?.slice(0, 3).map(apt => (
                                        <div key={apt.id} className="rounded-lg p-3 hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-100 transition-all" onClick={() => { setSelectedAppointmentForEdit(apt); setShowBookingModal(true); }}>
                                            <div className="font-bold text-sm text-slate-900 mb-0.5">{apt.serviceName}</div>
                                            <div className="text-[11px] font-medium text-slate-500 mb-2">{new Date(apt.startTime).toLocaleString()}</div>
                                            <Badge className={`text-[9px] font-black uppercase tracking-widest ${apt.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>{apt.status}</Badge>
                                        </div>
                                    ))}
                                    {summary?.appointments && summary.appointments.length > 3 && (
                                        <div className="text-center text-xs font-bold text-blue-600 py-3 cursor-pointer hover:bg-blue-50 rounded-b-lg transition-colors">View all {summary.appointments.length} appointments</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Financials / Payments Widget */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="bg-slate-50 border-b border-slate-200 px-5 py-4 flex justify-between items-center cursor-pointer hover:bg-slate-100 transition-colors">
                            <h3 className="font-bold text-slate-800 text-sm">Financials</h3>
                        </div>
                        <div className="p-5">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Lifetime Value</span>
                                <span className="text-base font-black text-emerald-600">€{(Number(summary?.summary?.lifetimeValue) || 0).toFixed(2)}</span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-2">
                                <div className="bg-emerald-500 h-full w-full"></div>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 text-right">Total Revenue Generated</p>
                        </div>
                    </div>

                </div>
            </div>

        </div>
            {/* Diary Modal */}
            {showDiaryModal && (
                <div className="fixed inset-0 z-[1001] bg-slate-900/60 backdrop-blur-sm flex justify-center items-center p-4">
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


            {/* Phone Call Notes Modal */}
            {showPhoneCallModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[1001] flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-slate-200 p-6 space-y-4">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <PhoneCall className="w-4 h-4 text-slate-400" /> {editingLogId ? "Edit Phone Call Notes" : "Add Phone Call Notes"}
                            </h3>
                            <Button variant="ghost" size="sm" onClick={() => { setShowPhoneCallModal(false); setPhoneCallNotes(""); setEditingLogId(null); }} className="h-8 w-8 p-0">
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
                                <Button variant="outline" onClick={() => { setShowPhoneCallModal(false); setPhoneCallNotes(""); setEditingLogId(null); }}>Cancel</Button>
                                <Button className="bg-slate-800 hover:bg-slate-900 text-white" onClick={handleSavePhoneCallNotes}>
                                    {editingLogId ? "Update Notes" : "Save Notes"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Email Log Modal */}
            {showEmailModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[1001] flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-slate-200 p-6 space-y-4">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Mail className="w-4 h-4 text-slate-400" /> {editingLogId ? "Edit Email Log" : "Log Sent Email"}
                            </h3>
                            <Button variant="ghost" size="sm" onClick={() => { setShowEmailModal(false); setEmailNotes(""); setEditingLogId(null); }} className="h-8 w-8 p-0">
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
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[1001] flex items-center justify-center p-4 animate-in fade-in">
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
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[1001] flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
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
                                onCancel={() => setShowTaskModal(false)}
                                prefilledData={{ salespersonId: user?.id }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Prompt Modal */}
            {isPaymentPrompt && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[1001] flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-300">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 flex flex-col">
                        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h3 className="text-xl font-black text-slate-800 tracking-tight">Finalize Transaction</h3>
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mt-1">Operational Checkout</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setIsPaymentPrompt(false)} className="h-10 w-10 p-0 rounded-2xl bg-white hover:bg-slate-100 shadow-sm">
                                <X className="w-5 h-5 text-slate-400" />
                            </Button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100/50 space-y-2">
                                    <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                        <span>Treatment</span>
                                        <span className="text-blue-600">Verified</span>
                                    </div>
                                    <div className="text-sm font-black text-slate-900 uppercase tracking-tight truncate">
                                        {pendingAptObj?.serviceName || 'Standard Procedure'}
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] px-1">Amount Captured (€)</label>
                                    <div className="relative group">
                                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">€</div>
                                        <Input
                                            type="number"
                                            placeholder="0.00"
                                            value={paymentAmt}
                                            onChange={(e) => setPaymentAmt(e.target.value)}
                                            className="h-14 pl-10 text-lg font-black bg-slate-50 border-slate-200 rounded-2xl focus:bg-white transition-all shadow-inner"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] px-1">Payment Channel</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {['cash', 'card'].map(method => (
                                            <button
                                                key={method}
                                                onClick={() => setPaymentMethod(method)}
                                                className={`h-14 flex items-center justify-center gap-3 rounded-2xl border-2 transition-all font-black uppercase text-[10px] tracking-widest
                                                    ${paymentMethod === method ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-lg shadow-blue-500/10' : 'border-slate-100 bg-slate-50 text-slate-400 hover:bg-white hover:border-slate-200'}`}
                                            >
                                                {method === 'card' ? <CreditCard className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                                                {method}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-slate-50/50 border-t border-slate-50">
                            <Button
                                onClick={handleCompletePayment}
                                className="w-full h-14 bg-slate-900 hover:bg-black text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3"
                            >
                                <CheckCircle className="w-5 h-5" />
                                Release Checkout & Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <CRMBookingModal
                isOpen={showBookingModal}
                customerId={effectiveId}
                customerName={fullName}
                customerEmail={email}
                customerPhone={phone}
                bookedBy={`${user?.firstName} ${user?.lastName}`}
                taskId={pendingTaskId}
                onTaskComplete={async (tid) => {
                    await dispatch(updateAction({ id: tid, updates: { status: 'completed' } })).unwrap();
                    dispatch(fetchCustomerRecord({ customerId: effectiveId, salespersonId: user?.id }));
                    setPendingTaskId(undefined);
                }}
                onClose={() => {
                    setShowBookingModal(false);
                    setPendingTaskId(undefined);
                    setSelectedAppointmentForEdit(null);
                }}
                initialAppointment={selectedAppointmentForEdit}
                onSuccess={async () => {
                    if (!isConverted) {
                        try {
                            await dispatch(updateLead({ id: customer.id, updates: { status: 'converted' as any } })).unwrap();
                        } catch (e) {
                            console.error("Lead conversion failed on success", e);
                        }
                    }
                    dispatch(fetchCustomerRecord({ customerId: effectiveId, salespersonId: user?.id }));
                }}
            />

            <DialerModal
                isOpen={showDialer}
                onClose={() => setShowDialer(false)}
                customerName={`${customer.firstName} ${customer.lastName}`}
                phoneNumber={customer.phone || 'No Number'}
                onCallEnded={handleCallEnded}
            />

        </>
    );
};
