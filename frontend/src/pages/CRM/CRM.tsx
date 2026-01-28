import React, { useState } from 'react';
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
  Clock
} from 'lucide-react';
import { Button } from '@/components/atoms/Button/Button';
import { Input } from '@/components/atoms/Input/Input';
import { Badge } from '@/components/atoms/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/molecules/Card/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/molecules/Tabs';
import { LeadsPage } from '@/pages/CRM/Leads';
import { Tasks } from '@/pages/CRM/Tasks';
import { OneCustomerDetail } from '@/pages/CRM/OneCustomerDetail';
import {
  fetchLeads,
  fetchActions,
  fetchOverdueTasks,
  fetchAutomationRules,
  runTaskAutomationCheck,
  createLead
} from '@/store/slices/crmSlice';
import type { RootState, AppDispatch } from '@/store';
import type { Lead } from '@/types/crm.types';
import type { Task } from '@/types';
import { TaskDetails } from '@/pages/CRM/TaskDetails';
import { fetchTasks } from "@/store/slices/TaskSlice"
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


  const { tasks } = useSelector((state: RootState) => state.task);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedCustomer, setSelectedCustomer] = useState<Lead | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [forceShowCreateForm, setForceShowCreateForm] = useState(false);

  const handleAddNewLead = () => {
    setForceShowCreateForm(true);
    setActiveTab('leads');
  };

  const handleFormShown = () => {
    setForceShowCreateForm(false);
  };
  React.useEffect(() => {
    if (user) {
      dispatch(fetchLeads({}));
      dispatch(fetchTasks());
      dispatch(fetchActions({ salespersonId: user.id }));
      dispatch(fetchOverdueTasks(user.id));
      dispatch(fetchAutomationRules());
    }
  }, [dispatch, user]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handleRunAutomation = async () => {
    try {
      await dispatch(runTaskAutomationCheck()).unwrap();
      // Refresh data after automation
      if (user) {
        dispatch(fetchActions({ salespersonId: user.id }));
        dispatch(fetchOverdueTasks(user.id));
      }
    } catch (error) {
      console.error('Failed to run automation:', error);
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
    if (dueDate < now && task.status !== 'completed') {
      return { ...task, status: 'overdue' };
    }

    return task;
  });


  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-4">
          {/* Title & Subtitle */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">CRM Dashboard</h1>
            <p className="text-gray-500 mt-1">
              Manage leads, customers, and sales activities
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-100 transition-all"
              onClick={handleRunAutomation}
            >
              <Target className="h-4 w-4 mr-2 text-blue-600" />
              Run Automation
            </Button>

            <Button
              variant="primary"
              className="bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-md"
            >
              <Plus className="h-4 w-4 mr-2" />
              Quick Actions
            </Button>
          </div>
        </div>
      </Card>
      {/* Main Navigation Tabs */}

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className='w-full p-4 md:p-6 bg-gray-50 rounded-2xl shadow-sm'
      >
        <Card>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="leads">Leads</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
        </Card>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="hover:shadow-md transition-shadow duration-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{leads.length}</div>
                    <div className="text-sm font-medium text-gray-500">Total Leads</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow duration-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-full">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {leads.filter(l => l.status === 'converted').length}
                    </div>
                    <div className="text-sm font-medium text-gray-500">Converted</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow duration-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-yellow-100 rounded-full">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{tasks.filter(l => l.status === 'pending').length}</div>
                    <div className="text-sm font-medium text-gray-500">Pending Tasks</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow duration-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-red-100 rounded-full">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{updatedTasks.filter(l => l.status === 'overdue').length}</div>
                    <div className="text-sm font-medium text-gray-500">Overdue</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions and Recent Activity */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Quick Actions */}
            <Card className="flex flex-col h-full hover:shadow-md transition-shadow duration-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold pb-2">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="grid gap-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start h-auto py-3 px-4 border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700 hover:text-blue-700 transition-all group"
                    onClick={handleAddNewLead}
                  >
                    <div className="p-2 bg-blue-100 rounded-full mr-3 group-hover:bg-blue-200 transition-colors">
                      <Plus className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="font-medium">Add New Lead</span>
                  </Button>
                  <Button variant="outline" className="w-full justify-start h-auto py-3 px-4 border-gray-200 hover:border-green-300 hover:bg-green-50 text-gray-700 hover:text-green-700 transition-all group">
                    <div className="p-2 bg-green-100 rounded-full mr-3 group-hover:bg-green-200 transition-colors">
                      <Phone className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="font-medium">Log Call</span>
                  </Button>
                  <Button variant="outline" className="w-full justify-start h-auto py-3 px-4 border-gray-200 hover:border-purple-300 hover:bg-purple-50 text-gray-700 hover:text-purple-700 transition-all group">
                    <div className="p-2 bg-purple-100 rounded-full mr-3 group-hover:bg-purple-200 transition-colors">
                      <Calendar className="h-4 w-4 text-purple-600" />
                    </div>
                    <span className="font-medium">Schedule Follow-up</span>
                  </Button>
                  <Button variant="outline" className="w-full justify-start h-auto py-3 px-4 border-gray-200 hover:border-orange-300 hover:bg-orange-50 text-gray-700 hover:text-orange-700 transition-all group">
                    <div className="p-2 bg-orange-100 rounded-full mr-3 group-hover:bg-orange-200 transition-colors">
                      <Building className="h-4 w-4 text-orange-600" />
                    </div>
                    <span className="font-medium">Import Facebook Leads</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Leads */}
            <Card className="flex flex-col h-full hover:shadow-md transition-shadow duration-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold pb-2">Recent Leads</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto">
                <div className="space-y-3">
                  {leads.slice(0, 5).map((lead) => (
                    <div
                      key={lead.id}
                      className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => handleViewCustomer(lead)}
                    >
                      <div className="flex-1 min-w-0 mr-3">
                        <div className="font-semibold text-gray-900 truncate">
                          {lead.firstName} {lead.lastName}
                        </div>
                        <div className="text-xs text-gray-500 truncate">{lead.email}</div>
                      </div>
                      <Badge variant={lead.status === 'new' ? 'info' : 'warning'} className="shrink-0">
                        {lead.status}
                      </Badge>
                    </div>
                  ))}
                  {leads.length === 0 && <div className="text-center text-gray-400 py-4">No recent leads</div>}
                </div>
              </CardContent>
            </Card>

            {/* Overdue Tasks */}
            <Card className="flex flex-col h-full hover:shadow-md transition-shadow duration-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 pb-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Overdue Tasks
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto">
                <div className="space-y-3">
                  {updatedTasks.slice(0, 5).map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-3 bg-red-50/50 border border-red-100 rounded-xl hover:bg-red-50 transition-colors">
                      <div className="flex-1 min-w-0 mr-3">
                        <div className="font-medium text-gray-900 truncate">{task.title}</div>
                        <div className="text-xs text-gray-600 truncate">
                          {task.description}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <Badge variant="error" size="sm">Overdue</Badge>
                        <div className="text-xs text-red-400 mt-1 font-mono">
                          {new Date(task.dueDate || '').toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  {tasks.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      No overdue tasks
                    </div>
                  )}
                </div>
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
                  <div className="flex-1">
                    <Input placeholder="Search customers by name, email, or phone..." />
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
              <CardHeader>
                <CardTitle>Customer Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  Customer management interface coming soon...
                  <br />
                  Use the "Customer Details" tab to view individual customers.
                </div>
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
                        {analytics?.communications.calls || 0}
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
                        {analytics?.customers.repeat || 0}
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
                        {formatCurrency(analytics?.customers.totalRevenue || 0)}
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
      </Tabs>

      {/* s Modal/Tab */}
      {selectedCustomer && activeTab === 'customer' && (

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
      {selectedTask && activeTab === 'task' && (

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
    </div >
  );
};
