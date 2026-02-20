import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Users,
  Phone,
  Calendar,
  TrendingUp,
  AlertTriangle,
  Plus,
  Filter,
  Building,
  Target,
  Award,
  Clock,
  ChevronDown,
  Loader2,
  Search,
  X,
  CheckCircle,
  Mail,
  ArrowUpRight,
  FileText,
  Trash2
} from 'lucide-react';
import { CRMBookingModal } from '@/components/crm/CRMBookingModal';
import { Button } from '@/components/atoms/Button/Button';
import { Input } from '@/components/atoms/Input/Input';
import { Badge } from '@/components/atoms/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/molecules/Card/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/molecules/Tabs';
import { LeadsPage } from '@/pages/CRM/Leads';
import { Tasks } from '@/pages/CRM/Tasks';
import { OneCustomerDetail } from '@/pages/CRM/OneCustomerDetail';
import {
  fetchOverdueTasks,
  fetchAutomationRules,
  runTaskAutomationCheck,
  deleteLead,
  fetchSalespersons,
  fetchLeads,
  fetchActions
} from '@/store/slices/crmSlice';
import type { RootState, AppDispatch } from '@/store';
import type { Lead } from '@/types/crm.types';
import type { Task } from '@/types';
import { TaskDetails } from '@/pages/CRM/TaskDetails';

import { SalesDiary } from '@/components/organisms/SalesDiary/SalesDiary';

