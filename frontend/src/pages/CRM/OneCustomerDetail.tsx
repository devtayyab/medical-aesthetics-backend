import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    Clock, Tag, Mail, Phone, Calendar,
    ArrowRight, User, Users, Plus, CreditCard,
    AlertCircle, FileText, Check, X,
    MoreHorizontal, Trash2, PhoneCall,
    Activity, CheckCircle, Repeat, RefreshCw, Bell,
    ClipboardCheck, ShieldCheck, MessageSquare, MessageCircle
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
    const [editingCallId, setEditingCallId] = useState<string | null>(null);

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

    const { salespersons, clinics } = crmState;

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
            if (editingCallId) {
                await dispatch(updateCommunication({
                    id: editingCallId,
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
                    metadata: { clickOnly: true }
                })).unwrap();

                // Rule: Update Last Contacted At
                await dispatch(updateLead({
                    id: customer.id,
                    updates: { lastContactedAt: new Date().toISOString() }
                })).unwrap();
            }
            setPhoneCallNotes("");
            setEditingCallId(null);
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

            // Rule: Update Last Contacted At
            await dispatch(updateLead({
                id: customer.id,
                updates: { lastContactedAt: new Date().toISOString() }
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
                await dispatch(updateLead({ id: customer.id, updates: { status: 'converted' } })).unwrap();
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
            const paymentData = {
                amount: parseFloat(paymentAmt) || 0,
                paymentMethod: paymentMethod,
            };

            const completionReport = {
                patientCame: true,
                servicePerformed: true,
                notes: `Completed from CRM Detail view. Amount: ${paymentAmt} via ${paymentMethod}`
            };

            await dispatch(completeAppointment({
                id: pendingAptId,
                completionData: { ...paymentData, completionReport }
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
        <div className="max-w-[1600px] mx-auto pb-10 space-y-6 animate-in fade-in slide-in-from-top-4 duration-700">
            {/* 1. Sleek Header Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-slate-900 border border-white/10 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 mix-blend-overlay pointer-events-none" />
                <div className="absolute -left-20 -top-20 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px]" />
                <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-purple-500/10 rounded-full blur-[100px]" />

                <div className="p-6 relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-5">
                        <div className="relative">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-700 border border-white/5 flex items-center justify-center font-bold text-xl text-white shadow-xl">
                                {getInitials(customer.firstName, customer.lastName)}
                            </div>
                            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-slate-900 ${isConverted ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-2xl font-bold text-white tracking-tight">
                                    {customer.firstName} {customer.lastName}
                                </h1>
                                <Badge className={`h-5 text-[9px] font-black uppercase border-none tracking-widest px-2.5 ${isConverted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                    {customer.status}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-slate-400 text-xs font-medium">
                                <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-500" /> {customer.email}</span>
                                {customer.phone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-500" /> {customer.phone}</span>}
                                <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-slate-500" /> ID: {customer.id.slice(0, 8).toUpperCase()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {isAdmin && (
                            <Button
                                variant="ghost"
                                className="h-10 px-4 text-slate-400 hover:text-red-400 hover:bg-red-400/10 font-bold text-xs rounded-xl transition-all"
                                onClick={async () => {
                                    if (confirm('Delete this record?')) {
                                        await dispatch(deleteLead(customer.id));
                                        window.location.href = '/crm/leads';
                                    }
                                }}
                            >
                                <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </Button>
                        )}
                        <Button
                            className="h-10 px-6 bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs rounded-xl shadow-lg transition-all active:scale-95"
                            onClick={() => setShowBookingModal(true)}
                        >
                            <Calendar className="w-4 h-4 mr-2" /> Book Appointment
                        </Button>
                    </div>
                </div>
            </div>


            {/* 3. Main Navigation Tabs */}
            <div className="flex items-center gap-1 border-b border-slate-200 bg-white sticky top-[137px] z-30">
                {[
                    { id: 'overview', label: 'Overview', icon: Activity },
                    { id: 'appointments', label: 'Appointments', icon: Calendar },
                    { id: 'communications', label: 'Communications', icon: Mail },
                    { id: 'tasks', label: 'Tasks', icon: CheckCircle }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all relative
                            ${activeTab === tab.id ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <tab.icon className={`w-3.5 h-3.5 ${activeTab === tab.id ? 'text-blue-500' : 'text-slate-300'}`} />
                        {tab.label}
                        {activeTab === tab.id && (
                            <div className="absolute bottom-[-1px] left-0 right-0 h-1 bg-blue-600 rounded-t-full shadow-[0_-2px_10px_rgba(37,99,235,0.4)]" />
                        )}
                    </button>
                ))}
            </div>
            {/* 4. KPI Performance Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-2">
                {[
                    { label: 'Total Appointments', value: summary?.summary?.totalAppointments || 0, icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-50' },
                    { label: 'Completed', value: summary?.summary?.completedAppointments || 0, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                    canSeeFinancials && { label: 'Lifetime Value', value: `€${(Number(summary?.summary?.lifetimeValue) || 0).toFixed(2)}`, icon: ShieldCheck, color: 'text-indigo-500', bg: 'bg-indigo-50' },
                    { label: 'Repeat Visits', value: summary?.summary?.repeatCount || 0, icon: Repeat, color: 'text-amber-500', bg: 'bg-amber-50' }
                ].filter(Boolean).map((kpi, idx) => (
                    <Card key={idx} className="border-none shadow-sm bg-white rounded-2xl overflow-hidden border border-slate-200 group hover:shadow-md transition-all">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center ${kpi.color}`}>
                                    <kpi.icon className="w-5 h-5" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{kpi.label}</span>
                                    <span className="text-sm font-black text-slate-900 mt-0.5">{kpi.value}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* 2. Quick Action Toolbar (The "Big 5" Sales Interactions) */}
            <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm animate-in slide-in-from-top-5">
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
                    <Button
                        onClick={() => setShowPhoneCallModal(true)}
                        className="h-16 flex flex-col items-center justify-center gap-1.5 bg-white hover:bg-emerald-50 border-slate-200 hover:border-emerald-200 text-slate-700 transition-all rounded-2xl shadow-sm group"
                    >
                        <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                            <PhoneCall className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-tighter">Add Call Notes</span>
                    </Button>

                    <Button
                        onClick={() => window.open(`https://wa.me/${customer.phone?.replace(/[^0-9]/g, '')}`, '_blank')}
                        className="h-16 flex flex-col items-center justify-center gap-1.5 bg-white hover:bg-emerald-50 border-slate-200 hover:border-emerald-200 text-slate-700 transition-all rounded-2xl shadow-sm group"
                    >
                        <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                            <MessageSquare className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-tighter">WhatsApp</span>
                    </Button>

                    <Button
                        onClick={() => setShowEmailModal(true)}
                        className="h-16 flex flex-col items-center justify-center gap-1.5 bg-white hover:bg-blue-50 border-slate-200 hover:border-blue-200 text-slate-700 transition-all rounded-2xl shadow-sm group"
                    >
                        <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                            <Mail className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-tighter">Log Email Sent</span>
                    </Button>

                    <Button
                        onClick={() => setShowTaskModal(true)}
                        className="h-16 flex flex-col items-center justify-center gap-1.5 bg-white hover:bg-amber-50 border-slate-200 hover:border-amber-200 text-slate-700 transition-all rounded-2xl shadow-sm group"
                    >
                        <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                            <Clock className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-tighter">Follow up</span>
                    </Button>

                    <Button
                        onClick={() => setShowBookingModal(true)}
                        className="h-16 flex flex-col items-center justify-center gap-1.5 bg-white hover:bg-indigo-50 border-slate-200 hover:border-indigo-200 text-slate-700 transition-all rounded-2xl shadow-sm group"
                    >
                        <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                            <Calendar className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-tighter">Book Appoint.</span>
                    </Button>
                </div>
            </div>

            {/* 4. Main Two-Column Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                {/* ---------- LEFT COLUMN: CRM PROPERTIES (4 COLS) ---------- */}
                <div className="lg:col-span-4 space-y-6">
                    {/* D. Clinique Status Card (Critical Requirement) */}
                    <Card className="border-none shadow-sm bg-[#fafcfe] rounded-2xl overflow-hidden border-2 border-[#b3d81b]/20">
                        <CardHeader className="bg-[#b3d81b]/10 border-b border-[#b3d81b]/20 py-4 px-6 flex flex-row items-center justify-between">
                            <CardTitle className="text-xs font-black uppercase tracking-widest text-[#7a9412]">Ιατρείο – Clinique</CardTitle>
                            <Activity className="w-4 h-4 text-[#b3d81b]" />
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Clinic Statuses</label>
                                    <Button variant="ghost" size="sm" onClick={() => setIsEditingClinics(!isEditingClinics)} className="h-6 px-2 text-[10px] font-bold text-blue-600 hover:bg-blue-50">
                                        {isEditingClinics ? 'Finish' : 'Manage Clinics'}
                                    </Button>
                                </div>

                                <div className="grid grid-cols-1 gap-3">
                                    {(customer as any).clinicStatuses?.map((aff: any) => (
                                        <div key={aff.id} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-3 group hover:border-blue-200 transition-all">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2.5 h-2.5 rounded-full bg-[#b3d81b] animate-pulse" />
                                                    <span className="text-xs font-black text-slate-800">{aff.clinic?.name || 'Unknown Clinic'}</span>
                                                </div>
                                                {isEditingClinics && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 w-6 p-0 text-slate-300 hover:text-red-500"
                                                        onClick={async () => {
                                                            const currentAffs = (customer as any).clinicStatuses || [];
                                                            const updatedAffs = currentAffs.filter((a: any) => a.clinicId !== aff.clinicId).map((a: any) => ({ clinicId: a.clinicId, status: a.status }));
                                                            await dispatch(updateLead({ id: effectiveId, updates: { clinicAffiliations: updatedAffs } as any })).unwrap();
                                                            dispatch(fetchCustomerRecord({ customerId: effectiveId, salespersonId: user?.id }));
                                                        }}
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </Button>
                                                )}
                                            </div>

                                            <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-50">
                                                <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Clinic Status</span>
                                                <Select
                                                    value={aff.status}
                                                    onChange={async (val) => {
                                                        const currentAffs = (customer as any).clinicStatuses || [];
                                                        const updatedAffs = currentAffs.map((a: any) =>
                                                            a.clinicId === aff.clinicId ? { clinicId: a.clinicId, status: val } : { clinicId: a.clinicId, status: a.status }
                                                        );
                                                        await dispatch(updateLead({ id: effectiveId, updates: { clinicAffiliations: updatedAffs } as any })).unwrap();
                                                        dispatch(fetchCustomerRecord({ customerId: effectiveId, salespersonId: user?.id }));
                                                    }}
                                                    options={[
                                                        { value: 'new', label: 'Lead' },
                                                        { value: 'contacted', label: 'Contacted' },
                                                        { value: 'interested', label: 'Interested' },
                                                        { value: 'converted', label: 'Client / Converted' },
                                                        { value: 'lost', label: 'Lost' },
                                                    ]}
                                                    className="h-8 text-[11px] border-slate-200 font-bold bg-white"
                                                />
                                            </div>
                                        </div>
                                    ))}

                                    {(!(customer as any).clinicStatuses || (customer as any).clinicStatuses.length === 0) && (
                                        <div className="py-4 px-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">No Active Clinique Linked</p>
                                        </div>
                                    )}

                                    {isEditingClinics && (
                                        <div className="pt-2">
                                            <Select
                                                placeholder="Link new clinic..."
                                                onChange={async (val) => {
                                                    const currentAffs = (customer as any).clinicStatuses || [];
                                                    const updatedAffs = [...currentAffs.map((a: any) => ({ clinicId: a.clinicId, status: a.status })), { clinicId: val, status: 'new' }];
                                                    await dispatch(updateLead({ id: effectiveId, updates: { clinicAffiliations: updatedAffs } as any })).unwrap();
                                                    dispatch(fetchCustomerRecord({ customerId: effectiveId, salespersonId: user?.id }));
                                                }}
                                                options={(clinics || []).filter((c: any) => !(customer as any).clinicStatuses?.some((a: any) => a.clinicId === c.id)).map((c: any) => ({ value: c.id, label: c.name }))}
                                                className="h-10 text-xs border-slate-200 font-black uppercase tracking-tighter"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* A. Core Info Card (Includes Lifecycle Status) */}
                    <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden border border-slate-200">
                        <CardHeader className="bg-slate-50 border-b border-slate-100 py-4 px-6 flex flex-row items-center justify-between">
                            <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-500">Sales Record</CardTitle>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => isEditingCore ? handleSaveCoreProperties() : setIsEditingCore(true)}
                                className="h-7 px-2 text-[10px] font-bold text-blue-600 hover:bg-blue-50"
                            >
                                {isEditingCore ? 'Save' : 'Edit'}
                            </Button>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            {/* Sales Status */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Lead Status</label>
                                <Select
                                    value={displayStatus}
                                    onChange={async (val) => {
                                        await dispatch(updateLead({ id: effectiveId, updates: { status: val as Lead['status'] } })).unwrap();
                                        dispatch(fetchCustomerRecord({ customerId: effectiveId, salespersonId: user?.id }));
                                    }}
                                    options={[
                                        { value: 'new', label: 'New Lead' },
                                        { value: 'contacted', label: 'Contacted' },
                                        { value: 'qualified', label: 'Qualified' },
                                        { value: 'converted', label: 'Converted' },
                                        { value: 'lost', label: 'Lost' },
                                    ]}
                                    className="h-10 text-xs font-bold border-slate-100 bg-slate-50/50 rounded-xl"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">First Name</label>
                                    {isEditingCore ? (
                                        <Input
                                            value={editedProperties.firstName}
                                            onChange={(e) => setEditedProperties({ ...editedProperties, firstName: e.target.value })}
                                            className="h-8 text-xs font-bold bg-slate-50"
                                        />
                                    ) : (
                                        <div className="text-sm font-bold text-slate-800">{customer.firstName}</div>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">Last Name</label>
                                    {isEditingCore ? (
                                        <Input
                                            value={editedProperties.lastName}
                                            onChange={(e) => setEditedProperties({ ...editedProperties, lastName: e.target.value })}
                                            className="h-8 text-xs font-bold bg-slate-50"
                                        />
                                    ) : (
                                        <div className="text-sm font-bold text-slate-800">{customer.lastName || '--'}</div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-slate-50">
                                <div className="flex flex-col gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">Email Address</label>
                                        {isEditingCore ? (
                                            <Input
                                                value={editedProperties.email}
                                                onChange={(e) => setEditedProperties({ ...editedProperties, email: e.target.value })}
                                                className="h-8 text-xs font-bold bg-slate-50"
                                            />
                                        ) : (
                                            <div className="text-xs font-bold text-slate-700">{customer.email}</div>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">Phone Number</label>
                                        {isEditingCore ? (
                                            <Input
                                                value={editedProperties.phone}
                                                onChange={(e) => setEditedProperties({ ...editedProperties, phone: e.target.value })}
                                                className="h-8 text-xs font-bold bg-slate-50"
                                            />
                                        ) : (
                                            <div className="text-xs font-bold text-slate-700">{customer.phone || '--'}</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* B. Commercial & Tracking */}
                    <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden border border-slate-200">
                        <CardHeader className="bg-slate-50 border-b border-slate-100 py-4 px-6">
                            <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-500">Commercial Intel</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            {canSeeFinancials && (
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5"><Clock className="w-3 h-3" /> Est. Value</label>
                                    {isEditingCore ? (
                                        <Input
                                            type="number"
                                            value={editedProperties.estimatedValue || 0}
                                            onChange={(e) => setEditedProperties({ ...editedProperties, estimatedValue: parseFloat(e.target.value) })}
                                            className="h-8 text-xs font-bold mt-1"
                                        />
                                    ) : (
                                        <div className="text-sm font-black text-slate-900 line-clamp-1">€{customer.estimatedValue || '0.00'}</div>
                                    )}
                                </div>
                            )}

                            <div className="flex flex-col py-3 px-4 bg-slate-50 rounded-xl border border-slate-100 group transition-all">
                                <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1.5 flex items-center gap-1.5">
                                    <FileText className="w-3 h-3" /> Meta Form Source
                                </span>
                                {isEditingCore ? (
                                    <div className="space-y-2">
                                        <Input
                                            placeholder="Form Name"
                                            value={editedProperties.lastMetaFormName || ""}
                                            onChange={(e) => setEditedProperties({ ...editedProperties, lastMetaFormName: e.target.value })}
                                            className="h-8 text-xs font-bold"
                                        />
                                        <Input
                                            placeholder="Facebook Ad Name"
                                            value={editedProperties.facebookAdName || ""}
                                            onChange={(e) => setEditedProperties({ ...editedProperties, facebookAdName: e.target.value })}
                                            className="h-8 text-xs font-bold"
                                        />
                                    </div>
                                ) : (
                                    <>
                                        <span className="text-xs font-black text-blue-600">{(customer as any).lastMetaFormName || 'No Meta Data Detected'}</span>
                                        {(customer as any).facebookAdName && (
                                            <span className="text-[10px] text-slate-500 font-bold mt-1">Ad: {(customer as any).facebookAdName}</span>
                                        )}
                                        {(customer as any).lastMetaFormSubmittedAt && (
                                            <span className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-tighter">Submitted: {new Date((customer as any).lastMetaFormSubmittedAt).toLocaleString()}</span>
                                        )}
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>


                    {/* C. Contact owner Card */}
                    <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden border border-slate-200">
                        <CardHeader className="bg-slate-50 border-b border-slate-100 py-4 px-6 flex flex-row items-center justify-between">
                            <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-500">Contact owner</CardTitle>
                            <Users className="w-4 h-4 text-slate-300" />
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            {/* Owners Section */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Contact owner</label>
                                    <Button variant="ghost" size="sm" onClick={() => setIsEditingOwners(!isEditingOwners)} className="h-6 px-2 text-[10px] font-bold text-blue-600 hover:bg-blue-50">
                                        {isEditingOwners ? 'Done' : 'Edit'}
                                    </Button>
                                </div>
                                {isEditingOwners ? (
                                    <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-100 max-h-40 overflow-y-auto">
                                        {salespersons?.filter(sp => sp.role === 'salesperson' || sp.role === 'manager').map(sp => (
                                            <label key={sp.id} className="flex items-center gap-2 cursor-pointer hover:bg-white p-1 rounded transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={(customer as any).multiOwners?.some((o: any) => o.id === sp.id)}
                                                    onChange={async (e) => {
                                                        const currentIds = (customer as any).multiOwners?.map((o: any) => o.id) || [];
                                                        const newIds = e.target.checked
                                                            ? [...currentIds, sp.id]
                                                            : currentIds.filter((id: string) => id !== sp.id);

                                                        await dispatch(updateLead({
                                                            id: effectiveId,
                                                            updates: { multiOwnerIds: newIds } as any
                                                        })).unwrap();
                                                        dispatch(fetchCustomerRecord({ customerId: effectiveId, salespersonId: user?.id }));
                                                    }}
                                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                                                />
                                                <span className="text-xs font-bold text-slate-700">{sp.firstName} {sp.lastName}</span>
                                            </label>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {(customer as any).multiOwners?.map((owner: any) => (
                                            <Badge key={owner.id} className="bg-blue-50 text-blue-600 text-[10px] font-bold border-blue-100/50 rounded-lg px-2.5 py-1">
                                                {owner.firstName} {owner.lastName}
                                            </Badge>
                                        ))}
                                        {(!(customer as any).multiOwners || (customer as any).multiOwners.length === 0) && (
                                            <div className="text-[10px] text-slate-400 italic font-medium py-2 px-3 bg-slate-50 rounded-xl border border-dashed border-slate-200 w-full text-center">No contact owners assigned</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* E. Internal Notes Card */}
                    <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden border border-slate-200">
                        <CardHeader className="bg-slate-50 border-b border-slate-100 py-4 px-6 flex flex-row items-center justify-between">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-500">Record Perspective / Notes</CardTitle>
                            <AlertCircle className="w-3.5 h-3.5 text-slate-300" />
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100/50">
                                <p className="text-[11px] text-slate-600 font-medium leading-relaxed italic">
                                    {customer.notes || "No high-level persistent notes identified for this contact."}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* ---------- RIGHT COLUMN: DYNAMIC TABS & TIMELINE (8 COLS) ---------- */}
                <div className="lg:col-span-8 space-y-6">

                    {activeTab === 'overview' && (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            {/* I. Quick Log / Interaction Flow */}
                            <div className="mb-0">
                                {renderInteractionFlow()}
                            </div>

                            {/* II. Unified Activity Timeline (Vertical Thread) */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-6">
                                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">Activity Feed</h3>
                                    <div className="flex gap-1">
                                        {['all', 'actions', 'comms', 'forms', 'appointments'].map(f => (
                                            <Button
                                                key={f}
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setTimelineFilter(f)}
                                                className={`h-7 px-2.5 text-[9px] font-black uppercase rounded-lg tracking-tighter
                                                    ${timelineFilter === f ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
                                            >
                                                {f}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                <div className="relative pl-8 pr-2 py-4">
                                    {/* Vertical Line Track */}
                                    <div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-slate-100 rounded-full" />

                                    <div className="space-y-8">
                                        {(() => {
                                            const actionEvents = (summary?.actions || []).flatMap(a => {
                                                const events = [];
                                                events.push({
                                                    type: a.originalTaskId ? 'action_autogenerated' : 'action_created',
                                                    date: new Date(a.createdAt),
                                                    data: a
                                                });
                                                if (a.status === 'completed' && a.completedAt) {
                                                    events.push({ type: 'action_completed', date: new Date(a.completedAt), data: a });
                                                }
                                                if (a.status !== 'completed' && a.dueDate && new Date(a.dueDate) < new Date()) {
                                                    events.push({ type: 'action_overdue', date: new Date(a.dueDate), data: a });
                                                }
                                                return events;
                                            });

                                            const timelineItems = [
                                                ...(summary?.communications?.map(c => ({ type: 'communication', date: new Date(c.createdAt), data: c })) || []),
                                                ...(summary?.appointments?.map(a => ({ type: 'appointment', date: new Date(a.startTime), data: a })) || []),
                                                ...actionEvents,
                                                // Form Submissions
                                                ...((customer as any).lastMetaFormName ? [{
                                                    type: 'form',
                                                    date: new Date((customer as any).lastMetaFormSubmittedAt || customer.createdAt),
                                                    data: {
                                                        formName: (customer as any).lastMetaFormName,
                                                        adName: (customer as any).facebookAdName
                                                    }
                                                }] : [])
                                            ]
                                                .filter(item => {
                                                    if (timelineFilter === 'all') return true;
                                                    if (timelineFilter === 'actions') return item.type.startsWith('action');
                                                    if (timelineFilter === 'comms') return item.type === 'communication';
                                                    if (timelineFilter === 'forms') return item.type === 'form';
                                                    if (timelineFilter === 'appointments') return item.type === 'appointment';
                                                    return true;
                                                })
                                                .sort((a, b) => b.date.getTime() - a.date.getTime());

                                            if (timelineItems.length === 0) {
                                                return (
                                                    <div className="text-center py-20 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                                        <Activity className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                                                        <p className="text-xs font-bold text-slate-400">No activity thread found for this contact.</p>
                                                    </div>
                                                );
                                            }

                                            return timelineItems.map((item: any, idx) => {
                                                let icon = <Activity className="w-3.5 h-3.5" />;
                                                let iconBg = 'bg-slate-100 text-slate-500';
                                                let title = 'Activity Event';
                                                let content = '';
                                                let meta = '';

                                                if (item.type === 'communication') {
                                                    const c = item.data as CommunicationLog;
                                                    const isCall = c.type === 'call';
                                                    const isViber = (c.type as string) === 'viber' || c.notes?.toLowerCase().includes('viber');
                                                    const isWhatsApp = (c.type as string) === 'whatsapp' || c.notes?.toLowerCase().includes('whatsapp');

                                                    if (isCall) {
                                                        icon = <PhoneCall className="w-3.5 h-3.5" />;
                                                        iconBg = 'bg-blue-500 text-white shadow-lg shadow-blue-500/20';
                                                        title = 'Logged Phone Call';
                                                    } else if (isViber) {
                                                        icon = <MessageCircle className="w-3.5 h-3.5" />;
                                                        iconBg = 'bg-purple-500 text-white shadow-lg shadow-purple-500/20';
                                                        title = 'Viber Message Logged';
                                                    } else if (isWhatsApp) {
                                                        icon = <MessageSquare className="w-3.5 h-3.5" />;
                                                        iconBg = 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20';
                                                        title = 'WhatsApp Interaction';
                                                    } else {
                                                        icon = <Mail className="w-3.5 h-3.5" />;
                                                        iconBg = 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20';
                                                        title = 'Outgoing Email/Note';
                                                    }

                                                    content = c.notes;
                                                    const actorName = c.salesperson ? `${c.salesperson.firstName} ${c.salesperson.lastName}` : (c as any).userName || 'Sales Rep';
                                                    meta = `By: ${actorName} • ${c.metadata?.outcome ? `Outcome: ${c.metadata.outcome.replace('_', ' ')}` : 'Logged'}`;
                                                } else if (item.type === 'appointment') {
                                                    const a = item.data as any;
                                                    icon = <Calendar className="w-3.5 h-3.5" />;
                                                    iconBg = 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20';
                                                    title = `Appointment: ${a.status?.toUpperCase()}`;
                                                    content = `${a.serviceName || 'Treatment'} at ${a.clinicName || 'Clinic'}`;
                                                    meta = `Scheduled: ${new Date(a.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                                                } else if (item.type === 'form') {
                                                    icon = <FileText className="w-3.5 h-3.5" />;
                                                    iconBg = 'bg-amber-500 text-white shadow-lg shadow-amber-500/20';
                                                    title = 'Meta Lead Form Inbound';
                                                    // Try to reconstruct some fields from customer meta if available
                                                    const metaData = customer.metaData || {};
                                                    const questions = Object.entries(metaData)
                                                        .filter(([k]) => k !== 'ad_name' && k !== 'form_name')
                                                        .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`)
                                                        .join(' | ');

                                                    content = `Form: ${item.data.formName}${questions ? ` • ${questions}` : ''}`;
                                                    meta = (customer as any).lastMetaFormName ? `Ad: ${(customer as any).lastMetaFormName}` : 'Inbound Source';
                                                } else if (item.type.startsWith('action_')) {
                                                    const act = item.data as CrmAction;
                                                    const isCompleted = item.type === 'action_completed';
                                                    icon = isCompleted ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />;
                                                    iconBg = isCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-800 text-white';

                                                    if (act.actionType === 'confirmation_call_reminder') {
                                                        title = `Appointment Confirmation Reminder`;
                                                        icon = <Phone className="w-3.5 h-3.5" />;
                                                        iconBg = 'bg-indigo-100 text-indigo-600';
                                                    } else if (item.type === 'action_autogenerated') {
                                                        title = `Recurring Task Injected`;
                                                        icon = <RefreshCw className="w-3.5 h-3.5" />;
                                                        iconBg = 'bg-blue-100 text-blue-600';
                                                    } else if (item.type === 'action_overdue') {
                                                        title = `Task Overdue Warning`;
                                                        iconBg = 'bg-red-500 text-white shadow-lg shadow-red-500/20';
                                                    } else {
                                                        title = isCompleted ? `Task Completed` : `New Task Created`;
                                                    }

                                                    content = act.title;
                                                    meta = `Assignee: ${(act as any).assigneeName || 'Self'} • Due: ${act.dueDate ? new Date(act.dueDate).toLocaleString() : 'N/A'}`;

                                                    if (act.relatedAppointmentId) {
                                                        meta += ` • Linked to Appt #${act.relatedAppointmentId.slice(0, 8)}`;
                                                    }
                                                }

                                                return (
                                                    <div key={`${item.type}-${idx}`} className="relative group">
                                                        {/* Node */}
                                                        <div className={`absolute left-[-25px] top-1 w-4.5 h-4.5 rounded-full border-4 border-white flex items-center justify-center z-10 transition-transform group-hover:scale-110 ${iconBg} w-[18px] h-[18px]`}>
                                                            <div className="scale-75">{icon}</div>
                                                        </div>

                                                        {/* Card Content (Glassmorphic) */}
                                                        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow group-hover:border-slate-200">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[10px] font-black uppercase text-slate-800 tracking-tight">{title}</span>
                                                                </div>
                                                                <span className="text-[9px] font-bold text-slate-400">{item.date.toLocaleString()}</span>
                                                            </div>
                                                            <p className="text-xs text-slate-600 leading-relaxed font-medium mb-2">{content}</p>
                                                            {meta && (
                                                                <div className="flex flex-wrap gap-2 pt-2 mt-2 border-t border-slate-50">
                                                                    <Badge className="bg-slate-50 text-slate-400 border border-slate-100 text-[8px] px-1.5 font-bold uppercase">{meta}</Badge>
                                                                    {item.data.metadata?.tags?.map((t: string) => (
                                                                        <Badge key={t} className="bg-blue-50/50 text-blue-500 text-[8px] font-bold rounded">#{t}</Badge>
                                                                    ))}
                                                                </div>
                                                            )}

                                                            {item.type === 'appointment' && (
                                                                <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-slate-50">
                                                                    {item.data.status?.toUpperCase() === 'COMPLETED' ? (
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            onClick={() => {
                                                                                setPendingAptId(item.data.id);
                                                                                setPendingAptObj(item.data);
                                                                                setPaymentAmt(item.data.amountPaid?.toString() || '');
                                                                                setPaymentMethod(item.data.paymentMethod || 'cash');
                                                                                setIsPaymentPrompt(true);
                                                                            }}
                                                                            className="h-7 text-[9px] font-black uppercase border-emerald-200 text-emerald-600 hover:bg-emerald-50 rounded-lg px-3"
                                                                        >
                                                                            Update Record
                                                                        </Button>
                                                                    ) : (
                                                                        <>
                                                                            <Button
                                                                                size="sm"
                                                                                onClick={() => handleUpdateAppointmentStatus(item.data.id, 'COMPLETED', item.data)}
                                                                                className="h-7 text-[9px] font-black uppercase bg-emerald-500 hover:bg-emerald-600 text-white border-none rounded-lg px-3"
                                                                            >
                                                                                Complete
                                                                            </Button>
                                                                            <Button
                                                                                size="sm"
                                                                                variant="outline"
                                                                                onClick={() => handleUpdateAppointmentStatus(item.data.id, 'NO_SHOW', item.data)}
                                                                                className="h-7 text-[9px] font-black uppercase border-amber-200 text-amber-600 hover:bg-amber-50 rounded-lg px-3"
                                                                            >
                                                                                No Show
                                                                            </Button>
                                                                            <Button
                                                                                size="sm"
                                                                                variant="outline"
                                                                                onClick={() => handleUpdateAppointmentStatus(item.data.id, 'CANCELLED', item.data)}
                                                                                className="h-7 text-[9px] font-black uppercase border-red-200 text-red-600 hover:bg-red-50 rounded-lg px-3"
                                                                            >
                                                                                Cancel
                                                                            </Button>
                                                                        </>
                                                                    )}
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => {
                                                                            setSelectedAppointmentForEdit(item.data);
                                                                            setShowBookingModal(true);
                                                                        }}
                                                                        className="h-7 text-[9px] font-black uppercase border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg px-3"
                                                                    >
                                                                        Edit
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            });
                                        })()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}


                    {activeTab === 'tasks' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                            <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden border border-slate-200">
                                <CardHeader className="bg-slate-50 border-b border-slate-100 py-4 px-6 flex flex-row items-center justify-between">
                                    <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-500">Execution Plan: Operational Tasks</CardTitle>
                                    <Button size="sm" onClick={() => setShowTaskModal(true)} className="h-9 bg-slate-900 text-white font-bold text-xs px-4 rounded-xl">
                                        <Plus className="w-4 h-4 mr-2" /> Program New Task
                                    </Button>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest w-[60px]">Status</th>
                                                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Task Details</th>
                                                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Classification</th>
                                                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Deadlines</th>
                                                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {summary?.actions?.length === 0 ? (
                                                    <tr><td colSpan={5} className="p-20 text-center text-slate-400 italic font-medium text-xs">No active tasks identified for this record.</td></tr>
                                                ) : (
                                                    summary?.actions?.map((task) => (
                                                        <tr key={task.id} className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors ${new Date(task.dueDate!) < new Date() && task.status !== 'completed' ? 'bg-red-50/30' : ''}`}>
                                                            <td className="p-5 align-middle">
                                                                <div className="flex justify-center">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={task.status === 'completed'}
                                                                        onChange={async (e) => {
                                                                            e.preventDefault();
                                                                            const isCompleting = task.status !== 'completed';

                                                                            if (isCompleting && (task.actionType === 'call' || task.actionType === 'follow_up_call' || task.actionType === 'confirmation_call_reminder' || task.actionType === 'mobile_message')) {
                                                                                setInteractionType('call');
                                                                                setWorkflowStep(2);
                                                                                setShowDialer(true);
                                                                                (window as any)._pendingTaskIdToComplete = task.id;
                                                                                return;
                                                                            }

                                                                            if (isCompleting && task.actionType === 'email') {
                                                                                setShowEmailModal(true);
                                                                                setInteractionType('email');
                                                                                (window as any)._pendingTaskIdToComplete = task.id;
                                                                                return;
                                                                            }

                                                                            if (isCompleting && task.actionType === 'appointment') {
                                                                                setPendingTaskId(task.id);
                                                                                setShowBookingModal(true);
                                                                                return;
                                                                            }

                                                                            const newStatus = isCompleting ? 'completed' : 'pending';
                                                                            await dispatch(updateAction({ id: task.id, updates: { status: newStatus } })).unwrap();
                                                                            dispatch(fetchCustomerRecord({ customerId: effectiveId, salespersonId: user?.id }));
                                                                        }}
                                                                        className="h-5 w-5 rounded-lg border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                                                                    />
                                                                </div>
                                                            </td>
                                                            <td className="p-5">
                                                                <div className="font-bold text-slate-800 text-xs mb-0.5">{task.title}</div>
                                                                {task.description && <div className="text-[10px] text-slate-500 line-clamp-1 italic font-medium">{task.description}</div>}
                                                            </td>
                                                            <td className="p-5">
                                                                <div className="flex flex-col gap-1.5">
                                                                    <Badge className="bg-slate-800 text-white border-none text-[8px] w-fit font-black uppercase tracking-tight py-0.5 px-2">
                                                                        {task.actionType.replace('_', ' ')}
                                                                    </Badge>
                                                                    {task.therapy && <span className="text-[9px] font-bold text-blue-500 uppercase tracking-tighter">Ref: {task.therapy}</span>}
                                                                </div>
                                                            </td>
                                                            <td className="p-5">
                                                                <div className="flex flex-col gap-1">
                                                                    <div className={`text-[10px] font-black flex items-center gap-1.5 ${new Date(task.dueDate!) < new Date() && task.status !== 'completed' ? 'text-red-500' : 'text-slate-700'}`}>
                                                                        <Clock className="w-3.5 h-3.5" /> Due {new Date(task.dueDate!).toLocaleDateString()} {new Date(task.dueDate!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                    </div>
                                                                    {task.reminderDate && (
                                                                        <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tight flex items-center gap-1">
                                                                            <Bell className="w-2.5 h-2.5" /> Rem: {new Date(task.reminderDate).toLocaleDateString()} {new Date(task.reminderDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="p-5 text-right">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                                                    onClick={async () => {
                                                                        if (window.confirm('Delete this task?')) {
                                                                            await dispatch(deleteAction(task.id));
                                                                            dispatch(fetchCustomerRecord({ customerId: effectiveId, salespersonId: user?.id }));
                                                                        }
                                                                    }}
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                    {activeTab === 'appointments' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                            <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden border border-slate-200">
                                <CardHeader className="bg-slate-50 border-b border-slate-100 py-4 px-6 flex flex-row items-center justify-between">
                                    <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-500">Engagement Record: Appointments</CardTitle>
                                    <Button size="sm" onClick={() => setShowBookingModal(true)} className="h-9 bg-slate-900 text-white font-bold text-xs px-4 rounded-xl">
                                        <Plus className="w-4 h-4 mr-2" /> Book New
                                    </Button>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date & Time</th>
                                                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Service Item</th>
                                                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Clinic Location</th>
                                                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                                                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {summary?.appointments?.length === 0 ? (
                                                    <tr><td colSpan={4} className="p-20 text-center text-slate-400 italic font-medium text-xs">No appointment history found for this contact.</td></tr>
                                                ) : (
                                                    summary?.appointments?.map((apt) => (
                                                        <tr key={apt.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                                                            <td className="p-5 text-xs font-bold text-slate-700">{new Date(apt.startTime).toLocaleString()}</td>
                                                            <td className="p-5 text-xs font-bold text-slate-900">{apt.serviceName}</td>
                                                            <td className="p-5 text-xs font-medium text-slate-500">{apt.clinicName}</td>
                                                            <td className="p-5 text-right">
                                                                <Badge className={`${apt.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'} text-[9px] font-black uppercase px-2.5 py-1 rounded-lg border shadow-sm`}>
                                                                    {apt.status}
                                                                </Badge>
                                                            </td>
                                                            <td className="p-5 text-right">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        setSelectedAppointmentForEdit(apt);
                                                                        setShowBookingModal(true);
                                                                    }}
                                                                    className="h-8 text-[10px] font-bold text-blue-600 hover:bg-blue-50 rounded-lg"
                                                                >
                                                                    Edit
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {activeTab === 'communications' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                            <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden border border-slate-200">
                                <CardHeader className="bg-slate-50 border-b border-slate-100 py-4 px-6 flex flex-row items-center justify-between">
                                    <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-500">Unified Communication Logs</CardTitle>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={() => setShowPhoneCallModal(true)} className="h-8 text-[10px] font-bold border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg">
                                            <PhoneCall className="w-3 h-3 mr-2" /> Log Call
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => setShowEmailModal(true)} className="h-8 text-[10px] font-bold border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg">
                                            <Mail className="w-3 h-3 mr-2" /> Log Email
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {summary?.communications?.length === 0 ? (
                                        <div className="p-20 text-center text-slate-400 italic font-medium text-xs">No communication history logged.</div>
                                    ) : (
                                        <div className="divide-y divide-slate-100">
                                            {summary?.communications?.map((comm) => (
                                                <div key={comm.id} className="p-6 hover:bg-slate-50/50 transition-all group/comm">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm ${comm.type === 'call' ? 'bg-blue-50 border-blue-100 text-blue-500' : 'bg-indigo-50 border-indigo-100 text-indigo-500'}`}>
                                                                {comm.type === 'call' ? <PhoneCall className="w-5 h-5" /> : <Mail className="w-5 h-5" />}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-xs font-black text-slate-800 uppercase tracking-tight">{comm.type === 'call' ? 'Phone Outbound' : 'Email Outbound'}</span>
                                                                <span className="text-[10px] font-bold text-slate-400">{new Date(comm.createdAt).toLocaleString()}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 opacity-0 group-hover/comm:opacity-100 transition-opacity">
                                                            {comm.type === 'call' && (
                                                                <Button variant="ghost" size="sm" className="h-8 px-3 text-[10px] font-bold text-blue-600 hover:bg-blue-50" onClick={() => { setEditingCallId(comm.id); setPhoneCallNotes(comm.notes || ""); setShowPhoneCallModal(true); }}>
                                                                    Edit
                                                                </Button>
                                                            )}
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 px-3 text-[10px] font-bold text-red-600 hover:bg-red-50"
                                                                onClick={async () => {
                                                                    if (confirm('Delete log?')) {
                                                                        await dispatch(deleteCommunication(comm.id));
                                                                        dispatch(fetchCustomerRecord({ customerId: customer.id, salespersonId: user?.id }));
                                                                    }
                                                                }}
                                                            >
                                                                Delete
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-slate-600 leading-relaxed font-medium bg-slate-50/50 p-4 rounded-xl border border-slate-100/50">{comm.notes}</p>
                                                    {comm.metadata?.outcome && (
                                                        <div className="mt-4">
                                                            <Badge className="bg-slate-800 text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-lg shadow-sm">{comm.metadata.outcome.replace('_', ' ')}</Badge>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}

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


            {/* Phone Call Notes Modal */}
            {showPhoneCallModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-slate-200 p-6 space-y-4">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <PhoneCall className="w-4 h-4 text-slate-400" /> {editingCallId ? "Edit Phone Call Notes" : "Add Phone Call Notes"}
                            </h3>
                            <Button variant="ghost" size="sm" onClick={() => { setShowPhoneCallModal(false); setPhoneCallNotes(""); setEditingCallId(null); }} className="h-8 w-8 p-0">
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
                                <Button variant="outline" onClick={() => { setShowPhoneCallModal(false); setPhoneCallNotes(""); setEditingCallId(null); }}>Cancel</Button>
                                <Button className="bg-slate-800 hover:bg-slate-900 text-white" onClick={handleSavePhoneCallNotes}>
                                    {editingCallId ? "Update Notes" : "Save Notes"}
                                </Button>
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
                                onCancel={() => setShowTaskModal(false)}
                                prefilledData={{ salespersonId: user?.id }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Prompt Modal */}
            {isPaymentPrompt && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-300">
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

        </div >
    );
};
