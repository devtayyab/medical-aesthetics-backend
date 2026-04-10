import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Users,
  Phone,
  Calendar,
  Plus,
  Search,
  X,
  ArrowUpRight,
  FileText,
  ChevronDown
} from 'lucide-react';
import { CRMBookingModal } from '@/components/crm/CRMBookingModal';
import { Button } from '@/components/atoms/Button/Button';
import { Input } from '@/components/atoms/Input/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/molecules/Card/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/molecules/Tabs';
import { LeadsPage } from '@/pages/CRM/Leads';
import { Customers } from '@/pages/CRM/Customers';
import { Tasks } from '@/pages/CRM/Tasks';
import { OneCustomerDetail } from '@/pages/CRM/OneCustomerDetail';
import {
  fetchOverdueTasks,
  fetchAutomationRules,
  fetchSalespersons,
  fetchLeads,
  fetchActions,
  fetchCrmMetrics
} from '@/store/slices/crmSlice';
import type { RootState, AppDispatch } from '@/store';
import type { Lead, CrmAction } from '@/types/crm.types';
import type { Task } from '@/types';
import { Analytics } from '@/pages/CRM/Analytics';
import { SalesWeekCalendar } from '@/pages/CRM/SalesWeekCalendar';
import { Calls as ManagerCrmCalls } from '@/pages/Admin/ManagerCRM/Calls';
import { MessagesPage } from '@/pages/Messages/MessagesPage';