export const CRM: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const {
    leads,
    analytics,
    automationRules,
    isLoading,
    error
  } = useSelector((state: RootState) => state.crm);


  const { actions: tasks } = useSelector((state: RootState) => state.crm);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedCustomer, setSelectedCustomer] = useState<Lead | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [forceShowCreateForm, setForceShowCreateForm] = useState(false);

  // New state for buttons
  const [isAutomationRunning, setIsAutomationRunning] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showQuickBooking, setShowQuickBooking] = useState(false);
  const [bookingCustomer, setBookingCustomer] = useState<{ id: string; name: string } | null>(null);
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
  }, [dispatch, user]);

  const handleDeleteCustomer = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      try {
        await dispatch(deleteLead(id)).unwrap();
      } catch (error) {
        console.error('Failed to delete customer:', error);
        alert('Failed to delete customer.');
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string | Date | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleRunAutomation = async () => {
    if (isAutomationRunning) return;

    setIsAutomationRunning(true);
    try {
      await dispatch(runTaskAutomationCheck()).unwrap();
      // Refresh data after automation
      if (user) {
        dispatch(fetchActions({ salespersonId: user.id }));
        dispatch(fetchOverdueTasks(user.id));
      }
      // Simple alert for feedback since we don't have a global toast yet
      alert('Automation check completed successfully!');
    } catch (error) {
      console.error('Failed to run automation:', error);
      alert('Failed to run automation check.');
    } finally {
      setIsAutomationRunning(false);
    }
  };

  const handleViewCustomer = (customer: Lead) => {
    setSelectedCustomer(customer);
    setActiveTab('customer');
  };

  const handleViewTask = (task: any) => {
    setSelectedTask(task);
    setActiveTab('task');
  };
  const updatedTasks = tasks.map(task => {
    const dueDate = new Date(task.dueDate);
    const now = new Date();

    // Check if due date is in the past and task is not completed
    if (dueDate < now && task.status !== 'completed' && task.status !== 'cancelled') {
      return { ...task, status: 'overdue' };
    }

    return task;
  });


  const [customersTabSearchTerm, setCustomersTabSearchTerm] = useState('');

  const filteredCustomers = leads.filter(customer => {
    if (!customersTabSearchTerm) return true;
    const term = customersTabSearchTerm.toLowerCase();
    return (
      customer.id.toLowerCase().includes(term) ||
      customer.firstName.toLowerCase().includes(term) ||
      customer.lastName.toLowerCase().includes(term) ||
      customer.email.toLowerCase().includes(term) ||
      (customer.phone && customer.phone.includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-none shadow-sm relative overflow-visible z-20">
        <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/30 rounded-full -mr-32 -mt-32 blur-3xl" />
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between p-8 gap-6 relative z-10">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">CRM Dashboard</h1>
            <p className="text-gray-500 mt-1.5 font-medium">
              Manage leads, customers, and sales activities
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Button
              variant="outline"
              className="bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100 transition-all font-bold px-6 shadow-sm hover:shadow-md h-11"
              onClick={() => setShowQuickBooking(true)}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Direct Booking
            </Button>

            <Button
              variant="outline"
              className={`border-gray-200 hover:border-blue-200 hover:bg-blue-50 transition-all font-bold h-11 shadow-sm ${isAutomationRunning ? 'animate-pulse opacity-80' : ''}`}
              onClick={handleRunAutomation}
              disabled={isAutomationRunning}
            >
              {isAutomationRunning ? (
                <Loader2 className="h-4 w-4 mr-2 text-blue-600 animate-spin" />
              ) : (
                <Target className="h-4 w-4 mr-2 text-blue-600" />
              )}
              Run Automation
            </Button>

            <div className="relative">
              <Button
                variant="primary"
                className="bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-lg hover:shadow-blue-200/50 font-bold px-6 h-11"
                onClick={() => setShowQuickActions(!showQuickActions)}
              >
                <Plus className="h-4 w-4 mr-2 transition-transform duration-300" style={{ transform: showQuickActions ? 'rotate(45deg)' : 'none' }} />
                Quick Actions
                <ChevronDown className={`h-4 w-4 ml-2 transition-transform duration-300 ${showQuickActions ? 'rotate-180' : ''}`} />
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
                      <ArrowUpRight className="h-3.5 w-3.5 text-gray-300 opacity-0 group-hover:opacity-100 transition-all" />
                    </button>
                    <button
                      onClick={() => { window.location.href = 'tel:'; setShowQuickActions(false); }}
                      className="w-full text-left px-4 py-3 hover:bg-green-50/50 rounded-xl flex items-center justify-between group transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-50 rounded-lg group-hover:scale-110 transition-transform"><Phone className="h-4 w-4 text-green-600" /></div>
                        <span className="text-sm font-bold text-gray-700">Log Call / Dialer</span>
                      </div>
                      <ArrowUpRight className="h-3.5 w-3.5 text-gray-300 opacity-0 group-hover:opacity-100 transition-all" />
                    </button>
                    <button
                      onClick={() => { setActiveTab('tasks'); setShowQuickActions(false); }}
                      className="w-full text-left px-4 py-3 hover:bg-purple-50/50 rounded-xl flex items-center justify-between group transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-50 rounded-lg group-hover:scale-110 transition-transform"><FileText className="h-4 w-4 text-purple-600" /></div>
                        <span className="text-sm font-bold text-gray-700">View Tasks</span>
                      </div>
                      <ArrowUpRight className="h-3.5 w-3.5 text-gray-300 opacity-0 group-hover:opacity-100 transition-all" />
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
                      <ArrowUpRight className="h-3.5 w-3.5 text-gray-300 opacity-0 group-hover:opacity-100 transition-all" />
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
        <Card className="border-none shadow-sm p-1.5 bg-gray-100/50 rounded-2xl mb-8">
          <TabsList className="grid grid-cols-2 lg:grid-cols-6 bg-transparent h-auto gap-1">
            <TabsTrigger value="dashboard" className="rounded-xl py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">Dashboard</TabsTrigger>
            <TabsTrigger value="leads" className="rounded-xl py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">Leads</TabsTrigger>
            <TabsTrigger value="tasks" className="rounded-xl py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">Tasks</TabsTrigger>
            <TabsTrigger value="tracker" className="rounded-xl py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">My Tracker</TabsTrigger>
            <TabsTrigger value="customers" className="rounded-xl py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">Customers</TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-xl py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">Analytics</TabsTrigger>
            {(user?.role === 'admin' || user?.role === 'manager') && (
              <TabsTrigger value="team" className="rounded-xl py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">Team</TabsTrigger>
            )}
          </TabsList>
        </Card>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-8 animate-in fade-in duration-500">

          {/* Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-none shadow-sm hover:shadow-lg transition-all duration-300 group overflow-hidden relative bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl group-hover:scale-150 transition-transform duration-700" />
              <CardContent className="p-6 relative z-10 flex flex-col justify-between h-full min-h-[140px]">
                <div className="flex justify-between items-start">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  {/* <span className="bg-white/20 px-2 py-1 rounded text-[10px] font-bold">+12%</span> */}
                </div>
                <div>
                  <div className="text-4xl font-black tracking-tight mt-4">{leads.length}</div>
                  <div className="text-blue-100 text-xs font-bold uppercase tracking-widest mt-1">Total Leads</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm hover:shadow-lg transition-all duration-300 group overflow-hidden relative bg-white">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700" />
              <CardContent className="p-6 relative z-10 flex flex-col justify-between h-full min-h-[140px]">
                <div className="flex justify-between items-start">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-[10px] font-bold border border-emerald-100">
                    {leads.length > 0 ? Math.round((leads.filter(l => l.status === 'converted').length / leads.length) * 100) : 0}% Conv.
                  </span>
                </div>
                <div>
                  <div className="text-4xl font-black text-gray-900 tracking-tight mt-4">
                    {leads.filter(l => l.status === 'converted').length}
                  </div>
                  <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Converted</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm hover:shadow-lg transition-all duration-300 group overflow-hidden relative bg-white">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700" />
              <CardContent className="p-6 relative z-10 flex flex-col justify-between h-full min-h-[140px]">
                <div className="flex justify-between items-start">
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  {tasks.filter(t => t.status === 'overdue').length > 0 && (
                    <span className="bg-red-50 text-red-600 px-2.5 py-1 rounded-full text-[10px] font-bold animate-pulse border border-red-100">
                      Attention
                    </span>
                  )}
                </div>
                <div>
                  <div className="text-4xl font-black text-gray-900 tracking-tight mt-4">
                    {tasks.filter(t => t.status === 'overdue').length}
                  </div>
                  <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Overdue Tasks</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm hover:shadow-lg transition-all duration-300 group overflow-hidden relative bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl group-hover:scale-150 transition-transform duration-700" />
              <CardContent className="p-6 relative z-10 flex flex-col justify-between h-full min-h-[140px]">
                <div className="flex justify-between items-start">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div>
                  <div className="text-4xl font-black tracking-tight mt-4">
                    {tasks.filter(t => t.status === 'pending').length}
                  </div>
                  <div className="text-purple-100 text-xs font-bold uppercase tracking-widest mt-1">Pending Actions</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions and Recent Activity - Moved inside Dashboard Tab */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Actions */}
            <Card className="border-none shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                <button
                  onClick={handleAddNewLead}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-blue-50 rounded-xl group transition-all border border-transparent hover:border-blue-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white text-blue-600 rounded-lg shadow-sm border border-gray-100 group-hover:scale-110 transition-transform">
                      <Plus className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <span className="block font-bold text-gray-900">Add Lead</span>
                      <span className="text-xs text-gray-500 font-medium">Create new potential customer</span>
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-blue-300 group-hover:text-blue-600 transition-colors" />
                </button>

                <button
                  onClick={() => setShowQuickBooking(true)}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-emerald-50 rounded-xl group transition-all border border-transparent hover:border-emerald-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white text-emerald-600 rounded-lg shadow-sm border border-gray-100 group-hover:scale-110 transition-transform">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <span className="block font-bold text-gray-900">Book Appointment</span>
                      <span className="text-xs text-gray-500 font-medium">Schedule for a client</span>
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-emerald-300 group-hover:text-emerald-600 transition-colors" />
                </button>
              </CardContent>
            </Card>

            {/* Sales Calendar Preview (Placeholder for now, or small list) */}
            <Card className="lg:col-span-2 border-none shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                    <Clock className="h-5 w-5" />
                  </div>
                  Recent Tasks
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {tasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 font-medium">No pending tasks</div>
                ) : (
                  <div className="space-y-3">
                    {tasks.slice(0, 3).map(task => (
                      <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-transparent hover:border-gray-200 transition-all">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${task.priority === 'urgent' ? 'bg-red-500' : task.priority === 'high' ? 'bg-orange-500' : 'bg-blue-500'}`} />
                          <div>
                            <div className="font-bold text-gray-900 text-sm">{task.title}</div>
                            <div className="text-xs text-gray-500">{new Date(task.dueDate).toLocaleDateString()}</div>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleViewTask(task)}>View</Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>


          {/* Automation Rules */}
          <Card className="border-none shadow-none bg-transparent">
            <div className="flex items-center gap-2 mb-4 px-1">
              <Target className="h-5 w-5 text-gray-700" />
              <h3 className="text-lg font-semibold text-gray-800">Active Automation Rules</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {automationRules.map((rule) => (
                <Card key={rule.id} className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900">{rule.name}</h4>
                      <Badge variant="success" size="sm" className="uppercase text-[10px]">Active</Badge>
                    </div>
                    <div className="text-sm text-gray-600 mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>Triggers {rule.delayDays > 0 ? `+${rule.delayDays}` : rule.delayDays} days</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <span className="text-xs text-gray-500 font-medium">Priority</span>
                      <span className={`text-xs font-semibold px-2 py-1 rounded bg-gray-100
                        ${rule.priority === 'high' ? 'text-red-600 bg-red-50' :
                          rule.priority === 'medium' ? 'text-orange-600 bg-orange-50' : 'text-blue-600 bg-blue-50'}`}>
                        {rule.priority}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Leads Tab */}
        <TabsContent value="leads">
          <LeadsPage
            onViewLead={handleViewCustomer}
            forceShowCreateForm={forceShowCreateForm}
            onFormShown={handleFormShown}
          />
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks">
          <Tasks onViewTask={handleViewTask} />
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers">
          <div className="space-y-6">
            {/* Customer Search and Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search by ID, Name, Email, or Phone..."
                      value={customersTabSearchTerm}
                      onChange={(e) => setCustomersTabSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Customer List */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle>Customer Management</CardTitle>
                <div className="text-xs text-gray-500 font-medium">
                  Showing {filteredCustomers.length} results
                </div>
              </CardHeader>
              <CardContent>
                {filteredCustomers.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-gray-50 rounded-lg text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      <div className="col-span-3">Customer</div>
                      <div className="col-span-3">Contact</div>
                      <div className="col-span-2">ID</div>
                      <div className="col-span-2">Status</div>
                      <div className="col-span-2 text-right">Action</div>
                    </div>
                    {filteredCustomers.map(customer => (
                      <div
                        key={customer.id}
                        className="grid grid-cols-12 gap-4 px-4 py-4 items-center hover:bg-gray-50 transition-colors rounded-lg cursor-pointer group"
                        onClick={() => handleViewCustomer(customer)}
                      >
                        <div className="col-span-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs ring-4 ring-white group-hover:ring-blue-50 transition-all">
                              {customer.firstName?.[0]}{customer.lastName?.[0]}
                            </div>
                            <div>
                              <div className="font-bold text-gray-900">{customer.firstName} {customer.lastName}</div>
                              <div className="text-xs text-gray-400">Since {new Date(customer.createdAt).toLocaleDateString()}</div>
                            </div>
                          </div>
                        </div>
                        <div className="col-span-3">
                          <div className="text-sm text-gray-700 flex items-center gap-2"><Mail className="w-3 h-3 text-gray-400" /> {customer.email}</div>
                          {customer.phone && <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2"><Phone className="w-3 h-3 text-gray-400" /> {customer.phone}</div>}
                        </div>
                        <div className="col-span-2">
                          <code className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-[10px] font-mono whitespace-nowrap overflow-hidden text-ellipsis max-w-full block">
                            {customer.id}
                          </code>
                        </div>
                        <div className="col-span-2">
                          <Badge
                            variant="secondary"
                            className={`
                              ${customer.status === 'converted' ? 'bg-emerald-100 text-emerald-800' :
                                customer.status === 'new' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}
                            `}
                          >
                            {customer.status}
                          </Badge>
                        </div>
                        <div className="col-span-2 text-right flex items-center justify-end gap-2">
                          <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            View <ArrowUpRight className="w-3 h-3 ml-1" />
                          </Button>
                          {(user?.role === 'admin' || user?.role === 'manager') && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => handleDeleteCustomer(e, customer.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center border border-dashed border-gray-200">
                      <Users className="w-8 h-8 text-gray-300" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">No customers found</h3>
                      <p className="text-sm text-gray-500">Try searching for a different ID, name, or email.</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="space-y-6">
            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Phone className="h-5 w-5 text-blue-600" />
                    <div>
                      <div className="text-2xl font-bold">
                        {analytics?.communicationStats?.calls || 0}
                      </div>
                      <div className="text-sm text-gray-500">Total Calls</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-green-600" />
                    <div>
                      <div className="text-2xl font-bold">
                        {analytics?.customerStats?.repeatCustomers || 0}
                      </div>
                      <div className="text-sm text-gray-500">Repeat Customers</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    <div>
                      <div className="text-2xl font-bold">
                        {formatCurrency(analytics?.customerStats?.totalRevenue || 0)}
                      </div>
                      <div className="text-sm text-gray-500">Total Revenue</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Analytics */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  Detailed analytics dashboard coming soon...
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Sales Tracker / Calendar Tab */}
        <TabsContent value="tracker">
          <SalesDiary />
        </TabsContent>

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
                  {/* Placeholder for Salespersons List relying on crm.salespersons */}
                  <div className="text-center py-8 text-gray-500 col-span-full">
                    Salesperson management interface loading...
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* s Modal/Tab */}
      {
        selectedCustomer && activeTab === 'customer' && (

          <div className="space-y-6">
            <Card>
              <div className="px-8">

                <div className="flex  justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">
                      Customer Details
                    </h2></div>
                  <div>
                    <Button variant="outline" onClick={() => setActiveTab('leads')}>
                      ← Back to Leads
                    </Button>
                  </div>
                </div>

              </div>
              <OneCustomerDetail
                SelectedCustomer={selectedCustomer as any}
                isLoading={isLoading}
                error={error}


              />
            </Card>

          </div>
        )
      }

      {/* s Modal/Tab */}
      {
        selectedTask && activeTab === 'task' && (

          <div className="space-y-6">
            <Card>
              <div className="px-8">

                <div className="flex  justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">
                      Task Details
                    </h2></div>
                  <div>
                    <Button variant="outline" onClick={() => setActiveTab('tasks')}>
                      ← Back to Tasks
                    </Button>
                  </div>
                </div>

              </div>
              <TaskDetails
                selectedTask={selectedTask}
              />
            </Card>

          </div>
        )
      }

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

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {searchResults.map(customer => (
                    <div
                      key={customer.id}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 border border-gray-100 rounded-xl cursor-pointer transition-colors"
                      onClick={() => setBookingCustomer({ id: customer.id, name: `${customer.firstName} ${customer.lastName}` })}
                    >
                      <div>
                        <div className="font-semibold text-gray-900">{customer.firstName} {customer.lastName}</div>
                        <div className="text-xs text-gray-500">{customer.email}</div>
                      </div>
                      <Button size="sm" variant="ghost" className="text-blue-600 font-bold">Select</Button>
                    </div>
                  ))}

                  {customerSearchTerm.length > 2 && searchResults.length === 0 && (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      No customers found.
                      <button
                        className="text-blue-600 font-bold ml-1 hover:underline"
                        onClick={() => {
                          handleAddNewLead();
                          setShowQuickBooking(false);
                        }}
                      >
                        Create new lead first?
                      </button>
                    </div>
                  )}

                  {customerSearchTerm.length <= 2 && (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      Start typing to find a customer...
                    </div>
                  )}
                </div>
              </CardContent>
              <div className="p-4 border-t border-gray-100 flex justify-between gap-2 bg-gray-50 rounded-b-xl">
                <button
                  className="text-sm text-blue-600 font-medium hover:underline"
                  onClick={() => {
                    handleAddNewLead();
                    setShowQuickBooking(false);
                  }}
                >
                  + Add New Customer
                </button>
                <Button variant="outline" onClick={() => setShowQuickBooking(false)}>Cancel</Button>
              </div>
            </Card>
          </div>
        )
      }

      {/* Actual Booking Modal */}
      {
        bookingCustomer && (
          <CRMBookingModal
            customerId={bookingCustomer.id}
            customerName={bookingCustomer.name}
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
