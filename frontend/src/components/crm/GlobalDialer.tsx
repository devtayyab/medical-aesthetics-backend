import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import { closeDialer, setWorkflowStep } from "@/store/slices/dialerSlice";
import { updateAction, logCommunication, fetchTaskKpis, fetchActions } from "@/store/slices/crmSlice";
import { Button } from "@/components/atoms/Button/Button";
import { Textarea } from "@/components/atoms/Textarea";
import { Select } from "@/components/atoms/Select/Select";
import { Phone, User, MoreHorizontal, X, Check, Activity, Clock, PhoneCall, Calendar } from "lucide-react";
import toast from "react-hot-toast";

// Reuse the visual Dialer UI
const DialerModalUI = ({
    customerName,
    phoneNumber,
    onEndCall,
    onClose
}: {
    customerName: string;
    phoneNumber: string;
    onEndCall: (duration: number) => void;
    onClose: () => void;
}) => {
    const [callStatus, setCallStatus] = useState<'dialing' | 'connected' | 'ended'>('dialing');
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        setCallStatus('dialing');
        setDuration(0);
        timer = setTimeout(() => {
            setCallStatus('connected');
            // Automatic physical call trigger removed to match "old logic"
            // where user handles the call separately while timer runs.
        }, 2000);
        return () => clearTimeout(timer);
    }, [phoneNumber]);

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

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
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
                                {customerName?.split(' ').map(n => n[0]).join('').slice(0, 2)}
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
                                            <span>LIVE {formatDuration(duration)}</span>
                                        </div>
                                    ) : 'Call Ended'}
                            </div>
                        </div>
                    </div>

                    <div className="p-8 pb-10 flex justify-center items-center gap-8">
                        <Button variant="ghost" className="w-14 h-14 rounded-full bg-gray-700/50 hover:bg-gray-700 text-white" onClick={onClose}>
                            <X className="w-6 h-6" />
                        </Button>

                        <Button
                            onClick={() => {
                                setCallStatus('ended');
                                setTimeout(() => onEndCall(duration), 800);
                            }}
                            className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/40 border-4 border-gray-800 flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
                        >
                            <Phone className="w-8 h-8 fill-current rotate-[135deg]" />
                        </Button>
                        
                        <div className="w-14 h-14" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export const GlobalDialer: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { isOpen, customerName, phoneNumber, taskId, customerId, workflowStep } = useSelector((state: RootState) => state.dialer);
    const { user } = useSelector((state: RootState) => state.auth);
    const { clinics } = useSelector((state: RootState) => state.crm);

    const [notes, setNotes] = useState("");
    const [outcome, setOutcome] = useState("");
    const [clinic, setClinic] = useState("");
    const [duration, setDuration] = useState(0);

    if (!isOpen) return null;

    const handleSaveInteraction = async () => {
        if (!outcome || !notes.trim() || !clinic) {
            toast.error("Outcome, Clinic, and Notes are mandatory.");
            return;
        }

        try {
            // 1. Log the communication
            await dispatch(logCommunication({
                customerId: customerId || undefined,
                salespersonId: user?.id,
                type: 'call',
                direction: 'outgoing',
                status: 'completed',
                notes: `[GLOBAL DIALER] ${notes}`,
                metadata: { outcome, durationSeconds: duration, taskId }
            })).unwrap();

            // 2. Complete the task if it exists
            if (taskId) {
                await dispatch(updateAction({
                    id: taskId,
                    updates: { 
                        status: 'completed',
                        metadata: { callOutcome: outcome } 
                    }
                })).unwrap();
                toast.success("Task completed successfully!");
            }

            // 3. Refresh data
            dispatch(fetchActions({ salespersonId: user?.id }));
            dispatch(fetchTaskKpis(user?.id));

            toast.success("Interaction logged successfully!");
            dispatch(closeDialer());
            setNotes("");
            setOutcome("");
            setClinic("");
        } catch (error) {
            console.error("Failed to save interaction:", error);
            toast.error("Failed to save interaction.");
        }
    };

    return (
        <>
            {workflowStep === 0 && (
                <DialerModalUI
                    customerName={customerName}
                    phoneNumber={phoneNumber}
                    onClose={() => dispatch(closeDialer())}
                    onEndCall={(d) => {
                        setDuration(d);
                        dispatch(setWorkflowStep(1));
                    }}
                />
            )}

            {workflowStep === 1 && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold">Log Call Result</h3>
                                <p className="text-slate-400 text-xs">For {customerName} ({phoneNumber})</p>
                            </div>
                            <Button variant="ghost" onClick={() => dispatch(closeDialer())} className="text-white hover:bg-slate-800 h-10 w-10 p-0 rounded-full">
                                <X className="w-6 h-6" />
                            </Button>
                        </div>

                        <div className="p-6 space-y-4 overflow-y-auto">
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { id: 'appointment_booked', label: 'Appt Booked', icon: Calendar },
                                    { id: 'call_later', label: 'Call Back', icon: Clock },
                                    { id: 'no_answer', label: 'No Answer', icon: PhoneCall },
                                    { id: 'not_interested', label: 'Not Interested', icon: X }
                                ].map(opt => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setOutcome(opt.id)}
                                        className={`flex items-center gap-3 p-3 border rounded-xl transition-all text-left ${
                                            outcome === opt.id ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'bg-white border-slate-200 hover:border-blue-300'
                                        }`}
                                    >
                                        <div className={`p-2 rounded-lg ${outcome === opt.id ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                            <opt.icon className="w-4 h-4" />
                                        </div>
                                        <span className={`font-bold text-sm ${outcome === opt.id ? 'text-blue-700' : 'text-slate-700'}`}>{opt.label}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Clinic</label>
                                <Select
                                    options={clinics.map(c => ({ value: c.id, label: c.name }))}
                                    value={clinic}
                                    onChange={setClinic}
                                    placeholder="Choose Clinic..."
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Interaction Notes</label>
                                <Textarea
                                    placeholder="Briefly describe what happened during the call..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="min-h-[120px] rounded-xl border-slate-200 focus:ring-blue-500/20"
                                />
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 border-t flex gap-3">
                            <Button variant="white" className="flex-1 h-12 rounded-xl font-bold" onClick={() => dispatch(closeDialer())}>Cancel</Button>
                            <Button variant="primary" className="flex-2 h-12 rounded-xl font-bold shadow-lg shadow-blue-500/20" onClick={handleSaveInteraction}>Save & Close Task</Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