export const CRM: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { leads } = useSelector((state: RootState) => state.crm);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedCustomer, setSelectedCustomer] = useState<Lead | null>(null);
  const [forceShowCreateForm, setForceShowCreateForm] = useState(false);

  // New state for buttons
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showQuickBooking, setShowQuickBooking] = useState(false);
  const [bookingCustomer, setBookingCustomer] = useState<{ id: string; name: string; email?: string; phone?: string } | null>(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Lead[]>([]);

  const handleAddNewLead = () => {
    setForceShowCreateForm(true);
    setActiveTab('leads');
  };

  const handleFormShown = () => {
    setForceShowCreateForm(false);
  };

  useEffect(() => {
    if (user) {
      dispatch(fetchLeads({}));
      dispatch(fetchActions({ salespersonId: user.id }));
      dispatch(fetchOverdueTasks(user.id));
      dispatch(fetchAutomationRules());

      if (user.role === 'admin' || user.role === 'manager') {
        dispatch(fetchSalespersons());
      }
    }
    dispatch(fetchCrmMetrics());
  }, [dispatch, user]);


  const handleViewCustomer = (customer: Lead) => {
    setSelectedCustomer(customer);
    setActiveTab('customer');
  };

  const handleViewTask = (task: CrmAction) => {
    const customer = task.customer?.customer || task.relatedLead;
    if (customer) {
      handleViewCustomer(customer as Lead);
    }
  };


  if (selectedCustomer) {
    return (
      <div className="min-h-screen bg-gray-50/50 p-4 md:p-8 animate-in fade-in duration-500">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button 
              variant="ghost" 
              onClick={() => setSelectedCustomer(null)}
              className="p-2 hover:bg-white rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-none">Customer Profile</h1>
              <p className="text-xs text-gray-400 mt-1 uppercase font-black tracking-widest">Selected Record</p>
            </div>
          </div>
          <OneCustomerDetail SelectedCustomer={selectedCustomer} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-none shadow-sm relative overflow-visible z-20">
        <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/30 rounded-full -mr-32 -mt-32 blur-3xl" />
        </div>
        <div className="px-8 py-10 flex flex-col md:flex-row justify-between items-center gap-6 relative z-10 bg-white/40 backdrop-blur-sm rounded-xl border border-slate-100/50">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-200 animate-in zoom-in-50 duration-700">
              <Users className="text-white w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">CRM Console</h1>
              <p className="text-slate-500 font-bold text-sm mt-1 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                Premium Sales Management
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-wrap justify-center">
            <div className="relative">
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-bold px-4 h-10 text-xs"
                onClick={() => setShowQuickActions(!showQuickActions)}
              >
                <Plus className="h-3.5 w-3.5 mr-2" />
                Quick Actions
                <ChevronDown className={`h-3.5 w-3.5 ml-2 transition-transform duration-300 ${showQuickActions ? 'rotate-180' : ''}`} />
              </Button>

              {showQuickActions && (
                <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[100] overflow-hidden transform transition-all animate-in fade-in slide-in-from-top-4">
                  <div className="p-2 space-y-1">
                    <button
                      onClick={() => { handleAddNewLead(); setShowQuickActions(false); }}
                      className="w-full text-left px-4 py-3 hover:bg-blue-50/50 rounded-xl flex items-center justify-between group transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg group-hover:scale-110 transition-transform"><Plus className="h-4 w-4 text-blue-600" /></div>
                        <span className="text-sm font-bold text-gray-700">Add New Lead</span>
                      </div>
                      <ArrowUpRight className="h-3.5 w-3.5 text-gray-300 transition-all" />
                    </button>
                    <button
                      onClick={() => { setActiveTab('leads'); setShowQuickActions(false); }}
                      className="w-full text-left px-4 py-3 hover:bg-green-50/50 rounded-xl flex items-center justify-between group transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-50 rounded-lg group-hover:scale-110 transition-transform"><Phone className="h-4 w-4 text-green-600" /></div>
                        <span className="text-sm font-bold text-gray-700">Log Call / Dialer</span>
                      </div>
                      <ArrowUpRight className="h-3.5 w-3.5 text-gray-300 transition-all" />
                    </button>
                    <button
                      onClick={() => { setActiveTab('tasks'); setShowQuickActions(false); }}
                      className="w-full text-left px-4 py-3 hover:bg-purple-50/50 rounded-xl flex items-center justify-between group transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-50 rounded-lg group-hover:scale-110 transition-transform"><FileText className="h-4 w-4 text-purple-600" /></div>
                        <span className="text-sm font-bold text-gray-700">View Tasks</span>
                      </div>
                      <ArrowUpRight className="h-3.5 w-3.5 text-gray-300 transition-all" />
                    </button>
                    <div className="h-px bg-gray-50 my-1 mx-2" />
                    <button
                      onClick={() => { setActiveTab('tracker'); setShowQuickActions(false); }}
                      className="w-full text-left px-4 py-3 hover:bg-orange-50/50 rounded-xl flex items-center justify-between group transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-50 rounded-lg group-hover:scale-110 transition-transform"><Calendar className="h-4 w-4 text-orange-600" /></div>
                        <span className="text-sm font-bold text-gray-700">Meeting / Calendar</span>
                      </div>
                      <ArrowUpRight className="h-3.5 w-3.5 text-gray-300 transition-all" />
                    </button>
                    <button
                      onClick={() => { setShowQuickBooking(true); setShowQuickActions(false); }}
                      className="w-full text-left px-4 py-3 hover:bg-rose-50/50 rounded-xl flex items-center justify-between group transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-rose-50 rounded-lg group-hover:scale-110 transition-transform"><Calendar className="h-4 w-4 text-rose-600" /></div>
                        <span className="text-sm font-bold text-gray-700">Quick Booking</span>
                      </div>
                      <ArrowUpRight className="h-3.5 w-3.5 text-gray-300 transition-all" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
      
      {/* Main Navigation Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className='w-full'
      >
        <Card className="border-none shadow-sm p-1 bg-slate-100/80 rounded-lg mb-8">
          <TabsList className="grid grid-cols-2 lg:grid-cols-7 bg-transparent h-auto gap-1">
            <TabsTrigger value="messages" className="rounded-md py-2 font-bold text-xs data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all">Messages</TabsTrigger>
            <TabsTrigger value="tasks" className="rounded-md py-2 font-bold text-xs data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all">Tasks</TabsTrigger>
            <TabsTrigger value="leads" className="rounded-md py-2 font-bold text-xs data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all">Leads</TabsTrigger>
            <TabsTrigger value="customers" className="rounded-md py-2 font-bold text-xs data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all">Customers</TabsTrigger>
            <TabsTrigger value="tracker" className="rounded-md py-2 font-bold text-xs data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all">My Tracker</TabsTrigger>
            <TabsTrigger value="dashboard" className="rounded-md py-2 font-bold text-xs data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all">Statistics</TabsTrigger>
            {user?.role !== 'salesperson' && (
              <TabsTrigger value="calls" className="rounded-md py-2 font-bold text-xs data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all">Calls</TabsTrigger>
            )}
          </TabsList>
        </Card>

        {/* Messages Tab */}
        <TabsContent value="messages">
          <MessagesPage />
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks">
          <Tasks onViewTask={handleViewTask} />
        </TabsContent>

        {/* Leads Tab */}
        <TabsContent value="leads">
          <LeadsPage
            onViewLead={handleViewCustomer}
            forceShowCreateForm={forceShowCreateForm}
            onFormShown={handleFormShown}
          />
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers">
          <Customers />
        </TabsContent>

        {/* Sales Tracker / Calendar Tab */}
        <TabsContent value="tracker">
          <SalesWeekCalendar />
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="dashboard" className="animate-in fade-in duration-500">
          <Analytics />
        </TabsContent>

        {user?.role !== 'salesperson' && (
          <TabsContent value="calls">
            <ManagerCrmCalls />
          </TabsContent>
        )}

        {/* Team Management Tab (Admin Only) */}
        {(user?.role === 'admin' || user?.role === 'manager') && (
          <TabsContent value="team">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Team Management</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">Manage salespeople and permissions</p>
                </div>
                <Button>
                  <Plus className="w-4 h-4 mr-2" /> Add Salesperson
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="text-center py-8 text-gray-500 col-span-full">
                    Salesperson management interface loading...
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Quick Booking Customer Search Modal */}
      {
        showQuickBooking && !bookingCustomer && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in">
            <Card className="w-full max-w-lg shadow-2xl">
              <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <CardTitle className="text-xl">Direct Appointment</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">Select a customer to book an appointment</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowQuickBooking(false)}><X className="w-4 h-4" /></Button>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by name, email or phone..."
                    className="pl-9"
                    value={customerSearchTerm}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomerSearchTerm(val);
                      if (val.length > 2) {
                        const filtered = leads.filter(l =>
                          `${l.firstName} ${l.lastName}`.toLowerCase().includes(val.toLowerCase()) ||
                          l.email.toLowerCase().includes(val.toLowerCase()) ||
                          l.phone?.includes(val)
                        ).slice(0, 5);
                        setSearchResults(filtered);
                      } else {
                        setSearchResults([]);
                      }
                    }}
                  />
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {searchResults.map(customer => (
                    <div
                      key={customer.id}
                      className="flex items-center justify-between p-3 hover:bg-slate-50 border border-slate-200 rounded-lg cursor-pointer transition-colors"
                      onClick={() => setBookingCustomer({
                        id: customer.id,
                        name: `${customer.firstName} ${customer.lastName}`,
                        email: customer.email,
                        phone: customer.phone
                      })}
                    >
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{customer.firstName} {customer.lastName}</div>
                        <div className="text-[11px] text-slate-500 font-medium">{customer.email}</div>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-slate-300" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )
      }

      {
        showQuickBooking && bookingCustomer && (
          <CRMBookingModal
            isOpen={true}
            customerId={bookingCustomer.id}
            customerName={bookingCustomer.name}
            customerEmail={bookingCustomer.email}
            customerPhone={bookingCustomer.phone}
            onClose={() => {
              setBookingCustomer(null);
              setShowQuickBooking(false);
            }}
            onSuccess={() => {
              alert('Booking completed!');
            }}
          />
        )
      }
    </div >
  );
};
