import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    Mail, Phone, Calendar,
    Activity, CheckCircle, PhoneCall,
    Briefcase, Clock
} from "lucide-react";
import { Button } from "@/components/atoms/Button/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/molecules/Card/Card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/molecules/Tabs";
import { Badge } from "@/components/atoms/Badge";
import { Input } from "@/components/atoms/Input/Input";
import { Select } from "@/components/atoms/Select/Select";
import { Textarea } from "@/components/atoms/Textarea";

import type { Lead, Customer, CustomerSummary } from "@/types";
import { RootState, AppDispatch } from "@/store";
import {
    fetchCustomerRecord,
    createAction,
    logCommunication,
    updateLead
} from "@/store/slices/crmSlice";
import { clinicsAPI } from "@/services/api";
import type { Clinic } from "@/types";

interface OneCustomerDetailProps {
    SelectedCustomer: Customer | Lead;
    isLoading?: boolean;
    error?: string | null;
}

import { CRMBookingModal } from '@/components/crm/CRMBookingModal';

export const OneCustomerDetail: React.FC<OneCustomerDetailProps> = ({
    SelectedCustomer,
}) => {
    const dispatch = useDispatch<AppDispatch>();
    const { customerRecord } = useSelector((state: RootState) => state.crm);
    const { user } = useSelector((state: RootState) => state.auth);

    // Local state for interaction form
    const [activeTab, setActiveTab] = useState("overview");
    const [interactionForm, setInteractionForm] = useState({
        clinic: "",
        proposedTreatment: "",
        cost: "",
        consumablesCost: "",
        outcome: "",
        notes: ""
    });
    const [isInteracting, setIsInteracting] = useState(false);
    const [showValidationWarning, setShowValidationWarning] = useState(false);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [availableClinics, setAvailableClinics] = useState<Clinic[]>([]);
    const tabsRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchClinics = async () => {
            try {
                const res = await clinicsAPI.search({ limit: 100 });
                setAvailableClinics(res.data.clinics || []);
            } catch (err) {
                console.error("Failed to fetch clinics", err);
            }
        };
        fetchClinics();
    }, []);

    const scrollToTabs = (tab: string) => {
        setActiveTab(tab);
        setTimeout(() => {
            tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    useEffect(() => {
        if (SelectedCustomer?.id) {
            // Fetch full customer details
            dispatch(fetchCustomerRecord({
                customerId: SelectedCustomer.id,
                salespersonId: user?.id
            }));
        }
    }, [SelectedCustomer, dispatch, user]);

    // Derived state
    const customer = SelectedCustomer; // Type assertion or fallback
    const summary = customerRecord as CustomerSummary | null;

    const getCustomerDetails = (c: Customer | Lead) => {
        return {
            firstName: c.firstName,
            lastName: c.lastName,
            displayName: `${c.firstName} ${c.lastName}`,
            initials: (c.firstName?.[0] || '') + (c.lastName?.[0] || '')
        };
    };

    const { displayName, initials } = getCustomerDetails(customer);

    // Helper to determine type
    const isCustomer = (c: Customer | Lead): c is Customer => {
        return (c as Customer).summary !== undefined;
    };
    const customerType = isCustomer(customer) ? 'Customer' : 'Lead';

    const handleInteractionChange = (field: string, value: string) => {
        setInteractionForm(prev => ({ ...prev, [field]: value }));
        setIsInteracting(true);
        setShowValidationWarning(false);
    };

    const handleSaveInteraction = async () => {
        // Validation (Strict as per Rule 3)
        // Check clinic, proposedTreatment, outcome. Cost acts as number.
        if (!interactionForm.clinic || !interactionForm.proposedTreatment || !interactionForm.outcome || (!interactionForm.cost && interactionForm.cost !== "0")) {
            setShowValidationWarning(true);
            return;
        }

        try {
            // Log Communication
            await dispatch(logCommunication({
                customerId: customer.id,
                type: 'call',
                direction: 'outgoing',
                status: 'completed',
                notes: interactionForm.notes,
                metadata: {
                    clinic: interactionForm.clinic,
                    proposedTreatment: interactionForm.proposedTreatment,
                    cost: parseFloat(interactionForm.cost) || 0,
                    consumablesCost: parseFloat(interactionForm.consumablesCost) || 0,
                    callOutcome: interactionForm.outcome // Matched to backend expectation
                }
            })).unwrap();

            // Automatic Tasks (Rule 4)
            if (interactionForm.outcome !== 'not_interested') {
                let actionTitle = 'Follow up call';
                let actionType = 'follow_up';
                let description = `Follow up regarding ${interactionForm.proposedTreatment}`;
                let dueDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(); // Default 2 days
                let priority = 'high';

                if (interactionForm.outcome === 'appointment_booked') {
                    actionTitle = 'Confirm Appointment';
                    actionType = 'appointment_confirmation';
                    description = 'Confirm appointment 2 days prior to visit';
                    priority = 'urgent';
                    // Auto-open booking modal if desired, or just hint
                } else if (interactionForm.outcome === 'no_answer') {
                    description = 'Tried calling, no answer. Try again later.';
                }

                await dispatch(createAction({
                    customerId: customer.id,
                    salespersonId: user?.id || '',
                    actionType: actionType as any,
                    title: actionTitle,
                    description: description,
                    status: 'pending',
                    dueDate: dueDate,
                    priority: priority as any
                }));
            }

            // Reset
            setIsInteracting(false);
            setInteractionForm({ clinic: "", proposedTreatment: "", cost: "", consumablesCost: "", outcome: "", notes: "" });

            // If appointment booked, ask to schedule
            if (interactionForm.outcome === 'appointment_booked') {
                if (window.confirm('Interaction saved. Open booking calendar now?')) {
                    setShowBookingModal(true);
                }
            } else {
                alert("Interaction saved successfully!");
            }

        } catch (err) {
            console.error("Failed to save interaction", err);
        }
    };

    if (!customer) return <div>No customer selected</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-[1400px] mx-auto pb-12">
            {/* Header / Profile Summary */}
            <Card className="border-none shadow-sm overflow-hidden relative group bg-white">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full -mr-48 -mt-48 blur-3xl group-hover:bg-blue-600/5 transition-all duration-700" />
                <div className="flex flex-col md:flex-row items-center justify-between p-10 gap-8 relative z-10">
                    <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                        <div className="relative">
                            <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-black text-4xl shadow-xl shadow-blue-600/20 group-hover:scale-105 transition-transform duration-500 border-4 border-white">
                                {initials}
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-green-500 w-6 h-6 rounded-full border-4 border-white" />
                        </div>
                        <div>
                            <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start">
                                <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-tight">{displayName}</h1>
                                <Badge className={`${customerType === 'Customer' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-blue-50 text-blue-700 border-blue-100'} px-3 py-1 rounded-full font-bold uppercase text-[10px] tracking-widest border shadow-sm`}>
                                    {customerType}
                                </Badge>
                            </div>
                            <div className="mt-4 flex flex-wrap items-center gap-6 justify-center md:justify-start text-gray-500 font-medium">
                                <div className="flex items-center gap-2 group/item cursor-pointer hover:text-blue-600 transition-colors">
                                    <div className="p-2 bg-gray-50 rounded-lg group-hover/item:bg-blue-50 transition-colors"><Mail className="w-4 h-4" /></div>
                                    <span className="text-sm border-b border-transparent group-hover/item:border-blue-200">{customer.email}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-400 group/item hover:text-gray-600 transition-colors" title="Customer ID">
                                    <div className="p-2 bg-gray-50 rounded-lg group-hover/item:bg-gray-100 transition-colors"><span className="w-4 h-4 flex items-center justify-center font-mono text-[10px] font-bold">#</span></div>
                                    <span className="text-xs font-mono tracking-wider uppercase">{customer.id.slice(0, 8)}</span>
                                </div>
                                {customer.phone && (
                                    <div className="flex items-center gap-2 group/item cursor-pointer hover:text-emerald-600 transition-colors">
                                        <div className="p-2 bg-gray-50 rounded-lg group-hover/item:bg-emerald-50 transition-colors"><Phone className="w-4 h-4" /></div>
                                        <span className="text-sm border-b border-transparent group-hover/item:border-emerald-200">{customer.phone}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 text-amber-600 bg-amber-50/50 px-3 py-1 rounded-full border border-amber-100/50">
                                    <Activity className="w-3.5 h-3.5" />
                                    <span className="text-xs font-bold uppercase tracking-wide">{customer.status}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                        <Button
                            variant="white"
                            className="w-full sm:w-auto bg-white hover:bg-gray-50 border-gray-200 shadow-sm h-12 px-6 font-bold text-gray-700 hover:text-gray-900 hover:border-gray-300 transition-all"
                            onClick={() => window.location.href = `mailto:${customer.email}`}
                        >
                            <Mail className="w-4 h-4 mr-2" />
                            Message
                        </Button>
                        <Button
                            variant="primary"
                            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 h-12 px-8 font-bold transform hover:-translate-y-0.5 transition-all"
                            onClick={() => setShowBookingModal(true)}
                        >
                            <Calendar className="w-4 h-4 mr-2" />
                            Book Now
                        </Button>
                    </div>
                </div>
            </Card >

            <div className="lg:col-span-2 space-y-8">
                <div ref={tabsRef} className="scroll-mt-6">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <Card className="border-none shadow-sm p-1.5 bg-gray-100/50 rounded-2xl mb-8">
                            <TabsList className="grid grid-cols-3 md:grid-cols-5 bg-transparent h-auto gap-1">
                                <TabsTrigger value="overview" className="rounded-xl py-3 font-bold data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all">Overview</TabsTrigger>
                                <TabsTrigger value="records" className="rounded-xl py-3 font-bold data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all text-xs md:text-sm">Medical Records</TabsTrigger>
                                <TabsTrigger value="treatments" className="rounded-xl py-3 font-bold data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all text-sm">Treatments</TabsTrigger>
                                <TabsTrigger value="communication" className="rounded-xl py-3 font-bold data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all text-xs md:text-sm">History</TabsTrigger>
                                <TabsTrigger value="history" className="rounded-xl py-3 font-bold data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all text-xs md:text-sm">Tasks</TabsTrigger>
                            </TabsList>
                        </Card>

                        <TabsContent value="overview" className="space-y-6">
                            {/* Interaction Logging Panel */}
                            <Card className={`border-none shadow-md transition-all overflow-hidden ${isInteracting ? 'ring-2 ring-amber-300 shadow-amber-100' : ''}`}>
                                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 pb-4">
                                    <CardTitle className="text-lg flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-gray-800">
                                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                                <PhoneCall className="w-5 h-5" />
                                            </div>
                                            Current Interaction
                                        </div>
                                        {isInteracting && (
                                            <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-xs font-bold uppercase tracking-wide border border-amber-100 animate-pulse">
                                                <div className="w-2 h-2 rounded-full bg-amber-500" />
                                                Unsaved
                                            </span>
                                        )}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Select
                                            label="Clinic *"
                                            placeholder="Select clinic"
                                            options={availableClinics.map(c => ({ value: c.id, label: c.name }))}
                                            value={interactionForm.clinic}
                                            onChange={(value) => handleInteractionChange('clinic', value)}
                                            error={showValidationWarning && !interactionForm.clinic ? "Required" : undefined}
                                        />
                                        <Select
                                            label="Outcome *"
                                            placeholder="Call outcome"
                                            options={[
                                                { value: "no_answer", label: "No Answer" },
                                                { value: "call_back", label: "Call Back Later" },
                                                { value: "appointment_booked", label: "Appointment Booked" },
                                                { value: "not_interested", label: "Not Interested" },
                                                { value: "wrong_number", label: "Wrong Number" },
                                            ]}
                                            value={interactionForm.outcome}
                                            onChange={(value) => handleInteractionChange('outcome', value)}
                                            error={showValidationWarning && !interactionForm.outcome ? "Required" : undefined}
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input
                                            label="Proposed Treatment *"
                                            placeholder="e.g. Botox, Filler..."
                                            value={interactionForm.proposedTreatment}
                                            onChange={(e) => handleInteractionChange('proposedTreatment', e.target.value)}
                                            error={showValidationWarning && !interactionForm.proposedTreatment ? "Required" : undefined}
                                        />
                                        <Input
                                            label="Cost Estimate"
                                            placeholder="€"
                                            type="number"
                                            value={interactionForm.cost}
                                            onChange={(e) => handleInteractionChange('cost', e.target.value)}
                                        />
                                    </div>
                                    {user?.role === 'doctor' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input
                                                label="Consumables Cost (Doctor only)"
                                                placeholder="e.g. 1ml Filler (€60)"
                                                value={interactionForm.consumablesCost}
                                                onChange={(e) => handleInteractionChange('consumablesCost', e.target.value)}
                                            />
                                        </div>
                                    )}
                                    <Textarea
                                        placeholder="Add notes about this conversation..."
                                        value={interactionForm.notes}
                                        onChange={(e) => handleInteractionChange('notes', e.target.value)}
                                        className="min-h-[100px]"
                                    />
                                    <div className="flex justify-end pt-2">
                                        <Button
                                            onClick={handleSaveInteraction}
                                            variant="primary"
                                            className="w-full md:w-auto"
                                        >
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            Save Interaction
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Recent Activity */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Recent Activity</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {summary?.actions?.slice(0, 3).map((action, i) => (
                                            <div key={i} className="flex gap-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                                                <div className={`mt-1 w-2 h-2 rounded-full ${action.status === 'completed' ? 'bg-green-500' : 'bg-amber-500'}`} />
                                                <div>
                                                    <div className="font-medium text-sm text-gray-900">{action.title}</div>
                                                    <div className="text-xs text-gray-500">{new Date(action.createdAt).toLocaleDateString()}</div>
                                                    <div className="text-sm text-gray-600 mt-1">{action.description}</div>
                                                </div>
                                            </div>
                                        )) || <div className="text-gray-500 text-sm">No recent actions</div>}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="history" className="mt-4">
                            <Card>
                                <CardHeader><CardTitle>Communication History</CardTitle></CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {summary?.communications?.map((comm, i) => (
                                            <div key={i} className="flex flex-col gap-1 p-3 bg-gray-50 rounded-lg">
                                                <div className="flex justify-between items-start">
                                                    <span className="font-medium capitalize text-sm">{comm.type}</span>
                                                    <span className="text-xs text-gray-500">{new Date(comm.createdAt).toLocaleString()}</span>
                                                </div>
                                                <p className="text-sm text-gray-700">{comm.notes}</p>
                                                {comm.metadata && (
                                                    <div className="mt-2 text-xs bg-white p-2 rounded border border-gray-100 grid grid-cols-2 gap-2">
                                                        <div><span className="text-gray-500">Outcome:</span> {comm.metadata.outcome}</div>
                                                        <div><span className="text-gray-500">Proposal:</span> {comm.metadata.proposedTreatment}</div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {!summary?.communications?.length && <div className="text-center text-gray-500 py-4">No history yet</div>}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="treatments" className="mt-4">
                            <Card>
                                <CardHeader><CardTitle>Detailed Treatment History</CardTitle></CardHeader>
                                <CardContent>
                                    {/* Mock/Real data from summary.appointments */}
                                    <div className="space-y-4">
                                        {summary?.appointments?.map((apt, i) => (
                                            <div key={i} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                                                <div className="flex justify-between">
                                                    <h4 className="font-semibold text-gray-900">{apt.serviceName || 'Treatment'}</h4>
                                                    <Badge variant={apt.status === 'completed' ? 'success' : 'default'}>{apt.status}</Badge>
                                                </div>
                                                <div className="text-sm text-gray-500 mt-1 flex gap-4">
                                                    <span>{new Date(apt.startTime).toLocaleDateString()}</span>
                                                    <span>{apt.clinicName}</span>
                                                    <span>${apt.totalAmount}</span>
                                                </div>
                                            </div>
                                        ))}
                                        {!summary?.appointments?.length && <div className="text-center text-gray-500 py-4">No treatments found</div>}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
                {/* Sidebar Info */}
                <div className="space-y-6">
                    <Card className="border-none shadow-sm bg-white">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-gray-400">Customer Profile</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <div className="text-sm font-bold text-gray-900">Source</div>
                                <div className="flex items-center gap-2 mt-1.5 p-2 bg-blue-50/50 rounded-lg border border-blue-100/50">
                                    <Activity className="w-4 h-4 text-blue-500" />
                                    <span className="text-sm font-medium text-gray-700">{customer.source || 'Facebook Ads'}</span>
                                </div>
                            </div>
                            <div>
                                <div className="text-sm font-bold text-gray-900">Lead Status</div>
                                <div className="mt-1.5">
                                    <Badge className="capitalize px-3 py-1 text-sm font-medium">{customer.status}</Badge>
                                </div>
                            </div>
                            <div>
                                <div className="text-sm font-bold text-gray-900">Assigned To</div>
                                <div className="flex items-center gap-2 mt-1.5 p-2 bg-gray-50 rounded-lg border border-gray-100">
                                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                                        {summary?.record?.assignedSalesperson?.firstName?.[0] || 'U'}
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">
                                        {summary?.record?.assignedSalesperson?.firstName || 'Unassigned'}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-indigo-600 to-purple-700 border-none text-white shadow-lg shadow-indigo-500/30 overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                        <CardHeader className="relative z-10 pb-2">
                            <CardTitle className="text-white flex items-center gap-2">
                                <Calendar className="w-4 h-4" /> Next Step
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="relative z-10 space-y-4">
                            {summary?.actions?.find(a => a.status === 'pending') ? (
                                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20">
                                    <div className="font-bold text-white text-lg">
                                        {summary.actions.find(a => a.status === 'pending')?.title}
                                    </div>
                                    <div className="text-sm text-indigo-100 mt-1 font-medium flex items-center gap-2">
                                        <Clock className="w-3.5 h-3.5" />
                                        Due: {new Date(summary.actions.find(a => a.status === 'pending')?.dueDate || '').toLocaleDateString()}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-indigo-100 text-sm bg-white/10 p-4 rounded-xl border border-white/20">
                                    No pending tasks. You're all caught up!
                                </div>
                            )}

                            <div className="flex flex-col gap-2 pt-2">
                                <Button
                                    className="w-full bg-white text-indigo-600 hover:bg-indigo-50 font-bold border-none shadow-sm h-10"
                                    onClick={() => setShowBookingModal(true)}
                                >
                                    Book Appointment
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full bg-transparent text-white border-white/30 hover:bg-white/10 font-medium h-10"
                                    onClick={() => scrollToTabs('history')}
                                >
                                    Schedule Task
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {customer.status && customer.status !== 'converted' && (
                        <Card className="border-none shadow-none bg-transparent">
                            <Button
                                variant="primary"
                                className="w-full bg-emerald-600 hover:bg-emerald-700 h-10 shadow-lg shadow-emerald-600/20"
                                onClick={async () => {
                                    if (confirm('Are you sure you want to convert this lead to a customer?')) {
                                        await dispatch(updateLead({
                                            id: customer.id,
                                            updates: { status: 'converted' }
                                        }));
                                        // Ideally refresh or navigate, but status badge update handles visual
                                        alert('Lead converted successfully!');
                                    }
                                }}
                            >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Convert to Customer
                            </Button>
                        </Card>
                    )}
                </div>
            </div>

            {/* Booking Modal */}
            {
                showBookingModal && (
                    <CRMBookingModal
                        customerId={customer.id}
                        customerName={displayName}
                        onClose={() => setShowBookingModal(false)}
                        onSuccess={() => {
                            // Refresh history
                            dispatch(fetchCustomerRecord({ customerId: customer.id, salespersonId: user?.id }));
                        }}
                    />
                )
            }
        </div >
    );
};
