import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    Mail, Phone, Calendar,
    Activity, CheckCircle, PhoneCall,
    MapPin, Stethoscope, Briefcase
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
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header / Summary Card */}
            <Card className="border-l-4 border-l-blue-500 shadow-md">
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                        <div className="flex items-start gap-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center shadow-inner">
                                <span className="text-2xl font-bold text-blue-700">
                                    {initials}
                                </span>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                    {displayName}
                                    {summary?.summary?.isRepeatCustomer && (
                                        <Badge variant="success" className="ml-2">Active Member</Badge>
                                    )}
                                </h2>
                                <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                                    <div className="flex items-center gap-1.5">
                                        <Mail className="w-4 h-4 text-gray-400" />
                                        {customer.email}
                                    </div>
                                    {customer.phone && (
                                        <div className="flex items-center gap-1.5">
                                            <Phone className="w-4 h-4 text-gray-400" />
                                            {customer.phone}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1.5">
                                        <MapPin className="w-4 h-4 text-gray-400" />
                                        {summary?.summary?.preferredClinic || 'No preferred clinic'}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Stethoscope className="w-4 h-4 text-gray-400" />
                                        {summary?.summary?.preferredDoctor || 'No assigned doctor'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 min-w-[200px]">
                            <div className="grid grid-cols-2 gap-2 text-center">
                                <div className="bg-blue-50 p-2 rounded-lg">
                                    <div className="text-xs text-blue-600 font-medium">LTV</div>
                                    <div className="text-lg font-bold text-blue-900">
                                        ${summary?.summary?.lifetimeValue || 0}
                                    </div>
                                </div>
                                <div className="bg-green-50 p-2 rounded-lg">
                                    <div className="text-xs text-green-600 font-medium">Visits</div>
                                    <div className="text-lg font-bold text-green-900">
                                        {summary?.summary?.completedAppointments || 0}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-6">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="history">History</TabsTrigger>
                            <TabsTrigger value="treatments">Treatments</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="mt-4 space-y-6">
                            {/* Interaction Logging Panel (Mandatory) */}
                            <Card className={`border-2 ${isInteracting ? 'border-amber-300 shadow-amber-100' : 'border-gray-100'} shadow-md transition-all`}>
                                <CardHeader className="bg-gray-50/50 pb-4">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <PhoneCall className="w-5 h-5 text-blue-600" />
                                        Current Interaction
                                        {isInteracting && <Badge variant="warning" className="ml-auto text-xs">Unsaved Changes</Badge>}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Select
                                            label="Clinic *"
                                            placeholder="Select logic"
                                            options={[
                                                { value: "clinic_a", label: "Clinic A (Downtown)" },
                                                { value: "clinic_b", label: "Clinic B (West End)" },
                                                // Should be dynamic
                                            ]}
                                            value={interactionForm.clinic}
                                            onChange={(v) => handleInteractionChange('clinic', v)}
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
                                            onChange={(v) => handleInteractionChange('outcome', v as any)}
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
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input
                                            label="Consumables Cost (Doctor only)"
                                            placeholder="e.g. 1ml Filler (€60)"
                                            value={interactionForm.consumablesCost}
                                            onChange={(e) => handleInteractionChange('consumablesCost', e.target.value)}
                                        />
                                    </div>
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
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm uppercase tracking-wide text-gray-500">Customer Profile</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <div className="text-sm font-medium text-gray-700">Source</div>
                                <div className="flex items-center gap-2 mt-1">
                                    <Activity className="w-4 h-4 text-blue-500" />
                                    <span className="text-gray-900">{customer.source || 'Facebook Ads'}</span>
                                </div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-gray-700">Lead Status</div>
                                <Badge className="mt-1 capitalize">{customer.status}</Badge>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-gray-700">Assigned To</div>
                                <div className="flex items-center gap-2 mt-1">
                                    <Briefcase className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-900">
                                        {summary?.record?.assignedSalesperson?.firstName || 'Unassigned'}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-none">
                        <CardHeader>
                            <CardTitle className="text-indigo-900">Next Step</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {summary?.actions?.find(a => a.status === 'pending') ? (
                                <div className="bg-white p-4 rounded-lg shadow-sm">
                                    <div className="font-medium text-gray-900">
                                        {summary.actions.find(a => a.status === 'pending')?.title}
                                    </div>
                                    <div className="text-sm text-red-500 mt-1 font-medium">
                                        Due: {new Date(summary.actions.find(a => a.status === 'pending')?.dueDate || '').toLocaleDateString()}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-indigo-600 text-sm">No pending tasks. Great job!</div>
                            )}

                            <div className="flex flex-col gap-2 mt-4">
                                <Button
                                    className="w-full bg-blue-600 hover:bg-blue-700 shadow-md transition-all"
                                    onClick={() => setShowBookingModal(true)}
                                >
                                    <Calendar className="w-4 h-4 mr-2" /> Book Appointment
                                </Button>
                                <Button variant="outline" className="w-full bg-white hover:bg-indigo-50 text-indigo-700 border-indigo-200">
                                    Schedule Task
                                </Button>
                            </div>

                            {customer.status && customer.status !== 'converted' && (
                                <Button
                                    variant="primary"
                                    className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700"
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
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Booking Modal */}
            {showBookingModal && (
                <CRMBookingModal
                    customerId={customer.id}
                    customerName={displayName}
                    onClose={() => setShowBookingModal(false)}
                    onSuccess={() => {
                        // Refresh history
                        dispatch(fetchCustomerRecord({ customerId: customer.id, salespersonId: user?.id }));
                    }}
                />
            )}
        </div>
    );
};
