const fs = require('fs');

const path = 'e:/ebizz/medical-aesthetics-backend/frontend/src/pages/CRM/OneCustomerDetail.tsx';
const content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

const startIndex = lines.findIndex(l => l.includes('return (') && l.includes('max-w-[1600px] mx-auto pb-10 space-y-6 animate-in fade-in slide-in-from-top-4 duration-700') === false);
// actually find exact lines
const returnLineIndex = lines.findIndex((l, idx) => l.trim() === 'return (' && lines[idx+1] && lines[idx+1].includes('max-w-[1600px]'));
const diaryModalIndex = lines.findIndex(l => l.includes('{/* Diary Modal */}'));

if (returnLineIndex === -1 || diaryModalIndex === -1) {
    console.error('Could not find start or end index', {returnLineIndex, diaryModalIndex});
    process.exit(1);
}

const beforeLines = lines.slice(0, returnLineIndex);
const afterLines = lines.slice(diaryModalIndex);

const newLayout = `
    return (
        <div className="max-w-[1600px] mx-auto pb-10 animate-in fade-in slide-in-from-top-4 duration-700 bg-slate-50 min-h-screen">
            {/* Top Navigation Bar */}
            <div className="px-8 py-5 border-b border-slate-200 bg-white flex items-center gap-4 sticky top-0 z-40 shadow-sm">
                <Button variant="ghost" onClick={() => window.history.back()} className="text-blue-600 font-bold hover:bg-blue-50 px-3 h-8">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Contacts
                </Button>
                <div className="h-6 w-px bg-slate-200"></div>
                <h2 className="text-lg font-black text-slate-800 tracking-tight">{customer.firstName} {customer.lastName}</h2>
            </div>

            {/* 3-Column CSS Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-8">
                
                {/* --- LEFT COLUMN (~25% width) --- */}
                <div className="col-span-1 md:col-span-3 space-y-6">
                    {/* Profile Card */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 flex flex-col items-center text-center">
                        <div className="relative mb-5">
                            <div className="w-24 h-24 rounded-full bg-slate-800 border-[6px] border-white shadow-xl flex items-center justify-center font-black text-3xl text-white">
                                {getInitials(customer.firstName, customer.lastName)}
                            </div>
                            <div className={\`absolute bottom-1 right-1 w-6 h-6 rounded-full border-4 border-white \${isConverted ? 'bg-emerald-500' : 'bg-blue-500'}\`} />
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">{customer.firstName} {customer.lastName}</h1>
                        <p className="text-sm font-bold text-slate-500 mt-1 flex items-center justify-center gap-1.5"><Mail className="w-4 h-4 text-slate-400" /> {customer.email}</p>
                        
                        <div className="mt-8 w-full flex justify-center gap-3 md:gap-4">
                            <button onClick={() => setShowEmailModal(true)} className="flex flex-col items-center gap-2 group">
                                <div className="w-12 h-12 rounded-full border border-slate-200 shadow-sm flex items-center justify-center text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-200 transition-all group-hover:scale-105">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <span className="text-[11px] font-bold text-slate-500 group-hover:text-slate-800">Email</span>
                            </button>
                            <button onClick={() => { setActiveTab('overview'); setShowPhoneCallModal(true); }} className="flex flex-col items-center gap-2 group">
                                <div className="w-12 h-12 rounded-full border border-slate-200 shadow-sm flex items-center justify-center text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-200 transition-all group-hover:scale-105">
                                    <PhoneCall className="w-5 h-5" />
                                </div>
                                <span className="text-[11px] font-bold text-slate-500 group-hover:text-slate-800">Call</span>
                            </button>
                            <button onClick={() => setShowBookingModal(true)} className="flex flex-col items-center gap-2 group">
                                <div className="w-12 h-12 rounded-full border border-slate-200 shadow-sm flex items-center justify-center text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-200 transition-all group-hover:scale-105">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <span className="text-[11px] font-bold text-slate-500 group-hover:text-slate-800">Meet</span>
                            </button>
                            <button onClick={() => setShowTaskModal(true)} className="flex flex-col items-center gap-2 group">
                                <div className="w-12 h-12 rounded-full border border-slate-200 shadow-sm flex items-center justify-center text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-200 transition-all group-hover:scale-105">
                                    <CheckCircle className="w-5 h-5" />
                                </div>
                                <span className="text-[11px] font-bold text-slate-500 group-hover:text-slate-800">Task</span>
                            </button>
                        </div>
                    </div>

                    {/* About this contact Card */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="bg-slate-50 border-b border-slate-200 px-5 py-4 flex justify-between items-center cursor-pointer hover:bg-slate-100 transition-colors">
                            <h3 className="font-bold text-slate-800 text-sm">About this contact</h3>
                            <ChevronDown className="w-4 h-4 text-slate-500" />
                        </div>
                        <div className="p-5 space-y-5">
                            <div className="group relative">
                                <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">First Name</span>
                                <span className="text-sm font-bold text-slate-800 group-hover:bg-slate-50 p-1 -ml-1 rounded transition-colors block">{customer.firstName}</span>
                            </div>
                            <div className="group relative">
                                <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Last Name</span>
                                <span className="text-sm font-bold text-slate-800 group-hover:bg-slate-50 p-1 -ml-1 rounded transition-colors block">{customer.lastName}</span>
                            </div>
                            <div className="group relative">
                                <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Phone Number</span>
                                <span className="text-sm font-bold text-slate-800 group-hover:bg-slate-50 p-1 -ml-1 rounded transition-colors block">{customer.phone || 'N/A'}</span>
                            </div>
                            <div className="group relative">
                                <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Email</span>
                                <span className="text-sm font-bold text-blue-600 group-hover:bg-blue-50 p-1 -ml-1 rounded transition-colors block cursor-pointer" onClick={() => setShowEmailModal(true)}>{customer.email}</span>
                            </div>
                            <div>
                                <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Lead Status</span>
                                <Badge className={\`text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-md border shadow-sm \${isConverted ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-blue-50 text-blue-600 border-blue-200'}\`}>{customer.status}</Badge>
                            </div>
                            <div className="group relative">
                                <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Source</span>
                                <span className="text-sm font-bold text-slate-800 group-hover:bg-slate-50 p-1 -ml-1 rounded transition-colors block">{customer.source || 'Manual Entry'}</span>
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
                                    className={\`px-6 py-4 text-xs font-black uppercase tracking-widest transition-colors relative \${activeTab === tab ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}\`}
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
                                                summary.appointments.forEach(a => timelineItems.push({ type: 'appointment', date: new Date(a.createdAt), data: a }));
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
                                                                <Badge className={\`\${item.data.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'} text-[10px] font-black uppercase\`}>
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
                                                                    <span className={\`ml-auto text-[10px] font-bold uppercase \${new Date(item.data.dueDate) < new Date() && item.data.status !== 'completed' ? 'text-red-500' : 'text-slate-400'}\`}>
                                                                        Due: {new Date(item.data.dueDate).toLocaleDateString()}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                }

                                                return (
                                                    <div key={\`\${item.type}-\${idx}\`} className="relative">
                                                        <div className={\`absolute -left-[63px] top-1 w-11 h-11 rounded-full border-[3px] \${iconBg} flex items-center justify-center shadow-sm z-10\`}>
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
                                            <Badge className={\`text-[9px] font-black uppercase tracking-widest \${apt.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}\`}>{apt.status}</Badge>
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
    );
`;

const finalLines = [...beforeLines, newLayout, ...afterLines];
fs.writeFileSync(path, finalLines.join('\n'), 'utf8');
console.log('Successfully replaced OneCustomerDetail.tsx UI layout.');
